'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MessageSquare,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Lock,
  Phone,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

function AktivasiContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token');

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [phoneNumber, setPhoneNumber] = useState('081298765432');
  const [magicToken, setMagicToken] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (tokenParam) {
      verifyToken(tokenParam);
    }
  }, [tokenParam]);

  const verifyToken = async (token: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{
        token: string;
        phone_mask: string;
        user_name: string;
        expires_at: string;
      }>(`/activation/verify?token=${token}`);

      if (!res.success || !res.data) {
        setError(res.message || 'Tautan aktivasi tidak valid atau telah kadaluarsa.');
        setLoading(false);
        return;
      }

      setSessionToken(res.data.token);
      setMaskedPhone(res.data.phone_mask);
      setUserName(res.data.user_name);
      setOtpCode('');
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Gagal memverifikasi tautan aktivasi');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch<{ token: string; expires_at: string; magic_url: string }>(
        '/activation/request',
        {
          method: 'POST',
          body: JSON.stringify({ phone_number: phoneNumber }),
        }
      );

      if (!res.success || !res.data) {
        setError(res.message || 'Nomor telepon tidak ditemukan dalam daftar pengguna.');
        setLoading(false);
        return;
      }

      setMagicToken(res.data.token);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses permintaan aktivasi');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Kata sandi minimal 8 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/activation/set-password', {
        method: 'POST',
        body: JSON.stringify({
          token: sessionToken,
          otp: otpCode,
          new_password: newPassword,
        }),
      });

      if (!res.success) {
        setError(res.message || 'Gagal mengatur kata sandi');
        setLoading(false);
        return;
      }

      setSuccessMessage('Akun berhasil diaktifkan! Anda dapat login dengan kata sandi baru.');
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f6] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 font-sans py-10">
      <div className="w-full max-w-lg mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>

      <div className="w-full max-w-lg berry-card p-8 relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-extrabold text-white text-2xl mx-auto mb-3 shadow-md shadow-indigo-500/25">
            KW
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Aktivasi Mandiri Akun WhatsApp
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Proses cold bonding aman tanpa membocorkan kata sandi awal
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2 pt-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : step > s
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 4 && <div className={`w-8 sm:w-12 h-0.5 ${step > s ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Masukkan Nomor Telepon */}
        {step === 1 && (
          <form onSubmit={handleRequestMagicLink} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Nomor Telepon / WhatsApp Terdaftar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="081298765432"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengirim Permintaan...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  Kirim Tautan Aktivasi WhatsApp
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Menunggu Klik Magic Link */}
        {step === 2 && (
          <div className="space-y-4 text-xs text-center">
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-slate-700 space-y-2">
              <span className="font-bold text-indigo-950 block">Tautan Aktivasi Dikirimkan!</span>
              <p className="text-[11px] text-slate-600">
                Silakan periksa WhatsApp Anda dan klik tautan aktivasi atau klik tombol di bawah untuk simulasi langsung:
              </p>
            </div>

            <button
              onClick={() => verifyToken(magicToken)}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              Simulasi Klik Tautan dari WhatsApp
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 3: Input OTP & Set Password */}
        {step === 3 && (
          <form onSubmit={handleSetPassword} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Pengguna:</span>
                <b className="text-slate-900">{userName}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Terdaftar:</span>
                <b className="font-mono text-indigo-700">{maskedPhone}</b>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kode OTP 6-Digit (Cek WhatsApp Anda) *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-[0.4em] py-2.5 bg-white border border-slate-200 rounded-xl text-indigo-700 font-mono text-lg font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Kata Sandi Baru *</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Konfirmasi Kata Sandi Baru *</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengaktifkan Akun...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Simpan Sandi &amp; Aktifkan Akun
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: Sukses */}
        {step === 4 && (
          <div className="space-y-4 text-center text-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Aktivasi Selesai!</h2>
            <p className="text-slate-600 leading-relaxed">
              {successMessage}
            </p>

            <Link
              href="/login"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer text-xs mt-4"
            >
              Masuk ke Halaman Login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AktivasiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#eef2f6] flex items-center justify-center text-slate-500 text-xs">Memuat modul aktivasi...</div>}>
      <AktivasiContent />
    </Suspense>
  );
}
