import "./globals.css";
import React from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import type { Metadata } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import { Header } from "../components/Header";

// Temporarily disabled - react-joyride incompatible with React 19
// import { TourProvider } from '../components/onboarding/ProductTour';

export const metadata: Metadata = {
  title: "SafeWork Pro - TRA & LMRA Management",
  description:
    "Complete oplossing voor Taak Risicoanalyses (TRA) en Last Minute Risicoanalyses (LMRA)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900">
        <AuthProvider>
          {/* Temporarily disabled TourProvider - react-joyride incompatible with React 19 */}
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}


/* --- Modern Footer --- */
function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              © {new Date().getFullYear()} SafeWork Pro
            </span>
            <span className="mx-2">•</span>
            <span>Built for field safety (TRA & LMRA)</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <a href="/privacy" className="hover:text-indigo-600 transition-colors">
              Privacy
            </a>
            <span>•</span>
            <a href="/terms" className="hover:text-indigo-600 transition-colors">
              Terms
            </a>
            <span>•</span>
            <a href="/support" className="hover:text-indigo-600 transition-colors">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
