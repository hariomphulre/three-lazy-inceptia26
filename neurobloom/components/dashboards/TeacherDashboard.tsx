"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, X, Copy, Check, Trash2, FileText,
  Send, RefreshCw, ChevronDown, ChevronUp,
  BookOpen, Brain, Zap, Ear, MessageSquare, PenTool,
  Calculator, ClipboardList, Link2, AlertCircle, FileDown,
  CheckCircle, AlertTriangle, Search, ArrowLeft, SlidersHorizontal, ArrowUpDown, Activity
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { parseConditions } from "@/lib/conditions";

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  referral_assessment_type?: string;
  assessment_status: "not_started" | "in_progress" | "completed";
  assessment_id?: string;
  report_url?: string;
  detected_disabilities?: string;
  parent_name?: string;
  parent_email?: string;
  latest_referral_code?: string;
  referral_status?: string;
  referral_sent_at?: string;
  created_at: string;
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

const STATUS_STYLES = {
  not_started: { label: "Not Started", cls: "bg-gray-100 text-black border-black" },
  in_progress: { label: "In Progress", cls: "bg-[#FBD000] text-black border-black" },
  completed: { label: "Completed", cls: "bg-[#43B047] text-white border-black" },
};

const RISK_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low Risk", color: "bg-[#43B047] text-white" },
  moderate: { label: "Monitor", color: "bg-[#FBD000] text-black" },
  high: { label: "Follow Up", color: "bg-[#E52521] text-white" },
  unknown: { label: "Pending", color: "bg-black/10 text-black/40" },
};

const DOMAIN_ICONS: Record<string, { icon: string; name: string }> = {
  reading: { icon: "📖", name: "Reading Ability" },
  math: { icon: "🧮", name: "Mathematical Skill" },
  writing: { icon: "✏️", name: "Writing Motor Control" },
  attention: { icon: "🧠", name: "Attention & Executive Function" },
};

function Overlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      onClick={onClose}
    />
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const statusLabel = (s: string) =>
    t(`status_${s}`) === `status_${s}` ? s.replace("_", " ") : t(`status_${s}`);

  const [activeTab, setActiveTab] = useState<"students" | "reports">("students");

  const [students, setStudents] = useState<Student[]>([]);
  const [reports, setReports] = useState<AssessmentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState("");

  // Selected report for dedicated detail view
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Search, Filter & Sort for Reports
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "moderate" | "low" | "pending">("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "risk">("date");

  // Add student modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", phone: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // Assign modal
  const [assigningStudent, setAssigningStudent] = useState<Student | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignResult, setAssignResult] = useState<{ referralLink: string; emailSent: boolean; emailWarning?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Notes panel
  const [notesStudent, setNotesStudent] = useState<Student | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const fetchStudents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsPolling(true);
    setError("");
    try {
      const res = await fetch("/api/teacher/students");
      if (!res.ok) throw new Error(t("td_err_load_students"));
      const data = await res.json();
      setStudents(data);
      setLastUpdated(new Date());
    } catch (e: any) {
      if (!silent) setError(e.message);
    } finally {
      setLoading(false);
      setIsPolling(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const res = await fetch("/api/assessments");
      if (res.ok) {
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchReports();
    const interval = setInterval(() => {
      fetchStudents(true);
      fetchReports();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchStudents, fetchReports]);

  const fetchNotes = useCallback(async (studentId: string) => {
    setNotesLoading(true);
    try {
      const res = await fetch(`/api/notes?studentId=${studentId}`);
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch { setNotes([]); } finally { setNotesLoading(false); }
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!addForm.name.trim() || !addForm.email.trim()) {
      setAddError(t("td_err_name_email_required"));
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || t("td_err_add_failed")); return; }
      setAddForm({ name: "", email: "", phone: "" });
      setShowAdd(false);
      fetchStudents();
    } catch { setAddError(t("td_err_generic")); }
    finally { setAddLoading(false); }
  };

  const handleAssign = async () => {
    if (!assigningStudent) return;
    setAssignLoading(true);
    setAssignResult(null);
    try {
      const res = await fetch(`/api/teacher/students/${assigningStudent.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("td_err_assign_failed"));
      setAssignResult({ referralLink: data.referralLink, emailSent: data.emailSent, emailWarning: data.emailWarning });
      fetchStudents();
    } catch (e: any) {
      alert(e.message);
    } finally { setAssignLoading(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${t("td_remove_pre")} ${name} ${t("td_remove_post")}`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/teacher/students/${id}`, { method: "DELETE" });
      fetchStudents();
      fetchReports();
    } finally { setDeletingId(null); }
  };

  const handlePostNote = async () => {
    if (!notesStudent || !noteText.trim()) return;
    setNoteSubmitting(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: notesStudent.id, content: noteText.trim() }),
      });
      if (res.ok) {
        setNoteText("");
        fetchNotes(notesStudent.id);
      }
    } finally { setNoteSubmitting(false); }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
  }, [reports, searchQuery, riskFilter, sortBy]);

  const selectedReport = useMemo(() => {
    return reports.find((r) => r.id === selectedReportId) ?? null;
  }, [reports, selectedReportId]);

  const stats = {
    total: students.length,
    assigned: students.filter(s => s.referral_assessment_type).length,
    completed: students.filter(s => s.assessment_status === "completed").length,
    inProgress: students.filter(s => s.assessment_status === "in_progress").length,
  };

  return (
    <div className="min-h-screen w-full bg-background flex font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-8 pb-4 bg-background border-b-4 border-black flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-black uppercase italic tracking-tighter">
              {t("td_my")} <span className="text-primary">{t("td_class")}</span>
            </h1>
            <p className="text-xs font-black text-black/40 mt-1 uppercase tracking-widest">
              {t("td_teacher_portal")} · {user?.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {isPolling
                ? <RefreshCw size={9} className="animate-spin text-primary" />
                : <span className="w-2 h-2 rounded-full bg-[#43B047] inline-block" />}
              <span className="text-[9px] font-black uppercase tracking-widest text-black/30">
                {isPolling ? t("td_refreshing") : lastUpdated
                  ? `${t("td_updated")} ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : t("td_live_status")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ y: -2 }}
              onClick={() => { setShowAdd(true); setAddError(""); }}
              className="flex items-center gap-2 px-4 py-3 bg-primary text-white border-2 border-black font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <Plus size={16} /> {t("td_add_student")}
            </motion.button>
          </div>
        </div>

        <div className="flex-1 px-6 sm:px-8 py-6 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: t("td_total_students"), value: stats.total, color: "#5C94FC" },
              { label: t("td_assigned"), value: stats.assigned, color: "#FBD000" },
              { label: t("td_stat_in_progress"), value: stats.inProgress, color: "#FF9800" },
              { label: t("td_completed"), value: stats.completed, color: "#43B047" },
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

          {/* Dashboard Tabs */}
          <div className="flex flex-wrap gap-0 mb-6 border-4 border-black w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <button
              onClick={() => {
                setActiveTab("students");
                setSelectedReportId(null);
              }}
              className={`px-6 py-3 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === "students" ? "bg-primary text-white" : "bg-white text-black hover:bg-muted"}`}
            >
              <Users size={14} /> My Class Students ({students.length})
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`px-6 py-3 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === "reports" ? "bg-primary text-white" : "bg-white text-black hover:bg-muted"}`}
            >
              <FileText size={14} /> Student Reports & Assessment History ({reports.length})
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-[#E52521]/10 border-4 border-[#E52521] text-[#E52521] font-black text-xs uppercase">
              {error}
            </div>
          )}

          {/* STUDENTS TAB */}
          {activeTab === "students" && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <RefreshCw size={32} className="animate-spin text-primary" />
                </div>
              ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-4 border-dashed border-black/20 text-center p-6">
                  <Users size={48} className="text-black/20 mb-4" />
                  <p className="text-2xl font-black uppercase italic text-black/30 mb-2">{t("td_empty_title")}</p>
                  <p className="text-xs font-black uppercase text-black/30 max-w-sm mb-6">{t("td_empty_desc")}</p>
                  <button
                    onClick={() => { setShowAdd(true); setAddError(""); }}
                    className="px-6 py-3 bg-primary text-white border-2 border-black font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
                  >
                    + {t("td_add_first_student")}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {students.map((student, i) => {
                    const st = STATUS_STYLES[student.assessment_status] ?? STATUS_STYLES.not_started;
                    const conditions = parseConditions(student.detected_disabilities);

                    return (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden hover:-translate-y-1 transition-transform"
                      >
                        {/* Top accent */}
                        <div className="h-2 w-full bg-primary" />
                        <div className="p-5 flex flex-col gap-4 flex-1">
                          {/* Student header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 bg-primary border-2 border-black flex items-center justify-center text-white font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {student.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-black text-black uppercase tracking-tight text-base">{student.name}</p>
                                <p className="text-[10px] font-bold text-black/50 truncate max-w-[140px]">{student.email}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 border-2 text-[9px] font-black uppercase tracking-wide ${st.cls}`}>
                              {statusLabel(student.assessment_status)}
                            </span>
                          </div>

                          {student.phone && (
                            <p className="text-[11px] font-bold text-black/50 uppercase">📞 {student.phone}</p>
                          )}

                          {/* Condition from report */}
                          {student.assessment_status === "completed" ? (
                            <div className="space-y-2">
                              <p className="text-[9px] font-black uppercase tracking-widest text-black/40">{t("td_condition_from_report")}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                {conditions.length > 0 ? (
                                  conditions.map((c, idx) => (
                                    <span key={idx} className={`${c.color} text-white px-3 py-1 border-2 border-black text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                      {c.icon} {c.label}
                                    </span>
                                  ))
                                ) : (
                                  <span className="bg-[#43B047] text-white px-3 py-1 border-2 border-black text-[10px] font-black uppercase tracking-widest">{t("td_no_condition_detected")}</span>
                                )}
                                {student.report_url && (
                                  <a
                                    href={student.report_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-2 py-1 bg-black text-white border-2 border-black text-[9px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-800 transition-all"
                                  >
                                    📄 {t("td_report")}
                                  </a>
                                )}
                              </div>
                            </div>
                          ) : student.referral_assessment_type ? (
                            <p className="text-[10px] font-black uppercase text-black/40 italic">{t("td_assessment_assigned_awaiting")}</p>
                          ) : (
                            <p className="text-[10px] font-black uppercase text-black/30 italic">{t("td_no_assessment_assigned")}</p>
                          )}

                          {/* Parent info */}
                          {student.parent_name && (
                            <div className="bg-muted border-2 border-black p-2">
                              <p className="text-[9px] font-black uppercase tracking-widest text-black/40">{t("td_parent_linked")}</p>
                              <p className="text-[11px] font-bold text-black">{student.parent_name}</p>
                            </div>
                          )}

                          {/* Referral status */}
                          {student.latest_referral_code && (
                            <div className="text-[9px] font-black uppercase tracking-widest text-black/40">
                              {t("td_referral")} <span className="text-primary">{statusLabel(student.referral_status || "")}</span>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t-2 border-black/10">
                            <button
                              onClick={() => { setAssigningStudent(student); setAssignResult(null); }}
                              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white border-2 border-black text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                            >
                              <Link2 size={11} /> {t("td_assign")}
                            </button>
                            <button
                              onClick={() => { setNotesStudent(student); fetchNotes(student.id); setNoteText(""); }}
                              className="flex items-center gap-1.5 px-3 py-2 bg-[#FBD000] text-black border-2 border-black text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                            >
                              <FileText size={11} /> {t("td_notes")}
                            </button>
                            <button
                              onClick={() => handleDelete(student.id, student.name)}
                              disabled={deletingId === student.id}
                              className="flex items-center gap-1.5 px-3 py-2 bg-[#E52521] text-white border-2 border-black text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                            >
                              {deletingId === student.id ? <RefreshCw size={11} className="animate-spin" /> : <Trash2 size={11} />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* REPORTS TAB */}
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
                      <ArrowLeft size={16} /> Back to Class List
                    </button>
                    <span className="text-xs font-black uppercase text-black/50 tracking-widest hidden sm:inline">
                      Dedicated Student Assessment View
                    </span>
                  </div>

                  {/* Student Profile Header Card */}
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

                  {/* Key Flags for Assessment */}
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
                /* STUDENT GRID VIEW WITH SEARCH, FILTER & SORT */
                <div className="space-y-6">
                  {/* Search, Filter & Sort Controls */}
                  <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-4 justify-between items-center">
                    {/* Search input */}
                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40" size={16} />
                      <input
                        type="text"
                        placeholder="Search student name..."
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
                          <option value="pending">Pending Screening</option>
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
                          <option value="name">Student Name (A-Z)</option>
                          <option value="risk">Highest Risk First</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Student Cards Grid */}
                  {loadingReports ? (
                    <div className="flex items-center justify-center py-20"><RefreshCw className="animate-spin text-primary" size={32} /></div>
                  ) : filteredReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border-4 border-dashed border-black/20 text-center p-6">
                      <FileText size={48} className="text-black/20 mb-4" />
                      <p className="text-xl font-black uppercase italic text-black/30">No Student Reports Found</p>
                      <p className="text-xs font-black uppercase text-black/30 mt-1 max-w-md">
                        {searchQuery || riskFilter !== "all"
                          ? "Try clearing your search query or changing the risk filter."
                          : "Reports for completed student assessments in your class will appear here automatically."}
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

      {/* ── ADD STUDENT MODAL ── */}
      <AnimatePresence>
        {showAdd && (
          <>
            <Overlay onClose={() => setShowAdd(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="w-full max-w-xl bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-primary p-6 border-b-4 border-black flex items-center justify-between">
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">{t("td_add_student")}</h2>
                  <button onClick={() => setShowAdd(false)} className="text-white hover:scale-110 transition-transform"><X size={20} /></button>
                </div>
                <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                  {[
                    { label: t("td_full_name_label"), key: "name", type: "text", placeholder: t("td_ph_student_name") },
                    { label: t("td_email_label"), key: "email", type: "email", placeholder: "student@example.com" },
                    { label: t("td_phone_label"), key: "phone", type: "tel", placeholder: "+91 98765 43210" },
                  ].map(f => (
                    <div key={f.key} className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-black">{f.label}</label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        value={(addForm as any)[f.key]}
                        onChange={e => setAddForm({ ...addForm, [f.key]: e.target.value })}
                        className={`w-full px-4 py-3.5 border-4 border-black bg-muted focus:bg-white focus:outline-none text-base font-black tracking-tight transition-all ${f.key === "name" ? "uppercase" : "lowercase"}`}
                      />
                    </div>
                  ))}
                  {addError && (
                    <p className="text-[11px] font-black text-[#E52521] uppercase">{addError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="w-full py-4 bg-primary text-white border-4 border-black font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2"
                  >
                    {addLoading ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                    {addLoading ? t("td_adding") : t("td_add_student")}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── ASSIGN ASSESSMENT MODAL ── */}
      <AnimatePresence>
        {assigningStudent && (
          <>
            <Overlay onClose={() => { setAssigningStudent(null); setAssignResult(null); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="w-full max-w-lg bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-[#FBD000] p-6 border-b-4 border-black flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-black uppercase tracking-tight">{t("td_assign_assessment")}</h2>
                    <p className="text-[11px] font-black text-black/60 uppercase mt-1">{t("td_for")} {assigningStudent.name}</p>
                  </div>
                  <button onClick={() => { setAssigningStudent(null); setAssignResult(null); }}><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  {!assignResult ? (
                    <>
                      <div className="bg-muted border-4 border-black p-4">
                        <p className="text-sm font-bold text-black/70 leading-relaxed">
                          {t("td_assign_desc_pre")} <span className="font-black text-black">{assigningStudent.name}</span> {t("td_assign_desc_post")}
                        </p>
                      </div>
                      <button
                        onClick={handleAssign}
                        disabled={assignLoading}
                        className="w-full py-4 bg-primary text-white border-4 border-black font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {assignLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                        {assignLoading ? t("td_generating_link") : t("td_assign_send_invite")}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className={`flex items-center gap-3 p-4 border-4 border-black ${assignResult.emailSent ? "bg-[#43B047]" : "bg-[#FBD000]"}`}>
                        {assignResult.emailSent
                          ? <><Check size={20} className="text-white" /><p className="font-black text-white uppercase text-sm">{t("td_email_sent_to")} {assigningStudent.email}!</p></>
                          : <><AlertCircle size={20} /><p className="font-black uppercase text-sm">{assignResult.emailWarning}</p></>
                        }
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-2">{t("td_referral_link")}</p>
                        <div className="flex gap-2">
                          <input
                            readOnly
                            value={assignResult.referralLink}
                            className="flex-1 px-3 py-3 border-4 border-black bg-muted text-xs font-black text-black/70 truncate"
                          />
                          <button
                            onClick={() => copyLink(assignResult!.referralLink)}
                            className="px-4 py-3 bg-black text-white border-4 border-black flex items-center gap-1 font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:bg-gray-800 transition-all"
                          >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => { setAssigningStudent(null); setAssignResult(null); }}
                        className="w-full py-3 bg-primary text-white border-4 border-black font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                      >
                        {t("td_done")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── NOTES PANEL ── */}
      <AnimatePresence>
        {notesStudent && (
          <>
            <Overlay onClose={() => setNotesStudent(null)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l-4 border-black shadow-[-8px_0px_0px_0px_rgba(0,0,0,1)] z-50 flex flex-col"
            >
              <div className="p-6 border-b-4 border-black bg-[#FBD000] flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">{t("td_notes")}</h3>
                  <p className="text-[11px] font-black uppercase opacity-70">{notesStudent.name}</p>
                </div>
                <button onClick={() => setNotesStudent(null)}><X size={20} /></button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-3">
                {notesLoading ? (
                  <div className="flex justify-center py-12"><RefreshCw size={24} className="animate-spin text-primary" /></div>
                ) : notes.length === 0 ? (
                  <p className="text-xs font-black uppercase text-black/30 italic text-center py-12">{t("td_no_notes")}</p>
                ) : (
                  notes.map((n) => (
                    <div key={n.id} className="p-4 bg-muted border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-xs text-black uppercase">{n.author_name}</span>
                        <span className="text-[9px] font-black uppercase opacity-50">{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs font-bold text-black/80">{n.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t-4 border-black bg-white flex gap-2 flex-shrink-0">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePostNote()}
                  placeholder={t("td_write_note")}
                  className="flex-1 px-4 py-3 border-2 border-black bg-muted focus:bg-white text-xs font-black uppercase focus:outline-none"
                />
                <button
                  onClick={handlePostNote}
                  disabled={noteSubmitting || !noteText.trim()}
                  className="px-4 py-3 bg-primary text-white border-2 border-black font-black text-xs uppercase flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40"
                >
                  <Send size={12} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
