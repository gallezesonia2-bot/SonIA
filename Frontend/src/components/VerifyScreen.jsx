import { useState } from "react";
import { verifyCode, resendCode } from "../api";
import { IconGoogle } from "../icons";
import logo from "../assets/sonia-robot-logo.svg";

function VerifyScreen({ email, theme = "dark", onVerified, onBack }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);
  const isLight = theme === "light";

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await verifyCode(email, code.trim());
      onVerified(user);
    } catch (err) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResending(true);
    try {
      await resendCode(email);
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      setError(err.message || "Could not resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isLight ? "bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.08),_transparent_45%),linear-gradient(135deg,#f5f0ff_0%,#ffffff_100%)] text-slate-900" : "bg-gradient-to-b from-[#121212] to-[#1a1a1e] text-white"}`}>
      <div className={`w-full max-w-md rounded-2xl shadow-2xl p-10 ${isLight ? "bg-white" : "bg-[#1E1E24]"}`}>
        <div className="mx-auto mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="SonIA" className={`h-16 w-16 ${isLight ? "" : "drop-shadow-[0_6px_18px_rgba(124,58,237,0.24)]"}`} />
          <h2 className={`mt-4 text-3xl font-extrabold ${isLight ? "text-slate-900" : "text-white"}`}>Verify your email</h2>
          <p className={`mt-2 text-sm ${isLight ? "text-gray-500" : "text-gray-400"}`}>
            We sent a 6-digit code to <span className="font-medium">{email}</span>. Enter it below to continue.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="123456"
            autoFocus
            className="w-full rounded-2xl px-4 py-3 text-center text-lg tracking-[0.5em] font-semibold"
            style={{ background: isLight ? "#F0F0F2" : "#2A2A30", border: "none", color: isLight ? "#111827" : "#fff" }}
          />

          {error && (
            <div className={`rounded-2xl px-4 py-3 text-sm ${isLight ? "border-rose-200 bg-rose-50 text-rose-600" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full rounded-full py-3 text-white font-semibold disabled:opacity-50"
            style={{ background: isLight ? "#5B2A9E" : "#7C3AED" }}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className={`text-sm underline ${resending ? "opacity-50" : ""}`}
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
          {sent && <span className={`ml-3 text-sm ${isLight ? "text-emerald-600" : "text-emerald-400"}`}>Code resent!</span>}
        </div>

        {onBack && (
          <div className="mt-6 text-center">
            <button type="button" onClick={onBack} className="text-sm underline opacity-70">
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyScreen;
