"use client";

import { useTranslation } from "@/hooks/useTranslation";

export default function OfflineContent() {
  const { t } = useTranslation();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
        background: "#5C94FC",
        color: "#ffffff",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: "4rem" }}>🧠</div>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0 }}>
        {t("off_youre_offline")}
      </h1>
      <p style={{ maxWidth: "24rem", opacity: 0.9, lineHeight: 1.5 }}>
        {t("off_not_loaded_message")}
      </p>
      <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
        {t("off_reconnect_message")}
      </p>
    </div>
  );
}
