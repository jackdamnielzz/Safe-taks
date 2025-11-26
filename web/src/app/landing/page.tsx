import React from "react";
import { Metadata } from "next";
import { Navigation } from "./components/Navigation";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { OfflineCapability } from "./components/OfflineCapability";
import { Pricing } from "./components/Pricing";
import { Testimonials } from "./components/Testimonials";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";

export const metadata: Metadata = {
  title: "SafeWork Pro - TRA & LMRA Software voor Veilig Werken",
  description:
    "Digitaliseer uw veiligheidsprocessen met SafeWork Pro. Complete oplossing voor TRA en LMRA. VCA-compliant, mobiel en offline beschikbaar.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Navigation />
      <main>
        <Hero />
        <Features />
        <OfflineCapability />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
