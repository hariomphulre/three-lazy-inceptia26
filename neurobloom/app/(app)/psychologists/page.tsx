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
  Star,
  Coins,
  ArrowUpDown,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Sidebar } from "@/components/Sidebar";
import { parseConditions } from "@/lib/conditions";

interface RegisteredDoctor {
  id: string;
  name: string;
  email: string;
  role?: string;
  consulting_fee?: number;
  avg_rating?: number;
  rating_count?: number;
  user_rating?: number;
}

interface Psychologist {
  id: string | number;
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
  ratingCount: number;
  userRating: number;
  fee: number;
  patients: number;
  initials: string;
  accentColor: string;
  isRegistered?: boolean;
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

const INITIAL_PSYCHOLOGISTS: Psychologist[] = [
  { id: 1, name: "Dr. Ananya Sharma", title: "Child Neuropsychologist", age: 38, experience: 12, location: "Mumbai, Maharashtra", email: "ananya.sharma@neurobloom.in", phone: "+91 98201 34567", expertise: ["Dyslexia", "ADHD"], availability: "Mon - Fri", languages: ["English", "Hindi", "Marathi"], rating: 4.9, ratingCount: 28, userRating: 0, fee: 150, patients: 340, initials: "AS", accentColor: "#049CD8" },
  { id: 2, name: "Dr. Rohan Mehta", title: "Educational Psychologist", age: 45, experience: 18, location: "Pune, Maharashtra", email: "rohan.mehta@neurobloom.in", phone: "+91 91234 56789", expertise: ["Dysgraphia", "Dyscalculia"], availability: "Tue - Sat", languages: ["English", "Hindi", "Gujarati"], rating: 4.8, ratingCount: 19, userRating: 0, fee: 120, patients: 290, initials: "RM", accentColor: "#E52521" },
  { id: 3, name: "Dr. Priya Nair", title: "Developmental Psychologist", age: 41, experience: 15, location: "Bengaluru, Karnataka", email: "priya.nair@neurobloom.in", phone: "+91 99876 01234", expertise: ["Autism Spectrum Disorder (ASD)", "Speech Disability"], availability: "Mon - Thu", languages: ["English", "Kannada", "Malayalam"], rating: 4.9, ratingCount: 35, userRating: 0, fee: 180, patients: 415, initials: "PN", accentColor: "#43B047" },
  { id: 4, name: "Dr. Vikram Iyer", title: "Senior Audiologist & Psychologist", age: 50, experience: 24, location: "Chennai, Tamil Nadu", email: "vikram.iyer@neurobloom.in", phone: "+91 94400 78901", expertise: ["Hearing Disability", "ADHD"], availability: "Mon - Sat", languages: ["English", "Tamil", "Telugu"], rating: 4.7, ratingCount: 42, userRating: 0, fee: 200, patients: 520, initials: "VI", accentColor: "#FBD000" },
  { id: 5, name: "Dr. Sneha Kulkarni", title: "Learning Disabilities Specialist", age: 36, experience: 10, location: "Hyderabad, Telangana", email: "sneha.kulkarni@neurobloom.in", phone: "+91 96305 22334", expertise: ["Dyslexia", "Dyscalculia", "Dysgraphia"], availability: "Wed - Sun", languages: ["English", "Telugu", "Hindi"], rating: 4.8, ratingCount: 14, userRating: 0, fee: 100, patients: 210, initials: "SK", accentColor: "#ff9f43" },
  { id: 6, name: "Dr. Arjun Patel", title: "Speech & Behaviour Therapist", age: 43, experience: 17, location: "Ahmedabad, Gujarat", email: "arjun.patel@neurobloom.in", phone: "+91 98988 44556", expertise: ["Speech Disability", "Autism Spectrum Disorder (ASD)"], availability: "Mon - Fri", languages: ["English", "Gujarati", "Hindi"], rating: 4.6, ratingCount: 22, userRating: 0, fee: 130, patients: 380, initials: "AP", accentColor: "#049CD8" },
];

export default function PsychologistsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<"price_asc" | "price_desc" | "rating_desc" | "rating_asc">("rating_desc");

