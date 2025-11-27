"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { SmartStatsCard } from "@/components/dashboard/SmartStatsCard";
import { ActionGrid } from "@/components/dashboard/ActionGrid";
import { SafetyPulse } from "@/components/dashboard/SafetyPulse";
import { WeatherCard } from "@/components/dashboard/WeatherCard";
import { FileText, CheckCircle, Clock, AlertTriangle, Sparkles } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";

// Beautiful shimmer loading skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto animate-fade-in">
      {/* Hero skeleton */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 p-8 md:p-10">
        <div className="absolute inset-0 bg-shimmer bg-[length:200%_100%] animate-shimmer" />
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="h-6 w-48 rounded-full bg-slate-200/80" />
            <div className="h-12 w-80 rounded-lg bg-slate-200/80" />
            <div className="h-6 w-96 rounded-lg bg-slate-200/60" />
          </div>
          <div className="flex gap-4">
            <div className="h-24 w-36 rounded-2xl bg-slate-200/80" />
            <div className="h-24 w-36 rounded-2xl bg-slate-200/80" />
            <div className="h-24 w-36 rounded-2xl bg-slate-200/80" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className="relative overflow-hidden rounded-2xl bg-white/80 p-6 border border-slate-100"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="absolute inset-0 bg-shimmer bg-[length:200%_100%] animate-shimmer" />
            <div className="flex justify-between items-start mb-4">
              <div className="h-11 w-11 rounded-xl bg-slate-200/80" />
              <div className="h-6 w-16 rounded-full bg-slate-200/60" />
            </div>
            <div className="h-4 w-24 rounded bg-slate-200/60 mb-2" />
            <div className="h-10 w-16 rounded bg-slate-200/80 mb-4" />
            <div className="h-16 w-full rounded bg-slate-200/40" />
          </div>
        ))}
      </div>

      {/* Actions and Activity skeleton */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 w-32 rounded bg-slate-200/80" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i} 
                className="relative overflow-hidden rounded-2xl bg-white/80 p-6 border border-slate-100"
              >
                <div className="absolute inset-0 bg-shimmer bg-[length:200%_100%] animate-shimmer" />
                <div className="h-12 w-12 rounded-xl bg-slate-200/80 mb-5" />
                <div className="h-5 w-28 rounded bg-slate-200/80 mb-2" />
                <div className="h-4 w-full rounded bg-slate-200/60 mb-1" />
                <div className="h-4 w-3/4 rounded bg-slate-200/60 mb-6" />
                <div className="h-4 w-24 rounded bg-slate-200/80" />
              </div>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-white/80 p-6 border border-slate-100">
          <div className="absolute inset-0 bg-shimmer bg-[length:200%_100%] animate-shimmer" />
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-slate-200/80" />
            <div>
              <div className="h-5 w-24 rounded bg-slate-200/80 mb-1" />
              <div className="h-3 w-20 rounded bg-slate-200/60" />
            </div>
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4 mb-4">
              <div className="h-10 w-10 rounded-xl bg-slate-200/80" />
              <div className="flex-1">
                <div className="h-4 w-32 rounded bg-slate-200/80 mb-2" />
                <div className="h-3 w-full rounded bg-slate-200/60 mb-1" />
                <div className="h-3 w-20 rounded bg-slate-200/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Section header component
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/50">
        <Sparkles className="w-4 h-4 text-slate-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { stats, loading: statsLoading } = useDashboardStats();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/landing");
    }
  }, [user, authLoading, router]);

  // Show loading skeleton
  if (authLoading || !user || statsLoading || !mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="px-4 py-8 md:px-6 lg:px-8">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Subtle background pattern */}
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(0,0,0) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />
      
      <div className="relative px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-10 pb-12 max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <DashboardHero />
            </div>
          </div>

          {/* Stats Grid */}
          <section>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <SmartStatsCard
                title="Actieve TRA's"
                value={stats?.activeTras || 0}
                trend={stats?.trends.tra || 0}
                trendLabel="vs. vorige week"
                data={stats?.chartData.tra || []}
                color="bg-blue-500"
                icon={<FileText />}
                delay={0}
              />
              <SmartStatsCard
                title="Voltooide LMRA's"
                value={stats?.completedLmras || 0}
                trend={stats?.trends.lmra || 0}
                trendLabel="deze week"
                data={stats?.chartData.lmra || []}
                color="bg-green-500"
                icon={<CheckCircle />}
                delay={100}
              />
              <SmartStatsCard
                title="In Beoordeling"
                value={stats?.inReview || 0}
                trend={stats?.trends.review || 0}
                trendLabel="wachtend op goedkeuring"
                data={stats?.chartData.review || []}
                color="bg-orange-500"
                icon={<Clock />}
                delay={200}
              />
              <SmartStatsCard
                title="Actie Vereist"
                value={stats?.actionRequired || 0}
                trend={stats?.trends.action || 0}
                trendLabel="kritieke items"
                data={stats?.chartData.action || []}
                color="bg-red-500"
                icon={<AlertTriangle />}
                delay={300}
              />
            </div>
          </section>

          {/* Quick Actions & Activity Feed */}
          <section>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <SectionHeader 
                  title="Snelle Acties" 
                  subtitle="Start direct met uw belangrijkste taken"
                />
                <ActionGrid />
              </div>
              <div>
                <SafetyPulse />
                <div className="mt-6">
                  <WeatherCard />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
