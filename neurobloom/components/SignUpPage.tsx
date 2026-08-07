"use client";
import { useRouter } from "next/navigation";
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSwitcher } from './ui/LanguageSwitcher';

import { Brain, Mail, Lock, User, ArrowLeft, Shield, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from "./ui/button";

export function SignUpPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'parent',
    agreement: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Signup failed");
      return;
    }

    //  Signup success
    alert("Account created successfully!");
    router.push("/login");

  } catch (error) {
    console.error("Signup error:", error);
    alert("Something went wrong. Please try again.");
  }
};


    return (
      <div className="min-h-screen bg-[#5C94FC] flex items-center justify-center px-6 py-12 relative overflow-hidden font-sans">
        {/* Background Clouds */}
        <div className="absolute top-20 left-10 w-32 h-10 bg-white rounded-full opacity-60 blur-sm" />
        <div className="absolute top-40 right-20 w-40 h-12 bg-white rounded-full opacity-40 blur-md" />
        
        {/* Grass floor */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-[#43B047] border-t-8 border-black" />
  
        {/* Back to home button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-8 left-8 flex items-center gap-2 text-white hover:text-accent transition-all text-xs font-black uppercase tracking-widest z-20"
        >
          <ArrowLeft size={16} />
          <span>{t("signup_back_to_home")}</span>
        </button>
  
        <div className="absolute top-10 right-8 z-20">
          <LanguageSwitcher />
        </div>
  
        {/* Sign Up Card */}
        <div className="w-full max-w-5xl mt-4 relative z-10">
          <div className="grid md:grid-cols-5 gap-0 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            
            {/* Left Side - Mission Message */}
            <div className="md:col-span-2 bg-primary p-10 text-white flex flex-col justify-center border-r-4 border-black">
              <div className="w-16 h-16 bg-white border-2 border-black rounded-lg flex items-center justify-center mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Brain className="text-primary" size={32} />
              </div>
              
              <h2 className="text-4xl font-black mb-6 uppercase italic tracking-tight leading-none">
                {t("signup_join_neurobloom")}
              </h2>
              
              <p className="text-white/80 mb-10 leading-relaxed font-bold uppercase tracking-widest text-sm">
                {t("signup_join_description")}
              </p>
  
              <div className="space-y-6">
                {[t("signup_feature_1"), t("signup_feature_2"), t("signup_feature_3")].map((text, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-accent border-2 border-black flex-shrink-0 mt-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                    <p className="text-xs font-black uppercase tracking-widest text-white">{text}</p>
                  </div>
                ))}
              </div>
            </div>
  
            {/* Right Side - Sign Up Form */}
            <div className="md:col-span-3 p-10 md:p-14 bg-white">
              {/* Heading */}
              <div className="mb-10">
                <h1 className="text-4xl font-black text-black mb-2 uppercase tracking-tighter">
                  {t("signup_create_account")}
                </h1>
                <div className="h-2 w-20 bg-secondary mt-4" />
                <p className="text-black/40 font-black uppercase tracking-widest mt-4 text-xs">
                  {t("signup_create_subtitle")}
                </p>
              </div>
  
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-xs font-black text-black uppercase tracking-widest ml-1">
                    {t("signup_full_name_label")}
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black group-focus-within:text-primary transition-colors" />
                    <input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder={t("signup_full_name_placeholder")}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-muted border-4 border-black focus:outline-none focus:bg-white transition-all text-sm font-black uppercase tracking-tight"
                    />
                  </div>
                </div>
  
                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-black text-black uppercase tracking-widest ml-1">
                    {t("signup_email_label")}
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black group-focus-within:text-primary transition-colors" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t("signup_email_placeholder")}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-muted border-4 border-black focus:outline-none focus:bg-white transition-all text-sm font-black tracking-tight"
                    />
                  </div>
                </div>
  
                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-xs font-black text-black uppercase tracking-widest ml-1">
                    {t("signup_password_label")}
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black group-focus-within:text-primary transition-colors" />
                    <input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={t("signup_password_placeholder")}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-muted border-4 border-black focus:outline-none focus:bg-white transition-all text-sm font-black uppercase tracking-tight"
                    />
                  </div>
                </div>
  
                {/* Role */}
                <div className="space-y-2">
                  <label htmlFor="role" className="text-xs font-black text-black uppercase tracking-widest ml-1">
                    {t("signup_role_label")}
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-6 py-4 bg-muted border-4 border-black focus:outline-none focus:bg-white transition-all text-sm font-black uppercase appearance-none"
                  >
                    <option value="parent">{t("signup_role_parent")}</option>
                    <option value="educator">{t("signup_role_educator")}</option>
                    <option value="researcher">{t("signup_role_researcher")}</option>
                  </select>
                </div>
  
                {/* Agreement */}
                <div className="bg-muted border-4 border-black p-4 shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.agreement}
                      onChange={(e) => setFormData({ ...formData, agreement: e.target.checked })}
                      required
                      className="mt-1 w-6 h-6 border-4 border-black bg-white checked:bg-primary appearance-none cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-white checked:after:font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <span className="text-xs font-bold text-black/60 leading-relaxed uppercase tracking-tight">
                      {t("signup_agreement_text")}
                    </span>
                  </label>
                </div>
  
                {/* Create Account Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full py-8 text-xl uppercase italic shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                >
                  {t("signup_submit_button")}
                </Button>
              </form>
  
              {/* Login Link */}
              <div className="mt-8 text-center">
                <p className="text-black/40 text-xs font-black uppercase tracking-widest">
                  {t("signup_already_have_account")}{' '}
                  <button
                    onClick={() => router.push("/login")}
                    className="text-primary font-black hover:underline"
                  >
                    {t("signup_login_link")}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  