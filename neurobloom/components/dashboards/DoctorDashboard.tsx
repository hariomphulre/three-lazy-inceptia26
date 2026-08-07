"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope, ChevronDown, ChevronUp, Check, X,
  FileDown, RefreshCw, MessageSquare, Send, LogOut,
  Clock, Users, ClipboardList, AlertCircle, Activity
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";

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

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-gray-100 text-black",
  in_progress: "bg-[#FBD000] text-black",
  completed: "bg-[#43B047] text-white",
  pending: "bg-[#FBD000] text-black",
  accepted: "bg-[#43B047] text-white",
  rejected: "bg-[#E52521] text-white",
};

const NOTE_ROLE_COLORS: Record<string, string> = {
  teacher: "bg-[#049CD8] text-white",
  parent: "bg-[#43B047] text-white",
  doctor: "bg-[#9C27B0] text-white",
  psychologist: "bg-[#9C27B0] text-white",
};

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"requests" | "cases">("requests");

  const [requests, setRequests] = useState<DoctorRequest[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loadingReq, setLoadingReq] = useState(true);
  const [loadingCases, setLoadingCases] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Expanded case
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [caseNotes, setCaseNotes] = useState<Record<string, Note[]>>({});
  const [noteText, setNoteText] = useState<Record<string, string>>({});
  const [noteLoading, setNoteLoading] = useState<Record<string, boolean>>({});
  const [noteSubmitting, setNoteSubmitting] = useState<Record<string, boolean>>({});

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

  useEffect(() => { fetchRequests(); fetchCases(); }, [fetchRequests, fetchCases]);

  const handleRespond = async (id: string, status: "accepted" | "rejected") => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/doctor-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { fetchRequests(); fetchCases(); }
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

  const pending = requests.filter(r => r.status === "pending");

  return (
    <div className="min-h-screen w-full bg-background flex font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-8 pb-4 bg-background border-b-4 border-black flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-black uppercase italic tracking-tighter">
              Doctor <span className="text-primary">Portal</span>
            </h1>
            <p className="text-xs font-black text-black/40 mt-1 uppercase tracking-widest">
              {user?.name} · Psychologist Dashboard
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-3 bg-white border-2 border-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-red-50 transition-all"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>

        <div className="flex-1 px-6 sm:px-8 py-6 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Pending Requests", value: pending.length, color: "#FBD000" },
              { label: "Active Cases", value: cases.length, color: "#43B047" },
              { label: "Total Requests", value: requests.length, color: "#5C94FC" },
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
          <div className="flex gap-0 mb-6 border-4 border-black w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {[
              { key: "requests", label: "Pending Requests", count: pending.length },
              { key: "cases", label: "Active Cases", count: cases.length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
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
                  <p className="text-xl font-black uppercase italic text-black/20">No Pending Requests</p>
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
                        <p className="text-[10px] font-bold text-black/40 mt-0.5">Parent: {req.parent_name}</p>
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
                        <Check size={13} /> Accept
                      </button>
                      <button
                        onClick={() => handleRespond(req.id, "rejected")}
                        disabled={processingId === req.id}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-[#E52521] text-white border-2 border-black font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                      >
                        <X size={13} /> Reject
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
                  <p className="text-xl font-black uppercase italic text-black/20">No Active Cases</p>
                  <p className="text-xs font-black uppercase text-black/20 mt-2">Accept pending requests to see cases here</p>
                </div>
              ) : (
                cases.map((c, i) => {
                  const isExpanded = expandedCase === c.student_id;
                  const notes = caseNotes[c.student_id] || [];
                  return (
                    <motion.div
                      key={c.student_id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                    >
                      {/* Case header */}
                      <div className="h-1.5 w-full bg-primary" />
                      <div
                        className="p-5 flex flex-wrap gap-4 items-center cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => handleExpand(c.student_id)}
                      >
                        <div className="w-12 h-12 bg-primary border-2 border-black flex items-center justify-center text-white font-black">
                          {c.student_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-black uppercase tracking-tight">{c.student_name}</p>
                          <p className="text-[10px] font-bold text-black/50">{c.student_email}</p>
                        </div>
                        {c.referral_assessment_type && (
                          <span className="px-2 py-1 bg-[#5C94FC] text-white border-2 border-black text-[10px] font-black uppercase">
                            {c.referral_assessment_type}
                          </span>
                        )}
                        {c.assessment_status && (
                          <span className={`px-2 py-1 border-2 border-black text-[10px] font-black uppercase ${STATUS_COLORS[c.assessment_status] || ""}`}>
                            {c.assessment_status.replace("_", " ")}
                          </span>
                        )}
                        {c.report_url && (
                          <a
                            href={c.report_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 px-3 py-2 bg-black text-white text-[10px] font-black uppercase border-2 border-black hover:bg-gray-800 transition-all"
                          >
                            <FileDown size={11} /> Report
                          </a>
                        )}
                        <div className="ml-auto">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t-4 border-black overflow-hidden"
                          >
                            <div className="p-5 space-y-5">
                              {/* Teacher & Parent info */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {c.teacher_name && (
                                  <div className="bg-[#049CD8]/10 border-2 border-[#049CD8] p-3">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#049CD8] mb-1">Teacher</p>
                                    <p className="font-black text-black">{c.teacher_name}</p>
                                    <p className="text-[11px] text-black/50">{c.teacher_email}</p>
                                  </div>
                                )}
                                {c.parent_name && (
                                  <div className="bg-[#43B047]/10 border-2 border-[#43B047] p-3">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#43B047] mb-1">Parent / Guardian</p>
                                    <p className="font-black text-black">{c.parent_name}</p>
                                    <p className="text-[11px] text-black/50">{c.parent_email}</p>
                                  </div>
                                )}
                              </div>

                              {/* Notes */}
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-3">All Notes</p>
                                {noteLoading[c.student_id] ? (
                                  <div className="flex items-center justify-center py-8"><RefreshCw size={20} className="animate-spin text-primary" /></div>
                                ) : notes.length === 0 ? (
                                  <p className="text-sm font-black text-black/30 uppercase italic py-4 text-center">No notes yet</p>
                                ) : (
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {notes.map(note => (
                                      <div key={note.id} className="border-2 border-black p-3 bg-white">
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <span className={`${NOTE_ROLE_COLORS[note.author_role] || "bg-gray-400 text-white"} px-2 py-0.5 text-[9px] font-black uppercase border border-black`}>
                                            {note.author_role}
                                          </span>
                                          <span className="text-[10px] font-bold text-black/50">{note.author_name}</span>
                                          <span className="ml-auto text-[9px] text-black/30">
                                            {new Date(note.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                          </span>
                                        </div>
                                        <p className="text-sm text-black/80">{note.content}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Add consultation note */}
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-2">Add Consultation Note</p>
                                <textarea
                                  value={noteText[c.student_id] || ""}
                                  onChange={e => setNoteText(prev => ({ ...prev, [c.student_id]: e.target.value }))}
                                  placeholder="Write consultation findings, recommendations, or observations…"
                                  rows={3}
                                  className="w-full px-4 py-3 border-4 border-black bg-muted focus:bg-white focus:outline-none text-sm resize-none"
                                />
                                <button
                                  onClick={() => handlePostNote(c.student_id)}
                                  disabled={!noteText[c.student_id]?.trim() || noteSubmitting[c.student_id]}
                                  className="mt-2 flex items-center gap-2 px-5 py-3 bg-[#9C27B0] text-white border-4 border-black font-black uppercase tracking-widest text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-40"
                                >
                                  {noteSubmitting[c.student_id] ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                                  Post Consultation Note
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
