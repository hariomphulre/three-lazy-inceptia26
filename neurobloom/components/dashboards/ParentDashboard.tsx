"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Stethoscope, MessageSquare, Send,
  FileDown, RefreshCw, Plus, X, Check,
  AlertCircle, Heart, Play, Star, Coins, ArrowUpDown, SlidersHorizontal
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { parseConditions } from "@/lib/conditions";
import { useTranslation } from "@/hooks/useTranslation";

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  referral_assessment_type?: string;
  assessment_status: string;
  assessment_id?: string;
  teacher_id?: string;
  teacher_name?: string;
  teacher_email?: string;
  report_url?: string;
  detected_disabilities?: string;
  assessment_date?: string;
}

interface Note {
  id: string;
  content: string;
  author_role: string;
  author_name: string;
  created_at: string;
}

interface DoctorRequest {
  id: string;
  doctor_id?: string;
  status: string;
  doctor_name: string;
  doctor_email: string;
  student_name: string;
  created_at: string;
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  role?: string;
  consulting_fee?: number;
  avg_rating?: number;
  rating_count?: number;
  user_rating?: number;
}

// Deterministic accent colours for the specialist cards (API only returns id/name/email)
const DOCTOR_COLORS = ["#049CD8", "#E52521", "#43B047", "#FBD000", "#ff9f43", "#9C27B0"];

const NOTE_ROLE_COLORS: Record<string, string> = {
  teacher: "bg-[#049CD8] text-white",
  parent: "bg-[#43B047] text-white",
  doctor: "bg-[#9C27B0] text-white",
  psychologist: "bg-[#9C27B0] text-white",
};

// Colour classes per status; the human label is resolved via t(`status_<key>`).
const STATUS_CLS: Record<string, string> = {
  not_started: "bg-gray-100 text-black border-black",
  in_progress: "bg-[#FBD000] text-black border-black",
  completed: "bg-[#43B047] text-white border-black",
  pending: "bg-[#FBD000] text-black border-black",
  accepted: "bg-[#43B047] text-white border-black",
  rejected: "bg-[#E52521] text-white border-black",
};

