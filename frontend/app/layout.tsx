import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
      className={cn("h-full antialiased", "font-sans", geist.variable)}
    >
      <body className="enterprise-theme h-full bg-background text-foreground">
        <Providers>
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar />
              <div className="flex min-h-svh w-full flex-col">
                {children}
              </div>
            </SidebarProvider>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
