# LOGIKA BISNIS, FORMULA KALKULASI & STATE MACHINE
## Business Logic, Automation Rules, and Workflows for Labamu MRP Clone

Dokumen ini mendokumentasikan seluruh logika otomatisasi (*auto-triggers*), formula perhitungan finansial & manufaktur, serta diagram *state machine* status transaksi.

---

## 1. Diagram State Machine Transaksi End-to-End

```
+----------------------------------------------------------------------------------------------------+
| 1. RFQ STATE MACHINE                                                                               |
| [DRAFT] ---> [ANALYSIS_PENDING] (Jika ada Custom Product / CPR) ---> [READY_TO_QUOTE] ---> [QUOTED]|
+----------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------+
| 2. QUOTATION STATE MACHINE                                                                        |
| [DRAFT] ---> [SENT_TO_CUSTOMER] ─── (Customer approves on Microsite) ───> [APPROVED]                |
|                                                                                │                   |
|                                         (Auto Trigger: Generate SO, WO, DP Inv)v                   |
|                                                                       [CONVERTED_TO_ORDER]         |
+----------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------+
| 3. SALES ORDER & WORK ORDER DUAL STATE MACHINE                                                     |
|                                                                                                    |
|  Sales Order:  [CONFIRMED] ──> [DOWN_PAYMENT_PENDING] (DP > 0) ──> [IN_PRODUCTION]                |
|                                                                            │                       |
|  Work Order:   [PENDING_ALLOCATION] ──(Auto Allocate)──> [ALLOCATED] ──> [IN_PROGRESS]             |
|                                                                            │ (Shopfloor Routing)   |
|                                                                            v                       |
|  Work Order:   [COMPLETED] <── [QUALITY_CONTROL] <── (All Steps Finished) ─┘                       |
|                     │                                                                              |
|                     v (Stock FG Added)                                                             |
|  Sales Order:  [READY_TO_SHIP] ──(Input Resi/Armada)──> [ON_SHIPPING] ──(BAST)──> [DELIVERED]       |
|                                                                                       │            |
|  Finance:      [FINAL_INVOICE_PAID] ──────────────────────────────────────────────────v            |
|  Sales Order:  [COMPLETED / CLOSED]                                                                |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Formula Kalkulasi Finansial & HPP (Costing Engine)

### A. Perhitungan HPP Bahan Baku BOM (Total Material Cost)
$$\text{Total Material Cost} = \sum_{i=1}^{n} (\text{Required Quantity}_i \times \text{Avg Unit Cost}_i)$$

### B. Perhitungan Biaya Operasi Routing (Total Routing Cost)
$$\text{Total Labor Cost} = \sum_{j \in \text{In-House}} (\text{Standard Hours}_j \times \text{Hourly Labor Rate})$$
$$\text{Total Subcontract Cost} = \sum_{k \in \text{Outsource}} (\text{Vendor Service Rate}_k \times \text{Quantity})$$
$$\text{Total Routing Cost} = \text{Total Labor Cost} + \text{Total Subcontract Cost}$$

### C. Harga Pokok Penjualan (HPP Standar / Unit)
$$\text{Standard Unit Cost (HPP)} = \text{Total Material Cost} + \text{Total Routing Cost}$$

### D. Rekomendasi Harga Jual di CPR & Quotation
$$\text{Suggested Selling Price} = \frac{\text{Standard Unit Cost}}{1 - (\text{Desired Margin \%} / 100)}$$
*Contoh:* HPP = Rp 1.400.000, Margin = 30%  
$$\text{Harga Jual} = \frac{1.400.000}{1 - 0.30} = \text{Rp } 2.000.000$$

### E. Penyesuaian Multi-Valuta (FX Multi-Currency)
$$\text{Foreign Price (USD/SGD)} = \frac{\text{IDR Selling Price}}{\text{Effective Exchange Rate}}$$

---

## 3. Algoritma Alokasi Stok Bahan Baku Otomatis (*Auto-Allocation Engine*)

Saat pengguna mengklik tombol **"Auto Allocate"** pada Work Order, sistem menjalankan algoritma alokasi stok batch berbasis FIFO (*First In, First Out*) & Expiry:

```typescript
// Pseudocode Logika Auto Allocation
async function autoAllocateWorkOrder(workOrderId: string, companyId: string) {
  return await prisma.$transaction(async (tx) => {
    const wo = await tx.workOrder.findUnique({
      where: { id: workOrderId },
      include: { bom: { include: { items: true } } }
    });

    const allocationResults = [];
    let isFullyAllocated = true;

    for (const bomItem of wo.bom.items) {
      const totalRequired = bomItem.quantity * wo.quantity;
      let remainingToAllocate = totalRequired;

      // Ambil batch yang masih memiliki stok aktif (FIFO: purchaseDate ASC)
      const availableBatches = await tx.stockBatch.findMany({
        where: {
          materialId: bomItem.materialId,
          status: { in: ['RECEIVED', 'IN_USE'] },
          currentQuantity: { gt: 0 }
        },
        orderBy: [{ expiryDate: 'asc' }, { purchaseDate: 'asc' }],
        // Kunci baris batch untuk mencegah race condition (Concurrency Lock)
      });

      for (const batch of availableBatches) {
        if (remainingToAllocate <= 0) break;

        const availableInBatch = batch.currentQuantity - batch.allocatedQuantity;
        if (availableInBatch <= 0) continue;

        const allocateAmount = Math.min(availableInBatch, remainingToAllocate);

        // Update kuantitas teralokasi pada batch
        await tx.stockBatch.update({
          where: { id: batch.id },
          data: {
            allocatedQuantity: { increment: allocateAmount }
          }
        });

        // Catat alokasi WO
        await tx.workOrderAllocation.create({
          data: {
            workOrderId: wo.id,
            materialId: bomItem.materialId,
            batchId: batch.id,
            reqQty: allocateAmount,
            allocatedQty: allocateAmount,
            isFulfilled: true
          }
        });

        remainingToAllocate -= allocateAmount;
      }

      if (remainingToAllocate > 0) {
        // Stok gudang tidak mencukupi!
        isFullyAllocated = false;
        await tx.workOrderAllocation.create({
          data: {
            workOrderId: wo.id,
            materialId: bomItem.materialId,
            batchId: null,
            reqQty: remainingToAllocate,
            allocatedQty: 0,
            isFulfilled: false
          }
        });
      }
    }

    // Perbarui status Work Order
    const updatedStatus = isFullyAllocated ? 'ALLOCATED' : 'PENDING_ALLOCATION';
    await tx.workOrder.update({
      where: { id: wo.id },
      data: {
        status: updatedStatus,
        allocatedStatus: isFullyAllocated
      }
    });

    return { isFullyAllocated, workOrderId };
  });
}
```

---

## 4. Alur Kerja Subkontrak (Outsource Routing & PO Jasa)

Ketika suatu tahapan kerja (seperti *Powder Coating* atau *Galvanizing*) bertipe `OUTSOURCE_SUBCONTRACT`:

1. **Release to Vendor:**
   - Operator mengklik `Release to Vendor` pada tahap WO terkait.
   - Sistem membuka wizard penerbitan Purchase Order bertipe `SUBCONTRACT_SERVICE`.
   - Mengisi otomatis Nama Vendor, Kode Tahap Routing, Jumlah Unit WO, Biaya Jasa per unit.
   - Sistem mencetak **Surat Jalan Pengiriman Material ke Subkontraktor**.
   - Status tahapan WO berubah menjadi `RELEASED_TO_VENDOR`.
2. **Receive from Subcontractor:**
   - Ketika barang selesai diproses di luar dan kembali ke pabrik, tim gudang mencatat penerimaan di `/purchase-orders/[id]` -> Tab *Receipts*.
   - Saat penerimaan diverifikasi, webhook internal memicu pembaruan status tahap WO menjadi `RECEIVED_FROM_VENDOR` dan `COMPLETED`.
   - WO siap dilanjutkan ke tahap berikutnya (misal: *Final Assembly & QC*).
