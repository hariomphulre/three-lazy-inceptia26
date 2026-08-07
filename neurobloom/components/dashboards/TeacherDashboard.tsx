"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, X, Copy, Check, Trash2, FileText,
  Send, RefreshCw, LogOut, ChevronDown, ChevronUp,
  BookOpen, Brain, Zap, Ear, MessageSquare, PenTool,
  Calculator, ClipboardList, Link2, AlertCircle
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  referral_assessment_type?: string;
  assessment_status: "not_started" | "in_progress" | "completed";
  assessment_id?: string;
  report_url?: string;
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

const ASSESSMENT_TYPES = [
  { value: "dyslexia", label: "Dyslexia", icon: "📖", color: "bg-[#7C6FF7]" },
  { value: "dyscalculia", label: "Dyscalculia", icon: "🔢", color: "bg-[#2E7D32]" },
  { value: "dysgraphia", label: "Dysgraphia", icon: "✏️", color: "bg-[#7C6FF7]" },
  { value: "adhd", label: "ADHD", icon: "⚡", color: "bg-[#F44336]" },
  { value: "asd", label: "Autism (ASD)", icon: "🧩", color: "bg-[#FF9800]" },
  { value: "speech", label: "Speech", icon: "🗣️", color: "bg-[#9C27B0]" },
  { value: "hearing", label: "Hearing", icon: "👂", color: "bg-[#00BCD4]" },
];

