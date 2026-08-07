"use client";

import Dashboard from "@/components/Dashboard";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  return (
    <Dashboard
      onStartTest={() => router.push("/assessment")}
    />
  );
}
