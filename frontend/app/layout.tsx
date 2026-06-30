import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Sidebar, { MobileTopBarSpacer } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "AI Automation Platform — Enterprise Intake & Prioritization",
  description: "AI-driven multi-stage intake and ROI prioritization platform for enterprise automation ideas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="h-full bg-[#0a0a12] text-[#e0e0e0]">
        <Providers>
          {/*
            Sidebar returns null on /login & /register so those pages stay
            full-screen. MobileTopBarSpacer pushes content below the fixed
            mobile top bar only when authenticated.
          */}
          <div className="flex h-full min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
              <MobileTopBarSpacer />
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
