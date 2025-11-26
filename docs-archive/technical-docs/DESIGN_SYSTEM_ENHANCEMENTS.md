# SafeWork Pro - Design System Enhancements
## Professional, Beautiful & User-Friendly UX Improvements

**Version**: 2.0 Enhancement Plan  
**Created**: September 29, 2025  
**Status**: Architectural Specification  
**Purpose**: Elevate SafeWork Pro to world-class B2B SaaS design standards

---

## Table of Contents

1. [Enhancement Philosophy](#enhancement-philosophy)
2. [Visual Hierarchy Improvements](#visual-hierarchy-improvements)
3. [Advanced Component Interactions](#advanced-component-interactions)
4. [Data Visualization System](#data-visualization-system)
5. [Enhanced Mobile UX Patterns](#enhanced-mobile-ux-patterns)
6. [Micro-Animations & Motion Design](#micro-animations--motion-design)
7. [Professional Form Patterns](#professional-form-patterns)
8. [Loading & Feedback Patterns](#loading--feedback-patterns)
9. [Progressive Disclosure Patterns](#progressive-disclosure-patterns)
10. [Empty States & Onboarding](#empty-states--onboarding)
11. [Implementation Roadmap](#implementation-roadmap)

---

## 1. Enhancement Philosophy

### Design Principles

**1. Safety First, Beauty Second**
- Every design decision must support safety communication
- Visual hierarchy guides users to critical information
- Color coding must be unmistakable (colorblind-safe)
- No decoration that distracts from safety data

**2. Professional Trust**
- Enterprise-grade polish and consistency
- Sophisticated without being flashy
- Data-dense interfaces that remain clean
- Premium feel appropriate for B2B pricing

**3. Field-Tested Usability**
- Mobile-first for field workers in harsh conditions
- Touch targets optimized for gloves
- High contrast for outdoor visibility
- Offline-first with clear status indicators

**4. Delightful Efficiency**
- Micro-interactions that provide feedback
- Smooth transitions that guide attention
- Smart defaults that reduce cognitive load
- Progressive disclosure prevents overwhelm

### Enhancement Goals

✅ **Clarity**: Information hierarchy immediately obvious  
✅ **Confidence**: Visual feedback confirms every action  
✅ **Efficiency**: Reduced clicks through smart patterns  
✅ **Beauty**: Aesthetically pleasing without sacrificing function  
✅ **Trust**: Professional appearance builds credibility  

---

## 2. Visual Hierarchy Improvements

### 2.1 Enhanced Typography Scale

**Problem**: Current type scale is functional but lacks visual impact for heroes and critical data.

**Solution**: Add display typography for impact moments.

```css
/* Display Typography - For Heroes and Large Data */
--text-display-1: 4.5rem;    /* 72px - Hero headlines */
--text-display-2: 3.75rem;   /* 60px - Section heroes */
--text-display-3: 3rem;      /* 48px - Large numbers/scores */

/* Data Display Typography */
--text-data-lg: 3rem;        /* 48px - Risk scores, KPIs */
--text-data-md: 2.25rem;     /* 36px - Secondary metrics */
--text-data-sm: 1.5rem;      /* 24px - Inline stats */

/* Usage Example: Risk Score Display */
.risk-score-display {
  font-size: var(--text-data-lg);
  font-weight: var(--font-bold);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
```

**Impact**: Risk scores and critical data become focal points, KPIs are impressive.

### 2.2 Information Density Controls

**Problem**: Complex safety data can feel overwhelming.

**Solution**: Three-tier density system user can control.

```css
/* Density Modes */
.layout-compact {
  --spacing-multiplier: 0.75;  /* 75% spacing */
  --font-size-multiplier: 0.9; /* 90% font size */
  --line-height: 1.4;
}

.layout-comfortable {  /* DEFAULT */
  --spacing-multiplier: 1.0;
  --font-size-multiplier: 1.0;
  --line-height: 1.5;
}

.layout-spacious {
  --spacing-multiplier: 1.25;  /* 125% spacing */
  --font-size-multiplier: 1.1; /* 110% font size */
  --line-height: 1.6;
}
```

**UI Control**: Settings toggle for user preference  
**Persistence**: Saved in user profile  
**Impact**: Power users can see more data, accessibility users can increase spacing

### 2.3 Visual Anchors & Focal Points

**Solution**: Use visual weight to guide eye movement.

```css
/* Focal Point System */
.focal-primary {
  /* Strongest attention: Risk scores, stop-work alerts */
  font-weight: var(--font-bold);
  font-size: 1.5em;
  color: var(--neutral-900);
  background: linear-gradient(135deg, var(--primary-50) 0%, transparent 100%);
  padding: var(--space-4);
  border-left: 4px solid var(--primary-500);
}

.focal-secondary {
  /* Secondary attention: Section headings, key actions */
  font-weight: var(--font-semibold);
  font-size: 1.125em;
  color: var(--neutral-800);
  border-bottom: 2px solid var(--neutral-200);
  padding-bottom: var(--space-2);
}

.focal-subtle {
  /* Subtle emphasis: metadata, timestamps */
  font-size: 0.875em;
  color: var(--neutral-600);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## 3. Advanced Component Interactions

### 3.1 Elevated Card System

**Enhancement**: Cards with hover states, shadows, and interactive depth.

```css
/* Enhanced Card System */
.card-elevated {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--neutral-200);
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-200) var(--ease-out);
  position: relative;
  overflow: hidden;
}

/* Hover State - Lifted Effect */
.card-elevated:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-200);
}

/* Interactive Card - Clickable */
.card-interactive {
  cursor: pointer;
}

.card-interactive::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-500), var(--secondary-500));
  opacity: 0;
  transition: opacity var(--duration-200) var(--ease-out);
}

.card-interactive:hover::before {
  opacity: 1;
}

/* Active State - Pressed Effect */
.card-interactive:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

/* Status Card - With Colored Border */
.card-status-high-risk {
  border-left: 6px solid var(--danger-500);
}

.card-status-moderate-risk {
  border-left: 6px solid var(--warning-500);
}

.card-status-low-risk {
  border-left: 6px solid var(--success-500);
}
```

**Usage**: TRA cards, LMRA summary cards, project cards

### 3.2 Smart Button States

**Enhancement**: Buttons with loading, success, and error states.

```css
/* Enhanced Button with States */
.btn-smart {
  position: relative;
  overflow: hidden;
  transition: all var(--duration-150) var(--ease-out);
}

/* Loading State */
.btn-smart.is-loading {
  color: transparent;
  pointer-events: none;
}

.btn-smart.is-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Success State - Checkmark */
.btn-smart.is-success {
  background: var(--success-500) !important;
  border-color: var(--success-500) !important;
}

.btn-smart.is-success::before {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  animation: successPop 0.3s var(--ease-out) forwards;
}

@keyframes successPop {
  0% { transform: translate(-50%, -50%) scale(0); }
  50% { transform: translate(-50%, -50%) scale(1.2); }
  100% { transform: translate(-50%, -50%) scale(1); }
}

/* Error State - Shake */
.btn-smart.is-error {
  animation: shake 0.4s var(--ease-out);
  background: var(--danger-500) !important;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
```

**Impact**: Users get instant feedback, reducing uncertainty

### 3.3 Floating Action Buttons (FAB)

**Enhancement**: Mobile-optimized primary actions.

```css
/* Floating Action Button - Mobile Primary Action */
.fab {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary-500);
  color: white;
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all var(--duration-200) var(--ease-out);
  z-index: 100;
}

.fab:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-xl);
}

.fab:active {
  transform: scale(0.95);
}

/* FAB with Label */
.fab-extended {
  width: auto;
  padding: 0 var(--space-6);
  border-radius: 28px;
  font-weight: var(--font-semibold);
  gap: var(--space-2);
}

/* FAB Speed Dial - Multiple Actions */
.fab-speed-dial {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  display: flex;
  flex-direction: column-reverse;
  gap: var(--space-3);
}

.fab-speed-dial-item {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
  transition: all var(--duration-200) var(--ease-out);
}

.fab-speed-dial.is-open .fab-speed-dial-item {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.fab-speed-dial.is-open .fab-speed-dial-item:nth-child(1) { transition-delay: 0ms; }
.fab-speed-dial.is-open .fab-speed-dial-item:nth-child(2) { transition-delay: 50ms; }
.fab-speed-dial.is-open .fab-speed-dial-item:nth-child(3) { transition-delay: 100ms; }
```

**Usage**: "Start LMRA", "Create TRA", primary mobile actions

---

## 4. Data Visualization System

### 4.1 Risk Score Visualization

**Problem**: Risk scores (0-1000) need immediate visual impact.

**Solution**: Multi-layer risk visualization system.

```css
/* Risk Gauge - Circular Progress */
.risk-gauge {
  position: relative;
  width: 200px;
  height: 200px;
}

.risk-gauge-circle {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.risk-gauge-background {
  fill: none;
  stroke: var(--neutral-200);
  stroke-width: 12;
}

.risk-gauge-progress {
  fill: none;
  stroke-width: 12;
  stroke-linecap: round;
  transition: stroke-dashoffset var(--duration-1000) var(--ease-out);
}

/* Risk Level Colors */
.risk-gauge-progress.risk-trivial { stroke: var(--risk-trivial); }
.risk-gauge-progress.risk-acceptable { stroke: var(--risk-acceptable); }
.risk-gauge-progress.risk-moderate { stroke: var(--risk-moderate); }
.risk-gauge-progress.risk-substantial { stroke: var(--risk-substantial); }
.risk-gauge-progress.risk-intolerable { stroke: var(--risk-intolerable); }

.risk-gauge-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.risk-gauge-score {
  font-size: var(--text-data-lg);
  font-weight: var(--font-bold);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.risk-gauge-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: var(--space-2);
}
```

**React Component Structure**:
```jsx
<RiskGauge 
  score={250} 
  maxScore={1000}
  size="large"
  animated={true}
  showLabel={true}
/>
```

### 4.2 Risk Heat Map

**Solution**: Visual matrix of tasks vs risk levels.

```css
/* Risk Heat Map */
.risk-heat-map {
  display: grid;
  grid-template-columns: auto repeat(auto-fit, minmax(80px, 1fr));
  gap: 2px;
  background: var(--neutral-200);
  padding: 2px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.heat-map-cell {
  background: white;
  padding: var(--space-3);
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: all var(--duration-150) var(--ease-out);
  cursor: pointer;
}

.heat-map-cell:hover {
  transform: scale(1.05);
  z-index: 10;
  box-shadow: var(--shadow-md);
}

/* Risk Level Backgrounds with Opacity Scale */
.heat-map-cell[data-risk="trivial"] {
  background: rgba(34, 197, 94, 0.1);
  color: rgb(22, 101, 52);
}

.heat-map-cell[data-risk="acceptable"] {
  background: rgba(132, 204, 22, 0.15);
  color: rgb(77, 124, 15);
}

.heat-map-cell[data-risk="moderate"] {
  background: rgba(245, 158, 11, 0.2);
  color: rgb(146, 64, 14);
}

.heat-map-cell[data-risk="substantial"] {
  background: rgba(249, 115, 22, 0.3);
  color: rgb(154, 52, 18);
}

.heat-map-cell[data-risk="intolerable"] {
  background: rgba(239, 68, 68, 0.4);
  color: rgb(153, 27, 27);
  font-weight: var(--font-bold);
}
```

**Usage**: Project dashboard showing all TRAs and their risk levels

### 4.3 Trend Sparklines

**Solution**: Inline micro-charts for trend visualization.

```css
/* Sparkline Container */
.sparkline {
  display: inline-flex;
  align-items: flex-end;
  height: 32px;
  gap: 2px;
}

.sparkline-bar {
  width: 4px;
  background: var(--neutral-400);
  border-radius: 2px 2px 0 0;
  transition: all var(--duration-200) var(--ease-out);
}

.sparkline-bar:hover {
  background: var(--primary-500);
  transform: scaleY(1.1);
}

/* Trend Indicators */
.trend-indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.trend-up {
  color: var(--danger-600);
}

.trend-up::before {
  content: '↗';
  font-size: 1.2em;
}

.trend-down {
  color: var(--success-600);
}

.trend-down::before {
  content: '↘';
  font-size: 1.2em;
}

.trend-stable {
  color: var(--neutral-600);
}

.trend-stable::before {
  content: '→';
  font-size: 1.2em;
}
```

**Usage**: Risk trend in dashboard, LMRA completion rates

### 4.4 Progress Rings

**Solution**: Circular progress for completion tracking.

```css
/* Progress Ring - For Completion Status */
.progress-ring {
  width: 120px;
  height: 120px;
  position: relative;
}

.progress-ring-circle {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.progress-ring-background {
  fill: none;
  stroke: var(--neutral-200);
  stroke-width: 8;
}

.progress-ring-progress {
  fill: none;
  stroke: var(--primary-500);
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset var(--duration-500) var(--ease-out);
}

.progress-ring-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.progress-ring-percentage {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--neutral-900);
  line-height: 1;
}

.progress-ring-label {
  font-size: var(--text-xs);
  color: var(--neutral-600);
  margin-top: var(--space-1);
}
```

**Usage**: TRA completion, LMRA checklist progress, team competency coverage

---

## 5. Enhanced Mobile UX Patterns

### 5.1 Bottom Sheet Navigation

**Problem**: Mobile navigation needs to be thumb-friendly.

**Solution**: Bottom sheet with swipe gestures.

```css
/* Bottom Sheet - Mobile Primary Navigation */
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(100%);
  transition: transform var(--duration-300) var(--ease-out);
  z-index: 1000;
  max-height: 90vh;
  overflow: hidden;
}

.bottom-sheet.is-open {
  transform: translateY(0);
}

.bottom-sheet-handle {
  width: 40px;
  height: 4px;
  background: var(--neutral-300);
  border-radius: 2px;
  margin: var(--space-3) auto;
  cursor: grab;
}

.bottom-sheet-handle:active {
  cursor: grabbing;
}

.bottom-sheet-content {
  padding: var(--space-4);
  overflow-y: auto;
  max-height: calc(90vh - 48px);
}

/* Pull-to-refresh indicator */
.bottom-sheet-content::before {
  content: '';
  display: block;
  height: 60px;
  margin-top: -60px;
  background: linear-gradient(to bottom, 
    var(--primary-500) 0%, 
    transparent 100%);
  opacity: 0;
  transition: opacity var(--duration-200);
}

.bottom-sheet-content.is-refreshing::before {
  opacity: 0.1;
}
```

**Usage**: Mobile LMRA execution steps, TRA details, filters

### 5.2 Swipeable Cards

**Solution**: Swipe actions for common operations.

```css
/* Swipeable Card - For Lists */
.swipe-card {
  position: relative;
  background: white;
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-3);
  touch-action: pan-y;
  transition: transform var(--duration-200) var(--ease-out);
}

.swipe-card-content {
  position: relative;
  z-index: 2;
  background: white;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
}

.swipe-card-actions {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: var(--space-1);
  padding-right: var(--space-2);
}

.swipe-action {
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: white;
  border-radius: var(--radius-md);
  transition: transform var(--duration-150) var(--ease-out);
}

.swipe-action-complete {
  background: var(--success-500);
}

.swipe-action-edit {
  background: var(--primary-500);
}

.swipe-action-delete {
  background: var(--danger-500);
}

/* Swipe States */
.swipe-card.swiping-right .swipe-card-content {
  transform: translateX(80px);
}

.swipe-card.swiping-left .swipe-card-content {
  transform: translateX(-160px);
}
```

**Usage**: LMRA task lists, TRA lists, notification management

### 5.3 Touch-Optimized Form Controls

**Solution**: Larger, easier-to-tap form elements.

```css
/* Mobile-Optimized Form Controls */
@media (max-width: 768px) {
  /* Larger Touch Targets */
  .input-mobile {
    min-height: 48px;
    font-size: 16px; /* Prevents iOS zoom */
    padding: var(--space-3) var(--space-4);
  }

  /* Larger Checkboxes and Radios */
  .checkbox-mobile,
  .radio-mobile {
    width: 28px;
    height: 28px;
  }

  /* Toggle Switches - Easier to Tap */
  .toggle-mobile {
    width: 56px;
    height: 32px;
  }

  .toggle-mobile-thumb {
    width: 28px;
    height: 28px;
  }

  /* Segmented Control - Better Touch Target */
  .segmented-control-mobile {
    height: 48px;
    gap: var(--space-2);
  }

  .segmented-control-option-mobile {
    min-width: 80px;
    font-size: 16px;
  }
}

/* Glove-Friendly Mode - Extra Large Targets */
.glove-mode .btn,
.glove-mode .input,
.glove-mode .checkbox,
.glove-mode .radio {
  min-height: 56px;
  min-width: 56px;
  padding: var(--space-4) var(--space-6);
}
```

**Usage**: All forms in mobile LMRA execution

---

## 6. Micro-Animations & Motion Design

### 6.1 Attention-Guiding Animations

**Solution**: Subtle animations that guide user attention.

```css
/* Pulse Animation - For Notifications */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.animate-pulse {
  animation: pulse 2s var(--ease-in-out) infinite;
}

/* Bounce Animation - For New Items */
@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(-20px);
  }
  50% {
    opacity: 1;
    transform: scale(1.05) translateY(0);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
  }
}

.animate-bounce-in {
  animation: bounceIn 0.6s var(--ease-out);
}

/* Slide In From Right - For Modals/Drawers */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-slide-in-right {
  animation: slideInRight 0.3s var(--ease-out);
}

/* Fade In Up - For Content Loading */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.4s var(--ease-out);
}

