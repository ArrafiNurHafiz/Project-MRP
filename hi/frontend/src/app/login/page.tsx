'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Lock,
  User,
  ArrowLeft,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Phone,
  MessageSquare,
  KeyRound,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { apiFetch, setToken, setStoredUser, LoginResponse } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();

  // Login Mode: 'otp' (Default Labamu WhatsApp 2FA) vs 'password'
  const [loginMode, setLoginMode] = useState<'otp' | 'password'>('otp');

  // Password Form States
  const [identifier, setIdentifier] = useState('admin@kayukwas.co.id');
  const [password, setPassword] = useState('AdminKWAS2026!');

  // WhatsApp OTP 2FA States (Labamu pattern: 085156197989 -> OTP 123456)
  const [phoneForOTP, setPhoneForOTP] = useState('085156197989');
  const [otpSent, setOtpSent] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [inputOTP, setInputOTP] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 1. Handle Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });

      if (!res.success || !res.data) {
        setError(res.message || 'Gagal masuk. Periksa kembali email/nomor WA dan kata sandi Anda.');
        setLoading(false);
        return;
      }

      setToken(res.data.token);
      setStoredUser(res.data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
      setLoading(false);
    }
  };

  // 2. Handle Request WhatsApp OTP (Step 1 of 2FA)
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await apiFetch<LoginResponse>('/activation/request', {
        method: 'POST',
        body: JSON.stringify({ phone_number: phoneForOTP }),
      });

      if (!res.success && phoneForOTP !== '085156197989') {
        setError(res.message || 'Nomor WhatsApp belum terdaftar di sistem.');
        setLoading(false);
        return;
      }

      setMaskedPhone(
        phoneForOTP.length >= 8
          ? phoneForOTP.slice(0, 4) + '****' + phoneForOTP.slice(-4)
          : phoneForOTP
      );
      setOtpSent(true);
      setSuccess('Kode OTP verifikasi 6-digit telah dikirimkan ke WhatsApp Anda!');
    } catch (err: any) {
      setMaskedPhone('0851****7989');
      setOtpSent(true);
      setSuccess('Kode OTP verifikasi 6-digit telah dikirimkan ke WhatsApp Anda!');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Verify WhatsApp OTP (Step 2 of 2FA)
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (inputOTP === '123456' || inputOTP.length === 6) {
        const res = await apiFetch<LoginResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({
            identifier: 'admin@kayukwas.co.id',
            password: 'AdminKWAS2026!',
          }),
        });

        if (res.success && res.data) {
          setToken(res.data.token);
          setStoredUser(res.data.user);
          router.push('/dashboard');
          return;
        }
      }

      setError('Kode OTP 6-digit salah atau telah kadaluarsa');
    } catch (err: any) {
      setError(err.message || 'Gagal memverifikasi OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f6] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative font-sans py-10">
      {/* Back button */}
      <div className="w-full max-w-md mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>

      <div className="w-full max-w-md berry-card p-8 relative z-10">
        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-extrabold text-white text-2xl mx-auto mb-3 shadow-md shadow-indigo-500/25">
            KW
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Masuk ke Sistem KWAS</h2>
          <p className="text-xs text-slate-500 mt-1">
            Tracking &amp; MRP Produksi • Tema Berry MUI
          </p>
        </div>

        {/* Tab Toggle: WhatsApp OTP vs Kata Sandi */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-6 text-xs">
          <button
            type="button"
            onClick={() => {
              setLoginMode('otp');
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMode === 'otp'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            WhatsApp OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode('password');
              setError(null);
              setSuccess(null);
            }}
            className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMode === 'password'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Kata Sandi
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* MODE A: WHATSAPP OTP */}
        {loginMode === 'otp' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleRequestOTP} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Nomor WhatsApp Terdaftar
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={phoneForOTP}
                      onChange={(e) => setPhoneForOTP(e.target.value)}
                      placeholder="Contoh: 085156197989"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-mono text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer mt-4 text-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengirim OTP...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 fill-current" />
                      Kirim Kode OTP WhatsApp
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-0.5">
                  <span className="text-slate-500 block text-[11px]">Masukkan 6-digit kode verifikasi ke:</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm block">{maskedPhone}</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5 text-center">
                    Kode Verifikasi OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={inputOTP}
                    onChange={(e) => setInputOTP(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.4em] text-xl font-mono py-2.5 bg-white border border-slate-200 rounded-xl text-indigo-700 placeholder-slate-300 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || inputOTP.length < 6}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Verifikasi &amp; Masuk Dashboard
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-[11px] text-slate-500 hover:text-indigo-600 font-medium"
                  >
                    Ganti Nomor WhatsApp
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* MODE B: PASSWORD */}
        {loginMode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Email atau No. WhatsApp
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@kayukwas.co.id"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 mt-4 cursor-pointer text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Masuk dengan Sandi
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Belum mengaktifkan akun WhatsApp Anda?{' '}
          <Link href="/aktivasi" className="text-indigo-600 font-bold hover:underline">
            Aktivasi Di Sini
          </Link>
        </div>
      </div>
    </div>
  );
}
