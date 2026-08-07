"use client";

import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { pendingCount } from "@/lib/offline/db";
import { syncAll } from "@/lib/offline/sync";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Drives background sync of offline-collected data and shows a small status pill:
 *  - offline  → "Offline · N saved"
 *  - online with a backlog → "Syncing N…"
 *  - online and drained → nothing
 *
 * Sync runs on mount, whenever the browser goes back online, on a slow retry
 * timer while a backlog exists, and after each save (via the sync-change event).
 */
export function OfflineSync() {
  const { t } = useTranslation();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    // Reads state after an await (not synchronously in the effect body).
    const refresh = async () => {
      try {
        const count = await pendingCount();
        setOnline(navigator.onLine);
        setPending(count);
      } catch {
        /* IndexedDB unavailable — ignore */
      }
    };

    const onOnline = () => {
      setOnline(true);
      syncAll().finally(refresh);
    };
    const onOffline = () => setOnline(false);
    const onChange = () => refresh();

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("neurobloom:sync-change", onChange);

    // Initial sync + count.
    syncAll().finally(refresh);

    // Slow retry loop: only does work if something is still queued and we're online.
    const timer = setInterval(() => {
      if (navigator.onLine) syncAll().finally(refresh);
      else refresh();
    }, 30000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("neurobloom:sync-change", onChange);
      clearInterval(timer);
    };
  }, []);

  // Nothing to show when online and fully synced.
  if (online && pending === 0) return null;

  return (
    <div
      className="fixed left-3 bottom-3 z-[9998] flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
      style={{ background: online ? "#049CD8" : "#334155" }}
    >
      {online ? (
        <>
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          {t("sync_syncing")} {pending}…
        </>
      ) : (
        <>
          <CloudOff className="h-3.5 w-3.5" />
          {t("sync_offline")}{pending > 0 ? ` · ${pending} ${t("sync_saved")}` : ""}
        </>
      )}
    </div>
  );
}