const STATUS_STYLES = {
  not_started: { label: "Not Started", cls: "bg-gray-100 text-black border-black" },
  in_progress: { label: "In Progress", cls: "bg-[#FBD000] text-black border-black" },
  completed: { label: "Completed", cls: "bg-[#43B047] text-white border-black" },
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
  const { user, logout } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add student modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", phone: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // Assign modal
  const [assigningStudent, setAssigningStudent] = useState<Student | null>(null);
  const [assignType, setAssignType] = useState("");
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
      if (!res.ok) throw new Error("Failed to load students");
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

  // Initial load + 30-second polling for live status updates
  useEffect(() => {
    fetchStudents();
    const interval = setInterval(() => fetchStudents(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchStudents]);


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
      setAddError("Name and email are required");
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
      if (!res.ok) { setAddError(data.error || "Failed to add student"); return; }
      setAddForm({ name: "", email: "", phone: "" });
      setShowAdd(false);
      fetchStudents();
    } catch { setAddError("Something went wrong"); }
    finally { setAddLoading(false); }
  };

  const handleAssign = async () => {
    if (!assigningStudent || !assignType) return;
    setAssignLoading(true);
    setAssignResult(null);
    try {
      const res = await fetch(`/api/teacher/students/${assigningStudent.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentType: assignType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign");
      setAssignResult({ referralLink: data.referralLink, emailSent: data.emailSent, emailWarning: data.emailWarning });
      fetchStudents();
    } catch (e: any) {
      alert(e.message);
    } finally { setAssignLoading(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from your class? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/teacher/students/${id}`, { method: "DELETE" });
      fetchStudents();
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
              My <span className="text-primary">Class</span>
            </h1>
            <p className="text-xs font-black text-black/40 mt-1 uppercase tracking-widest">
              Teacher Portal · {user?.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {isPolling
                ? <RefreshCw size={9} className="animate-spin text-primary" />
                : <span className="w-2 h-2 rounded-full bg-[#43B047] inline-block" />}
              <span className="text-[9px] font-black uppercase tracking-widest text-black/30">
                {isPolling ? "Refreshing…" : lastUpdated
                  ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "Live Status"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ y: -2 }}
              onClick={() => { setShowAdd(true); setAddError(""); }}
              className="flex items-center gap-2 px-4 py-3 bg-primary text-white border-2 border-black font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <Plus size={16} /> Add Student
            </motion.button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-3 bg-white border-2 border-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-red-50 transition-all"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 sm:px-8 py-6 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Students", value: stats.total, color: "#5C94FC" },
              { label: "Assigned", value: stats.assigned, color: "#FBD000" },
              { label: "In Progress", value: stats.inProgress, color: "#FF9800" },
              { label: "Completed", value: stats.completed, color: "#43B047" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5"
              >
                <div className="text-4xl font-black text-black">{s.value}</div>
                <div className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: s.color }}>
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border-4 border-[#E52521] p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(229,37,33,1)]">
              <AlertCircle size={18} className="text-[#E52521]" />
              <p className="text-sm font-black text-[#E52521] uppercase">{error}</p>
              <button onClick={() => fetchStudents()} className="ml-auto"><RefreshCw size={16} className="text-[#E52521]" /></button>
            </div>
          )}

          {/* Student List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <RefreshCw className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-sm font-black uppercase tracking-widest text-black/40">Loading students…</p>
            </div>
          ) : students.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 border-4 border-dashed border-black/20"
            >
              <Users size={48} className="text-black/20 mb-4" />
              <p className="text-2xl font-black uppercase italic text-black/20">No Students Yet</p>
              <p className="text-xs font-black uppercase tracking-widest text-black/20 mt-2">Click "Add Student" to get started</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {students.map((student, i) => {
                const st = STATUS_STYLES[student.assessment_status];
                const atype = ASSESSMENT_TYPES.find(a => a.value === student.referral_assessment_type);
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
                          {st.label}
                        </span>
                      </div>

                      {student.phone && (
                        <p className="text-[11px] font-bold text-black/50 uppercase">📞 {student.phone}</p>
                      )}

                      {/* Assessment badge + report link when completed */}
                      {atype ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`${atype.color} text-white px-3 py-1 border-2 border-black text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                            {atype.icon} {atype.label}
                          </span>
                          {student.assessment_status === "completed" && student.report_url && (
                            <a
                              href={student.report_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 bg-black text-white border-2 border-black text-[9px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-800 transition-all"
                            >
                              📄 Report
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] font-black uppercase text-black/30 italic">No assessment assigned</p>
                      )}

                      {/* Parent info */}
                      {student.parent_name && (
                        <div className="bg-muted border-2 border-black p-2">
                          <p className="text-[9px] font-black uppercase tracking-widest text-black/40">Parent Linked</p>
                          <p className="text-[11px] font-bold text-black">{student.parent_name}</p>
                        </div>
                      )}

                      {/* Referral status */}
                      {student.latest_referral_code && (
                        <div className="text-[9px] font-black uppercase tracking-widest text-black/40">
                          Referral: <span className="text-primary">{student.referral_status}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t-2 border-black/10">
                        <button
                          onClick={() => { setAssigningStudent(student); setAssignType(student.referral_assessment_type || ""); setAssignResult(null); }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white border-2 border-black text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                        >
                          <Link2 size={11} /> Assign
                        </button>
                        <button
                          onClick={() => { setNotesStudent(student); fetchNotes(student.id); setNoteText(""); }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#FBD000] text-black border-2 border-black text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                        >
                          <FileText size={11} /> Notes
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
              <div className="w-full max-w-md bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <div className="bg-primary p-6 border-b-4 border-black flex items-center justify-between">
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Add Student</h2>
                  <button onClick={() => setShowAdd(false)} className="text-white hover:scale-110 transition-transform"><X size={20} /></button>
                </div>
                <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                  {[
                    { label: "Full Name *", key: "name", type: "text", placeholder: "Student full name" },
                    { label: "Email *", key: "email", type: "email", placeholder: "student@example.com" },
                    { label: "Phone", key: "phone", type: "tel", placeholder: "+91 98765 43210" },
                  ].map(f => (
                    <div key={f.key} className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-black">{f.label}</label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        value={(addForm as any)[f.key]}
                        onChange={e => setAddForm({ ...addForm, [f.key]: e.target.value })}
                        className="w-full px-4 py-3 border-4 border-black bg-muted focus:bg-white focus:outline-none text-sm font-black uppercase tracking-tight transition-all"
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
                    {addLoading ? "Adding…" : "Add Student"}
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
                    <h2 className="text-xl font-black text-black uppercase tracking-tight">Assign Assessment</h2>
                    <p className="text-[11px] font-black text-black/60 uppercase mt-1">For: {assigningStudent.name}</p>
                  </div>
                  <button onClick={() => { setAssigningStudent(null); setAssignResult(null); }}><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  {!assignResult ? (
                    <>
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/60">Select Assessment Type</p>
                      <div className="grid grid-cols-2 gap-3">
                        {ASSESSMENT_TYPES.map(a => (
                          <button
                            key={a.value}
                            onClick={() => setAssignType(a.value)}
                            className={`p-3 border-4 border-black text-left transition-all ${assignType === a.value ? "shadow-none translate-x-1 translate-y-1" : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"} ${assignType === a.value ? a.color + " text-white" : "bg-muted text-black"}`}
                          >
                            <span className="text-lg">{a.icon}</span>
                            <p className="text-[11px] font-black uppercase mt-1">{a.label}</p>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleAssign}
                        disabled={!assignType || assignLoading}
                        className="w-full py-4 bg-primary text-white border-4 border-black font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {assignLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                        {assignLoading ? "Generating Link…" : "Assign & Send Invite"}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className={`flex items-center gap-3 p-4 border-4 border-black ${assignResult.emailSent ? "bg-[#43B047]" : "bg-[#FBD000]"}`}>
                        {assignResult.emailSent
                          ? <><Check size={20} className="text-white" /><p className="font-black text-white uppercase text-sm">Email sent to {assigningStudent.email}!</p></>
                          : <><AlertCircle size={20} /><p className="font-black uppercase text-sm">{assignResult.emailWarning}</p></>
                        }
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-2">Referral Link</p>
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
                        Done
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
                  <h3 className="text-xl font-black uppercase tracking-tight">Notes</h3>
                  <p className="text-[11px] font-black uppercase opacity-70">{notesStudent.name}</p>
                </div>
                <button onClick={() => setNotesStudent(null)}><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {notesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="animate-spin text-primary" size={24} />
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare size={36} className="text-black/20 mx-auto mb-3" />
                    <p className="text-sm font-black uppercase text-black/30">No notes yet</p>
                  </div>
                ) : (
                  notes.map(note => {
                    const roleColor = note.author_role === "teacher" ? "bg-[#049CD8]" : note.author_role === "parent" ? "bg-[#43B047]" : "bg-[#9C27B0]";
                    return (
                      <div key={note.id} className="border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`${roleColor} text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border border-black`}>
                            {note.author_role}
                          </span>
                          <span className="text-[10px] font-bold text-black/50 uppercase">{note.author_name}</span>
                          <span className="ml-auto text-[9px] text-black/30 font-bold">
                            {new Date(note.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                        <p className="text-sm text-black/80 leading-relaxed">{note.content}</p>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-4 border-t-4 border-black flex-shrink-0">
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Add an observation or note about this student…"
                  rows={3}
                  className="w-full px-4 py-3 border-4 border-black bg-muted focus:bg-white focus:outline-none text-sm resize-none"
                />
                <button
                  onClick={handlePostNote}
                  disabled={!noteText.trim() || noteSubmitting}
                  className="w-full mt-2 py-3 bg-primary text-white border-4 border-black font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {noteSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  Post Note
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
