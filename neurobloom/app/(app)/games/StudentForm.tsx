"use client";

import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { User, Calendar, Users, ArrowRight, ShieldCheck, Globe } from 'lucide-react';
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
  school_grade: string;
  language: string;
}

const GRADE_OPTIONS = [
  { label: "Preschool / KG", value: "preschool", group: "A" },
  { label: "Grade 1",        value: "grade_1",   group: "A" },
  { label: "Grade 2",        value: "grade_2",   group: "B" },
  { label: "Grade 3",        value: "grade_3",   group: "B" },
  { label: "Grade 4",        value: "grade_4",   group: "B" },
  { label: "Grade 5",        value: "grade_5",   group: "B" },
  { label: "Grade 6",        value: "grade_6",   group: "B" },
  { label: "Grade 7",        value: "grade_7",   group: "C" },
  { label: "Grade 8+",       value: "grade_8",   group: "C" },
];

const LANGUAGE_OPTIONS = [
  { label: "English", value: "english"  },
  { label: "Hindi",   value: "hindi"    },
  { label: "Marathi", value: "marathi"  },
  { label: "Tamil",   value: "tamil"    },
  { label: "Telugu",  value: "telugu"   },
  { label: "Kannada", value: "kannada"  },
];

const GROUP_BADGE: Record<string, { label: string; color: string }> = {
  A: { label: "Group A · Ages 4–7",  color: "bg-[#43B047] text-white" },
  B: { label: "Group B · Ages 7–12", color: "bg-secondary text-white" },
  C: { label: "Group C · Ages 12+",  color: "bg-primary text-white"   },
};

