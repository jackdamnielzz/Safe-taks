"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Shield, ClipboardList, Zap, TrendingUp, Sparkles } from "lucide-react";

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  duration?: number;
}

function AnimatedNumber({ value, suffix = "", duration = 1000 }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [value, duration]);

  return (
    <span className="tabular-nums">
      {displayValue}{suffix}
    </span>
  );
}

interface HeroStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  trend?: number;
  color: string;
  delay?: number;
}

function HeroStatCard({ icon, label, value, suffix = "", trend, color, delay = 0 }: HeroStatCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`
        group relative overflow-hidden rounded-2xl p-5
        bg-white/70 backdrop-blur-glass
        border border-white/50
        shadow-glass hover:shadow-glass-lg
        transition-all duration-500 ease-out
        hover:-translate-y-1 hover:bg-white/80
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Gradient accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color} opacity-80`} />
      
      {/* Icon with glow effect */}
      <div className={`
        inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3
        bg-gradient-to-br ${color} shadow-lg
        group-hover:shadow-glow transition-shadow duration-300
        [&>svg]:w-5 [&>svg]:h-5 [&>svg]:text-white
      `}>
        {icon}
      </div>

      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      
      <div className="flex items-end gap-2">
        <div className="text-3xl font-bold text-slate-900 tracking-tight">
          <AnimatedNumber value={value} suffix={suffix} />
        </div>
        {trend !== undefined && (
          <div className={`
            flex items-center gap-0.5 text-xs font-medium mb-1
            ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}
          `}>
            <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardHero() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Goedemorgen");
      else if (hour < 18) setGreeting("Goedemiddag");
      else setGreeting("Goedenavond");
    };

    updateGreeting();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      updateGreeting();
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const firstName = user?.displayName?.split(" ")[0] || "Gebruiker";

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Floating gradient orbs for depth */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-pink-400/10 rounded-full blur-3xl animate-float" />
      
      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-8 md:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          {/* Left side - Greeting */}
          <div className={`space-y-4 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
            {/* Date badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-white/50 shadow-soft">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-sm font-medium text-slate-600">
                {format(currentTime, "EEEE d MMMM yyyy", { locale: nl })}
              </span>
            </div>

            {/* Main greeting */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                {greeting},{" "}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {firstName}
                </span>
              </h1>
              <p className="mt-3 text-lg text-slate-600 max-w-xl leading-relaxed">
                Welkom terug bij <span className="font-semibold text-slate-700">SafeWork Pro</span>. 
                Hier is een overzicht van uw veiligheidsprestaties en openstaande taken.
              </p>
            </div>
          </div>

          {/* Right side - Quick stats */}
          <div className="grid grid-cols-3 gap-4 lg:gap-5">
            <HeroStatCard
              icon={<Shield />}
              label="Veiligheidsscore"
              value={98}
              suffix="%"
              trend={2}
              color="from-emerald-500 to-teal-500"
              delay={100}
            />
            <HeroStatCard
              icon={<ClipboardList />}
              label="Open Taken"
              value={3}
              color="from-blue-500 to-indigo-500"
              delay={200}
            />
            <HeroStatCard
              icon={<Zap />}
              label="Deze Week"
              value={12}
              trend={15}
              color="from-amber-500 to-orange-500"
              delay={300}
            />
          </div>
        </div>
      </div>
    </div>
  );
}