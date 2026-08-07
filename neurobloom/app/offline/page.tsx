// Shown by the service worker when a page is opened with no connection and no
// cached copy. Kept static so it can be precached at install time.
export const dynamic = "force-static";

export const metadata = {
  title: "Offline — NeuroBloom",
};

export default function OfflinePage() {
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
        You&apos;re offline
      </h1>
      <p style={{ maxWidth: "24rem", opacity: 0.9, lineHeight: 1.5 }}>
        This part of NeuroBloom hasn&apos;t been loaded yet. Any assessment you
        already started is saved on this device and will sync automatically when
        you&apos;re back online.
      </p>
      <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
        Reconnect to the internet and try again.
      </p>
    </div>
  );
}
