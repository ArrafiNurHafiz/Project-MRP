package service

import (
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"

	"github.com/kayukwas/tracking-backend/internal/models"
	"github.com/kayukwas/tracking-backend/internal/repository"
)

type ImportResult struct {
	TotalProcessed int      `json:"total_processed"`
	SuccessCount   int      `json:"success_count"`
	FailedCount    int      `json:"failed_count"`
	Errors         []string `json:"errors"`
}

type ImportService interface {
	GetTemplateCSV(module string) (string, string) // returns filename, csvContent
	ImportCustomers(actorID uint64, r io.Reader) (*ImportResult, error)
	ImportVendors(actorID uint64, r io.Reader) (*ImportResult, error)
	ImportMaterials(actorID uint64, r io.Reader) (*ImportResult, error)
	ImportProducts(actorID uint64, r io.Reader) (*ImportResult, error)
	ImportBOM(actorID uint64, r io.Reader) (*ImportResult, error)
	ImportMitraAssignments(actorID uint64, r io.Reader) (*ImportResult, error)
}

type importService struct {
	custRepo   repository.CustomerRepository
	vendRepo   repository.VendorRepository
	matRepo    repository.MaterialRepository
	prodRepo   repository.ProductRepository
	bomRepo    repository.BOMRepository
	stRepo     repository.WorkStationRepository
	mitraRepo  repository.MitraAssignmentRepository
	auditServ  AuditLogService
}

func NewImportService(
	custRepo repository.CustomerRepository,
	vendRepo repository.VendorRepository,
	matRepo repository.MaterialRepository,
	prodRepo repository.ProductRepository,
	bomRepo repository.BOMRepository,
	stRepo repository.WorkStationRepository,
	mitraRepo repository.MitraAssignmentRepository,
	auditServ AuditLogService,
) ImportService {
	return &importService{
		custRepo:   custRepo,
		vendRepo:   vendRepo,
		matRepo:    matRepo,
		prodRepo:   prodRepo,
		bomRepo:    bomRepo,
		stRepo:     stRepo,
		mitraRepo:  mitraRepo,
		auditServ:  auditServ,
	}
}

