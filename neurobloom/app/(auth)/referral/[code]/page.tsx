"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, CheckCircle, Check, AlertTriangle, Clock, ArrowRight, RefreshCw } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface ReferralData {
  valid: boolean;
  code: string;
  studentName: string;
  teacherName: string;
  teacherEmail: string;
  assessmentType: string;
  status: string;
  expiresAt: string;
  alreadyRegistered: boolean;
}

export default function ReferralLandingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;
    fetch(`/api/referral/${code}`)
      .then(async res => {
        const json = await res.json();
        if (!res.ok) setError(json.error || "Invalid referral link");
        else setData(json);
      })
      .catch(() => setError("Failed to validate referral link"))
      .finally(() => setLoading(false));
  }, [code]);

  const handleSignup = () => {
    router.push(`/signup?ref=${code}`);
  };

  const handleLogin = () => {
    router.push(`/login?ref=${code}`);
  };

  const assessmentLabel = data?.assessmentType
    ? data.assessmentType.charAt(0).toUpperCase() + data.assessmentType.slice(1)
    : "";

  return (
    <div className="min-h-screen bg-[#5C94FC] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background */}
      <div className="absolute top-20 left-10 w-32 h-10 bg-white rounded-full opacity-60 blur-sm" />
      <div className="absolute top-40 right-20 w-40 h-12 bg-white rounded-full opacity-40 blur-md" />
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-[#43B047] border-t-8 border-black" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Brain className="text-primary" size={28} />
          </div>
          <span className="text-2xl font-black text-white uppercase tracking-tight">NeuroBloom</span>
        </div>

        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          {/* Top bar */}
          <div className="h-3 w-full bg-primary" />

          <div className="p-8">
            {loading ? (
              <div className="flex flex-col items-center py-12">
                <RefreshCw className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-black/40">{t("ref_validating_invite")}</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center py-8 text-center">
                <AlertTriangle size={48} className="text-[#E52521] mb-4" />
                <h2 className="text-2xl font-black uppercase italic text-black mb-2">{t("ref_invalid_link")}</h2>
                <p className="text-sm font-bold text-black/60 mb-6">{error}</p>
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-3 bg-primary text-white border-4 border-black font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  {t("ref_go_to_homepage")}
                </button>
              </div>
            ) : data ? (
              <>
                {/* Success header */}
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle size={28} className="text-[#43B047] flex-shrink-0" />
                  <div>
                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-black">{t("ref_assessment_invitation")}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/40">{t("ref_verified_referral_link")}</p>
                  </div>
                </div>

                {/* Info cards */}
                <div className="space-y-3 mb-6">
                  <div className="bg-muted border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="space-y-2">
                      <InfoRow label={t("ref_student")} value={data.studentName} />
                      <InfoRow label={t("ref_assigned_by")} value={data.teacherName} />
                      <InfoRow label={t("ref_assessment")} value={assessmentLabel} highlight />
                      <InfoRow
                        label={t("ref_expires")}
                        value={new Date(data.expiresAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "long", year: "numeric"
                        })}
                      />
                    </div>
                  </div>

                  {data.alreadyRegistered && (
                    <div className="flex items-center gap-3 bg-[#43B047] border-4 border-black p-4">
                      <Check size={18} className="text-white flex-shrink-0" />
                      <p className="text-sm font-black uppercase text-white">
                        {data.status === 'completed'
                          ? t("ref_assessment_completed")
                          : t("ref_already_registered")}
                      </p>
                    </div>
                  )}
                </div>

                {/* What happens next — only for new users */}
                {!data.alreadyRegistered && (
                  <div className="mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/50 mb-3">{t("ref_what_happens_next")}</p>
                    <div className="space-y-2">
                      {[
                        t("ref_step_create_account"),
                        t("ref_step_code_applied"),
                        t("ref_step_linked_teacher"),
                        t("ref_step_start_assessment"),
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-primary text-white border-2 border-black flex items-center justify-center font-black text-xs flex-shrink-0">
                            {i + 1}
                          </div>
                          <p className="text-sm font-bold text-black">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTAs */}
                <div className="flex flex-col gap-3">
                  {data.alreadyRegistered ? (
                    // Already registered — go straight to login
                    <button
                      onClick={handleLogin}
                      className="w-full py-5 bg-primary text-white border-4 border-black font-black text-lg uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-3"
                    >
                      {t("ref_login_continue")} <ArrowRight size={20} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSignup}
                      className="w-full py-5 bg-primary text-white border-4 border-black font-black text-lg uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-3"
                    >
                      {t("ref_create_account_start")} <ArrowRight size={20} />
                    </button>
                  )}
                  <button
                    onClick={handleLogin}
                    className="w-full py-4 bg-white text-black border-4 border-black font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all text-sm"
                  >
                    {t("ref_have_account_signin")}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <p className="text-center text-white text-[10px] font-black uppercase tracking-widest mt-6 drop-shadow-sm">
          © 2026 NeuroBloom · {t("ref_footer_tagline")}
        </p>
      </motion.div>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black uppercase tracking-widest text-black/50">{label}</span>
      <span className={`text-sm font-black uppercase tracking-tight ${highlight ? "text-primary" : "text-black"}`}>
        {value}
      </span>
    </div>
  );
}
