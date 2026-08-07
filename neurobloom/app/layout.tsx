import type { Metadata, Viewport } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import { VideoProvider } from "@/context/VideoContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { CameraPreview } from "@/components/CameraPreview";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OfflineSync } from "@/components/OfflineSync";

const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = DM_Sans({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = Space_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  applicationName: "NeuroBloom",
  title: "NeuroBloom",
  description:
    "Gamified early learning-disability screening and intervention support for children.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NeuroBloom",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#5C94FC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}
      >
        <LanguageProvider>
          {/*GLOBAL VIDEO RECORDER CONTEXT */}
          <VideoProvider>
            {children}
            <CameraPreview />
          </VideoProvider>
        </LanguageProvider>
        <ServiceWorkerRegister />
        <InstallPrompt />
        <OfflineSync />
      </body>
    </html>
  );
}
