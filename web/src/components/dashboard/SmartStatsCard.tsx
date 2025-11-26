"use client";

import React, { useEffect, useState, useRef } from "react";
import { LineChart, Line, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SmartStatsCardProps {
  title: string;
  value: string | number;
  trend: number;
  trendLabel: string;
  data: { value: number }[];
  color: string;
  icon: React.ReactNode;
  delay?: number;
}

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = null;
    
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      
      // Smooth easing
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(Math.floor(easeOutExpo * value));

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

  return <span className="tabular-nums">{displayValue}</span>;
}

// Color mapping for gradients
const colorGradients: Record<string, { from: string; to: string; stroke: string; fill: string }> = {
  "bg-blue-500": { 
    from: "from-blue-500", 
    to: "to-indigo-500", 
    stroke: "#3b82f6",
    fill: "url(#blueGradient)"
  },
  "bg-green-500": { 
    from: "from-emerald-500", 
    to: "to-teal-500", 
    stroke: "#10b981",
    fill: "url(#greenGradient)"
  },
  "bg-orange-500": { 
    from: "from-amber-500", 
    to: "to-orange-500", 
    stroke: "#f59e0b",
    fill: "url(#orangeGradient)"
  },
  "bg-red-500": { 
    from: "from-rose-500", 
    to: "to-red-500", 
    stroke: "#ef4444",
    fill: "url(#redGradient)"
  },
};

export function SmartStatsCard({
  title,
  value,
  trend,
  trendLabel,
  data,
  color,
  icon,
  delay = 0,
}: SmartStatsCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isPositive = trend >= 0;
  const gradient = colorGradients[color] || colorGradients["bg-blue-500"];
  const numericValue = typeof value === "string" ? parseInt(value, 10) : value;

  // Subtle colored border derived from the main color, similar to ActionCard
  const subtleBorderColor =
    color === "bg-blue-500"
      ? "rgba(59,130,246,0.25)" // blue-500
      : color === "bg-green-500"
      ? "rgba(16,185,129,0.25)" // emerald-500
      : color === "bg-orange-500"
      ? "rgba(249,115,22,0.25)" // orange-500
      : color === "bg-red-500"
      ? "rgba(239,68,68,0.25)" // red-500
      : "rgba(148,163,184,0.25)"; // slate-400 fallback

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl p-6
        bg-white/80 backdrop-blur-glass
        border
        shadow-soft hover:shadow-float
        transition-all duration-500 ease-out
        hover:-translate-y-1
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{ transitionDelay: `${delay}ms`, border: `1px solid ${subtleBorderColor}` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient accent line at top */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient.from} ${gradient.to} opacity-90`} />
      
      {/* Subtle background glow on hover */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
        bg-gradient-to-br ${gradient.from}/5 ${gradient.to}/5
      `} />

      {/* Header with icon and trend */}
      <div className="relative flex justify-between items-start mb-4">
        <div className={`
          inline-flex items-center justify-center w-11 h-11 rounded-xl
          bg-gradient-to-br ${gradient.from} ${gradient.to}
          shadow-lg group-hover:shadow-glow
          transition-all duration-300
          group-hover:scale-105
          [&>svg]:w-5 [&>svg]:h-5 [&>svg]:text-white
        `}>
          {icon}
        </div>
        
        <div className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold
          transition-all duration-300
          ${isPositive 
            ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100" 
            : "bg-rose-50 text-rose-600 group-hover:bg-rose-100"
          }
        `}>
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          <span>{Math.abs(trend)}%</span>
        </div>
      </div>
      
      {/* Title */}
      <div className="relative mb-1 text-slate-500 text-sm font-medium tracking-wide">
        {title}
      </div>
      
      {/* Value with animation */}
      <div className="relative text-4xl font-bold text-slate-900 mb-5 tracking-tight">
        {isVisible ? <AnimatedCounter value={numericValue} /> : 0}
      </div>
      
      {/* Sparkline chart */}
      <div className="relative h-16 w-full -mx-2 mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={gradient.stroke}
              strokeWidth={2.5}
              fill={gradient.fill}
              dot={false}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Trend label */}
      <div className="relative text-xs text-slate-400 font-medium">
        {trendLabel}
      </div>
    </div>
  );
}