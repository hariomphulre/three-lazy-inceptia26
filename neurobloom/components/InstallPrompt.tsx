"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

// Minimal shape of the (non-standard) beforeinstallprompt event.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "neurobloom_install_dismissed";

/**
 * Small, unobtrusive install banner.
 * - Android / desktop Chromium: captures `beforeinstallprompt` and shows an
 *   "Install app" button that triggers the native prompt.
 * - iOS Safari: shows a short "Add to Home Screen" hint (iOS has no API for this).
 * - Hides itself when already installed (standalone) or after install/dismiss.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed → never show.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari exposes navigator.standalone
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    if (standalone) return;

    // Respect a previous dismissal.
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const ios =
      /iPad|iPhone|iPod/.test(window.navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    // iOS can't fire beforeinstallprompt, so show the hint immediately.
    if (ios) {
      setVisible(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore storage errors (private mode etc.)
    }
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] flex justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto flex max-w-md w-full items-center gap-3 rounded-2xl border-2 border-white/40 bg-[#5C94FC] px-4 py-3 text-white shadow-xl">
        <div className="flex-1 text-sm leading-snug">
          {isIOS ? (
            <span>
              Install NeuroBloom: tap{" "}
              <Share className="inline h-4 w-4 align-text-bottom" /> Share, then{" "}
              <span className="font-semibold">“Add to Home Screen”</span>.
            </span>
          ) : (
            <span className="font-semibold">Install NeuroBloom on your device</span>
          )}
        </div>

        {!isIOS && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-[#5C94FC] transition hover:bg-white/90"
          >
            <Download className="h-4 w-4" />
            Install
          </button>
        )}

        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