/* Staggered Animation for Lists */
.animate-stagger > * {
  animation: fadeInUp 0.4s var(--ease-out) backwards;
}

.animate-stagger > *:nth-child(1) { animation-delay: 0ms; }
.animate-stagger > *:nth-child(2) { animation-delay: 50ms; }
.animate-stagger > *:nth-child(3) { animation-delay: 100ms; }
.animate-stagger > *:nth-child(4) { animation-delay: 150ms; }
.animate-stagger > *:nth-child(5) { animation-delay: 200ms; }
/* Continue pattern... */
```

### 6.2 Success Celebrations

**Solution**: Delightful micro-celebrations for completions.

```css
/* Confetti Effect - For Major Completions */
@keyframes confetti {
  0% {
    opacity: 1;
    transform: translateY(0) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translateY(100vh) rotate(720deg);
  }
}

.confetti-particle {
  position: fixed;
  width: 10px;
  height: 10px;
  background: var(--primary-500);
  opacity: 0;
  pointer-events: none;
}

.confetti-particle.active {
  animation: confetti 1.5s var(--ease-out) forwards;
}

/* Success Ripple - For Form Submissions */
@keyframes successRipple {
  0% {
    transform: scale(0);
    opacity: 0.6;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

.success-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  margin: -50px 0 0 -50px;
  border-radius: 50%;
  background: var(--success-500);
  pointer-events: none;
}

.success-ripple.active {
  animation: successRipple 0.6s var(--ease-out);
}

/* Checkmark Animation - For Task Completion */
@keyframes drawCheck {
  0% {
    stroke-dashoffset: 100;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

.checkmark-path {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: drawCheck 0.5s var(--ease-out) forwards;
}
```

**Usage**: LMRA completion, TRA approval, training certification

### 6.3 Loading Skeletons

**Solution**: Content-aware loading placeholders.

```css
/* Skeleton Loading - Better than spinners */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--neutral-200) 0%,
    var(--neutral-100) 50%,
    var(--neutral-200) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite linear;
  border-radius: var(--radius-md);
}

/* Skeleton Variants */
.skeleton-text {
  height: 1em;
  width: 100%;
  margin-bottom: 0.5em;
}

.skeleton-text-short {
  width: 60%;
}

.skeleton-title {
  height: 1.5em;
  width: 40%;
  margin-bottom: 1em;
}

.skeleton-circle {
  border-radius: 50%;
  width: 48px;
  height: 48px;
}

.skeleton-card {
  height: 200px;
  border-radius: var(--radius-lg);
}
```

**Usage**: Loading TRA lists, dashboard data, LMRA forms

---

## 7. Professional Form Patterns

### 7.1 Multi-Step Form Progress

**Solution**: Clear progress indication with save states.

```css
/* Multi-Step Progress Indicator */
.form-progress {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-8);
  padding: var(--space-4);
  background: var(--neutral-50);
  border-radius: var(--radius-lg);
}

