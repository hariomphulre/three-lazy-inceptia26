"use client";

import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { User, Calendar, Users, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useVideo } from "@/context/VideoContext";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { createSession } from "@/lib/offline/session";

interface StudentFormProps {
  onNext: (data: StudentData) => void;
  onBack?: () => void;
}

export interface StudentData {
  name: string;
  age: number;
  gender: string;
}

export function StudentForm({ onNext, onBack }: StudentFormProps) {
  const { t } = useTranslation();
  const { setSessionId } = useVideo();
  const [formData, setFormData] = useState<StudentData>({
    name: '',
    age: 6,
    gender: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  // When the parent reached here via a teacher's referral, the child's name is
  // already on record — pre-fill and lock it so it can't diverge from the
  // student the teacher registered. Self-start parents (no linked student) keep
  // the fully editable form.
  const [nameLocked, setNameLocked] = useState(false);
  // The specific linked child being assessed (from /assessment?student=<id>),
  // so the created session links to the right sibling.
  const [linkedStudentId, setLinkedStudentId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const requestedId = new URLSearchParams(window.location.search).get("student");
        const res = await fetch("/api/parent/profile");
        if (!res.ok) return;
        const { students } = await res.json();
        const list: any[] = Array.isArray(students) ? students : [];
        // Prefer the requested child; otherwise, if there's exactly one, use it.
        const target =
          list.find(s => s.id === requestedId) ??
          (list.length === 1 ? list[0] : null);
        if (active && target?.name) {
          setFormData(prev => ({ ...prev, name: target.name }));
          setNameLocked(true);
          setLinkedStudentId(target.id);
        }
      } catch {
        /* no linked student → leave the name editable (self-start) */
      }
    })();
    return () => { active = false; };
  }, []);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = t('sf_err_name');
    if (!formData.gender) newErrors.gender = t('sf_err_gender');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    const res = await fetch("/api/session/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, studentId: linkedStudentId || undefined })
    });

    try {
      // Offline-first: create local UUID session immediately, sync when online
      const sessionId = await createSession(formData);
      setSessionId(sessionId);
      onNext(formData);
    } catch (error) {
      console.error("❌ Failed to create session:", error);
      setSubmitError("Could not start the assessment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          className="w-full max-w-2xl relative z-10"
        >
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            {/* Header */}
            <div className="bg-foreground px-10 py-8 flex justify-between items-center border-b-4 border-black">
              <div>
                <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">{t('sf_patient_registration')}</h1>
                <p className="text-white/40 text-xs font-black uppercase tracking-widest mt-1">{t('sf_assessment_intake')}</p>
              </div>
              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <div className="w-10 h-10 bg-accent border-2 border-white rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                  <ShieldCheck size={24} className="text-black" />
                </div>
              </div>
            </div>
  
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              {/* Name Field */}
              <div className="space-y-3">
                <label className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                  <User size={16} className="text-primary" />
                  {t('sf_full_name')}
                  {nameLocked && (
                    <span className="ml-auto flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#43B047]">
                      <CheckCircle2 size={12} /> From your teacher
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => { if (!nameLocked) setFormData({ ...formData, name: e.target.value }); }}
                  readOnly={nameLocked}
                  placeholder={t('sf_name_placeholder')}
                  className={`w-full px-6 py-4 border-4 text-sm font-black uppercase tracking-tight focus:outline-none transition-all ${
                    nameLocked
                      ? 'bg-[#43B047]/10 border-black text-black/70 cursor-not-allowed'
                      : `bg-muted focus:bg-white ${errors.name ? 'border-primary' : 'border-black'}`
                  }`}
                />
              </div>
  
              {/* Age and Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={16} className="text-secondary" />
                    {t('sf_age_group')}
                  </label>
                  <div className="flex gap-2">
                    {[6, 7, 8].map((age) => (
                      <button
                        key={age}
                        type="button"
                        onClick={() => setFormData({ ...formData, age })}
                        className={`flex-1 py-4 border-4 border-black font-black transition-all ${
                          formData.age === age
                            ? 'bg-accent text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-[-2px]'
                            : 'bg-white text-black/40 hover:bg-muted active:translate-y-1 active:shadow-none'
                        }`}
                      >
                        {age}
                      </button>
                    ))}
                  </div>
                </div>
  
                <div className="space-y-3">
                  <label className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                    <Users size={16} className="text-[#43B047]" />
                    {t('sf_gender')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: t('sf_gender_male'), value: 'male' },
                      { label: t('sf_gender_female'), value: 'female' },
                      { label: t('sf_gender_other'), value: 'other' }
                    ].map((gender) => (
                      <button
                        key={gender.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: gender.value })}
                        className={`py-4 border-4 border-black font-black text-[10px] uppercase transition-all ${
                          formData.gender === gender.value
                            ? 'bg-[#43B047] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-[-2px]'
                            : 'bg-white text-black/40 hover:bg-muted active:translate-y-1 active:shadow-none'
                        }`}
                      >
                        {gender.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
  
              {/* Bottom Actions */}
              <div className="pt-8 border-t-4 border-black flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-secondary border-2 border-black animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/40">{t('sf_ready')}</span>
                </div>
                
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="py-8 px-10 text-lg uppercase italic shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                >
                  {isSubmitting ? "Starting..." : t('sf_launch')}
                  <ArrowRight size={20} className="ml-2" />
                </Button>
              </div>

              {submitError && (
                <div className="mt-4 border-2 border-primary bg-primary/10 p-3 text-sm font-bold text-black">
                  {submitError}
                </div>
              )}
            </form>
          </div>
  
          {/* Progress steps */}
          <div className="mt-10 flex justify-center items-center gap-8">
             <Step label={t('sf_step_info')} active />
             <div className="w-16 h-1 bg-black/10" />
             <Step label={t('sf_step_assessment')} />
             <div className="w-16 h-1 bg-black/10" />
             <Step label={t('sf_step_analytics')} />
          </div>
        </motion.div>
      </div>
    );
  }
  
  function Step({ label, active = false }: { label: string, active?: boolean }) {
    return (
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 border-2 border-black rotate-45 transition-all ${active ? 'bg-accent shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white/20'}`} />
        <span className={`text-xs font-black uppercase tracking-widest ${active ? 'text-white' : 'text-white/40'}`}>
          {label}
        </span>
      </div>
    );
  }
  