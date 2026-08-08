"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope, ChevronDown, ChevronUp, Check, X,
  FileDown, RefreshCw, MessageSquare, Send,
  Clock, Users, ClipboardList, AlertCircle, Activity,
  Coins, Star, Save, CheckCircle, AlertTriangle, FileText,
  Search, ArrowLeft, SlidersHorizontal, ArrowUpDown, Brain, BookOpen, PenTool, Calculator
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

interface DoctorRequest {
  id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  responded_at?: string;
  student_id: string;
  student_name: string;
  student_email: string;
  referral_assessment_type?: string;
  assessment_status?: string;
  parent_name: string;
  parent_email: string;
}

interface Case {
  student_id: string;
  student_name: string;
  student_email: string;
  referral_assessment_type?: string;
  assessment_status?: string;
  teacher_name?: string;
  teacher_email?: string;
  parent_name?: string;
  parent_email?: string;
  report_url?: string;
  detected_disabilities?: string;
  assessment_date?: string;
  request_id: string;
  request_date: string;
}

interface Note {
  id: string;
  content: string;
  author_role: string;
  author_name: string;
  created_at: string;
}

interface AssessmentReport {
  id: string;
  child_name: string;
  gender: string;
  age: number;
  report_url: string;
  school_grade?: string;
  language?: string;
  created_at?: string;
  domain_scores?: Record<string, { composite_score: number; risk_level: string }> | null;
  flags_for_assessment?: string[] | null;
  evidence_status?: string;
  questionnaire_group?: string;
  screening_updated_at?: string;
}

interface DoctorReview {
  id: string;
  rating: number;
  review?: string;
  created_at: string;
  reviewer_name: string;
}

const RISK_CONFIG: Record<string, { label: string; color: string; badge: string }> = {
  low: { label: "Low Risk", color: "bg-[#43B047] text-white", badge: "bg-[#43B047]/10 text-[#43B047] border-[#43B047]" },
  moderate: { label: "Monitor", color: "bg-[#FBD000] text-black", badge: "bg-[#FBD000]/10 text-black border-[#FBD000]" },
  high: { label: "Follow Up", color: "bg-[#E52521] text-white", badge: "bg-[#E52521]/10 text-[#E52521] border-[#E52521]" },
  unknown: { label: "Pending", color: "bg-black/10 text-black/40", badge: "bg-black/5 text-black/40 border-black/20" },
};