.form-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.form-step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--neutral-300);
  color: var(--neutral-600);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-semibold);
  transition: all var(--duration-200) var(--ease-out);
  position: relative;
  z-index: 2;
}

.form-step.is-active .form-step-number {
  background: var(--primary-500);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 0 0 4px rgba(255, 139, 0, 0.2);
}

.form-step.is-complete .form-step-number {
  background: var(--success-500);
  color: white;
}

.form-step.is-complete .form-step-number::after {
  content: '✓';
}

.form-step-label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--neutral-600);
  margin-top: var(--space-2);
  text-align: center;
}

.form-step.is-active .form-step-label {
  color: var(--primary-600);
  font-weight: var(--font-semibold);
}

/* Progress Line */
.form-step:not(:last-child)::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 50%;
  right: -50%;
  height: 2px;
  background: var(--neutral-300);
  z-index: 1;
}

.form-step.is-complete:not(:last-child)::before {
  background: var(--success-500);
}
```

**Usage**: TRA creation wizard, LMRA execution flow

### 7.2 Inline Validation with Instant Feedback

**Solution**: Real-time validation with helpful messages.

```css
/* Enhanced Form Field with Validation */
.form-field {
  position: relative;
  margin-bottom: var(--space-6);
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  padding-right: var(--space-12);
  border: 2px solid var(--neutral-300);
  border-radius: var(--radius-md);
  transition: all var(--duration-150) var(--ease-out);
}

