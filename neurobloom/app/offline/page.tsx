// Shown by the service worker when a page is opened with no connection and no
// cached copy. Kept static so it can be precached at install time.
import OfflineContent from "./OfflineContent";

export const dynamic = "force-static";

export const metadata = {
  title: "Offline — NeuroBloom",
};

export default function OfflinePage() {
  return <OfflineContent />;
}