export function StudentForm({ onNext, onBack }: StudentFormProps) {
  const { t } = useTranslation();
  const { setSessionId } = useVideo();
  const [formData, setFormData] = useState<StudentData>({
    name: '',
    age: 8,
    gender: '',
    school_grade: '',
    language: 'english',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedGradeObj = GRADE_OPTIONS.find(g => g.value === formData.school_grade);
  const selectedGroup = selectedGradeObj?.group ?? null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim())  e.name         = t('sf_err_name');
    if (!formData.gender)       e.gender        = t('sf_err_gender');
    if (!formData.school_grade) e.school_grade  = "Please select a grade.";
    if (formData.age < 4 || formData.age > 16) e.age = "Age must be between 4 and 16.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    const res = await fetch("/api/session/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const { sessionId } = await res.json();
    localStorage.setItem("sessionId", sessionId);
    // Store grade so game components can resolve questionnaire group (A/B/C)
    localStorage.setItem("student_grade", formData.school_grade);
    setSessionId(sessionId);
    onNext(formData);
  };

  return (
    <div className="h-screen w-full bg-[#5C94FC] flex items-center justify-center p-6 overflow-auto font-sans relative">
      <div className="absolute top-20 left-10 w-32 h-10 bg-white rounded-full opacity-60 blur-sm" />
      <div className="absolute top-40 right-20 w-40 h-12 bg-white rounded-full opacity-40 blur-md" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-[#43B047] border-t-8 border-black" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl relative z-10 my-4"
      >
        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">

          {/* ── Header ── */}
          <div className="bg-foreground px-10 py-8 flex justify-between items-center border-b-4 border-black">
            <div>
              <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                {t('sf_patient_registration')}
              </h1>
              <p className="text-white/40 text-xs font-black uppercase tracking-widest mt-1">
                {t('sf_assessment_intake')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <div className="w-10 h-10 bg-accent border-2 border-white rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                <ShieldCheck size={24} className="text-black" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-7">

            {/* Name */}
            <div className="space-y-3">
              <label className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                <User size={16} className="text-primary" />
                {t('sf_full_name')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('sf_name_placeholder')}
                className={`w-full px-6 py-4 bg-muted border-4 text-sm font-black uppercase tracking-tight focus:outline-none focus:bg-white transition-all ${
                  errors.name ? 'border-primary' : 'border-black'
                }`}
              />
              {errors.name && <p className="text-primary text-xs font-black uppercase">{errors.name}</p>}
            </div>

            {/* Grade + Age */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Grade — primary grouping field */}
              <div className="space-y-3">
                <label className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={16} className="text-secondary" />
                  School Grade <span className="text-black/40 text-[9px]">(sets screening level)</span>
                </label>
                <select
                  value={formData.school_grade}
                  onChange={(e) => setFormData({ ...formData, school_grade: e.target.value })}
                  className={`w-full px-4 py-4 bg-muted border-4 font-black text-sm uppercase focus:outline-none focus:bg-white transition-all ${
                    errors.school_grade ? 'border-primary' : 'border-black'
                  }`}
                >
                  <option value="">— Select Grade —</option>
                  {GRADE_OPTIONS.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
                {errors.school_grade && (
                  <p className="text-primary text-xs font-black uppercase">{errors.school_grade}</p>
                )}
                {selectedGroup && (
                  <motion.span
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`inline-block px-3 py-1 border-2 border-black text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${GROUP_BADGE[selectedGroup].color}`}
                  >
                    {GROUP_BADGE[selectedGroup].label}
                  </motion.span>
                )}
              </div>

              {/* Age — 4–16 numeric input */}
              <div className="space-y-3">
                <label className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={16} className="text-[#43B047]" />
                  Age (years) <span className="text-black/40 text-[9px]">4 – 16</span>
                </label>
                <input
                  type="number"
                  min={4}
                  max={16}
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 8 })}
                  className={`w-full px-6 py-4 bg-muted border-4 text-xl font-black text-center focus:outline-none focus:bg-white transition-all ${
                    errors.age ? 'border-primary' : 'border-black'
                  }`}
                />
                {errors.age && <p className="text-primary text-xs font-black uppercase">{errors.age}</p>}
              </div>
            </div>

            {/* Gender + Language */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Gender */}
              <div className="space-y-3">
                <label className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                  <Users size={16} className="text-[#43B047]" />
                  {t('sf_gender')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: t('sf_gender_male'),   value: 'male'   },
                    { label: t('sf_gender_female'),  value: 'female' },
                    { label: t('sf_gender_other'),   value: 'other'  },
                  ].map((gender) => (
                    <button
                      key={gender.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: gender.value })}
                      className={`py-4 border-4 border-black font-black text-[10px] uppercase transition-all ${
                        formData.gender === gender.value
                          ? 'bg-[#43B047] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-[2px]'
                          : 'bg-white text-black/40 hover:bg-muted active:translate-y-1 active:shadow-none'
                      }`}
                    >
                      {gender.label}
                    </button>
                  ))}
                </div>
                {errors.gender && <p className="text-primary text-xs font-black uppercase">{errors.gender}</p>}
              </div>

              {/* Language */}
              <div className="space-y-3">
                <label className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                  <Globe size={16} className="text-primary" />
                  Child's Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-4 bg-muted border-4 border-black font-black text-sm uppercase focus:outline-none focus:bg-white transition-all"
                >
                  {LANGUAGE_OPTIONS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-muted border-2 border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/50 leading-relaxed">
                ⚠️ This is a <strong>screening aid</strong>, not a clinical diagnosis.
                Results should be reviewed by a qualified psychologist or special educator.
                All scores carry evidence status: <em>prototype_heuristic</em>.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t-4 border-black flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-secondary border-2 border-black animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-black/40">
                  {t('sf_ready')}
                </span>
              </div>
              <Button
                type="submit"
                size="lg"
                className="py-8 px-10 text-lg uppercase italic shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              >
                {t('sf_launch')}
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </div>
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

function Step({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-4 h-4 border-2 border-black rotate-45 transition-all ${active ? 'bg-accent shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white/20'}`} />
      <span className={`text-xs font-black uppercase tracking-widest ${active ? 'text-white' : 'text-white/40'}`}>
        {label}
      </span>
    </div>
  );
}