import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiError } from "@/lib/api";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back, Suzanne.");
      navigate("/admin");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white" data-testid="admin-login-page">
      {/* Left: brand */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#0A0B10] text-white p-12 relative overflow-hidden">
        <Link to="/" className="font-display font-black text-2xl tracking-tighter">
          SUZANNE<span className="text-[#7BC4C4]">.</span>
        </Link>
        <div>
          <h1 className="font-display font-black uppercase text-6xl tracking-tighter leading-[0.9]">
            Studio<br />Control<br /><span className="text-[#7BC4C4]">Room.</span>
          </h1>
          <p className="text-neutral-400 mt-6 max-w-md">
            Manage categories, projects, profile and messages — all in one quiet, well-lit place.
          </p>
        </div>
        <div className="text-[11px] tracking-[0.3em] uppercase text-neutral-500">
          Authorized personnel only
        </div>
        <div className="absolute -right-32 -bottom-32 w-96 h-96 border border-white/10 rotate-12" />
        <div className="absolute -right-20 -bottom-20 w-72 h-72 border border-[#7BC4C4]/30 -rotate-12" />
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <form onSubmit={onSubmit} className="w-full max-w-sm" data-testid="login-form">
          <Link to="/" className="text-[11px] tracking-[0.3em] uppercase text-neutral-500 hover:text-[#7BC4C4]">
            ← Back to site
          </Link>
          <h2 className="font-display font-black text-4xl tracking-tighter mt-6">Sign in</h2>
          <p className="text-sm text-neutral-500 mt-2">Enter your admin credentials.</p>

          <div className="mt-10 space-y-6">
            <label className="block">
              <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">Email</span>
              <input
                data-testid="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full bg-transparent border-b border-neutral-300 focus:border-[#7BC4C4] outline-none py-3 text-lg"
                placeholder="you@studio.com"
              />
            </label>
            <label className="block">
              <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">Password</span>
              <input
                data-testid="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 w-full bg-transparent border-b border-neutral-300 focus:border-[#7BC4C4] outline-none py-3 text-lg"
                placeholder="••••••••"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit"
            className="mt-10 w-full bg-[#0A0B10] text-white py-4 text-[12px] tracking-[0.2em] uppercase hover:bg-[#7BC4C4] transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>
      </div>
    </div>
  );
}