export default function ParentDashboard({ onStartTest }: { onStartTest?: () => void }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  // Translate a DB status/role token, falling back to a de-underscored version.
  const statusLabel = (s: string) => t(`status_${s}`) === `status_${s}` ? s.replace("_", " ") : t(`status_${s}`);
  const roleLabel = (r: string) => t(`role_${r}`) === `role_${r}` ? r : t(`role_${r}`);
  // A parent can always launch the assessment, even without a teacher referral.
  // With a linked child, the child's id is carried so the session links correctly.
  const startAssessment = (studentId?: string) => {
    if (studentId) router.push(`/assessment?student=${studentId}`);
    else if (onStartTest) onStartTest();
    else router.push("/assessment");
  };

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  const [doctorRequests, setDoctorRequests] = useState<DoctorRequest[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");

  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "rating_desc" | "rating_asc" | "name">("price_asc");

  const sortedDoctors = useMemo(() => {
    return [...doctors].sort((a, b) => {
      const feeA = Number(a.consulting_fee) || 0;
      const feeB = Number(b.consulting_fee) || 0;
      const ratingA = Number(a.avg_rating) || 0;
      const ratingB = Number(b.avg_rating) || 0;

      if (sortBy === "price_asc") return feeA - feeB;
      if (sortBy === "price_desc") return feeB - feeA;
      if (sortBy === "rating_desc") return ratingB - ratingA;
      if (sortBy === "rating_asc") return ratingA - ratingB;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [doctors, sortBy]);

  // Doctor rating & review modal state
  const [ratingDoctorId, setRatingDoctorId] = useState<string | null>(null);
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [ratingSubmitting, setRatingSubmitting] = useState<boolean>(false);
  const [viewingReviewsDoctorId, setViewingReviewsDoctorId] = useState<string | null>(null);
  const [doctorReviewsList, setDoctorReviewsList] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);

  const handleOpenRatingModal = (doc: Doctor, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRatingDoctorId(doc.id);
    setSelectedStars(doc.user_rating || 5);
    setReviewComment("");
  };

  const handleSaveRatingAndReview = async () => {
    if (!ratingDoctorId || !selectedStars) return;
    setRatingSubmitting(true);
    try {
      const res = await fetch("/api/doctor/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: ratingDoctorId, rating: selectedStars, review: reviewComment.trim() || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setDoctors((prev) =>
          prev.map((d) =>
            d.id === ratingDoctorId
              ? { ...d, user_rating: data.user_rating, avg_rating: data.avg_rating, rating_count: data.rating_count }
              : d
          )
        );
        setRatingDoctorId(null);
      }
    } catch {} finally {
      setRatingSubmitting(false);
    }
  };

  const handleFetchDoctorReviews = async (doctorId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setViewingReviewsDoctorId(doctorId);
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/doctor/reviews?doctorId=${doctorId}`);
      if (res.ok) {
        const data = await res.json();
        setDoctorReviewsList(data.reviews || []);
      }
    } catch {} finally {
      setLoadingReviews(false);
    }
  };

  const handleRateDoctor = async (e: React.MouseEvent, doctorId: string, rating: number) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/doctor/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, rating }),
      });
      if (res.ok) {
        const data = await res.json();
        setDoctors((prev) =>
          prev.map((d) =>
            d.id === doctorId
              ? { ...d, user_rating: data.user_rating, avg_rating: data.avg_rating, rating_count: data.rating_count }
              : d
          )
        );
      }
    } catch {}
  };

  // The currently-selected child (derived from the fetched list).
  const student = students.find(s => s.id === selectedId) ?? null;

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError("");
    try {
      const res = await fetch("/api/parent/profile");
      if (!res.ok) throw new Error(t("pd_err_load_profile"));
      const data = await res.json();
      const list: StudentProfile[] = data.students ?? (data.student ? [data.student] : []);
      setStudents(list);
      setSelectedId(prev => {
        // Keep the current selection if still present; otherwise prefer a child
        // who hasn't completed the assessment, else fall back to the first.
        if (prev && list.some(s => s.id === prev)) return prev;
        const pending = list.find(s => s.assessment_status !== "completed");
        return (pending ?? list[0])?.id ?? null;
      });
    } catch (e: any) {
      setProfileError(e.message);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const fetchNotes = useCallback(async (studentId: string) => {
    setNotesLoading(true);
    try {
      const res = await fetch(`/api/notes?studentId=${studentId}`);
      if (res.ok) setNotes(await res.json());
    } finally { setNotesLoading(false); }
  }, []);

  const fetchDoctorRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/doctor-requests");
      if (res.ok) setDoctorRequests(await res.json());
    } catch { }
  }, []);

  const fetchDoctors = useCallback(async () => {
    setDoctorsLoading(true);
    try {
      const res = await fetch("/api/users/doctors");
      if (res.ok) setDoctors(await res.json());
    } catch { } finally { setDoctorsLoading(false); }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchDoctorRequests();
    fetchDoctors();
  }, [fetchProfile, fetchDoctorRequests, fetchDoctors]);

  useEffect(() => {
    if (student?.id) fetchNotes(student.id);
  }, [student?.id, fetchNotes]);

  const handlePostNote = async () => {
    if (!student || !noteText.trim()) return;
    setNoteSubmitting(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, content: noteText.trim() }),
      });
      if (res.ok) { setNoteText(""); fetchNotes(student.id); }
    } finally { setNoteSubmitting(false); }
  };

  const handleRequestDoctor = async () => {
    if (!selectedDoctorId) return;
    setRequestError("");
    setRequestSubmitting(true);
    try {
      const res = await fetch("/api/doctor-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(student?.id ? { studentId: student.id } : {}),
          doctorId: selectedDoctorId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setRequestError(data.error || t("pd_err_send_request")); return; }
      setShowRequestModal(false);
      setSelectedDoctorId("");
      fetchDoctorRequests();
      // Refresh profile in case a student record was auto-created
      if (!student) fetchProfile();
    } finally { setRequestSubmitting(false); }
  };

  const doctorRequestsBlock = (
    <div className="mt-6 pt-4 border-t-2 border-black/10">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-black/40 flex items-center gap-1">
          <Stethoscope size={12} /> Psychologist Requests
        </p>
        <button
          onClick={() => { setShowRequestModal(true); setRequestError(""); setSelectedDoctorId(""); }}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#9C27B0] text-white border-2 border-black text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
        >
          <Plus size={10} /> Connect
        </button>
      </div>
      {doctorRequests.length === 0 ? (
        <p className="text-[11px] font-black uppercase text-black/20 italic">No requests sent</p>
      ) : (
        <div className="space-y-2">
          {doctorRequests.map(req => {
            const matchedDoctor = doctors.find(d => d.email.toLowerCase() === req.doctor_email.toLowerCase() || d.name === req.doctor_name);
            const targetDocId = req.doctor_id || matchedDoctor?.id;
            const isSelf = user?.userId && targetDocId && user.userId === targetDocId;

            return (
              <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-2 border-black p-2.5 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div>
                  <p className="text-[12px] font-black text-black uppercase">{req.doctor_name}</p>
                  <p className="text-[9px] text-black/40 font-bold">{req.doctor_email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 border border-black text-[9px] font-black uppercase ${STATUS_CLS[req.status] || ""}`}>
                    {statusLabel(req.status)}
                  </span>
                  {!isSelf && targetDocId && (
                    <button
                      type="button"
                      onClick={() => handleOpenRatingModal(matchedDoctor || { id: targetDocId, name: req.doctor_name, email: req.doctor_email })}
                      className="flex items-center gap-1 px-2.5 py-1 bg-accent text-black border border-black text-[9px] font-black uppercase shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors"
                    >
                      <Star size={11} className="fill-[#FBD000] text-black stroke-[1]" /> Rate &amp; Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (profileLoading) {
    return (
      <div className="min-h-screen w-full bg-background flex font-sans">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm font-black uppercase tracking-widest text-black/40">{t("pd_loading")}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-8 pb-4 bg-background border-b-4 border-black flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-black uppercase italic tracking-tighter">
              {students.length > 1 ? t("pd_header_my_childrens") : t("pd_header_my_childs")} <span className="text-primary">{t("pd_header_progress")}</span>
            </h1>
            <p className="text-xs font-black text-black/40 mt-1 uppercase tracking-widest">
              {t("pd_parent_portal")} · {user?.name}
            </p>
          </div>
          {/* Logout lives in the Sidebar — no duplicate here. */}
          <button
            onClick={() => startAssessment(selectedId ?? undefined)}
            className="flex items-center gap-2 px-4 py-3 bg-[#43B047] text-white border-2 border-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <Play size={14} /> {t("pd_start_assessment")}
          </button>
        </div>

        <div className="flex-1 px-6 sm:px-8 py-6 overflow-y-auto">
          {profileError && (
            <div className="flex items-center gap-3 bg-red-50 border-4 border-[#E52521] p-4 mb-6">
              <AlertCircle size={18} className="text-[#E52521]" />
              <p className="text-sm font-black text-[#E52521] uppercase">{profileError}</p>
            </div>
          )}

          {/* Child switcher — only when the parent has more than one linked child */}
          {students.length > 1 && (
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-2">{t("pd_select_child")}</p>
              <div className="flex flex-wrap gap-2">
                {students.map(s => {
                  const active = s.id === selectedId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 border-4 border-black text-xs font-black uppercase tracking-tight transition-all ${active ? "bg-primary text-white shadow-none translate-x-0.5 translate-y-0.5" : "bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"}`}
                    >
                      {s.name}
                      <span
                        title={s.assessment_status}
                        className={`w-2.5 h-2.5 border border-black ${s.assessment_status === "completed" ? "bg-[#43B047]" : s.assessment_status === "in_progress" ? "bg-[#FBD000]" : "bg-white"}`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* No student linked */}
          {!student ? (
            <div className="max-w-lg mx-auto space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 border-4 border-dashed border-black/20 text-center"
              >
                <Heart size={56} className="text-primary mb-4" />
                <h2 className="text-2xl font-black uppercase italic text-black mb-3">No Child Linked Yet</h2>
                <p className="text-sm font-bold text-black/50 leading-relaxed px-4">
                  You can start an assessment now without waiting for teacher assignment. Linking with a teacher is optional and can be done later.
                </p>
                <a
                  href="/assessment"
                  className="mt-5 inline-flex items-center gap-2 px-5 py-3 bg-primary text-white border-4 border-black font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  <Play size={14} />
                  Start Test Now
                </a>
              </motion.div>

              {/* Doctor connect — always available, even without a teacher */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 }}
                className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
              >
                <div className="h-2 bg-[#9C27B0]" />
                <div className="p-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-black/40 mb-1 flex items-center gap-2">
                    <Stethoscope size={14} /> Connect with a Doctor
                  </h3>
                  <p className="text-[11px] font-bold text-black/40 mb-2">
                    Request a psychologist consultation anytime — no teacher link required.
                  </p>
                  {doctorRequestsBlock}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SECTION 1 — Child Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
              >
                <div className="h-2 bg-primary" />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-14 h-14 bg-primary border-2 border-black flex items-center justify-center text-white font-black text-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      {student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-black text-xl uppercase tracking-tight">{student.name}</p>
                      <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">{t("pd_student_profile")}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {student.referral_assessment_type && student.referral_assessment_type !== "general" && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-black/50">{t("pd_label_assessment")}</span>
                        <span className="px-3 py-1 bg-primary text-white border-2 border-black text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          {student.referral_assessment_type}
                        </span>
                      </div>
                    )}
                    {student.assessment_status && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-black/50">{t("pd_label_status")}</span>
                        <span className={`px-3 py-1 border-2 border-black text-[10px] font-black uppercase ${STATUS_CLS[student.assessment_status] || "bg-gray-100 text-black border-black"}`}>
                          {statusLabel(student.assessment_status)}
                        </span>
                      </div>
                    )}
                    {student.assessment_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-black/50">{t("pd_label_date")}</span>
                        <span className="text-[11px] font-bold text-black">
                          {new Date(student.assessment_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    )}
                    {student.detected_disabilities && (() => {
                      const conditions = parseConditions(student.detected_disabilities);
                      return (
                        <div className="bg-muted border-2 border-black p-3 mt-2">
                          <p className="text-[9px] font-black uppercase tracking-widest text-black/40 mb-2">{t("pd_condition_from_report")}</p>
                          {conditions.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {conditions.map((c, idx) => (
                                <span key={idx} className={`${c.color} text-white px-3 py-1 border-2 border-black text-[10px] font-black uppercase tracking-widest`}>
                                  {c.icon} {c.label}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm font-bold text-black">{student.detected_disabilities}</p>
                          )}
                        </div>
                      );
                    })()}
                    {student.report_url && (
                      <a
                        href={student.report_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 w-full py-3 bg-black text-white border-4 border-black font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all justify-center mt-3"
                      >
                        <FileDown size={14} /> {t("pd_download_report")}
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* SECTION 2 — Teacher Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 }}
                className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
              >
                <div className="h-2 bg-[#049CD8]" />
                <div className="p-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-black/40 mb-4 flex items-center gap-2">
                    <BookOpen size={14} /> {t("pd_assigned_teacher")}
                  </h3>
                  {student.teacher_name ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#049CD8] border-2 border-black flex items-center justify-center text-white font-black text-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                          {student.teacher_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-black text-lg uppercase tracking-tight">{student.teacher_name}</p>
                          <p className="text-[10px] font-bold text-black/50">{student.teacher_email}</p>
                        </div>
                      </div>
                      <div className="bg-[#049CD8]/10 border-2 border-[#049CD8] p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#049CD8] mb-1">{t("pd_contact")}</p>
                        <p className="text-sm font-bold text-black">{student.teacher_email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-black uppercase text-black/30 italic">{t("pd_no_teacher")}</p>
                  )}

                  {/* Doctor requests — available whether or not a teacher is assigned */}
                  {doctorRequestsBlock}
                </div>
              </motion.div>

              {/* SECTION 4 — Notes (full width) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
                className="lg:col-span-2 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
              >
                <div className="h-2 bg-[#43B047]" />
                <div className="p-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-black/40 mb-4 flex items-center gap-2">
                    <MessageSquare size={14} /> {t("pd_notes_title")}
                  </h3>
                  {notesLoading ? (
                    <div className="flex items-center justify-center py-8"><RefreshCw className="animate-spin text-primary" size={20} /></div>
                  ) : notes.length === 0 ? (
                    <p className="text-sm font-black uppercase text-black/20 italic mb-4">{t("pd_no_notes")}</p>
                  ) : (
                    <div className="space-y-3 mb-5 max-h-72 overflow-y-auto">
                      {notes.map(note => (
                        <div key={note.id} className="border-2 border-black p-4 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`${NOTE_ROLE_COLORS[note.author_role] || "bg-gray-400 text-white"} px-2 py-0.5 text-[9px] font-black uppercase border border-black`}>
                              {roleLabel(note.author_role)}
                            </span>
                            <span className="text-[10px] font-bold text-black/50">{note.author_name}</span>
                            <span className="ml-auto text-[9px] text-black/30 font-bold">
                              {new Date(note.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                          <p className="text-sm text-black/80">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="border-t-2 border-black/10 pt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-2">{t("pd_add_note")}</p>
                    <textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder={t("pd_note_placeholder")}
                      rows={3}
                      className="w-full px-4 py-3 border-4 border-black bg-muted focus:bg-white focus:outline-none text-sm resize-none"
                    />
                    <button
                      onClick={handlePostNote}
                      disabled={!noteText.trim() || noteSubmitting}
                      className="mt-2 flex items-center gap-2 px-5 py-3 bg-[#43B047] text-white border-4 border-black font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-40"
                    >
                      {noteSubmitting ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                      {t("pd_post_note")}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>

      {/* ── REQUEST DOCTOR MODAL ── */}
      <AnimatePresence>
        {showRequestModal && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowRequestModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="w-full max-w-lg bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#9C27B0] p-6 border-b-4 border-black flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Connect with Doctor</h2>
                    <p className="text-[11px] font-black text-white/70 uppercase mt-1">
                      {student ? `For: ${student.name}` : "No teacher link required"}
                    </p>
                  </div>
                  <button onClick={() => setShowRequestModal(false)} className="text-white"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  {/* Sorting Header */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-black/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/60">Select a Specialist</p>
                    <div className="flex items-center gap-1.5 bg-muted border-2 border-black px-2.5 py-1">
                      <ArrowUpDown size={12} className="text-black/60" />
                      <span className="text-[10px] font-black uppercase text-black/50">Sort:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent text-[11px] font-black uppercase focus:outline-none cursor-pointer"
                      >
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="rating_desc">Rating: High to Low</option>
                        <option value="rating_asc">Rating: Low to High</option>
                        <option value="name">Name: A - Z</option>
                      </select>
                    </div>
                  </div>

                  {doctorsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="animate-spin text-[#9C27B0]" size={22} />
                    </div>
                  ) : sortedDoctors.length === 0 ? (
                    <p className="text-sm font-black uppercase text-black/30 italic py-4 text-center">
                      No doctors available yet
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                      {sortedDoctors.map((doc, i) => {
                        const color = DOCTOR_COLORS[i % DOCTOR_COLORS.length];
                        const selected = selectedDoctorId === doc.id;
                        const avgRating = Number(doc.avg_rating) || 0;
                        const ratingCount = Number(doc.rating_count) || 0;
                        const userRating = Number(doc.user_rating) || 0;
                        const fee = Number(doc.consulting_fee) || 0;

                        return (
                          <div
                            key={doc.id}
                            onClick={() => setSelectedDoctorId(doc.id)}
                            className={`w-full p-4 border-4 border-black text-left transition-all cursor-pointer ${
                              selected
                                ? "bg-[#9C27B0]/10 border-[#9C27B0] shadow-none translate-x-0.5 translate-y-0.5"
                                : "bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="w-12 h-12 border-2 border-black flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                style={{ backgroundColor: color }}
                              >
                                {doc.name.substring(0, 2).toUpperCase()}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-black text-base uppercase tracking-tight text-black truncate">{doc.name}</p>
                                  <span className="shrink-0 px-2.5 py-1 bg-black text-white border border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    ${fee} / session
                                  </span>
                                </div>
                                <p className="text-[10px] font-bold text-black/50 truncate mb-2">{doc.email}</p>

                                {/* Rating & Review Row */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/10">
                                  <div className="flex items-center gap-1.5">
                                    <Star size={14} className="fill-[#FBD000] text-black stroke-[1.5]" />
                                    <span className="text-xs font-black text-black">{avgRating.toFixed(1)}</span>
                                    <span className="text-[10px] font-bold text-black/40">({ratingCount})</span>
                                    {ratingCount > 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => handleFetchDoctorReviews(doc.id, e)}
                                        className="text-[9px] font-black uppercase text-[#049CD8] hover:underline ml-1"
                                      >
                                        View Reviews
                                      </button>
                                    )}
                                  </div>

                                  {/* Interactive Star Rating + Write Review (Disabled if self) */}
                                  {user?.userId === doc.id ? (
                                    <span className="px-2 py-0.5 bg-black/10 border border-black text-[9px] font-black uppercase text-black/60">
                                      Your Profile
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex items-center gap-1 bg-muted px-2 py-1 border border-black">
                                        <span className="text-[9px] font-black uppercase text-black/60 mr-1">Rate:</span>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <button
                                            key={star}
                                            type="button"
                                            onClick={(e) => handleRateDoctor(e, doc.id, star)}
                                            className="hover:scale-125 transition-transform"
                                            title={`Rate ${star} stars`}
                                          >
                                            <Star
                                              size={14}
                                              className={
                                                star <= (userRating || Math.round(avgRating))
                                                  ? "fill-[#FBD000] text-black stroke-[1.5]"
                                                  : "text-black/30"
                                              }
                                            />
                                          </button>
                                        ))}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => handleOpenRatingModal(doc, e)}
                                        className="px-2 py-1 bg-accent text-black border border-black text-[9px] font-black uppercase hover:bg-black hover:text-white transition-colors"
                                      >
                                        + Review
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {requestError && (
                    <p className="text-[11px] font-black text-[#E52521] uppercase">{requestError}</p>
                  )}
                  <button
                    onClick={handleRequestDoctor}
                    disabled={!selectedDoctorId || requestSubmitting}
                    className="w-full py-4 bg-[#9C27B0] text-white border-4 border-black font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-40 mt-2"
                  >
                    {requestSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Stethoscope size={14} />}
                    {t("pd_send_request")}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── WRITE RATING & OPTIONAL REVIEW MODAL ── */}
      <AnimatePresence>
        {ratingDoctorId && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setRatingDoctorId(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="w-full max-w-md bg-white border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
                  <h3 className="font-black text-lg uppercase tracking-tight text-black flex items-center gap-2">
                    <Star className="text-[#FBD000] fill-[#FBD000]" size={18} /> Rate & Review Doctor
                  </h3>
                  <button onClick={() => setRatingDoctorId(null)} className="text-black"><X size={18} /></button>
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
                      className="flex-1 py-3 bg-primary text-white border-2 border-black font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
                    >
                      {ratingSubmitting ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                      Submit Review
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── VIEW DOCTOR REVIEWS MODAL ── */}
      <AnimatePresence>
        {viewingReviewsDoctorId && (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setViewingReviewsDoctorId(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="w-full max-w-lg bg-white border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
                  <h3 className="font-black text-lg uppercase tracking-tight text-black flex items-center gap-2">
                    <MessageSquare className="text-primary" size={18} /> Patient Reviews
                  </h3>
                  <button onClick={() => setViewingReviewsDoctorId(null)} className="text-black"><X size={18} /></button>
                </div>

                {loadingReviews ? (
                  <div className="py-8 flex justify-center"><RefreshCw size={20} className="animate-spin text-primary" /></div>
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
                        <p className="text-[9px] text-black/30 font-bold text-right mt-1">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
