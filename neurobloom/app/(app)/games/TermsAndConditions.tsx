"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Eye,
  Scale,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Button } from "@/components/ui/button";

interface TermsAndConditionsProps {
  onAccept: () => void;
  onBack?: () => void;
}

export function TermsAndConditions({ onAccept }: TermsAndConditionsProps) {
  const { t } = useTranslation();
  const [accepted, setAccepted] = useState(false);

    return (
      <div className="h-screen w-full bg-[#5C94FC] flex items-center justify-center p-6 overflow-hidden font-sans relative">
        {/* Background Clouds */}
        <div className="absolute top-20 left-10 w-32 h-10 bg-white rounded-full opacity-60 blur-sm" />
        <div className="absolute top-40 right-20 w-40 h-12 bg-white rounded-full opacity-40 blur-md" />
        
        {/* Grass floor */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-[#43B047] border-t-8 border-black" />
  
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-3xl z-10"
        >
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
  
            {/* Header */}
            <div className="bg-foreground px-10 py-8 flex justify-between items-center border-b-4 border-black">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary border-2 border-white rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                  <ShieldCheck className="text-white" size={28} />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                    {t('tc_title')}
                  </h1>
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.25em] font-black mt-1">
                    {t('tc_subtitle')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-accent border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="w-2 h-2 bg-[#43B047] border border-black animate-pulse" />
                  <span className="text-[10px] text-black font-black uppercase tracking-widest">
                    {t('tc_hipaa')}
                  </span>
                </div>
              </div>
            </div>
  
            {/* Content */}
            <div className="p-10">
  
              {/* Terms Box */}
              <div className="bg-muted border-4 border-black p-8 mb-10 max-h-72 overflow-y-auto shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)] custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-black">
  
                  {[
                    {
                      title: t('tc_data_usage'),
                      icon: <Eye size={18} className="text-primary" />,
                      text: t('tc_data_usage_desc'),
                    },
                    {
                      title: t('tc_privacy'),
                      icon: <Lock size={18} className="text-secondary" />,
                      text: t('tc_privacy_desc'),
                    },
                    {
                      title: t('tc_medical'),
                      icon: <Scale size={18} className="text-accent" />,
                      text: t('tc_medical_desc'),
                    },
                    {
                      title: t('tc_guardian'),
                      icon: <CheckCircle2 size={18} className="text-[#43B047]" />,
                      text: t('tc_guardian_desc'),
                    },
                  ].map((item, i) => (
                    <motion.section
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <h3 className="text-xs font-black text-black uppercase tracking-widest mb-3 flex items-center gap-2">
                        {item.icon}
                        {item.title}
                      </h3>
                      <p className="text-[12px] leading-relaxed font-bold text-black/60 uppercase">
                        {item.text}
                      </p>
                    </motion.section>
                  ))}
  
                </div>
              </div>
  
              {/* Accept Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-8 border-t-4 border-black pt-10">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={accepted}
                    onChange={() => setAccepted(!accepted)}
                  />
                  <div
                    className={`w-8 h-8 border-4 border-black transition-all flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      accepted
                        ? "bg-secondary"
                        : "bg-white group-hover:bg-muted"
                    }`}
                  >
                    {accepted && <CheckCircle2 size={20} className="text-white font-black" />}
                  </div>
                  <span className="text-xs font-black text-black uppercase tracking-widest">
                    {t('tc_accept')}
                  </span>
                </label>
  
                <Button
                  size="lg"
                  onClick={onAccept}
                  disabled={!accepted}
                  className="py-8 px-12 text-lg uppercase italic shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                >
                  {t('tc_proceed')}
                  <ArrowRight size={20} className="ml-2" />
                </Button>
              </div>
            </div>
          </div>
  
          {/* Stepper */}
          <div className="mt-10 flex justify-center items-center gap-8">
            <Step label={t('sf_step_info')} completed />
            <div className="w-16 h-1 bg-black/10" />
            <Step label={t('tc_step_consent')} active />
            <div className="w-16 h-1 bg-black/10" />
            <Step label={t('sf_step_assessment')} />
          </div>
        </motion.div>
      </div>
    );
  }
  
  function Step({
    label,
    active = false,
    completed = false,
  }: {
    label: string;
    active?: boolean;
    completed?: boolean;
  }) {
    return (
      <div className="flex items-center gap-3">
        <div
          className={`w-4 h-4 border-2 border-black rotate-45 transition-all ${
            completed || active
              ? "bg-accent shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              : "bg-white/20"
          }`}
        />
        <span
          className={`text-xs font-black uppercase tracking-widest ${
            active || completed ? "text-white" : "text-white/40"
          }`}
        >
          {label}
        </span>
      </div>
    );
  }
  