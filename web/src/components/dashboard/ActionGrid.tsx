"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, CheckCircle, BarChart2, ArrowRight, Plus, Sparkles } from "lucide-react";

interface ActionCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  hoverGradient: string;
  delay?: number;
}

function ActionCard({ href, icon, title, description, gradient, hoverGradient, delay = 0 }: ActionCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // derive a suitable foreground class and a subtle RGBA border color from the provided gradient token
  const colorClass = gradient.includes("amber") || gradient.includes("orange")
    ? "text-amber-500"
    : gradient.includes("emerald") || gradient.includes("teal")
    ? "text-emerald-500"
    : gradient.includes("blue") || gradient.includes("indigo")
    ? "text-blue-500"
    : "text-slate-900";

  const subtleBorderColor =
    gradient.includes("amber") || gradient.includes("orange")
      ? "rgba(249,115,22,0.25)"   // orange-500 with alpha 0.25 (more visible)
      : gradient.includes("emerald") || gradient.includes("teal")
      ? "rgba(16,185,129,0.25)"   // emerald-500
      : gradient.includes("blue") || gradient.includes("indigo")
      ? "rgba(59,130,246,0.25)"   // blue-500
      : "rgba(15,23,42,0.25)";    // slate-900

  return (
    <Link
      href={href}
      className={`
        group relative overflow-hidden rounded-2xl p-6
        bg-white/80 backdrop-blur-glass
        shadow-soft hover:shadow-float
        transition-all duration-500 ease-out
        hover:-translate-y-2
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{ transitionDelay: `${delay}ms`, border: `1px solid ${subtleBorderColor || 'rgba(0,0,0,0.04)'}` }}
    >
      {/* Animated gradient border on hover */}
      <div className={`
        absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
        transition-opacity duration-500
        bg-gradient-to-r ${hoverGradient} p-[1px]
      `}>
        <div className="absolute inset-[1px] rounded-2xl bg-white/95" />
      </div>

      {/* Subtle background gradient on hover */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 
        transition-opacity duration-500
        bg-gradient-to-br ${gradient}/5 to-transparent
      `} />

      {/* Floating particles effect on hover */}
      <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-8 right-8 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-6 right-6 w-1 h-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Icon with gradient background */}
        <div className={`
          mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl
          bg-gradient-to-br ${gradient}
          shadow-lg group-hover:shadow-glow
          transition-all duration-300
          group-hover:scale-110
          [&>svg]:w-6 [&>svg]:h-6 [&>svg]:text-white
        `}>
          {icon}
        </div>
        
        {/* Title with subtle animation */}
        <h3 className="mb-2 text-lg font-semibold text-slate-900 group-hover:text-slate-800 transition-colors">
          {title}
        </h3>
        
        {/* Description */}
        <p className="mb-6 text-sm text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors flex-grow">
          {description}
        </p>
        
        {/* CTA with arrow animation */}
        <div className={`
          inline-flex items-center gap-2 text-sm font-semibold
          bg-gradient-to-r ${gradient} bg-clip-text text-transparent
          group-hover:gap-3 transition-all duration-300
        `}>
          <span>Aan de slag</span>
          <ArrowRight className={`
            w-4 h-4 transition-transform duration-300
            group-hover:translate-x-1
            ${gradient.includes('orange') ? 'text-orange-500' :
              gradient.includes('green') || gradient.includes('emerald') ? 'text-emerald-500' :
              'text-blue-500'}
          `} />
        </div>
      </div>
    </Link>
  );
}

export function ActionGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <ActionCard
        href="/tras/create"
        icon={<FileText />}
        title="TRA Aanmaken"
        description="Start een nieuwe Taak Risicoanalyse. Identificeer gevaren en bepaal effectieve maatregelen."
        gradient="from-amber-500 to-orange-500"
        hoverGradient="from-amber-400 via-orange-400 to-rose-400"
        delay={100}
      />

      <ActionCard
        href="/lmra/execute"
        icon={<CheckCircle />}
        title="LMRA Uitvoeren"
        description="Voer een Last Minute Risicoanalyse uit op de werkplek voordat u begint met werken."
        gradient="from-emerald-500 to-teal-500"
        hoverGradient="from-emerald-400 via-teal-400 to-cyan-400"
        delay={200}
      />

      <ActionCard
        href="/reports"
        icon={<BarChart2 />}
        title="Rapporten Bekijken"
        description="Bekijk veiligheidsprestaties, trends en compliance status van al uw projecten."
        gradient="from-blue-500 to-indigo-500"
        hoverGradient="from-blue-400 via-indigo-400 to-purple-400"
        delay={300}
      />
    </div>
  );
}