func (s *importService) GetTemplateCSV(module string) (string, string) {
	switch strings.ToLower(module) {
	case "customers":
		return "template_import_customers.csv",
			"Nama_Perusahaan_Pelanggan,Email_Resmi,Nomor_Telepon,Alamat_Lengkap,Kategori_Tag,Nama_PIC_Utama,Jabatan_PIC,Nomor_WA_PIC,Email_PIC\n" +
				"PT Resto Kayu Nusantara,purchasing@restonusantara.com,+6281234567890,\"Jl. Sudirman No. 12, Senayan, Jakarta Pusat\",Corporate Horeca,Budi Santoso,Purchasing Manager,+6281234567890,budi@restonusantara.com\n" +
				"CV Mebel Makmur Sejahtera,finance@mebelmakmur.co.id,+6281987654321,\"Jl. Industri Raya No. 45, Jebres, Surakarta\",Distributor Retail,Siti Aminah,Finance Approver,+6281987654321,siti@mebelmakmur.co.id\n" +
				"Kayu Deco Bali Villa,procurement@decobali.com,+6287811223344,\"Jl. Sunset Road No. 88, Kuta, Bali\",Hospitality VIP,Wayan Suardana,General Manager,+6287811223344,wayan@decobali.com\n"

	case "vendors":
		return "template_import_vendors.csv",
			"Nama_Vendor_Pemasok,Alias_Panggilan,Nama_PIC,Nomor_Telepon_WA,Email_PIC,Alamat_Gudang_Pemasok\n" +
				"PT Kayu Rimba Sejahtera,Supplier Kayu Jati Log,Hendra Wijaya,+6281122334455,sales@rimbasejahtera.com,\"Kawasan Hutan Industri Perhutani, Randublatung, Blora\"\n" +
				"CV Cat Prima Finishing,Supplier Cat & Melamine,Rudi Hermawan,+6281223344556,rudi@catprima.com,\"Jl. Kimia Industri Raya No. 8, Kawasan Candi, Semarang\"\n" +
				"PT Kartonindo Box Packaging,Supplier Kardus Kemasan,Dewi Lestari,+6285644332211,order@kartonindo.co.id,\"Jl. Raya Solo-Jogja Km 15, Delanggu, Klaten\"\n"

	case "materials":
		return "template_import_materials.csv",
			"Kode_SKU_Material,Nama_Bahan_Baku,Kategori,Satuan,Stok_Awal,Batas_Minimum_ROP,Biaya_Beli_Satuan_Rp\n" +
				"RAW-JAT-LOG,Kayu Jati Log Solid Grade A Diameter 30cm,wood,m3,25.5,5.0,8500000\n" +
				"RAW-MAH-PBN,Kayu Mahoni Papan Oven Kering (30x10x2 cm),wood,batang,450,80,18500\n" +
				"FIN-MEL-CLR,Cat Clear Melamine Topcoat Glossy,chemical,liter,120,20,45000\n" +
				"FIN-THN-SUP,Thinner Super High Gloss A-Special,chemical,liter,200,30,28000\n" +
				"ACC-ENG-35M,Engsel Sendok Soft Close Stainless 35mm,accessory,pcs,500,100,7500\n" +
				"PKG-BOX-K01,Kardus Master Box Single Wall Export Standard,packaging,pcs,300,50,12500\n"

	case "products":
		return "template_import_products.csv",
			"Kode_Produk,Nama_Produk_Kitchenware\n" +
				"KWAS-TB-01,Talenan Kayu Jati End Grain Premium 40x30cm\n" +
				"KWAS-CH-02,Kursi Makan Minimalis Sandaran Lengkung Mahoni\n" +
				"KWAS-SP-03,Spatula Masak Set Kayu Sonokeling Food Grade\n" +
				"KWAS-BW-04,Mangkok Salad Kayu Jati Solid Diameter 25cm\n" +
				"KWAS-TR-05,Nampan Saji Kayu Trembesi Handle Stainless\n"

	case "bom":
		return "template_import_bom.csv",
			"Kode_Produk,Kode_Material,Kode_Stasiun_Kerja,Jumlah_Kebutuhan,Persen_Waste_Scrap,Catatan_Instruksi_Produksi\n" +
				"KWAS-TB-01,RAW-JAT-LOG,ST-1,0.025,5,Potong blok end-grain presisi tebal 4cm\n" +
				"KWAS-TB-01,FIN-MEL-CLR,ST-3,0.15,2,Finishing food-safe mineral oil & beeswax\n" +
				"KWAS-TB-01,PKG-BOX-K01,ST-5,1.0,0,Kemas bubble wrap lapis 2 & box satuan\n" +
				"KWAS-CH-02,RAW-MAH-PBN,ST-1,4.0,7,Pembuatan kaki sandaran & dudukan kursi\n" +
				"KWAS-CH-02,FIN-MEL-CLR,ST-3,0.45,3,Semprot warna walnut brown satin doff\n"

	case "mitra-assignments":
		return "template_import_mitra_assignments.csv",
			"ID_User_Mitra,Kode_Produk,Kode_Stasiun_Kerja,Tarif_Borongan_Per_Pcs_Rp,Estimasi_Kapasitas_Harian,Catatan_Keahlian\n" +
				"1,KWAS-TB-01,ST-1,15000,35,Spesialis serut & pengeleman talenan end-grain\n" +
				"1,KWAS-CH-02,ST-1,35000,12,Spesialis konstruksi purus knock-down kursi kayu\n"

	default:
		return "template.csv", "No template found for module: " + module
	}
}

func (s *importService) ImportCustomers(actorID uint64, r io.Reader) (*ImportResult, error) {
	reader := csv.NewReader(r)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, errors.New("gagal membaca file CSV: " + err.Error())
	}
	if len(records) <= 1 {
		return nil, errors.New("file CSV kosong atau tidak memiliki baris data")
	}

	res := &ImportResult{TotalProcessed: len(records) - 1}
	for idx, row := range records[1:] {
		if len(row) < 5 {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d: Kolom tidak lengkap (min 5 kolom)", idx+2))
			continue
		}
		name := strings.TrimSpace(row[0])
		if name == "" {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d: Nama pelanggan tidak boleh kosong", idx+2))
			continue
		}

		cust := &models.Customer{
			Name:    name,
			Email:   strings.TrimSpace(row[1]),
			Phone:   strings.TrimSpace(row[2]),
			Address: strings.TrimSpace(row[3]),
			Tag:     strings.TrimSpace(row[4]),
		}

		if len(row) >= 9 && strings.TrimSpace(row[5]) != "" {
			cust.PICs = []models.CustomerPIC{
				{
					Name:      strings.TrimSpace(row[5]),
					Role:      strings.TrimSpace(row[6]),
					Phone:     strings.TrimSpace(row[7]),
					Email:     strings.TrimSpace(row[8]),
					IsPrimary: true,
				},
			}
		}

		if err := s.custRepo.Create(cust); err != nil {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d (%s): %v", idx+2, name, err))
		} else {
			res.SuccessCount++
		}
	}

	var uID *uint64
	if actorID > 0 {
		uID = &actorID
	}
	s.auditServ.RecordLog(uID, "IMPORT_CUSTOMERS", fmt.Sprintf("Imported %d customers", res.SuccessCount))
	return res, nil
}