const DOMAIN_ICONS: Record<string, { icon: string; name: string }> = {
  reading: { icon: "📖", name: "Reading Ability" },
  math: { icon: "🧮", name: "Mathematical Skill" },
  writing: { icon: "✏️", name: "Writing Motor Control" },
  attention: { icon: "🧠", name: "Attention & Executive Function" },
};

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"requests" | "cases" | "reports">("requests");

  const [requests, setRequests] = useState<DoctorRequest[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [reports, setReports] = useState<AssessmentReport[]>([]);

  const [loadingReq, setLoadingReq] = useState(true);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Dedicated Student Report View State
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Search, Filter & Sort State for Patient Reports
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "moderate" | "low" | "pending">("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "risk">("date");

  // Expanded case notes state
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [caseNotes, setCaseNotes] = useState<Record<string, Note[]>>({});
  const [noteText, setNoteText] = useState<Record<string, string>>({});
  const [noteLoading, setNoteLoading] = useState<Record<string, boolean>>({});
  const [noteSubmitting, setNoteSubmitting] = useState<Record<string, boolean>>({});

  // Doctor fee state
  const [consultingFee, setConsultingFee] = useState<string>("");
  const [avgRating, setAvgRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [patientReviews, setPatientReviews] = useState<DoctorReview[]>([]);
  const [feeSaving, setFeeSaving] = useState<boolean>(false);
  const [feeMsg, setFeeMsg] = useState<string>("");
  const [feeErr, setFeeErr] = useState<string>("");

  const fetchRequests = useCallback(async () => {
    setLoadingReq(true);
    try {
      const res = await fetch("/api/doctor-requests");
      if (res.ok) setRequests(await res.json());
    } finally { setLoadingReq(false); }
  }, []);

  const fetchCases = useCallback(async () => {
    setLoadingCases(true);
    try {
      const res = await fetch("/api/doctor/cases");
      if (res.ok) setCases(await res.json());
    } finally { setLoadingCases(false); }
  }, []);

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const res = await fetch("/api/assessments");
      if (res.ok) {
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
      }
    } finally { setLoadingReports(false); }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/doctor/profile");
      if (res.ok) {
        const data = await res.json();
        setConsultingFee(data.consulting_fee ? String(data.consulting_fee) : "0");
        setAvgRating(Number(data.avg_rating) || 0);
        setRatingCount(Number(data.rating_count) || 0);
        setPatientReviews(data.reviews || []);
      }
    } catch {}
  }, []);

  const handleSaveFee = async () => {
    setFeeSaving(true);
    setFeeMsg("");
    setFeeErr("");
    try {
      const res = await fetch("/api/doctor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consulting_fee: Number(consultingFee) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeeErr(data.error || "Failed to update fee");
      } else {
        setFeeMsg("Consulting fee updated!");
        setTimeout(() => setFeeMsg(""), 4000);
      }
    } catch (e: any) {
      setFeeErr(e.message || "Failed to update fee");
    } finally {
      setFeeSaving(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchCases();
    fetchReports();
    fetchProfile();
  }, [fetchRequests, fetchCases, fetchReports, fetchProfile]);

  const handleRespond = async (id: string, status: "accepted" | "rejected") => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/doctor-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchRequests();
        fetchCases();
        fetchReports();
      }
    } finally { setProcessingId(null); }
  };

  const fetchCaseNotes = async (studentId: string) => {
    setNoteLoading(prev => ({ ...prev, [studentId]: true }));
    try {
      const res = await fetch(`/api/notes?studentId=${studentId}`);
      if (res.ok) {
        const json = await res.json();
        setCaseNotes(prev => ({ ...prev, [studentId]: json }));
      }
    } finally { setNoteLoading(prev => ({ ...prev, [studentId]: false })); }
  };

  const handleExpand = (studentId: string) => {
    if (expandedCase === studentId) { setExpandedCase(null); return; }
    setExpandedCase(studentId);
    fetchCaseNotes(studentId);
  };

  const handlePostNote = async (studentId: string) => {
    const text = noteText[studentId]?.trim();
    if (!text) return;
    setNoteSubmitting(prev => ({ ...prev, [studentId]: true }));
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, content: text }),
      });
      if (res.ok) {
        setNoteText(prev => ({ ...prev, [studentId]: "" }));
        fetchCaseNotes(studentId);
      }
    } finally { setNoteSubmitting(prev => ({ ...prev, [studentId]: false })); }
  };

  // Filtered & Sorted Reports
  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = !q || r.child_name.toLowerCase().includes(q);

        const domains = Object.values(r.domain_scores ?? {});
        let matchesRisk = true;
        if (riskFilter === "high") {
          matchesRisk = domains.some((d) => d.risk_level === "high");
        } else if (riskFilter === "moderate") {
          matchesRisk = domains.some((d) => d.risk_level === "moderate");
        } else if (riskFilter === "low") {
          matchesRisk = domains.length > 0 && domains.every((d) => d.risk_level === "low");
        } else if (riskFilter === "pending") {
          matchesRisk = domains.length === 0;
        }

        return matchesQuery && matchesRisk;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.child_name.localeCompare(b.child_name);
        }
        if (sortBy === "risk") {
          const aHigh = Object.values(a.domain_scores ?? {}).filter((d) => d.risk_level === "high").length;
          const bHigh = Object.values(b.domain_scores ?? {}).filter((d) => d.risk_level === "high").length;
          return bHigh - aHigh;
        }
        // Default: Sort by Date descending
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
  }, [reports, searchQuery, riskFilter, sortBy]);

  const selectedReport = useMemo(() => {
    return reports.find((r) => r.id === selectedReportId) ?? null;
  }, [reports, selectedReportId]);

  const pending = requests.filter(r => r.status === "pending");

  return (
    <div className="min-h-screen w-full bg-background flex font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-8 pb-4 bg-background border-b-4 border-black flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-black uppercase italic tracking-tighter">
              {t("dd_doctor")} <span className="text-primary">{t("dd_portal")}</span>
            </h1>
            <p className="text-xs font-black text-black/40 mt-1 uppercase tracking-widest">
              {user?.name} · {t("dd_psychologist_dashboard")}
            </p>
          </div>
        </div>

        <div className="flex-1 px-6 sm:px-8 py-6 overflow-y-auto">
          {/* Doctor Fee & Rating Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest mb-1">
                  <Coins size={16} /> Consulting Fee & Rating Profile
                </div>
                <h2 className="text-xl font-black text-black uppercase tracking-tight">Set Your Consultation Charges</h2>
                <p className="text-xs text-black/60 font-bold mt-0.5">
                  Set the consultation fee that parents and patients will see when searching for doctors & specialists.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 font-black text-black text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={consultingFee}
                      onChange={(e) => setConsultingFee(e.target.value)}
                      placeholder="0"
                      className="w-36 pl-8 pr-4 py-2.5 border-4 border-black font-black text-base focus:bg-accent focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                  </div>
                  <button
                    onClick={handleSaveFee}
                    disabled={feeSaving}
                    className="flex items-center gap-2 px-5 py-3 bg-primary text-white border-4 border-black font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-40"
                  >
                    {feeSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Fee
                  </button>

                  {feeMsg && (
                    <span className="flex items-center gap-1.5 px-3 py-2 bg-[#43B047]/10 text-[#43B047] border-2 border-[#43B047] text-xs font-black uppercase">
                      <Check size={14} /> {feeMsg}
                    </span>
                  )}
                  {feeErr && (
                    <span className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-[#E52521] border-2 border-[#E52521] text-xs font-black uppercase">
                      <AlertCircle size={14} /> {feeErr}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-4 border-black bg-muted p-4 md:w-64 flex flex-col items-center justify-center text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1">Your Rating</p>
                <div className="flex items-center gap-1.5 my-1">
                  <span className="text-3xl font-black text-black">{avgRating.toFixed(1)}</span>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center text-[#FBD000]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={star <= Math.round(avgRating) ? "fill-[#FBD000] text-black stroke-[1.5]" : "text-black/20"}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-black/50">{ratingCount} {ratingCount === 1 ? "review" : "reviews"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Reviews List */}
            {patientReviews.length > 0 && (
              <div className="mt-6 pt-4 border-t-2 border-black/10">
                <p className="text-xs font-black uppercase tracking-widest text-black/60 mb-3 flex items-center gap-2">
                  <MessageSquare size={14} className="text-primary" /> Patient Ratings & Written Reviews ({patientReviews.length})
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {patientReviews.map((rev) => (
                    <div key={rev.id} className="border-2 border-black p-3 bg-muted/40 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
              </div>
            )}
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: t("dd_pending_requests"), value: pending.length, color: "#FBD000" },
              { label: t("dd_active_cases"), value: cases.length, color: "#43B047" },
              { label: "Patient Reports", value: reports.length, color: "#5C94FC" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5"
              >
                <div className="text-4xl font-black text-black">{s.value}</div>
                <div className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: s.color }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-0 mb-6 border-4 border-black w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {[
              { key: "requests", label: t("dd_pending_requests"), count: pending.length },
              { key: "cases", label: t("dd_active_cases"), count: cases.length },
              { key: "reports", label: "Patient Reports & History", count: reports.length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  if (tab.key !== "reports") setSelectedReportId(null);
                }}
                className={`px-6 py-3 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.key ? "bg-primary text-white" : "bg-white text-black hover:bg-muted"}`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border border-black ${activeTab === tab.key ? "bg-white text-primary" : "bg-primary text-white"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* PENDING REQUESTS TAB */}
          {activeTab === "requests" && (
            <div className="space-y-4">
              {loadingReq ? (
                <div className="flex items-center justify-center py-16"><RefreshCw className="animate-spin text-primary" size={28} /></div>
              ) : pending.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-4 border-dashed border-black/20">
                  <ClipboardList size={48} className="text-black/20 mb-4" />
                  <p className="text-xl font-black uppercase italic text-black/20">{t("dd_no_pending_requests")}</p>
                </div>
              ) : (
                pending.map((req, i) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-primary border-2 border-black flex items-center justify-center text-white font-black text-sm">
                        {req.student_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-black uppercase tracking-tight">{req.student_name}</p>
                        <p className="text-[10px] font-bold text-black/50">{req.student_email}</p>
                        <p className="text-[10px] font-bold text-black/40 mt-0.5">{t("dd_parent")}: {req.parent_name}</p>
                      </div>
                    </div>
                    {req.referral_assessment_type && (
                      <span className="px-3 py-1 bg-primary text-white border-2 border-black text-[10px] font-black uppercase">
                        {req.referral_assessment_type}
                      </span>
                    )}
                    <div className="text-[10px] font-bold text-black/40 uppercase">
                      <Clock size={11} className="inline mr-1" />
                      {new Date(req.created_at).toLocaleDateString("en-GB")}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(req.id, "accepted")}
                        disabled={processingId === req.id}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-[#43B047] text-white border-2 border-black font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                      >
                        <Check size={13} /> {t("dd_accept")}
                      </button>
                      <button
                        onClick={() => handleRespond(req.id, "rejected")}
                        disabled={processingId === req.id}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-[#E52521] text-white border-2 border-black font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                      >
                        <X size={13} /> {t("dd_reject")}
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* ACTIVE CASES TAB */}
          {activeTab === "cases" && (
            <div className="space-y-4">
              {loadingCases ? (
                <div className="flex items-center justify-center py-16"><RefreshCw className="animate-spin text-primary" size={28} /></div>
              ) : cases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-4 border-dashed border-black/20">
                  <Users size={48} className="text-black/20 mb-4" />
                  <p className="text-xl font-black uppercase italic text-black/20">{t("dd_no_active_cases")}</p>
                  <p className="text-xs font-black uppercase text-black/20 mt-2">{t("dd_accept_requests_to_see_cases")}</p>
                </div>
              ) : (
                cases.map((c, i) => {
                  const isExpanded = expandedCase === c.student_id;
                  const notes = caseNotes[c.student_id] || [];

                  return (
                    <motion.div
                      key={c.student_id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                    >
                      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-accent border-2 border-black flex items-center justify-center font-black text-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {c.student_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-black text-lg uppercase tracking-tight italic">{c.student_name}</p>
                            <p className="text-[10px] font-bold text-black/50">
                              {t("dd_parent")}: {c.parent_name ?? "—"} ({c.parent_email ?? "—"})
                            </p>
                            {c.teacher_name && (
                              <p className="text-[10px] font-bold text-black/40">
                                {t("dd_teacher")}: {c.teacher_name} ({c.teacher_email})
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {c.referral_assessment_type && (
                            <span className="px-3 py-1 bg-primary text-white border-2 border-black text-[10px] font-black uppercase">
                              {c.referral_assessment_type}
                            </span>
                          )}
                          {c.report_url && (
                            <a
                              href={c.report_url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#43B047] text-white border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            >
                              <FileDown size={12} /> {t("dd_report")}
                            </a>
                          )}
                          <button
                            onClick={() => handleExpand(c.student_id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <MessageSquare size={12} /> Notes & History {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Notes Section */}
                      {isExpanded && (
                        <div className="border-t-4 border-black p-5 bg-muted/30">
                          <p className="text-xs font-black uppercase tracking-widest text-black/60 mb-3 flex items-center gap-2">
                            <MessageSquare size={14} /> Clinical Notes History
                          </p>

                          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
                            {noteLoading[c.student_id] ? (
                              <RefreshCw size={16} className="animate-spin text-primary my-4" />
                            ) : notes.length === 0 ? (
                              <p className="text-xs text-black/40 italic font-bold">No clinical notes recorded yet.</p>
                            ) : (
                              notes.map((n) => (
                                <div key={n.id} className="p-3 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-black text-xs text-black">{n.author_name} ({n.author_role})</span>
                                    <span className="text-[9px] font-bold text-black/40">{new Date(n.created_at).toLocaleString()}</span>
                                  </div>
                                  <p className="text-xs text-black/80">{n.content}</p>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={noteText[c.student_id] || ""}
                              onChange={(e) => setNoteText((prev) => ({ ...prev, [c.student_id]: e.target.value }))}
                              placeholder="Write a clinical note..."
                              className="flex-1 px-4 py-2 bg-white border-2 border-black font-bold text-xs uppercase focus:outline-none"
                            />
                            <button
                              onClick={() => handlePostNote(c.student_id)}
                              disabled={noteSubmitting[c.student_id]}
                              className="px-4 py-2 bg-primary text-white border-2 border-black font-black text-xs uppercase flex items-center gap-1"
                            >
                              <Send size={12} /> Post
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {/* PATIENT REPORTS TAB */}
          {activeTab === "reports" && (
            <div>
              {/* DEDICATED STUDENT REPORT DETAIL VIEW */}
              {selectedReport ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Back Navigation Bar */}
                  <div className="flex items-center justify-between bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <button
                      onClick={() => setSelectedReportId(null)}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white font-black text-xs uppercase tracking-widest border-2 border-black hover:bg-gray-800 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <ArrowLeft size={16} /> Back to Patient List
                    </button>
                    <span className="text-xs font-black uppercase text-black/50 tracking-widest hidden sm:inline">
                      Dedicated Patient Assessment View
                    </span>
                  </div>

                  {/* Patient Profile Header Card */}
                  <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-primary text-white border-3 border-black flex items-center justify-center font-black text-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                          {selectedReport.child_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-2xl font-black text-black uppercase italic tracking-tight">{selectedReport.child_name}</h2>
                            <span className="px-3 py-1 bg-accent border-2 border-black text-black text-xs font-black uppercase">
                              Age {selectedReport.age}
                            </span>
                            <span className="px-3 py-1 bg-muted border-2 border-black text-black text-xs font-black uppercase">
                              {selectedReport.gender}
                            </span>
                          </div>
                          <p className="text-xs font-black text-black/50 uppercase tracking-widest mt-1">
                            School Grade: {selectedReport.school_grade ?? "—"} · Language: {selectedReport.language ?? "English"}
                            {selectedReport.created_at && ` · Assessment Date: ${new Date(selectedReport.created_at).toLocaleDateString("en-GB")}`}
                          </p>
                        </div>
                      </div>

                      {selectedReport.report_url && (
                        <a
                          href={selectedReport.report_url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-6 py-3 bg-[#43B047] text-white border-4 border-black font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all self-start sm:self-auto"
                        >
                          <FileDown size={16} /> Download Full PDF Report
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Screening Domain Performance & Risk Levels */}
                  <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="text-lg font-black uppercase italic text-black mb-4 flex items-center gap-2">
                      <Activity size={20} className="text-primary" /> Screening Domain Performance Breakdown
                    </h3>

                    {selectedReport.domain_scores && Object.keys(selectedReport.domain_scores).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(selectedReport.domain_scores).map(([domain, ds]) => {
                          const riskKey = ds.risk_level ?? "unknown";
                          const cfg = RISK_CONFIG[riskKey] ?? RISK_CONFIG.unknown;
                          const pct = Math.round((ds.composite_score ?? 0) * 100);
                          const domMeta = DOMAIN_ICONS[domain] ?? { icon: "🎯", name: domain.toUpperCase() };

                          return (
                            <div key={domain} className="border-4 border-black bg-muted/20 overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                              <div className={`px-4 py-2 flex items-center justify-between border-b-2 border-black ${cfg.color}`}>
                                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                                  <span>{domMeta.icon}</span> {domain}
                                </span>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 border border-black bg-black/20 text-white">
                                  {cfg.label}
                                </span>
                              </div>
                              <div className="p-4 text-center">
                                <p className="text-4xl font-black text-black">{pct}%</p>
                                <p className="text-[10px] font-black uppercase text-black/40 mt-1">Composite Score</p>

                                {/* Visual Progress Bar */}
                                <div className="w-full bg-black/10 h-3 border-2 border-black mt-3 overflow-hidden">
                                  <div
                                    className={`h-full ${pct >= 75 ? "bg-[#43B047]" : pct >= 50 ? "bg-[#FBD000]" : "bg-[#E52521]"}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 bg-muted border-2 border-black text-center font-black uppercase text-xs text-black/40">
                        Screening AI engine processing in progress or pending completion.
                      </div>
                    )}
                  </div>

                  {/* Detailed Clinical Assessment Narrative / Flags */}
                  {selectedReport.flags_for_assessment && selectedReport.flags_for_assessment.length > 0 && (
                    <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                      <h3 className="text-lg font-black uppercase italic text-black mb-3 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-[#E52521]" /> Key Flags for Formal Assessment
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedReport.flags_for_assessment.map((flag, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-[#E52521] text-white border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* PATIENT GRID VIEW WITH SEARCH, FILTER & SORT */
                <div className="space-y-6">
                  {/* Search, Filter & Sort Controls */}
                  <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-4 justify-between items-center">
                    {/* Search input */}
                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40" size={16} />
                      <input
                        type="text"
                        placeholder="Search patient name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border-3 border-black bg-muted font-black text-xs uppercase focus:bg-white focus:outline-none"
                      />
                    </div>

                    {/* Filter & Sort Controls */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal size={14} className="text-black/50" />
                        <span className="text-[10px] font-black uppercase text-black/60">Risk:</span>
                        <select
                          value={riskFilter}
                          onChange={(e) => setRiskFilter(e.target.value as any)}
                          className="px-3 py-2 border-3 border-black bg-white font-black text-xs uppercase focus:outline-none cursor-pointer"
                        >
                          <option value="all">All Risk Levels</option>
                          <option value="high">Follow Up (High Risk)</option>
                          <option value="moderate">Monitor (Moderate Risk)</option>
                          <option value="low">Low Risk</option>
                          <option value="pending">Pending Analysis</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <ArrowUpDown size={14} className="text-black/50" />
                        <span className="text-[10px] font-black uppercase text-black/60">Sort:</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="px-3 py-2 border-3 border-black bg-white font-black text-xs uppercase focus:outline-none cursor-pointer"
                        >
                          <option value="date">Most Recent Assessment</option>
                          <option value="name">Patient Name (A-Z)</option>
                          <option value="risk">Highest Risk First</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Patient Cards Grid */}
                  {loadingReports ? (
                    <div className="flex items-center justify-center py-20"><RefreshCw className="animate-spin text-primary" size={32} /></div>
                  ) : filteredReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border-4 border-dashed border-black/20 text-center p-6">
                      <FileText size={48} className="text-black/20 mb-4" />
                      <p className="text-xl font-black uppercase italic text-black/30">No Patient Reports Found</p>
                      <p className="text-xs font-black uppercase text-black/30 mt-1 max-w-md">
                        {searchQuery || riskFilter !== "all"
                          ? "Try clearing your search query or changing the risk filter."
                          : "Reports for accepted patients will appear here automatically."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredReports.map((rep, i) => {
                        const domains = Object.entries(rep.domain_scores ?? {});
                        const highRisk = domains.filter(([, d]) => d.risk_level === "high").length;
                        const modRisk = domains.filter(([, d]) => d.risk_level === "moderate").length;

                        return (
                          <motion.div
                            key={rep.id || i}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => setSelectedReportId(rep.id)}
                            className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
                          >
                            <div className="p-5">
                              {/* Card Header */}
                              <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-primary text-white border-2 border-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    {rep.child_name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <h3 className="font-black text-black text-lg uppercase tracking-tight italic">{rep.child_name}</h3>
                                    <p className="text-[10px] font-black text-black/50 uppercase tracking-widest">
                                      Age {rep.age} · {rep.gender} · {rep.school_grade ?? "—"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Risk Summary Badges */}
                              <div className="space-y-2 mb-4">
                                <p className="text-[9px] font-black uppercase text-black/40 tracking-widest">Assessment Risk Profile:</p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {highRisk > 0 && (
                                    <span className="bg-[#E52521] text-white text-[10px] font-black uppercase px-2.5 py-1 border border-black">
                                      {highRisk} Follow Up
                                    </span>
                                  )}
                                  {modRisk > 0 && (
                                    <span className="bg-[#FBD000] text-black text-[10px] font-black uppercase px-2.5 py-1 border border-black">
                                      {modRisk} Monitor
                                    </span>
                                  )}
                                  {domains.length > 0 && highRisk === 0 && modRisk === 0 && (
                                    <span className="bg-[#43B047] text-white text-[10px] font-black uppercase px-2.5 py-1 border border-black">
                                      All Low Risk
                                    </span>
                                  )}
                                  {domains.length === 0 && (
                                    <span className="bg-black/10 text-black/50 text-[10px] font-black uppercase px-2.5 py-1 border border-black">
                                      Pending Screening
                                    </span>
                                  )}
                                </div>
                              </div>

                              {rep.created_at && (
                                <p className="text-[10px] font-black text-black/40 uppercase">
                                  📅 {new Date(rep.created_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>

                            {/* Card Footer Button */}
                            <div className="bg-muted border-t-3 border-black p-3 text-center">
                              <span className="font-black text-xs uppercase tracking-widest text-primary flex items-center justify-center gap-1">
                                View Dedicated Report →
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
