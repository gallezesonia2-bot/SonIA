import { useState } from "react";
import { API_URL } from "../api";
import { IconGoogle } from "../icons";
import logo from "../assets/sonia-robot-logo.svg";

function LoginScreen({ onSignIn, isLoading, error, theme = "dark" }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const isLight = theme === "light";

  const handleSubmit = (e) => {
    e.preventDefault();
    onSignIn(email.trim(), name.trim());
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isLight ? "bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.08),_transparent_45%),linear-gradient(135deg,#f5f0ff_0%,#ffffff_100%)] text-slate-900" : "bg-gradient-to-b from-[#121212] to-[#1a1a1e] text-white"}`}>
      <div className="w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden grid grid-cols-2" style={{ minHeight: 520 }}>
        {/* Left - Sign In Form */}
        <div className={`p-10 flex flex-col justify-center ${isLight ? "bg-white" : "bg-[#1E1E24]"}`}>
          <div className="mx-auto mb-6 flex flex-col items-center">
            <img src={logo} alt="SonIA" className={`h-12 w-12 ${isLight ? "" : "drop-shadow-[0_6px_18px_rgba(124,58,237,0.24)]"}`} />
            <h2 className={`mt-4 text-3xl font-extrabold ${isLight ? "text-slate-900" : "text-white"}`}>Sign In</h2>
          </div>

          <div className="mx-auto w-full max-w-sm">
              <div className="mb-4">
                <button onClick={handleGoogleSignIn} className={`flex w-full h-12 items-center justify-center gap-3 rounded-full ${isLight ? "bg-white text-slate-900 border border-gray-200" : "bg-[#2A2A30] text-white border border-transparent"} font-medium transition-shadow shadow-sm hover:shadow-md`}>
                  <IconGoogle className="h-5 w-5" />
                  Continue with Google
                </button>
              </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl px-4 py-3 text-sm" style={{ background: isLight ? "#F0F0F2" : "#2A2A30", border: "none", color: isLight ? "#111827" : "#fff" }} />
              <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl px-4 py-3 text-sm" style={{ background: isLight ? "#F0F0F2" : "#2A2A30", border: "none", color: isLight ? "#111827" : "#fff" }} />

              {error && <div className={`rounded-2xl px-4 py-3 text-sm ${isLight ? "border-rose-200 bg-rose-50 text-rose-600" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>{error}</div>}

              <button type="submit" disabled={isLoading} className="mt-2 w-full rounded-full py-3 text-white font-semibold" style={{ background: isLight ? "#5B2A9E" : "#7C3AED" }}>{isLoading ? "Signing in..." : "SIGN IN"}</button>
            </form>
          </div>
        </div>

        {/* Right - Welcome Blob */}
        <div className="relative flex items-center justify-center p-10 overflow-hidden">
          <svg className="absolute -left-28 -top-20 h-[700px] w-[700px] transform scale-100" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <defs>
              <linearGradient id="sgg" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor={isLight ? "#7c3aed" : "#5B2A9E"} stopOpacity="1" />
                <stop offset="100%" stopColor={isLight ? "#5b2a9e" : "#0b0226"} stopOpacity="1" />
              </linearGradient>
            </defs>
            <path d="M421.9,46.6C486.6,87.8,514.6,168.1,513.4,241.6C512.1,315.1,481.6,381.8,427.4,430.6C373.2,479.4,295.2,500.3,224,490.3C152.8,480.3,88.4,439.4,50.6,383.8C12.8,328.2,1.6,258.8,25.9,197.4C50.2,136,110.9,83.6,176.7,57.6C242.6,31.6,357.3,5.4,421.9,46.6Z" fill="url(#sgg)" />
          </svg>

          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
            <img src={logo} alt="SonIA" className="h-20 w-20 mb-4" />
            <div className="text-4xl font-extrabold tracking-tight text-white">SonIA</div>
            <p className="mt-4 text-lg font-medium text-white/90">Your AI companion that listens, learns, and helps.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
