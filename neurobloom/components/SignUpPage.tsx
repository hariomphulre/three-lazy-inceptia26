"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "../hooks/useTranslation";
import { LanguageSwitcher } from "./ui/LanguageSwitcher";
import { Brain, Mail, Lock, User, ArrowLeft, Users, BookOpen, Stethoscope } from "lucide-react";
import { useState, Suspense } from "react";
import { Button } from "./ui/button";

const ROLE_OPTIONS = [
  {
    value: "parent",
    label: "Parent / Guardian",
    icon: <Users size={18} />,
    color: "border-[#43B047]",
    activeBg: "bg-[#43B047]",
    desc: "Track your child's assessments & progress",
  },
  {
    value: "teacher",
    label: "Teacher",
    icon: <BookOpen size={18} />,
    color: "border-[#5C94FC]",
    activeBg: "bg-[#5C94FC]",
    desc: "Add students & assign cognitive assessments",
  },
  {
    value: "doctor",
    label: "Doctor / Psychologist",
    icon: <Stethoscope size={18} />,
    color: "border-[#9C27B0]",
    activeBg: "bg-[#9C27B0]",
    desc: "Review cases and add clinical notes",
  },
];

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  // Pre-fill referral code from URL: /signup?ref=CODE
  const urlRef = searchParams.get("ref") || "";

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "parent",
    agreement: false,
    referralCode: urlRef,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.agreement) {
      setError("You must accept the terms to continue.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          referralCode: formData.referralCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      // If a redirectTo is returned (referral), go there after login
      if (data.redirectTo) {
        router.push(`/login?next=${encodeURIComponent(data.redirectTo)}`);
      } else {
        router.push("/login");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#5C94FC] flex items-center justify-center px-6 py-12 relative overflow-hidden font-sans">
      {/* Clouds */}
      <div className="absolute top-20 left-10 w-32 h-10 bg-white rounded-full opacity-60 blur-sm" />
      <div className="absolute top-40 right-20 w-40 h-12 bg-white rounded-full opacity-40 blur-md" />
      {/* Grass */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-[#43B047] border-t-8 border-black" />

      <button
        onClick={() => router.push("/")}
        className="absolute top-8 left-8 flex items-center gap-2 text-white hover:text-accent transition-all text-xs font-black uppercase tracking-widest z-20"
      >
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </button>

      <div className="absolute top-10 right-8 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-5xl mt-4 relative z-10">
        <div className="grid md:grid-cols-5 gap-0 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          {/* Left side */}
          <div className="md:col-span-2 bg-primary p-10 text-white flex flex-col justify-center border-r-4 border-black">
            <div className="w-16 h-16 bg-white border-2 border-black rounded-lg flex items-center justify-center mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Brain className="text-primary" size={32} />
            </div>
            <h2 className="text-4xl font-black mb-6 uppercase italic tracking-tight leading-none">
              Join NeuroBloom
            </h2>
            <p className="text-white/80 mb-10 leading-relaxed font-bold uppercase tracking-widest text-sm">
              Create your role-based account to access cognitive assessments and diagnostics.
            </p>
            <div className="space-y-4">
              {ROLE_OPTIONS.map(r => (
                <div key={r.value} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-white/20 border-2 border-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    {r.icon}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest">{r.label}</p>
                    <p className="text-[10px] text-white/60 font-bold mt-0.5">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side — Form */}
          <div className="md:col-span-3 p-10 md:p-14 bg-white">
            <div className="mb-8">
              <h1 className="text-4xl font-black text-black mb-2 uppercase tracking-tighter">Create Account</h1>
              <div className="h-2 w-20 bg-secondary mt-4" />
              <p className="text-black/40 font-black uppercase tracking-widest mt-4 text-xs">
                Register as a parent, teacher, or doctor
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-black uppercase tracking-widest">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Your full name"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-muted border-4 border-black focus:outline-none focus:bg-white transition-all text-sm font-black uppercase tracking-tight"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-black uppercase tracking-widest">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-muted border-4 border-black focus:outline-none focus:bg-white transition-all text-sm font-black tracking-tight"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-black uppercase tracking-widest">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    className="w-full pl-12 pr-4 py-4 bg-muted border-4 border-black focus:outline-none focus:bg-white transition-all text-sm font-black uppercase tracking-tight"
                  />
                </div>
              </div>

              {/* Role selection cards */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-black uppercase tracking-widest">I am a…</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLE_OPTIONS.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r.value })}
                      className={`p-3 border-4 border-black text-center transition-all flex flex-col items-center gap-1.5 ${
                        formData.role === r.value
                          ? `${r.activeBg} text-white shadow-none translate-x-0.5 translate-y-0.5`
                          : "bg-muted text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                      }`}
                    >
                      {r.icon}
                      <span className="text-[9px] font-black uppercase tracking-wide leading-tight">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Referral code — only relevant for parents joining via a teacher's invite */}
              {formData.role === "parent" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-black uppercase tracking-widest">
                    Referral Code <span className="text-black/40">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.referralCode}
                    onChange={e => setFormData({ ...formData, referralCode: e.target.value })}
                    placeholder="From your teacher's invite email"
                    className="w-full px-4 py-3 bg-muted border-4 border-black focus:outline-none focus:bg-white transition-all text-sm font-black tracking-tight"
                  />
                  {urlRef && (
                    <p className="text-[10px] font-black text-[#43B047] uppercase">✓ Referral code applied from invite link</p>
                  )}
                </div>
              )}

              {/* Agreement */}
              <div className="bg-muted border-4 border-black p-4">
                <label className="flex items-start gap-4 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.agreement}
                    onChange={e => setFormData({ ...formData, agreement: e.target.checked })}
                    required
                    className="mt-1 w-6 h-6 border-4 border-black bg-white checked:bg-primary appearance-none cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-white checked:after:font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <span className="text-xs font-bold text-black/60 leading-relaxed uppercase tracking-tight">
                    I agree to NeuroBloom's terms of service and privacy policy. Data is used solely for educational assessment purposes.
                  </span>
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border-4 border-[#E52521] px-4 py-3">
                  <p className="text-xs font-black text-[#E52521] uppercase">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full py-8 text-xl uppercase italic shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                {loading ? "Creating Account…" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-black/40 text-xs font-black uppercase tracking-widest">
                Already have an account?{" "}
                <button onClick={() => router.push("/login")} className="text-primary font-black hover:underline">
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#5C94FC] flex items-center justify-center"><div className="text-white font-black uppercase">Loading…</div></div>}>
      <SignUpForm />
    </Suspense>
  );
}