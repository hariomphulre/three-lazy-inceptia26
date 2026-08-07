import axios from "axios";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const token = (await cookies()).get("token");
  if (!token) {
    redirect("/login");
  }
  return <div className="auth-layout">{children}</div>;
}