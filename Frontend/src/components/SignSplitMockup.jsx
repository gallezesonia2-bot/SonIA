import React, { useState } from "react";
import logo from "../assets/sonia-robot-logo.svg";

export default function SignSplitMockup() {
  const [theme, setTheme] = useState("light");

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: theme === "light" ? "linear-gradient(135deg,#f5f0ff 0%, #ffffff 100%)" : "linear-gradient(180deg,#121212 0%, #1a1a1e 100%)" }}>
      <div className="max-w-5xl w-full rounded-2xl shadow-2xl overflow-hidden grid grid-cols-2" style={{ minHeight: 520 }}>
        {/* Left - Form (rectangular) */}
        <div className={`p-10 flex flex-col justify-center ${theme === "light" ? "bg-white text-slate-900" : "bg-[#1E1E24] text-white"}`}>
          <div className="mx-auto mb-6 flex flex-col items-center">
            <img src={logo} alt="SonIA" className="h-12 w-12" />
            <h2 className="mt-4 text-3xl font-extrabold">Sign In</h2>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <div className="flex gap-3 justify-between mb-4">
              <button className={`flex-1 h-10 rounded-lg border ${theme === "light" ? "border-gray-200 bg-white" : "border-transparent bg-[#2A2A30]"} flex items-center justify-center text-sm`}>Google</button>
              <button className={`flex-1 h-10 rounded-lg border ${theme === "light" ? "border-gray-200 bg-white" : "border-transparent bg-[#2A2A30]"} flex items-center justify-center text-sm`}>GitHub</button>
              <button className={`flex-1 h-10 rounded-lg border ${theme === "light" ? "border-gray-200 bg-white" : "border-transparent bg-[#2A2A30]"} flex items-center justify-center text-sm`}>LinkedIn</button>
              <button className={`flex-1 h-10 rounded-lg border ${theme === "light" ? "border-gray-200 bg-white" : "border-transparent bg-[#2A2A30]"} flex items-center justify-center text-sm`}>Email</button>
            </div>

            <p className={`text-sm mb-3 ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>or use your email and password</p>

            <div className="space-y-3">
              <input placeholder="Name" className="w-full rounded-2xl px-4 py-3 text-sm" style={{ background: theme === "light" ? "#F0F0F2" : "#2A2A30", border: "none" }} />
              <input placeholder="Email" className="w-full rounded-2xl px-4 py-3 text-sm" style={{ background: theme === "light" ? "#F0F0F2" : "#2A2A30", border: "none" }} />
              <input placeholder="Password" type="password" className="w-full rounded-2xl px-4 py-3 text-sm" style={{ background: theme === "light" ? "#F0F0F2" : "#2A2A30", border: "none" }} />
            </div>

            <button className="mt-6 w-full rounded-full py-3 text-white font-semibold" style={{ background: theme === "light" ? "#5B2A9E" : "#7C3AED" }}>SIGN IN</button>
          </div>

          <div className="mt-6 text-center">
            <button onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))} className="text-sm underline">Toggle Light / Dark</button>
          </div>
        </div>

        {/* Right - Welcome blob */}
        <div className="relative flex items-center justify-center p-10" style={{ background: theme === "light" ? "transparent" : "transparent" }}>
          <div className={`absolute inset-0 transform -translate-x-8 ${theme === "light" ? "bg-gradient-to-br from-[#7c3aed] to-[#5b2a9e]" : "bg-gradient-to-br from-[#3b0764] to-[#0b0226]"}`} style={{ clipPath: "path('M0,0 H100% V100% Q30% 60% 0 50 Z')" }} />
          <div className="relative z-10 max-w-sm text-center px-6">
            <h3 className="text-4xl font-extrabold text-white">Hello Friend!</h3>
            <p className="mt-4 text-white/90">Register with your personal details to use all of SonIA's features</p>
            <button className="mt-6 rounded-full px-6 py-3 border border-white text-white font-semibold bg-transparent">SIGN UP</button>
          </div>
        </div>
      </div>
    </div>
  );
}