  // Rating & Review Modal State
  const [ratingDoctorId, setRatingDoctorId] = useState<string | number | null>(null);
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [ratingSubmitting, setRatingSubmitting] = useState<boolean>(false);
  const [viewingReviewsDoctorId, setViewingReviewsDoctorId] = useState<string | number | null>(null);
  const [doctorReviewsList, setDoctorReviewsList] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);

  // Live stats & registered doctors
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [registeredDoctors, setRegisteredDoctors] = useState<RegisteredDoctor[]>([]);
  const [reportStudents, setReportStudents] = useState<{ assessment_status?: string; detected_disabilities?: string }[]>([]);
  const [requestCount, setRequestCount] = useState<number | null>(null);

  const fetchDoctors = async () => {
    try {
      const res = await fetch("/api/users/doctors");
      if (res.ok) {
        const d = await res.json();
        setRegisteredDoctors(Array.isArray(d) ? d : []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchDoctors();
    (async () => {
      try {
        const [profRes, reqRes, meRes] = await Promise.all([
          fetch("/api/parent/profile"),
          fetch("/api/doctor-requests"),
          fetch("/api/auth/me"),
        ]);
        if (profRes.ok) {
          const p = await profRes.json();
          setReportStudents(p.students ?? (p.student ? [p.student] : []));
        }
        if (reqRes.ok) {
          const r = await reqRes.json();
          setRequestCount(Array.isArray(r) ? r.length : 0);
        }
        if (meRes.ok) {
          const m = await meRes.json();
          if (m?.userId) setCurrentUserId(m.userId);
        }
      } catch {}
    })();
  }, []);

  const handleOpenRatingModal = (psych: Psychologist) => {
    setRatingDoctorId(psych.id);
    setSelectedStars(psych.userRating || 5);
    setReviewComment("");
  };

  const handleSaveRatingAndReview = async () => {
    if (!ratingDoctorId || !selectedStars) return;
    setRatingSubmitting(true);
    try {
      const res = await fetch("/api/doctor/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: String(ratingDoctorId), rating: selectedStars, review: reviewComment.trim() || undefined }),
      });
      if (res.ok) {
        fetchDoctors();
        setRatingDoctorId(null);
      }
    } catch {} finally {
      setRatingSubmitting(false);
    }
  };

  const handleFetchDoctorReviews = async (doctorId: string | number) => {
    setViewingReviewsDoctorId(doctorId);
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/doctor/reviews?doctorId=${String(doctorId)}`);
      if (res.ok) {
        const data = await res.json();
        setDoctorReviewsList(data.reviews || []);
      }
    } catch {} finally {
      setLoadingReviews(false);
    }
  };

  const handleRate = async (doctorId: string | number, rating: number) => {
    try {
      const res = await fetch("/api/doctor/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: String(doctorId), rating }),
      });
      if (res.ok) {
        fetchDoctors();
      }
    } catch {}
  };

  // Combine registered doctors with catalog doctors
  const allPsychologists = useMemo(() => {
    const combined: Psychologist[] = [...INITIAL_PSYCHOLOGISTS];

    registeredDoctors.forEach((rd, idx) => {
      const exists = combined.some(p => p.email.toLowerCase() === rd.email.toLowerCase());
      if (!exists) {
        const initials = rd.name.split(" ").filter(Boolean).map(n => n[0]).join("").substring(0, 2).toUpperCase() || "DR";
        combined.unshift({
          id: rd.id,
          name: rd.name,
          title: rd.role === "psychologist" ? "Licensed Psychologist" : "Consulting Doctor",
          age: 40,
          experience: 10,
          location: "Verified Specialist",
          email: rd.email,
          phone: "Contact via Portal",
          expertise: ["Dyslexia", "ADHD", "Learning Disabilities"],
          availability: "Mon - Fri",
          languages: ["English", "Hindi"],
          rating: Number(rd.avg_rating) || 5.0,
          ratingCount: Number(rd.rating_count) || 0,
          userRating: Number(rd.user_rating) || 0,
          fee: Number(rd.consulting_fee) || 0,
          patients: 150,
          initials,
          accentColor: idx % 2 === 0 ? "#9C27B0" : "#43B047",
          isRegistered: true,
        });
      } else {
        const idxMatch = combined.findIndex(p => p.email.toLowerCase() === rd.email.toLowerCase());
        if (idxMatch !== -1) {
          combined[idxMatch] = {
            ...combined[idxMatch],
            id: rd.id,
            fee: Number(rd.consulting_fee) || combined[idxMatch].fee,
            rating: Number(rd.avg_rating) || combined[idxMatch].rating,
            ratingCount: Number(rd.rating_count) || combined[idxMatch].ratingCount,
            userRating: Number(rd.user_rating) || 0,
            isRegistered: true,
          };
        }
      }
    });

    return combined;
  }, [registeredDoctors]);

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
    { label: "Specialists Available", value: allPsychologists.length, color: "#E52521" },
    { label: "Detected Conditions", value: detectedConditions, color: "#049CD8" },
    { label: "Assessments Completed", value: completedCount, color: "#FBD000" },
    { label: "Requests Sent", value: requestCount ?? "—", color: "#43B047" },
  ];

  const filteredAndSorted = useMemo(() => {
    const filtered = allPsychologists.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q);
      const matchExpertise = selectedExpertise ? p.expertise.includes(selectedExpertise) : true;
      return matchSearch && matchExpertise;
    });

    return filtered.sort((a, b) => {
      if (sortOption === "price_asc") return a.fee - b.fee;
      if (sortOption === "price_desc") return b.fee - a.fee;
      if (sortOption === "rating_desc") return b.rating - a.rating;
      if (sortOption === "rating_asc") return a.rating - b.rating;
      return 0;
    });
  }, [allPsychologists, search, selectedExpertise, sortOption]);

  return (
    <div className="h-screen w-full bg-background text-foreground flex overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-10 pb-4 flex-shrink-0 bg-background flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-black text-black uppercase italic tracking-tighter">Psychologists &amp; Doctors</h2>
            <p className="text-sm font-black text-black/40 mt-1 uppercase tracking-widest">Specialist Directory &amp; Consulting Fees</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="hidden sm:block text-right">
              <p className="text-xs font-black text-black uppercase tracking-tight">NeuroBloom</p>
              <p className="text-[10px] text-black/40 font-black uppercase tracking-widest">{allPsychologists.length} Specialists</p>
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

            {/* Search + Filter + Sorting */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8 items-stretch lg:items-center justify-between">
              <div className="relative group flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black group-focus-within:text-primary transition-colors" size={18} />
                <input type="text" placeholder="SEARCH BY NAME, TITLE OR CITY..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 border-2 border-black bg-card font-black text-xs uppercase tracking-widest placeholder:text-black/30 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all" />
              </div>

              {/* Sort controls */}
              <div className="flex items-center gap-2 bg-card border-2 border-black px-4 py-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
                <ArrowUpDown size={14} className="text-primary" />
                <span className="text-xs font-black uppercase text-black/60">Sort By:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="bg-transparent text-xs font-black uppercase focus:outline-none cursor-pointer"
                >
                  <option value="price_asc">Price: Low to High ($)</option>
                  <option value="price_desc">Price: High to Low ($)</option>
                  <option value="rating_desc">Rating: High to Low (★)</option>
                  <option value="rating_asc">Rating: Low to High (★)</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedExpertise(null)} className={`px-3 py-2 border-2 border-black text-[10px] font-black uppercase tracking-widest transition-all ${!selectedExpertise ? "bg-black text-white shadow-[3px_3px_0px_0px_rgba(229,37,33,1)]" : "bg-card text-black hover:bg-accent hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"}`}>All</button>
                {ALL_EXPERTISE.map((ex) => (
                  <button key={ex} onClick={() => setSelectedExpertise(ex === selectedExpertise ? null : ex)} className={`px-3 py-2 border-2 border-black text-[10px] font-black uppercase tracking-widest transition-all ${selectedExpertise === ex ? "bg-primary text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" : "bg-card text-black hover:bg-accent hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"}`}>{ex}</button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {filteredAndSorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 border-2 border-black border-dashed bg-card">
                <p className="text-2xl font-black uppercase italic tracking-tighter text-black/30">No Psychologists Found</p>
                <p className="text-xs font-black uppercase tracking-widest text-black/20 mt-2">Try adjusting your search or filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
                {filteredAndSorted.map((psych, i) => (
                  <motion.div key={psych.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <PsychCard
                      psych={psych}
                      currentUserId={currentUserId}
                      onRate={handleRate}
                      onOpenReview={() => handleOpenRatingModal(psych)}
                      onViewReviews={() => handleFetchDoctorReviews(psych.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Rate & Review Modal */}
      {ratingDoctorId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRatingDoctorId(null)}>
          <div className="w-full max-w-md bg-white border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
              <h3 className="font-black text-lg uppercase tracking-tight text-black flex items-center gap-2">
                <Star className="text-[#FBD000] fill-[#FBD000]" size={18} /> Rate & Review Doctor
              </h3>
              <button onClick={() => setRatingDoctorId(null)} className="text-black font-black">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-black/60 block mb-1">
                  Select Rating (1 to 5 Stars) *
                </label>
                <div className="flex items-center gap-2 bg-muted p-3 border-2 border-black justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedStars(star)}
                      className="hover:scale-125 transition-transform p-1"
                    >
                      <Star
                        size={26}
                        className={
                          star <= selectedStars
                            ? "fill-[#FBD000] text-black stroke-[1.5]"
                            : "text-black/20"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-black/60 block mb-1">
                  Written Review (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this doctor (optional)..."
                  className="w-full p-3 border-2 border-black bg-muted text-xs focus:bg-white focus:outline-none resize-none font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRatingDoctorId(null)}
                  className="flex-1 py-3 bg-muted border-2 border-black font-black uppercase text-xs tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRatingAndReview}
                  disabled={ratingSubmitting}
                  className="flex-1 py-3 bg-primary text-white border-2 border-black font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Reviews Modal */}
      {viewingReviewsDoctorId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingReviewsDoctorId(null)}>
          <div className="w-full max-w-lg bg-white border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
              <h3 className="font-black text-lg uppercase tracking-tight text-black">Patient Reviews</h3>
              <button onClick={() => setViewingReviewsDoctorId(null)} className="text-black font-black">✕</button>
            </div>

            {loadingReviews ? (
              <p className="text-xs font-black uppercase text-center py-6">Loading reviews...</p>
            ) : doctorReviewsList.length === 0 ? (
              <p className="text-xs font-black uppercase text-black/40 italic py-6 text-center">No reviews submitted yet.</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {doctorReviewsList.map((rev) => (
                  <div key={rev.id} className="border-2 border-black p-3 bg-muted/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-black text-xs uppercase text-black">{rev.reviewer_name}</span>
                      <div className="flex items-center text-[#FBD000]">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={12}
                            className={star <= rev.rating ? "fill-[#FBD000] text-black stroke-[1]" : "text-black/20"}
                          />
                        ))}
                      </div>
                    </div>
                    {rev.review ? (
                      <p className="text-xs text-black/80 italic font-medium">&quot;{rev.review}&quot;</p>
                    ) : (
                      <p className="text-[10px] text-black/40 font-bold uppercase tracking-wider">Star rating submitted</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PsychCard({
  psych,
  currentUserId,
  onRate,
  onOpenReview,
  onViewReviews,
}: {
  psych: Psychologist;
  currentUserId?: string | null;
  onRate?: (id: string | number, rating: number) => void;
  onOpenReview?: () => void;
  onViewReviews?: () => void;
}) {
  const isSelf = currentUserId && String(currentUserId) === String(psych.id);

  return (
    <div className="bg-card border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] transition-all">
      <div className="h-2 w-full flex justify-between items-center px-2" style={{ backgroundColor: psych.accentColor }}>
        {psych.isRegistered && (
          <span className="text-[9px] font-black uppercase tracking-widest text-white bg-black/60 px-1.5 py-0.5 rounded-b">
            Registered Doctor
          </span>
        )}
      </div>
      <div className="p-5 flex items-start gap-4 border-b-2 border-black">
        <div className="w-14 h-14 border-2 border-black flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" style={{ backgroundColor: psych.accentColor }}>
          {psych.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="font-black text-base uppercase tracking-tight text-black leading-tight truncate">{psych.name}</h3>
          </div>
          <p className="text-[11px] font-bold text-black/50 uppercase tracking-widest mt-0.5 truncate">{psych.title}</p>
          
          {/* Fee & Rating Badge */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-wider border border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
              <Coins size={10} className="text-[#FBD000]" /> ${psych.fee} / session
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-1 mt-2.5">
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => !isSelf && onRate?.(psych.id, s)}
                    disabled={Boolean(isSelf)}
                    className={isSelf ? "cursor-default" : "hover:scale-125 transition-transform"}
                    title={isSelf ? "You cannot rate yourself" : `Rate ${s} stars`}
                  >
                    <Star
                      size={14}
                      className={
                        s <= (psych.userRating || Math.round(psych.rating))
                          ? "fill-[#FBD000] text-black stroke-[1.5]"
                          : "text-black/20"
                      }
                    />
                  </button>
                ))}
              </div>
              <span className="text-[11px] font-black text-black ml-0.5">{psych.rating.toFixed(1)}</span>
              {psych.ratingCount > 0 && (
                <button
                  type="button"
                  onClick={onViewReviews}
                  className="text-[9px] font-bold text-primary hover:underline ml-0.5"
                >
                  ({psych.ratingCount})
                </button>
              )}
            </div>

            {isSelf ? (
              <span className="px-2 py-0.5 bg-black/10 text-black/60 text-[9px] font-black uppercase border border-black">
                Your Profile
              </span>
            ) : (
              <button
                type="button"
                onClick={onOpenReview}
                className="px-2 py-0.5 bg-accent text-black border border-black text-[9px] font-black uppercase hover:bg-black hover:text-white transition-colors"
              >
                + Review
              </button>
            )}
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
          <p className="text-[9px] font-black uppercase tracking-widest text-black/40">Fee</p>
          <p className="text-[11px] font-black text-primary uppercase">${psych.fee}</p>
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
