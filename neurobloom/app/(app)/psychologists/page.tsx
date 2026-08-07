"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Search,
  ExternalLink,
  Stethoscope,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Sidebar } from "@/components/Sidebar";
import { parseConditions } from "@/lib/conditions";

interface Psychologist {
  id: number;
  name: string;
  title: string;
  age: number;
  experience: number;
  location: string;
  email: string;
  phone: string;
  expertise: string[];
  availability: string;
  languages: string[];
  rating: number;
  patients: number;
  initials: string;
  accentColor: string;
}

const EXPERTISE_COLORS: Record<string, string> = {
  Dyslexia: "bg-[#049CD8] text-white border-black",
  Dysgraphia: "bg-[#E52521] text-white border-black",
  Dyscalculia: "bg-[#FBD000] text-black border-black",
  ADHD: "bg-[#43B047] text-white border-black",
  "Autism Spectrum Disorder (ASD)": "bg-[#ff9f43] text-black border-black",
  "Speech Disability": "bg-[#E52521] text-white border-black",
  "Hearing Disability": "bg-[#049CD8] text-white border-black",
};

const ALL_EXPERTISE = [
  "Dyslexia",
  "Dysgraphia",
  "Dyscalculia",
  "ADHD",
  "Autism Spectrum Disorder (ASD)",
  "Speech Disability",
  "Hearing Disability",
];

const PSYCHOLOGISTS: Psychologist[] = [
  { id: 1, name: "Dr. Ananya Sharma", title: "Child Neuropsychologist", age: 38, experience: 12, location: "Mumbai, Maharashtra", email: "ananya.sharma@neurobloom.in", phone: "+91 98201 34567", expertise: ["Dyslexia", "ADHD"], availability: "Mon - Fri", languages: ["English", "Hindi", "Marathi"], rating: 4.9, patients: 340, initials: "AS", accentColor: "#049CD8" },
  { id: 2, name: "Dr. Rohan Mehta", title: "Educational Psychologist", age: 45, experience: 18, location: "Pune, Maharashtra", email: "rohan.mehta@neurobloom.in", phone: "+91 91234 56789", expertise: ["Dysgraphia", "Dyscalculia"], availability: "Tue - Sat", languages: ["English", "Hindi", "Gujarati"], rating: 4.8, patients: 290, initials: "RM", accentColor: "#E52521" },
  { id: 3, name: "Dr. Priya Nair", title: "Developmental Psychologist", age: 41, experience: 15, location: "Bengaluru, Karnataka", email: "priya.nair@neurobloom.in", phone: "+91 99876 01234", expertise: ["Autism Spectrum Disorder (ASD)", "Speech Disability"], availability: "Mon - Thu", languages: ["English", "Kannada", "Malayalam"], rating: 4.9, patients: 415, initials: "PN", accentColor: "#43B047" },
  { id: 4, name: "Dr. Vikram Iyer", title: "Senior Audiologist & Psychologist", age: 50, experience: 24, location: "Chennai, Tamil Nadu", email: "vikram.iyer@neurobloom.in", phone: "+91 94400 78901", expertise: ["Hearing Disability", "ADHD"], availability: "Mon - Sat", languages: ["English", "Tamil", "Telugu"], rating: 4.7, patients: 520, initials: "VI", accentColor: "#FBD000" },
  { id: 5, name: "Dr. Sneha Kulkarni", title: "Learning Disabilities Specialist", age: 36, experience: 10, location: "Hyderabad, Telangana", email: "sneha.kulkarni@neurobloom.in", phone: "+91 96305 22334", expertise: ["Dyslexia", "Dyscalculia", "Dysgraphia"], availability: "Wed - Sun", languages: ["English", "Telugu", "Hindi"], rating: 4.8, patients: 210, initials: "SK", accentColor: "#ff9f43" },
  { id: 6, name: "Dr. Arjun Patel", title: "Speech & Behaviour Therapist", age: 43, experience: 17, location: "Ahmedabad, Gujarat", email: "arjun.patel@neurobloom.in", phone: "+91 98988 44556", expertise: ["Speech Disability", "Autism Spectrum Disorder (ASD)"], availability: "Mon - Fri", languages: ["English", "Gujarati", "Hindi"], rating: 4.6, patients: 380, initials: "AP", accentColor: "#049CD8" },
];