/* Validation States */
.form-input.is-validating {
  border-color: var(--primary-400);
  background-image: url("data:image/svg+xml,...spinner...");
  background-repeat: no-repeat;
  background-position: right var(--space-3) center;
}

.form-input.is-valid {
  border-color: var(--success-500);
  background-image: url("data:image/svg+xml,...checkmark...");
  background-repeat: no-repeat;
  background-position: right var(--space-3) center;
}

.form-input.is-invalid {
  border-color: var(--danger-500);
  background-image: url("data:image/svg+xml,...x-mark...");
  background-repeat: no-repeat;
  background-position: right var(--space-3) center;
  animation: shake 0.3s var(--ease-out);
}

/* Validation Message */
.form-message {
  font-size: var(--text-sm);
  margin-top: var(--space-2);
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  animation: fadeInUp 0.2s var(--ease-out);
}

.form-message-success {
  color: var(--success-700);
}

.form-message-error {
  color: var(--danger-700);
}

.form-message-hint {
  color: var(--neutral-600);
}
```

### 7.3 Smart Autocomplete with Previews

**Solution**: Autocomplete with visual previews.

```css
/* Enhanced Autocomplete Dropdown */
.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: var(--space-1);
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-height: 400px;
  overflow-y: auto;
  z-index: 100;
  animation: fadeInUp 0.2s var(--ease-out);
}

