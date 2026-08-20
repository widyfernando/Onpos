import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BarChart3,
  Boxes,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  ShoppingCart,
  UserRound,
} from 'lucide-react';
import { loginUser } from '../services/authService';
import Swal from 'sweetalert2';
import logo from '../components/assets/Logo.png';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const user = await loginUser(username, password);

      if (onLoginSuccess) onLoginSuccess(user);

      navigate('/home', { replace: true });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="relative min-h-screen bg-[#071526] bg-cover bg-center bg-no-repeat text-slate-900"
      style={{ backgroundImage: "url('/bike-tools-ai-background.png')" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#030b16]/35 via-[#071526]/30 to-[#030b16]/70" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_50%,rgba(47,125,211,0.14),transparent_32%)]" />
      <div className="relative grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">

          <div className="relative z-10 flex items-center gap-3">
            <img src={logo} alt="BikeStore" className="h-11 w-11 rounded bg-white p-1" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-200">BikeStore ERP</p>
              <p className="text-xs text-slate-300">Operational Management System</p>
            </div>
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-white/10 px-4 py-2 text-sm text-cyan-100 backdrop-blur">
              <ShieldCheck size={16} />
              Secure internal access
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white">
              Kendalikan operasional toko dari satu dashboard ERP.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Pantau penjualan, stok, pesanan, dan otoritas pengguna dengan akses yang terkontrol untuk tim internal.
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
              <div className="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur">
                <ShoppingCart className="mb-4 text-cyan-200" size={24} />
                <p className="text-2xl font-bold">128</p>
                <p className="mt-1 text-xs text-slate-300">Order aktif</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur">
                <Boxes className="mb-4 text-emerald-200" size={24} />
                <p className="text-2xl font-bold">32</p>
                <p className="mt-1 text-xs text-slate-300">Stok rendah</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur">
                <BarChart3 className="mb-4 text-amber-200" size={24} />
                <p className="text-2xl font-bold">94%</p>
                <p className="mt-1 text-xs text-slate-300">Target sales</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 grid max-w-xl grid-cols-[1fr_auto] items-end gap-6 rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div>
              <p className="text-sm font-semibold text-white">Daily operation snapshot</p>
              <p className="mt-2 text-xs leading-5 text-slate-300">
                Sistem hanya untuk personel berwenang. Semua aktivitas akses dapat dicatat oleh administrator.
              </p>
            </div>
            <div className="h-20 w-32 rounded-md bg-white/10 p-3">
              <div className="mb-2 h-2 w-20 rounded bg-cyan-200" />
              <div className="mb-2 h-2 w-14 rounded bg-emerald-200" />
              <div className="h-2 w-24 rounded bg-amber-200" />
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:pr-12">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:p-9">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500" />
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <img src={logo} alt="BikeStore" className="h-11 w-11 rounded bg-white p-1 shadow-sm" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">BikeStore ERP</p>
                <p className="text-xs text-slate-500">Operational Management System</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                <ShieldCheck size={14} />
                Authorized personnel only
              </p>
              <h2 className="text-3xl font-bold text-slate-950">Masuk ke ERP</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Gunakan akun internal Anda untuk mengakses dashboard operasional.
              </p>
            </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Username</label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  required
                  className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#2f7dd3] focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <button type="button" onClick={() => Swal.fire({ icon: 'info', title: 'Reset Password', text: 'Hubungi administrator BikeStore untuk melakukan reset password akun Anda.', confirmButtonText: 'Mengerti', confirmButtonColor: '#2f7dd3' })} className="text-xs font-medium text-[#2f7dd3] hover:text-[#1d5fa6]">
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  required
                  className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-12 pr-12 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#2f7dd3] focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="font-semibold">Login gagal</p>
                  <p className="mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition ${
                loading
                  ? 'cursor-not-allowed bg-slate-400'
                  : 'bg-[#2f7dd3] hover:bg-[#246cb8] focus:outline-none focus:ring-4 focus:ring-blue-100'
              }`}
            >
              {loading ? 'Memverifikasi akun...' : 'Masuk ke Dashboard'}
            </button>
          </form>

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-200 pt-5 text-xs text-slate-500">
              <span>BikeStore ERP</span>
              <span>Secure access v1.0</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
