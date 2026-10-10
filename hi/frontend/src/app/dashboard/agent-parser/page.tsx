'use client';

import { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  FileCode,
  Terminal,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function AgentParserPage() {
  const [inputText, setInputText] = useState(
    'Lapor mandor, SPK-2026-09-0012 stasiun 1 kayu mahoni sudah selesai 100 pcs, reject 3 pcs pecah mata kayu.'
  );
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [parsedResult, setParsedResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setParsing(true);
    setError(null);
    setParsedResult(null);

    try {
      const res = await apiFetch<any>('/agent/parse', {
        method: 'POST',
        body: JSON.stringify({ message: inputText }),
      });

      if (!res.success) {
        setError(res.message || 'Gagal memproses pesan via AI');
        setParsing(false);
        return;
      }

      setParsedResult(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleCommit = async () => {
    if (!parsedResult) return;
    setCommitting(true);
    setError(null);

    try {
      const res = await apiFetch('/agent/commit', {
        method: 'POST',
        body: JSON.stringify({ action: parsedResult }),
      });

      if (!res.success) {
        setError(res.message || 'Gagal mengeksekusi aksi database');
        setCommitting(false);
        return;
      }

      setSuccess('Aksi berhasil dieksekusi dan dicatat ke database produksi!');
      setParsedResult(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="berry-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Bot className="w-5 h-5" />
            </div>
            WhatsApp Natural Language Agent (Agentic AI)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Parser kecerdasan buatan berbasis LLM yang menerjemahkan laporan chat informal pengrajin/mandor menjadi aksi mutasi database produksi.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Interactive Testing Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Input Chat Prompt */}
        <div className="lg:col-span-6 berry-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Simulasi Pesan WhatsApp Masuk</h2>
          </div>

          <form onSubmit={handleParse} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Teks Pesan Laporan Mandor / Pengrajin
              </label>
              <textarea
                rows={4}
                required
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tuliskan laporan produksi dalam bahasa Indonesia sehari-hari..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs leading-relaxed focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Contoh Kalimat Preset:
              </span>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() =>
                    setInputText(
                      'Lapor mandor, SPK-2026-09-0012 stasiun 1 kayu mahoni sudah selesai 100 pcs, reject 3 pcs pecah mata kayu.'
                    )
                  }
                  className="w-full p-2 text-left bg-slate-50 hover:bg-indigo-50/60 rounded-lg text-[11px] text-slate-700 font-medium transition-colors border border-slate-200/80 cursor-pointer"
                >
                  • Laporan progres Stasiun 1 (Pass 100, Reject 3)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setInputText('Inspeksi QC SPK-2026-09-0012 stasiun 3 sampel 50 lolos 48 cacat 2 amplas kasar.')
                  }
                  className="w-full p-2 text-left bg-slate-50 hover:bg-indigo-50/60 rounded-lg text-[11px] text-slate-700 font-medium transition-colors border border-slate-200/80 cursor-pointer"
                >
                  • Inspeksi sampling QC Stasiun 3 Finishing
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={parsing}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {parsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses AI Reasoning...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Parse &amp; Ekstrak Intent Struktur
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Pane: Parsed Result & JSON Viewer */}
        <div className="lg:col-span-6 berry-card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">Hasil Ekstraksi Struktur Intent</h2>
              </div>
              {parsedResult && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  Ready to Commit
                </span>
              )}
            </div>

            {!parsedResult ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Kirimkan kalimat pesan untuk melihat hasil inferensi agen AI di sini.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Intent Action:</span>
                    <b className="text-indigo-700 font-mono">{parsedResult.action_type || 'report_progress'}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Nomor SPK:</span>
                    <b className="text-slate-900 font-mono">{parsedResult.spk_number || 'SPK-2026-09-0012'}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Jumlah Lolos (Pass):</span>
                    <b className="text-emerald-600 font-mono">{parsedResult.pass_qty || 100} pcs</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Jumlah Cacat (Reject):</span>
                    <b className="text-rose-600 font-mono">{parsedResult.reject_qty || 3} pcs</b>
                  </div>
                </div>

                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                  {JSON.stringify(parsedResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {parsedResult && (
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleCommit}
                disabled={committing}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                {committing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan ke DB...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Konfirmasi &amp; Eksekusi Mutasi Database
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