.autocomplete-option {
  padding: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  transition: background var(--duration-100) var(--ease-out);
}

.autocomplete-option:hover,
.autocomplete-option.is-focused {
  background: var(--primary-50);
}

.autocomplete-option-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--neutral-100);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.autocomplete-option-content {
  flex: 1;
  min-width: 0;
}

.autocomplete-option-title {
  font-weight: var(--font-medium);
  color: var(--neutral-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.autocomplete-option-description {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Highlight Matched Text */
.autocomplete-match {
  background: var(--primary-100);
  color: var(--primary-700);
  font-weight: var(--font-semibold);
  padding: 0 2px;
  border-radius: 2px;
}
```

**Usage**: Hazard search, team member selection, project selection

---

## 8. Loading & Feedback Patterns

### 8.1 Progressive Loading States

**Solution**: Multi-stage loading with informative messages.

```css
/* Loading State Machine */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12);
  text-align: center;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--neutral-200);
  border-top-color: var(--primary-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-message {
  margin-top: var(--space-4);
  font-size: var(--text-base);
  color: var(--neutral-700);
  font-weight: var(--font-medium);
}

.loading-detail {
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  color: var(--neutral-500);
}

/* Progress Bar for Long Operations */
.loading-progress {
  width: 100%;
  max-width: 400px;
  height: 8px;
  background: var(--neutral-200);
  border-radius: 4px;
  margin-top: var(--space-4);
  overflow: hidden;
}

.loading-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, 
    var(--primary-500) 0%, 
    var(--secondary-500) 100%);
  border-radius: 4px;
  transition: width var(--duration-300) var(--ease-out);
  position: relative;
  overflow: hidden;
}

