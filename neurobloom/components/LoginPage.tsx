"use client";

import { useState } from 'react';
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Lock, Mail, ArrowLeft, ShieldCheck, Activity, Globe } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSwitcher } from './ui/LanguageSwitcher';

export function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }
      localStorage.setItem("token", data.token);
      if (data.name) localStorage.setItem("userName", data.name);
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

    return (
      <div className="h-screen w-full bg-[#5C94FC] flex items-center justify-center p-6 overflow-hidden font-sans relative">
        {/* Background Clouds */}
        <div className="absolute top-20 left-10 w-32 h-10 bg-white rounded-full opacity-60 blur-sm" />
        <div className="absolute top-40 right-20 w-40 h-12 bg-white rounded-full opacity-40 blur-md" />
        
        {/* Grass floor */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-[#43B047] border-t-8 border-black" />
  
        {/* Back to home */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-8 left-8 flex items-center gap-2 text-white hover:text-accent transition-all text-xs font-black uppercase tracking-widest z-20"
        >
          <ArrowLeft size={16} />
          {t("login_back_to_portal")}
        </button>
  
        <div className="absolute top-8 right-8 z-20">
          <LanguageSwitcher />
        </div>
  
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl relative z-10"
        >
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col md:flex-row min-h-[500px]">
            
            {/* Left Side: Branding */}
            <div className="hidden md:flex w-2/5 bg-foreground p-12 flex-col justify-between relative overflow-hidden border-r-4 border-black">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-10">
                  <div className="p-3 bg-primary border-2 border-white rounded-lg shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                    <Brain className="text-white" size={32} />
                  </div>
                  <span className="text-2xl font-black text-white tracking-tight uppercase">{t("login_neurobloom_brand")}</span>
                </div>
                <h2 className="text-4xl font-black text-white leading-tight mb-6 uppercase italic">
                  {t("login_advanced_cognitive")} <br /> 
                  <span className="text-primary">{t("login_diagnostics")}</span>
                </h2>
                <p className="text-white/60 text-sm leading-relaxed font-bold uppercase tracking-widest">
                  {t("login_description")}
                </p>
              </div>
  
              <div className="relative z-10 space-y-4 border-t-2 border-white/10 pt-8">
                <div className="flex items-center gap-3 text-white">
                  <ShieldCheck size={20} className="text-accent" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t("login_end_to_end")}</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Globe size={20} className="text-secondary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t("login_regional_data")}</span>
                </div>
              </div>
            </div>
  
            {/* Right Side: Login Form */}
            <div className="flex-1 p-10 md:p-16 flex flex-col justify-center bg-white">
              <div className="mb-10">
                <h1 className="text-4xl font-black text-black tracking-tight uppercase">{t("login_practitioner_login")}</h1>
                <div className="h-2 w-16 bg-primary mt-4" />
                <p className="text-black/40 text-xs font-black uppercase tracking-widest mt-4">{t("login_auth_required")}</p>
              </div>
  
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-black uppercase tracking-widest">{t("login_email_protocol")}</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("login_email_placeholder")}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-muted border-4 border-black focus:outline-none focus:bg-white transition-all text-sm font-black tracking-tight"
                    />
                  </div>
                </div>
  
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-black uppercase tracking-widest">{t("login_security_token")}</label>
                    <button type="button" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">{t("login_reset")}</button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black group-focus-within:text-primary transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("login_password_placeholder")}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-muted border-4 border-black focus:outline-none focus:bg-white transition-all text-sm font-black uppercase tracking-tight"
                    />
                  </div>
                </div>
  
                <div className="pt-6">
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-6 bg-primary text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 font-black text-lg uppercase tracking-widest flex items-center justify-center gap-4 hover:translate-y-[-2px] transition-all"
                  >
                    {loading ? t("login_authorizing") : t("login_initialize_session")}
                    {!loading && <Activity size={24} />}
                  </button>
                </div>
              </form>
  
              <div className="mt-12 pt-8 border-t-4 border-black text-center">
                <p className="text-black/40 text-xs font-black uppercase tracking-widest">
                  {t("login_new_practitioner")}{" "}
                  <button
                    onClick={() => router.push("/signup")}
                    className="text-secondary font-black hover:underline"
                  >
                    {t("login_request_access")}
                  </button>
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer Meta */}
          <div className="mt-8 flex justify-center gap-6 text-white text-[10px] font-black uppercase tracking-widest drop-shadow-md">
            <span>{t("login_footer_copyright")}</span>
            <span className="text-black">•</span>
            <span>{t("login_footer_status")}</span>
            <span className="text-black">•</span>
            <span>{t("login_footer_version")}</span>
          </div>
        </motion.div>
      </div>
    );
  }
  