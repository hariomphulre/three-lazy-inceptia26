"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import TeacherDashboard from "./dashboards/TeacherDashboard";
import DoctorDashboard from "./dashboards/DoctorDashboard";
import ParentDashboard from "./dashboards/ParentDashboard";

// Original dashboard for legacy roles (educator/researcher/parent without student)
import LegacyDashboard from "./LegacyDashboard";

interface DashboardProps {
  onStartTest: () => void;
}

export default function Dashboard({ onStartTest }: DashboardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background font-sans">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm font-black uppercase tracking-widest text-black/40">{t("dash2_loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const role = user.role;

  if (role === "teacher") return <TeacherDashboard />;
  if (role === "doctor" || role === "psychologist") return <DoctorDashboard />;
  if (role === "parent") return <ParentDashboard onStartTest={onStartTest} />;

  // educator / researcher → legacy dashboard
  return <LegacyDashboard onStartTest={onStartTest} />;
}