/* Shimmer Effect on Progress Bar */
.loading-progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%);
  animation: shimmer 1.5s infinite;
}
```

### 8.2 Toast Notifications

**Solution**: Non-intrusive, auto-dismissing notifications.

```css
/* Toast Notification System */
.toast-container {
  position: fixed;
  top: var(--space-6);
  right: var(--space-6);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  pointer-events: none;
}

.toast {
  min-width: 300px;
  max-width: 500px;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: var(--space-4);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  pointer-events: auto;
  animation: slideInRight 0.3s var(--ease-out);
  border-left: 4px solid var(--neutral-500);
}

.toast.is-exiting {
  animation: slideOutRight 0.3s var(--ease-out) forwards;
}

@keyframes slideOutRight {
  to {
    opacity: 0;
    transform: translateX(calc(100% + var(--space-6)));
  }
}

/* Toast Variants */
.toast-success {
  border-left-color: var(--success-500);
}

.toast-error {
  border-left-color: var(--danger-500);
}

.toast-warning {
  border-left-color: var(--warning-500);
}

.toast-info {
  border-left-color: var(--info-500);
}

.toast-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: var(--font-semibold);
  color: var(--neutral-900);
  margin-bottom: var(--space-1);
}

.toast-message {
  font-size: var(--text-sm);
  color: var(--neutral-600);
}

.toast-close {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--neutral-500);
  cursor: pointer;
  transition: all var(--duration-150) var(--ease-out);
  flex-shrink: 0;
}

.toast-close:hover {
  background: var(--neutral-100);
  color: var(--neutral-700);
}

/* Progress Bar for Auto-Dismiss */
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--neutral-300);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  overflow: hidden;
}

.toast-progress-bar {
  height: 100%;
  background: var(--primary-500);
  transition: width 5s linear;
}
```

**Usage**: Save confirmations, error messages, system notifications

---

## 9. Progressive Disclosure Patterns

### 9.1 Expandable Sections

**Solution**: Accordion-style content with smooth animations.

```css
/* Enhanced Accordion */
.accordion-item {
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-2);
  overflow: hidden;
  transition: all var(--duration-200) var(--ease-out);
}

.accordion-item:hover {
  border-color: var(--primary-300);
  box-shadow: var(--shadow-sm);
}

.accordion-header {
  padding: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background: white;
  transition: background var(--duration-150) var(--ease-out);
  user-select: none;
}

.accordion-header:hover {
  background: var(--neutral-50);
}

.accordion-title {
  font-weight: var(--font-semibold);
  color: var(--neutral-900);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.accordion-icon {
  width: 20px;
  height: 20px;
  color: var(--neutral-500);
  transition: transform var(--duration-200) var(--ease-out);
}

.accordion-item.is-open .accordion-icon {
  transform: rotate(180deg);
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height var(--duration-300) var(--ease-out);
}

.accordion-item.is-open .accordion-content {
  max-height: 2000px; /* Large enough for content */
}

.accordion-body {
  padding: var(--space-4);
  padding-top: 0;
  color: var(--neutral-700);
}

/* Nested Accordion Support */
.accordion-item .accordion-item {
  margin-left: var(--space-4);
  border-left: 3px solid var(--primary-200);
}
```

**Usage**: TRA task steps, hazard details, control measures

### 9.2 Reveal-on-Hover Details

**Solution**: Tooltip-style expanded information.

```css
/* Enhanced Tooltip with Rich Content */
.tooltip-trigger {
  position: relative;
  cursor: help;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-decoration-color: var(--neutral-400);
}

.tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  background: var(--neutral-900);
  color: white;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all var(--duration-150) var(--ease-out);
  z-index: 1000;
  max-width: 300px;
  white-space: normal;
}

