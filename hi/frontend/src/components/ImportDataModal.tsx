'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { API_BASE, getToken } from '@/lib/api';

interface ImportModalProps {
  moduleName: string;
  moduleLabel: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportDataModal({
  moduleName,
  moduleLabel,
  isOpen,
  onClose,
  onSuccess,
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success_count: number;
    failed_count: number;
    total_processed: number;
    errors?: string[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const token = getToken();
    const url = `${API_BASE}/import/template/${moduleName}`;

    // Trigger download with auth header using fetch blob
    fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `template_import_${moduleName}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => {
        alert('Gagal mendownload template: ' + err.message);
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Pilih file template CSV yang sudah diisi terlebih dahulu');
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setResult(null);

    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/import/${moduleName}`, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.message || 'Gagal mengimpor data');
      } else {
        setResult(json.data);
        if (json.data?.success_count > 0) {
          onSuccess();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Import Data Massal: {moduleLabel}
              </h2>
              <span className="text-[11px] text-slate-500">
                Unduh template resmi dan unggah file CSV untuk penginputan otomatis
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Download Template */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-900">1. Unduh Template CSV Resmi</div>
            <div className="text-[11px] text-slate-500">
              Format kolom sudah disesuaikan secara presisi dengan sistem MRP
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs border border-indigo-200 transition-all cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Download Template (.CSV)
          </button>
        </div>

        {/* Step 2: Form Upload */}
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              2. Pilih File CSV Hasil Pengisian
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:cursor-pointer p-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {result && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Selesai Diproses: {result.success_count} berhasil, {result.failed_count} gagal (dari total {result.total_processed} baris).
                </span>
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="pt-2 border-t border-emerald-200 text-[11px] text-rose-700 space-y-1">
                  <b>Catatan Error:</b>
                  {result.errors.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengunggah &amp; Memproses...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Upload &amp; Import Data
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