func (s *importService) ImportVendors(actorID uint64, r io.Reader) (*ImportResult, error) {
	reader := csv.NewReader(r)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, errors.New("gagal membaca file CSV: " + err.Error())
	}
	if len(records) <= 1 {
		return nil, errors.New("file CSV kosong atau tidak memiliki baris data")
	}

	res := &ImportResult{TotalProcessed: len(records) - 1}
	for idx, row := range records[1:] {
		if len(row) < 2 {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d: Kolom tidak lengkap", idx+2))
			continue
		}
		name := strings.TrimSpace(row[0])
		if name == "" {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d: Nama vendor tidak boleh kosong", idx+2))
			continue
		}

		vend := &models.Vendor{
			Name:     name,
			Alias:    strings.TrimSpace(row[1]),
			PICName:  getCol(row, 2),
			PICPhone: getCol(row, 3),
			PICEmail: getCol(row, 4),
			Address:  getCol(row, 5),
		}

		if err := s.vendRepo.Create(vend); err != nil {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d (%s): %v", idx+2, name, err))
		} else {
			res.SuccessCount++
		}
	}

	var uID *uint64
	if actorID > 0 {
		uID = &actorID
	}
	s.auditServ.RecordLog(uID, "IMPORT_VENDORS", fmt.Sprintf("Imported %d vendors", res.SuccessCount))
	return res, nil
}

func (s *importService) ImportMaterials(actorID uint64, r io.Reader) (*ImportResult, error) {
	reader := csv.NewReader(r)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, errors.New("gagal membaca file CSV: " + err.Error())
	}
	if len(records) <= 1 {
		return nil, errors.New("file CSV kosong")
	}

	res := &ImportResult{TotalProcessed: len(records) - 1}
	for idx, row := range records[1:] {
		if len(row) < 7 {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d: Kolom tidak lengkap", idx+2))
			continue
		}
		code := strings.TrimSpace(row[0])
		name := strings.TrimSpace(row[1])
		if code == "" || name == "" {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d: Kode & Nama material wajib diisi", idx+2))
			continue
		}

		stock, _ := strconv.ParseFloat(strings.TrimSpace(row[4]), 64)
		minStock, _ := strconv.ParseFloat(strings.TrimSpace(row[5]), 64)
		cost, _ := strconv.ParseFloat(strings.TrimSpace(row[6]), 64)

		mat := &models.Material{
			MaterialCode: code,
			Name:         name,
			Category:     strings.TrimSpace(row[2]),
			Unit:         strings.TrimSpace(row[3]),
			StockQty:     stock,
			MinimumStock: minStock,
			CostPerUnit:  cost,
		}

		if err := s.matRepo.Create(mat); err != nil {
			// Try update if code exists
			existing, errFind := s.matRepo.FindByCode(code)
			if errFind == nil && existing != nil {
				existing.Name = mat.Name
				existing.Category = mat.Category
				existing.Unit = mat.Unit
				existing.StockQty = mat.StockQty
				existing.MinimumStock = mat.MinimumStock
				existing.CostPerUnit = mat.CostPerUnit
				_ = s.matRepo.Update(existing)
				res.SuccessCount++
			} else {
				res.FailedCount++
				res.Errors = append(res.Errors, fmt.Sprintf("Baris %d (%s): %v", idx+2, code, err))
			}
		} else {
			res.SuccessCount++
		}
	}

	var uID *uint64
	if actorID > 0 {
		uID = &actorID
	}
	s.auditServ.RecordLog(uID, "IMPORT_MATERIALS", fmt.Sprintf("Imported %d materials", res.SuccessCount))
	return res, nil
}

func (s *importService) ImportProducts(actorID uint64, r io.Reader) (*ImportResult, error) {
	reader := csv.NewReader(r)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, errors.New("gagal membaca file CSV: " + err.Error())
	}
	if len(records) <= 1 {
		return nil, errors.New("file CSV kosong")
	}

	res := &ImportResult{TotalProcessed: len(records) - 1}
	for idx, row := range records[1:] {
		if len(row) < 2 {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d: Kolom tidak lengkap", idx+2))
			continue
		}
		code := strings.TrimSpace(row[0])
		name := strings.TrimSpace(row[1])
		if code == "" || name == "" {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d: Kode & Nama produk wajib diisi", idx+2))
			continue
		}

		prod := &models.Product{
			ProductCode: code,
			ProductName: name,
		}

		if err := s.prodRepo.Create(prod); err != nil {
			existing, errFind := s.prodRepo.FindByCode(code)
			if errFind == nil && existing != nil {
				existing.ProductName = name
				_ = s.prodRepo.Update(existing)
				res.SuccessCount++
			} else {
				res.FailedCount++
				res.Errors = append(res.Errors, fmt.Sprintf("Baris %d (%s): %v", idx+2, code, err))
			}
		} else {
			res.SuccessCount++
		}
	}

	var uID *uint64
	if actorID > 0 {
		uID = &actorID
	}
	s.auditServ.RecordLog(uID, "IMPORT_PRODUCTS", fmt.Sprintf("Imported %d products", res.SuccessCount))
	return res, nil
}