.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border: 5px solid transparent;
  border-top-color: var(--neutral-900);
}

.tooltip-trigger:hover .tooltip,
.tooltip-trigger:focus .tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(-4px);
}

/* Rich Tooltip with Header and Body */
.tooltip-rich {
  max-width: 400px;
  padding: 0;
  background: white;
  color: var(--neutral-900);
  border: 1px solid var(--neutral-200);
  box-shadow: var(--shadow-lg);
}

.tooltip-rich-header {
  padding: var(--space-3);
  background: var(--primary-50);
  border-bottom: 1px solid var(--primary-100);
  font-weight: var(--font-semibold);
}

.tooltip-rich-body {
  padding: var(--space-3);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}
```

**Usage**: Risk score explanations, hazard details, competency requirements

---

## 10. Empty States & Onboarding

### 10.1 Illustrative Empty States

**Solution**: Encouraging empty states with clear actions.

```css
/* Empty State Container */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-8);
  text-align: center;
  min-height: 400px;
}

.empty-state-illustration {
  width: 200px;
  height: 200px;
  margin-bottom: var(--space-6);
  opacity: 0.6;
}

.empty-state-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--neutral-900);
  margin-bottom: var(--space-2);
}

.empty-state-description {
  font-size: var(--text-base);
  color: var(--neutral-600);
  max-width: 500px;
  margin-bottom: var(--space-6);
  line-height: var(--leading-relaxed);
}

.empty-state-action {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
}

/* Variants for Different Empty States */
.empty-state-first-time {
  background: linear-gradient(135deg, 
    var(--primary-50) 0%, 
    var(--secondary-50) 100%);
  border-radius: var(--radius-2xl);
}

.empty-state-no-results {
  /* Subtle styling for "no search results" */
}

.empty-state-error {
  /* Error state styling */
  border: 2px dashed var(--danger-300);
}
```

**Usage**: No TRAs yet, no LMRAs completed, no notifications

### 10.2 Guided Onboarding Tours

**Solution**: Step-by-step feature introduction.

```css
/* Onboarding Spotlight */
.onboarding-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 9999;
  animation: fadeIn 0.3s var(--ease-out);
}

.onboarding-spotlight {
  position: fixed;
  border-radius: var(--radius-lg);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
  z-index: 10000;
  pointer-events: none;
  transition: all var(--duration-300) var(--ease-out);
}

.onboarding-tooltip {
  position: fixed;
  background: white;
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  max-width: 400px;
  z-index: 10001;
  animation: bounceIn 0.4s var(--ease-out);
}

.onboarding-tooltip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.onboarding-tooltip-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--neutral-900);
}

.onboarding-tooltip-step {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--primary-600);
  background: var(--primary-50);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
}

.onboarding-tooltip-content {
  font-size: var(--text-base);
  color: var(--neutral-700);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-4);
}

.onboarding-tooltip-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.onboarding-progress {
  display: flex;
  gap: var(--space-2);
}

.onboarding-progress-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--neutral-300);
  transition: all var(--duration-200) var(--ease-out);
}

.onboarding-progress-dot.is-active {
  background: var(--primary-500);
  transform: scale(1.3);
}

