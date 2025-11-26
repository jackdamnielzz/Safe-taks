"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, FileText, Clock, Activity, ChevronRight, User } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "tra_approved" | "lmra_completed" | "tra_created" | "incident_reported";
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

// Mock data - will be replaced with real data later
const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "tra_approved",
    title: "TRA Goedgekeurd",
    description: "TRA-001 'Dakwerkzaamheden' is goedgekeurd door Supervisor",
    timestamp: "2 uur geleden",
    user: "Jan Jansen",
  },
  {
    id: "2",
    type: "lmra_completed",
    title: "LMRA Voltooid",
    description: "LMRA uitgevoerd voor Project Alpha - Locatie B",
    timestamp: "4 uur geleden",
    user: "Piet Pietersen",
  },
  {
    id: "3",
    type: "tra_created",
    title: "Nieuwe TRA",
    description: "Nieuwe TRA 'Elektra installatie' aangemaakt",
    timestamp: "6 uur geleden",
    user: "Klaas Klaassen",
  },
  {
    id: "4",
    type: "lmra_completed",
    title: "LMRA Voltooid",
    description: "Veiligheidscheck voor hijswerkzaamheden afgerond",
    timestamp: "8 uur geleden",
    user: "Marie de Vries",
  },
];

const activityConfig = {
  tra_approved: {
    icon: CheckCircle,
    gradient: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-50",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-200",
  },
  lmra_completed: {
    icon: CheckCircle,
    gradient: "from-blue-500 to-indigo-500",
    bgLight: "bg-blue-50",
    textColor: "text-blue-600",
    borderColor: "border-blue-200",
  },
  tra_created: {
    icon: FileText,
    gradient: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50",
    textColor: "text-amber-600",
    borderColor: "border-amber-200",
  },
  incident_reported: {
    icon: AlertTriangle,
    gradient: "from-rose-500 to-red-500",
    bgLight: "bg-rose-50",
    textColor: "text-rose-600",
    borderColor: "border-rose-200",
  },
};

interface ActivityItemCardProps {
  activity: ActivityItem;
  index: number;
  isLast: boolean;
}

function ActivityItemCard({ activity, index, isLast }: ActivityItemCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const config = activityConfig[activity.type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div 
      className={`
        relative flex gap-4 pb-6
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
        transition-all duration-500 ease-out
      `}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Timeline connector */}
      <div className="relative flex flex-col items-center">
        {/* Icon circle */}
        <div className={`
          relative z-10 flex items-center justify-center w-10 h-10 rounded-xl
          bg-gradient-to-br ${config.gradient}
          shadow-lg
          [&>svg]:w-5 [&>svg]:h-5 [&>svg]:text-white
        `}>
          <Icon />
        </div>
        
        {/* Connecting line */}
        {!isLast && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-slate-200 to-transparent" />
        )}
      </div>

      {/* Content card */}
      <div className={`
        flex-1 group p-4 rounded-xl
        bg-white/60 backdrop-blur-sm
        border border-white/60 hover:border-white/80
        shadow-soft hover:shadow-glass
        transition-all duration-300
        hover:-translate-y-0.5
      `}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-slate-800">
            {activity.title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap">
            <Clock className="w-3 h-3" />
            {activity.timestamp}
          </div>
        </div>
        
        <p className="text-sm text-slate-600 mb-3 line-clamp-2 leading-relaxed">
          {activity.description}
        </p>
        
        <div className="flex items-center gap-2">
          <div className={`
            flex items-center justify-center w-6 h-6 rounded-full
            bg-gradient-to-br ${config.gradient}
            text-[10px] font-bold text-white
          `}>
            {activity.user.charAt(0)}
          </div>
          <span className="text-xs font-medium text-slate-500">
            {activity.user}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SafetyPulse() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={`
      rounded-2xl p-6
      bg-white/80 backdrop-blur-glass
      border border-slate-200/80
      shadow-soft
      transition-all duration-500
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Activiteit</h2>
            <p className="text-xs text-slate-500">Recente updates</p>
          </div>
        </div>
        
        <button className="
          group flex items-center gap-1 px-3 py-1.5 rounded-lg
          text-sm font-medium text-blue-600
          bg-blue-50 hover:bg-blue-100
          transition-all duration-300
        ">
          Alles
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Activity timeline */}
      <div className="space-y-0">
        {mockActivities.map((activity, index) => (
          <ActivityItemCard
            key={activity.id}
            activity={activity}
            index={index}
            isLast={index === mockActivities.length - 1}
          />
        ))}
      </div>

      {/* Live indicator */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live updates ingeschakeld
        </div>
      </div>
    </div>
  );
}