func (s *importService) ImportBOM(actorID uint64, r io.Reader) (*ImportResult, error) {
	reader := csv.NewReader(r)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, errors.New("gagal membaca file CSV: " + err.Error())
	}
	if len(records) <= 1 {
		return nil, errors.New("file CSV kosong")
	}

	res := &ImportResult{TotalProcessed: len(records) - 1}
	for idx, row := range records[1:] {
		if len(row) < 4 {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d: Kolom tidak lengkap", idx+2))
			continue
		}
		prodCode := strings.TrimSpace(row[0])
		matCode := strings.TrimSpace(row[1])
		stationCode := strings.TrimSpace(row[2])
		qty, _ := strconv.ParseFloat(strings.TrimSpace(row[3]), 64)
		wastePct := 0.0
		if len(row) >= 5 {
			wastePct, _ = strconv.ParseFloat(strings.TrimSpace(row[4]), 64)
		}
		notes := getCol(row, 5)

		prod, errP := s.prodRepo.FindByCode(prodCode)
		if errP != nil || prod == nil {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d: Produk %s tidak ditemukan", idx+2, prodCode))
			continue
		}
		mat, errM := s.matRepo.FindByCode(matCode)
		if errM != nil || mat == nil {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d: Material %s tidak ditemukan", idx+2, matCode))
			continue
		}
		st, errS := s.stRepo.FindByCode(stationCode)
		if errS != nil || st == nil {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d: Stasiun %s tidak ditemukan", idx+2, stationCode))
			continue
		}

		bom := &models.ProductBOM{
			ProductID:  prod.ID,
			MaterialID: mat.ID,
			StationID:  st.ID,
			Quantity:   qty,
			WastePct:   wastePct,
			Notes:      notes,
		}

		if err := s.bomRepo.CreateOrUpdate(bom); err != nil {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d (BOM %s-%s): %v", idx+2, prodCode, matCode, err))
		} else {
			res.SuccessCount++
		}
	}

	var uID *uint64
	if actorID > 0 {
		uID = &actorID
	}
	s.auditServ.RecordLog(uID, "IMPORT_BOM", fmt.Sprintf("Imported %d BOM lines", res.SuccessCount))
	return res, nil
}

func (s *importService) ImportMitraAssignments(actorID uint64, r io.Reader) (*ImportResult, error) {
	reader := csv.NewReader(r)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, errors.New("gagal membaca file CSV: " + err.Error())
	}
	if len(records) <= 1 {
		return nil, errors.New("file CSV kosong")
	}

	res := &ImportResult{TotalProcessed: len(records) - 1}
	for idx, row := range records[1:] {
		if len(row) < 4 {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d: Kolom tidak lengkap", idx+2))
			continue
		}
		mitraID, _ := strconv.ParseUint(strings.TrimSpace(row[0]), 10, 64)
		prodCode := strings.TrimSpace(row[1])
		stationCode := strings.TrimSpace(row[2])
		fee, _ := strconv.ParseFloat(strings.TrimSpace(row[3]), 64)
		capEst := 0
		if len(row) >= 5 {
			capEst, _ = strconv.Atoi(strings.TrimSpace(row[4]))
		}
		notes := getCol(row, 5)

		prod, errP := s.prodRepo.FindByCode(prodCode)
		if errP != nil || prod == nil {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d: Produk %s tidak ditemukan", idx+2, prodCode))
			continue
		}
		st, errS := s.stRepo.FindByCode(stationCode)
		if errS != nil || st == nil {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d: Stasiun %s tidak ditemukan", idx+2, stationCode))
			continue
		}

		assign := &models.MitraProductStationAssignment{
			MitraUserID:           mitraID,
			ProductID:             prod.ID,
			StationID:             st.ID,
			PieceRateFee:          fee,
			DailyCapacityEstimate: capEst,
			Notes:                 notes,
		}

		if err := s.mitraRepo.Create(assign); err != nil {
			res.FailedCount++
			res.Errors = append(res.Errors, fmt.Sprintf("Baris %d: %v", idx+2, err))
		} else {
			res.SuccessCount++
		}
	}

	return res, nil
}

func getCol(row []string, idx int) string {
	if idx < len(row) {
		return strings.TrimSpace(row[idx])
	}
	return ""
}