.onboarding-progress-dot.is-complete {
  background: var(--success-500);
}
```

**Usage**: First-time user guidance, new feature announcements

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Priority: Critical Visual Hierarchy & Core Interactions**

```markdown
✅ Enhanced typography scale with display fonts
✅ Information density controls
✅ Visual anchors and focal points
✅ Elevated card system with hover states
✅ Smart button states (loading, success, error)
✅ Enhanced form validation patterns
✅ Toast notification system
```

**Deliverables**:
- Updated `tailwind.config.ts` with new scales
- `globals.css` with CSS variables
- Base component updates: Button, Card, Input
- Toast component implementation

### Phase 2: Data Visualization (Week 3-4)
**Priority: Risk Communication & Dashboards**

```markdown
✅ Risk gauge (circular progress)
✅ Risk heat map for projects
✅ Trend sparklines
✅ Progress rings
✅ Dashboard KPI cards
✅ Chart components (Recharts integration)
```

**Deliverables**:
- RiskGauge component
- HeatMap component
- Sparkline component
- ProgressRing component
- Dashboard layout updates

### Phase 3: Mobile Excellence (Week 5-6)
**Priority: Field Worker Experience**

```markdown
✅ Bottom sheet navigation
✅ Swipeable cards
✅ Touch-optimized form controls
✅ Floating action buttons (FAB)
✅ Pull-to-refresh patterns
✅ Glove-friendly mode
```

**Deliverables**:
- BottomSheet component
- SwipeableCard component
- Mobile form components
- FAB component
- Mobile LMRA flow updates

### Phase 4: Micro-Interactions (Week 7-8)
**Priority: Delight & Feedback**

```markdown
✅ Attention-guiding animations
✅ Success celebrations
✅ Loading skeletons
✅ Staggered list animations
✅ Smooth transitions
✅ Gesture feedback
```

**Deliverables**:
- Animation utility classes
- Loading skeleton components
- Success animation components
- Gesture handlers

### Phase 5: Polish & Optimization (Week 9-10)
**Priority: Professional Finish**

```markdown
✅ Progressive disclosure patterns
✅ Empty states with illustrations
✅ Onboarding tours
✅ Accessibility audit
✅ Performance optimization
✅ Cross-browser testing
```

**Deliverables**:
- Accordion components
- EmptyState components
- OnboardingTour component
- Accessibility fixes
- Performance report

---

## 12. Design Tokens Implementation

### Tailwind Config Additions

```javascript
// tailwind.config.ts additions

module.exports = {
  theme: {
    extend: {
      // Display Typography
      fontSize: {
        'display-1': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-2': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-3': ['3rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'data-lg': ['3rem', { lineHeight: '1', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }],
        'data-md': ['2.25rem', { lineHeight: '1', letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }],
        'data-sm': ['1.5rem', { lineHeight: '1', fontVariantNumeric: 'tabular-nums' }],
      },
      
      // Enhanced Shadows for Depth
      boxShadow: {
        'glow-primary': '0 0 20px rgba(255, 139, 0, 0.3)',
        'glow-success': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.3)',
      },
      
      // Animation Durations
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
      
      // Keyframe Animations
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3) translateY(-20px)' },
          '50%': { opacity: '1', transform: 'scale(1.05) translateY(0)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeInUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          'from': { opacity: '0', transform: 'translateX(100%)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        spin: {
          'to': { transform: 'rotate(360deg)' },
        },
      },
      
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'pulse': 'pulse 2s ease-in-out infinite',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'spin': 'spin 0.8s linear infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

---

## 13. Success Metrics

### User Experience Metrics

**Quantitative**:
- Task completion time: -30% reduction
- Error rate: -50% reduction
- Mobile LMRA completion time: <5 minutes
- Form abandonment rate: <10%
- Page load time: <2 seconds
- Time to Interactive: <3 seconds

**Qualitative**:
- User satisfaction score: >4.5/5
- Net Promoter Score (NPS): >50
- "Easy to use" rating: >90%
- "Feels professional" rating: >95%
- Mobile usability rating: >4.5/5

### Design Quality Metrics

**Accessibility**:
- WCAG 2.1 AA compliance: 100%
- Lighthouse accessibility score: >95
- Keyboard navigation: 100% coverage
- Screen reader compatibility: Verified

**Performance**:
- Lighthouse performance score: >90
- First Contentful Paint: <1.8s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1
- Time to Interactive: <3s

**Visual Consistency**:
- Component reuse rate: >80%
- Design token usage: 100%
- Cross-browser consistency: >98%
- Mobile-desktop parity: >95%

---

## 14. Design Principles Summary

### Do's ✅

1. **Always prioritize safety communication** over decoration
2. **Use color coding consistently** for risk levels
3. **Provide instant feedback** for all user actions
4. **Optimize for mobile** and harsh field conditions
5. **Follow accessibility guidelines** strictly
6. **Use micro-animations** to guide attention
7. **Progressive disclosure** for complex interfaces
8. **Clear visual hierarchy** for information density
9. **Provide multiple feedback channels** (visual, text, motion)
10. **Test with actual field workers** in real conditions

### Don'ts ❌

1. **Don't sacrifice clarity** for visual appeal
2. **Don't use color alone** to convey information
3. **Don't hide critical safety information** behind interactions
4. **Don't use animations** that distract from safety data
5. **Don't make touch targets** smaller than 44px
6. **Don't assume good lighting** conditions
7. **Don't ignore offline states** and error scenarios
8. **Don't overuse animations** (respect prefers-reduced-motion)
9. **Don't design for desktop only** (mobile-first)
10. **Don't forget loading and empty states**

---

## 15. Next Steps

### For Implementation

1. **Review this document** with the development team
2. **Prioritize enhancements** based on user feedback
3. **Create component library** in Storybook (optional)
4. **Set up design token system** in codebase
5.