export default function PsychologistsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string | null>(null);

  // ── Live stats — derived from real specialists + this parent's report data ──
  const [specialistCount, setSpecialistCount] = useState<number | null>(null);
  const [reportStudents, setReportStudents] = useState<{ assessment_status?: string; detected_disabilities?: string }[]>([]);
  const [requestCount, setRequestCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [docRes, profRes, reqRes] = await Promise.all([
          fetch("/api/users/doctors"),
          fetch("/api/parent/profile"),
          fetch("/api/doctor-requests"),
        ]);
        if (docRes.ok) {
          const d = await docRes.json();
          setSpecialistCount(Array.isArray(d) ? d.length : 0);
        }
        if (profRes.ok) {
          const p = await profRes.json();
          setReportStudents(p.students ?? (p.student ? [p.student] : []));
        }
        if (reqRes.ok) {
          const r = await reqRes.json();
          setRequestCount(Array.isArray(r) ? r.length : 0);
        }
      } catch {
        /* leave placeholders */
      }
    })();
  }, []);

  // Distinct conditions detected across this parent's children's reports.
  const detectedConditions = useMemo(() => {
    const set = new Set<string>();
    for (const s of reportStudents) {
      for (const c of parseConditions(s.detected_disabilities)) set.add(c.label);
    }
    return set.size;
  }, [reportStudents]);

  const completedCount = useMemo(
    () => reportStudents.filter(s => s.assessment_status === "completed").length,
    [reportStudents]
  );

  const STATS = [
    { label: "Specialists Available", value: specialistCount ?? "—", color: "#E52521" },
    { label: "Detected Conditions", value: detectedConditions, color: "#049CD8" },
    { label: "Assessments Completed", value: completedCount, color: "#FBD000" },
    { label: "Requests Sent", value: requestCount ?? "—", color: "#43B047" },
  ];

  const filtered = PSYCHOLOGISTS.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q);
    const matchExpertise = selectedExpertise ? p.expertise.includes(selectedExpertise) : true;
    return matchSearch && matchExpertise;
  });

  return (
    <div className="h-screen w-full bg-background text-foreground flex overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-10 pb-4 flex-shrink-0 bg-background flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-black text-black uppercase italic tracking-tighter">Psychologists</h2>
            <p className="text-sm font-black text-black/40 mt-1 uppercase tracking-widest">Specialist Directory &amp; Contact Hub</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="hidden sm:block text-right">
              <p className="text-xs font-black text-black uppercase tracking-tight">NeuroBloom</p>
              <p className="text-[10px] text-black/40 font-black uppercase tracking-widest">{specialistCount ?? "—"} Specialists</p>
            </div>
            <div className="w-10 h-10 bg-accent border-2 border-black flex items-center justify-center text-black font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Stethoscope size={18} />
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 px-8 py-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {STATS.map((stat) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border-2 border-black px-5 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-3xl font-black text-black">{stat.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: stat.color }}>{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative group flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black group-focus-within:text-primary transition-colors" size={18} />
                <input type="text" placeholder="SEARCH BY NAME, TITLE OR CITY..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 border-2 border-black bg-card font-black text-xs uppercase tracking-widest placeholder:text-black/30 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all" />
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedExpertise(null)} className={`px-3 py-2 border-2 border-black text-[10px] font-black uppercase tracking-widest transition-all ${!selectedExpertise ? "bg-black text-white shadow-[3px_3px_0px_0px_rgba(229,37,33,1)]" : "bg-card text-black hover:bg-accent hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"}`}>All</button>
                {ALL_EXPERTISE.map((ex) => (
                  <button key={ex} onClick={() => setSelectedExpertise(ex === selectedExpertise ? null : ex)} className={`px-3 py-2 border-2 border-black text-[10px] font-black uppercase tracking-widest transition-all ${selectedExpertise === ex ? "bg-primary text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" : "bg-card text-black hover:bg-accent hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"}`}>{ex}</button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 border-2 border-black border-dashed bg-card">
                <p className="text-2xl font-black uppercase italic tracking-tighter text-black/30">No Psychologists Found</p>
                <p className="text-xs font-black uppercase tracking-widest text-black/20 mt-2">Try adjusting your search or filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
                {filtered.map((psych, i) => (
                  <motion.div key={psych.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <PsychCard psych={psych} />
                  </motion.div>
                ))}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

function PsychCard({ psych }: { psych: Psychologist }) {
  return (
    <div className="bg-card border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] transition-all">
      <div className="h-2 w-full" style={{ backgroundColor: psych.accentColor }} />
      <div className="p-5 flex items-start gap-4 border-b-2 border-black">
        <div className="w-14 h-14 border-2 border-black flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: psych.accentColor }}>
          {psych.initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-base uppercase tracking-tight text-black leading-tight">{psych.name}</h3>
          <p className="text-[11px] font-bold text-black/50 uppercase tracking-widest mt-0.5 truncate">{psych.title}</p>
          <div className="flex items-center gap-0.5 mt-1.5">
            {[1,2,3,4,5].map((s) => (
              <span key={s} className={`text-sm ${s <= Math.floor(psych.rating) ? "text-[#FBD000]" : "text-black/20"}`}>&#9733;</span>
            ))}
            <span className="ml-1 text-[10px] font-black text-black">{psych.rating}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-black text-black">{psych.experience}<span className="text-xs font-black text-black/40 ml-0.5">YRS</span></p>
          <p className="text-[9px] font-black text-black/40 uppercase tracking-widest">Experience</p>
        </div>
      </div>
      <div className="px-5 py-3 border-b-2 border-black bg-muted/30">
        <p className="text-[9px] font-black text-black/40 uppercase tracking-widest mb-2">Expertise</p>
        <div className="flex flex-wrap gap-1.5">
          {psych.expertise.map((ex) => (
            <span key={ex} className={`px-2 py-0.5 border-2 text-[9px] font-black uppercase tracking-wider ${EXPERTISE_COLORS[ex] ?? "bg-card text-black border-black"}`}>{ex}</span>
          ))}
        </div>
      </div>
      <div className="px-5 py-4 space-y-2 flex-1 border-b-2 border-black">
        <DetailRow icon={<Calendar size={13} />} label="Age" value={psych.age + " years"} />
        <DetailRow icon={<Award size={13} />} label="Patients" value={psych.patients + " served"} />
        <DetailRow icon={<MapPin size={13} />} label="Location" value={psych.location} />
        <DetailRow icon={<Phone size={13} />} label="Phone" value={psych.phone} />
        <DetailRow icon={<Mail size={13} />} label="Email" value={psych.email} truncate />
      </div>
      <div className="px-5 py-3 flex items-center justify-between bg-muted/20">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-black/40">Availability</p>
          <p className="text-[11px] font-black text-black uppercase">{psych.availability}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black uppercase tracking-widest text-black/40">Languages</p>
          <p className="text-[11px] font-black text-black">{psych.languages.join(", ")}</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-primary border-2 border-black text-white text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
          Contact <ExternalLink size={11} />
        </button>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value, truncate = false }: { icon: React.ReactNode; label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-black/40 flex-shrink-0">{icon}</span>
      <span className="text-[9px] font-black uppercase tracking-widest text-black/40 w-14 flex-shrink-0">{label}</span>
      <span className={`text-[11px] font-bold text-black ${truncate ? "truncate max-w-[140px]" : ""}`}>{value}</span>
    </div>
  );
}
