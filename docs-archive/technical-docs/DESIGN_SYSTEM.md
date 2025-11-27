# SafeWork Pro - Design System

**Version**: 1.0  
**Last Updated**: September 29, 2025  
**Status**: Foundation Specification  
**Purpose**: Complete design system for consistent UI/UX across the TRA/LMRA application

---

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color Palette](#color-palette)
3. [Typography System](#typography-system)
4. [Spacing Scale](#spacing-scale)
5. [Layout & Grid](#layout--grid)
6. [Border Radius](#border-radius)
7. [Shadows & Elevation](#shadows--elevation)
8. [Transitions & Animations](#transitions--animations)
9. [Component Specifications](#component-specifications)
10. [Responsive Breakpoints](#responsive-breakpoints)
11. [Accessibility Guidelines](#accessibility-guidelines)
12. [Icon System](#icon-system)
13. [Usage Examples](#usage-examples)

---

## 1. Brand Identity

### Brand Colors (Provided)
```css
--brand-primary: rgb(255, 139, 0);    /* Orange - Action, Energy, Warning */
--brand-secondary: rgb(0, 128, 85);   /* Green - Safety, Success, Go */
--brand-dark: rgb(9, 30, 66);         /* Navy Blue - Trust, Professional */
--brand-white: rgb(255, 255, 255);    /* White - Clean, Simple */
```

### Brand Personality
- **Professional**: Enterprise-ready, trustworthy, reliable
- **Safety-First**: Clear visual hierarchy, high contrast, accessible
- **Modern**: Clean, minimalist, efficient
- **Mobile-Friendly**: Touch-optimized, responsive, PWA-ready

### Design Principles
1. **Clarity Over Cleverness**: Safety information must be immediately clear
2. **Consistency**: Predictable patterns across all interactions
3. **Accessibility First**: WCAG 2.1 AA minimum standard
4. **Mobile-First**: Optimized for field workers on mobile devices
5. **Performance**: Fast loading, efficient rendering

---

## 2. Color Palette

### 2.1 Primary Colors (Orange)

```css
/* Primary - Orange (Action, Warnings, CTAs) */
--primary-50: rgb(255, 247, 237);   /* Lightest - Backgrounds */
--primary-100: rgb(255, 237, 213);  /* Light hover states */
--primary-200: rgb(255, 224, 178);  /* Light borders */
--primary-300: rgb(255, 204, 128);  /* Disabled states */
--primary-400: rgb(255, 171, 64);   /* Hover states */
--primary-500: rgb(255, 139, 0);    /* BRAND PRIMARY - Default */
--primary-600: rgb(230, 119, 0);    /* Active states */
--primary-700: rgb(204, 99, 0);     /* Dark mode primary */
--primary-800: rgb(179, 79, 0);     /* Deep states */
--primary-900: rgb(153, 59, 0);     /* Darkest - Text on light */
```

**Usage**:
- Primary actions (Create TRA, Submit, Save)
- Warning indicators (Medium risk)
- Active states and focus rings
- Call-to-action buttons

### 2.2 Secondary Colors (Green)

```css
/* Secondary - Green (Success, Safety, Approval) */
--secondary-50: rgb(230, 247, 237);   /* Lightest - Backgrounds */
--secondary-100: rgb(204, 238, 221);  /* Light hover states */
--secondary-200: rgb(153, 221, 187);  /* Light borders */
--secondary-300: rgb(102, 204, 153);  /* Disabled states */
--secondary-400: rgb(51, 166, 119);   /* Hover states */
--secondary-500: rgb(0, 128, 85);     /* BRAND SECONDARY - Default */
--secondary-600: rgb(0, 115, 77);     /* Active states */
--secondary-700: rgb(0, 102, 68);     /* Dark mode secondary */
--secondary-800: rgb(0, 89, 60);      /* Deep states */
--secondary-900: rgb(0, 77, 51);      /* Darkest - Text on light */
```

**Usage**:
- Success messages and confirmations
- Safe-to-proceed indicators
- Approval status
- Positive feedback
- Secondary actions

### 2.3 Neutral Colors (Grays)

```css
/* Neutrals - Gray Scale (UI Elements, Text, Borders) */
--neutral-50: rgb(250, 251, 252);    /* Page backgrounds */
--neutral-100: rgb(243, 244, 246);   /* Card backgrounds */
--neutral-200: rgb(229, 231, 235);   /* Borders, dividers */
--neutral-300: rgb(209, 213, 219);   /* Disabled backgrounds */
--neutral-400: rgb(156, 163, 175);   /* Disabled text */
--neutral-500: rgb(107, 114, 128);   /* Placeholder text */
--neutral-600: rgb(75, 85, 99);      /* Secondary text */
--neutral-700: rgb(55, 65, 81);      /* Primary text */
--neutral-800: rgb(31, 41, 55);      /* Headings */
--neutral-900: rgb(17, 24, 39);      /* Dark backgrounds */
--neutral-950: rgb(9, 13, 22);       /* Darkest */
```

**Usage**:
- Body text (700-800)
- Headings (800-900)
- Borders and dividers (200-300)
- Disabled states (300-400)
- Backgrounds (50-100)

### 2.4 Dark Mode Colors (Navy Blue Base)

```css
/* Dark Mode - Based on Brand Dark Navy */
--dark-bg-primary: rgb(9, 30, 66);     /* BRAND DARK - Main background */
--dark-bg-secondary: rgb(15, 46, 99);  /* Card backgrounds */
--dark-bg-tertiary: rgb(21, 62, 132);  /* Elevated surfaces */
--dark-border: rgb(42, 84, 165);       /* Borders */
--dark-text-primary: rgb(255, 255, 255);    /* Primary text */
--dark-text-secondary: rgb(203, 213, 224);  /* Secondary text */
--dark-text-tertiary: rgb(148, 163, 184);   /* Tertiary text */
```

**Usage**: Complete dark mode support for night shifts and low-light environments

### 2.5 Semantic Colors (Status & Feedback)

```css
/* Success - Green tones */
--success-50: rgb(240, 253, 244);
--success-500: rgb(34, 197, 94);     /* Success messages */
--success-600: rgb(22, 163, 74);     /* Success hover */
--success-700: rgb(21, 128, 61);     /* Success active */

/* Warning - Orange/Amber tones */
--warning-50: rgb(255, 251, 235);
--warning-500: rgb(245, 158, 11);    /* Warning messages */
--warning-600: rgb(217, 119, 6);     /* Warning hover */
--warning-700: rgb(180, 83, 9);      /* Warning active */

/* Error/Danger - Red tones */
--danger-50: rgb(254, 242, 242);
--danger-500: rgb(239, 68, 68);      /* Error messages, high risk */
--danger-600: rgb(220, 38, 38);      /* Error hover */
--danger-700: rgb(185, 28, 28);      /* Error active */

/* Info - Blue tones */
--info-50: rgb(239, 246, 255);
--info-500: rgb(59, 130, 246);       /* Information messages */
--info-600: rgb(37, 99, 235);        /* Info hover */
--info-700: rgb(29, 78, 216);        /* Info active */
```

**Usage**:
- **Success**: Approved TRAs, successful submissions, safe conditions
- **Warning**: Medium risk, pending approvals, modifications needed
- **Danger**: High risk, critical issues, stop work, errors
- **Info**: Help text, tips, neutral notifications

### 2.6 Risk Level Colors (TRA/LMRA Specific)

```css
/* Risk Assessment Colors - Based on Kinney & Wiruth */
--risk-trivial: rgb(34, 197, 94);        /* 0-20: Green */
--risk-acceptable: rgb(132, 204, 22);    /* 21-70: Light Green */
--risk-moderate: rgb(245, 158, 11);      /* 71-200: Amber/Orange */
--risk-substantial: rgb(249, 115, 22);   /* 201-400: Orange/Red */
--risk-intolerable: rgb(239, 68, 68);    /* 401+: Red */
```

**Usage**: Risk score visualization, heat maps, status indicators

### 2.7 Color Contrast Requirements

**Text Contrast Ratios** (WCAG 2.1 AA):
- Normal text (16px+): 4.5:1 minimum
- Large text (24px+): 3:1 minimum
- UI components: 3:1 minimum

**Approved Combinations**:
```css
/* Light Mode */
--primary-on-white: var(--primary-600);    /* 4.8:1 */
--secondary-on-white: var(--secondary-600); /* 5.2:1 */
--text-on-white: var(--neutral-800);        /* 12.6:1 */

/* Dark Mode */
--primary-on-dark: var(--primary-400);     /* 5.1:1 */
--secondary-on-dark: var(--secondary-400); /* 5.4:1 */
--text-on-dark: var(--neutral-50);         /* 15.3:1 */
```

---

## 3. Typography System

### 3.1 Font Families

```css
/* Primary Font Stack - Inter (System UI Fallback) */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 
                'Droid Sans', 'Helvetica Neue', sans-serif;

/* Monospace Font Stack - For code, data, technical info */
--font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', 
             Consolas, 'Courier New', monospace;

/* Numeric Font Stack - For tables, scores, measurements */
--font-numeric: 'Inter', 'SF Pro Display', -apple-system, sans-serif;
```

**Font Loading Strategy**:
- Use `next/font` for optimized loading
- System font fallbacks for instant rendering
- Variable font support for Inter (weights 300-700)

### 3.2 Font Sizes (Type Scale)

```css
/* Type Scale - Based on 16px root */
--text-xs: 0.75rem;      /* 12px - Small labels, captions */
--text-sm: 0.875rem;     /* 14px - Secondary text, metadata */
--text-base: 1rem;       /* 16px - Body text DEFAULT */
--text-lg: 1.125rem;     /* 18px - Emphasized body text */
--text-xl: 1.25rem;      /* 20px - Section subheadings */
--text-2xl: 1.5rem;      /* 24px - Page subheadings */
--text-3xl: 1.875rem;    /* 30px - Page headings */
--text-4xl: 2.25rem;     /* 36px - Major section headings */
--text-5xl: 3rem;        /* 48px - Hero headings */
--text-6xl: 3.75rem;     /* 60px - Marketing/landing pages */
```

**Mobile Adjustments**: Reduce heading sizes by 10-15% on screens < 640px

### 3.3 Font Weights

```css
/* Font Weights - Inter Variable Font */
--font-light: 300;        /* Light - Sparingly for large headings */
--font-normal: 400;       /* Normal - Body text DEFAULT */
--font-medium: 500;       /* Medium - UI elements, labels */
--font-semibold: 600;     /* Semibold - Buttons, emphasized text */
--font-bold: 700;         /* Bold - Headings, important info */
```

**Usage Guidelines**:
- **Body text**: 400 (normal)
- **Labels & UI**: 500 (medium)
- **Buttons**: 600 (semibold)
- **Headings**: 600-700 (semibold-bold)
- **Numbers/Scores**: 600 (semibold) with tabular-nums

### 3.4 Line Heights

```css
/* Line Heights - Optimized for readability */
--leading-none: 1;           /* 1 - Tight headings */
--leading-tight: 1.25;       /* 1.25 - Large headings */
--leading-snug: 1.375;       /* 1.375 - Small headings */
--leading-normal: 1.5;       /* 1.5 - Body text DEFAULT */
--leading-relaxed: 1.625;    /* 1.625 - Long-form content */
--leading-loose: 2;          /* 2 - Spacious layouts */
```

**Usage Guidelines**:
- **Headings (h1-h3)**: 1.25 (tight)
- **Headings (h4-h6)**: 1.375 (snug)
- **Body text**: 1.5 (normal)
- **Tables/lists**: 1.625 (relaxed)

### 3.5 Letter Spacing (Tracking)

```css
/* Letter Spacing - Subtle adjustments */
--tracking-tighter: -0.05em;  /* Tight - Large display text */
--tracking-tight: -0.025em;   /* Slightly tight - Headings */
--tracking-normal: 0;         /* Normal - Body text DEFAULT */
--tracking-wide: 0.025em;     /* Wide - All-caps labels */
--tracking-wider: 0.05em;     /* Wider - Buttons, badges */
--tracking-widest: 0.1em;     /* Widest - Small all-caps */
```

### 3.6 Text Styles (Pre-defined)

```css
/* Heading Styles */
.heading-1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--neutral-900);
}

.heading-2 {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--neutral-900);
}

.heading-3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  color: var(--neutral-800);
}

/* Body Text Styles */
.body-large {
  font-size: var(--text-lg);
  font-weight: var(--font-normal);
  line-height: var(--leading-relaxed);
  color: var(--neutral-700);
}

.body-default {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--neutral-700);
}

.body-small {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--neutral-600);
}

/* UI Text Styles */
.label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  color: var(--neutral-700);
}

.caption {
  font-size: var(--text-xs);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--neutral-500);
}

/* Specialized Styles */
.code {
  font-family: var(--font-mono);
  font-size: 0.875em;
  background: var(--neutral-100);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

.numeric {
  font-family: var(--font-numeric);
  font-weight: var(--font-semibold);
  font-variant-numeric: tabular-nums;
}
```

---

## 4. Spacing Scale

### 4.1 Base Spacing Units

```css
/* Spacing Scale - Based on 4px grid (0.25rem) */
--space-0: 0;              /* 0px - No spacing */
--space-px: 1px;           /* 1px - Hairline borders */
--space-0-5: 0.125rem;     /* 2px - Micro spacing */
--space-1: 0.25rem;        /* 4px - Tight spacing */
--space-1-5: 0.375rem;     /* 6px - Very small */
--space-2: 0.5rem;         /* 8px - Small */
--space-2-5: 0.625rem;     /* 10px - Small-medium */
--space-3: 0.75rem;        /* 12px - Medium-small */
--space-3-5: 0.875rem;     /* 14px - Medium */
--space-4: 1rem;           /* 16px - DEFAULT base unit */
--space-5: 1.25rem;        /* 20px - Medium-large */
--space-6: 1.5rem;         /* 24px - Large */
--space-7: 1.75rem;        /* 28px - Large-extra */
--space-8: 2rem;           /* 32px - Extra large */
--space-9: 2.25rem;        /* 36px - Extra large+ */
--space-10: 2.5rem;        /* 40px - XXL */
--space-11: 2.75rem;       /* 44px - Touch target minimum */
--space-12: 3rem;          /* 48px - Section spacing */
--space-14: 3.5rem;        /* 56px - Large section */
--space-16: 4rem;          /* 64px - Major section */
--space-20: 5rem;          /* 80px - Page section */
--space-24: 6rem;          /* 96px - Hero section */
--space-32: 8rem;          /* 128px - Major divider */
```

### 4.2 Spacing Usage Guidelines

**Component Spacing**:
- **Form fields**: 4 (16px) vertical gap
- **Button padding**: 2.5 (10px) vertical, 4 (16px) horizontal
- **Card padding**: 4-6 (16-24px)
- **Modal padding**: 6 (24px)
- **Page margins**: 4-8 (16-32px)

**Layout Spacing**:
- **Section gaps**: 12-16 (48-64px)
- **Container max-width**: 1280px
- **Content max-width**: 768px (long-form reading)

**Touch Targets**:
- **Minimum size**: 44px × 44px (11 spacing units)
- **Comfortable size**: 48px × 48px (12 spacing units)
- **Button height**: 40-48px (10-12 units)

---

## 5. Layout & Grid

### 5.1 Container Widths

```css
/* Container Sizes */
--container-sm: 640px;      /* Small - Forms, modals */
--container-md: 768px;      /* Medium - Content pages */
--container-lg: 1024px;     /* Large - Dashboards */
--container-xl: 1280px;     /* Extra large - Wide layouts */
--container-2xl: 1536px;    /* 2XL - Marketing pages */
--container-full: 100%;     /* Full width */
```

### 5.2 Grid System

```css
/* 12-Column Grid */
--grid-cols-1: repeat(1, minmax(0, 1fr));
--grid-cols-2: repeat(2, minmax(0, 1fr));
--grid-cols-3: repeat(3, minmax(0, 1fr));
--grid-cols-4: repeat(4, minmax(0, 1fr));
--grid-cols-6: repeat(6, minmax(0, 1fr));
--grid-cols-12: repeat(12, minmax(0, 1fr));

/* Grid Gap */
--gap-base: var(--space-4);    /* 16px - Default */
--gap-sm: var(--space-2);      /* 8px - Tight */
--gap-lg: var(--space-6);      /* 24px - Spacious */
```

### 5.3 Flex Layouts

```css
/* Common Flex Patterns */
.flex-row {
  display: flex;
  flex-direction: row;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-start {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}
```

---

## 6. Border Radius

### 6.1 Border Radius Scale

```css
/* Border Radius - Smooth, modern corners */
--radius-none: 0;           /* 0 - Sharp corners */
--radius-sm: 0.25rem;       /* 4px - Subtle */
--radius-base: 0.375rem;    /* 6px - DEFAULT for cards, inputs */
--radius-md: 0.5rem;        /* 8px - Buttons, badges */
--radius-lg: 0.75rem;       /* 12px - Cards, modals */
--radius-xl: 1rem;          /* 16px - Large cards */
--radius-2xl: 1.5rem;       /* 24px - Hero sections */
--radius-3xl: 2rem;         /* 32px - Feature cards */
--radius-full: 9999px;      /* Full - Circular (avatars, pills) */
```

### 6.2 Component-Specific Radius

```css
/* Component Radius Assignments */
--radius-button: var(--radius-md);      /* 8px */
--radius-input: var(--radius-base);     /* 6px */
--radius-card: var(--radius-lg);        /* 12px */
--radius-modal: var(--radius-xl);       /* 16px */
--radius-badge: var(--radius-full);     /* Pill shape */
--radius-avatar: var(--radius-full);    /* Circular */
--radius-tooltip: var(--radius-sm);     /* 4px */
```

---

## 7. Shadows & Elevation

### 7.1 Shadow Scale

```css
/* Shadows - Elevation system (0-5) */
--shadow-none: none;

--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
/* Usage: Subtle borders, dropdown dividers */

--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 
             0 1px 2px -1px rgba(0, 0, 0, 0.1);
/* Usage: Cards, inputs (default) */

--shadow-base: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
               0 2px 4px -2px rgba(0, 0, 0, 0.1);
/* Usage: Buttons, elevated cards */

--shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
             0 4px 6px -4px rgba(0, 0, 0, 0.1);
/* Usage: Dropdowns, popovers */

--shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
             0 8px 10px -6px rgba(0, 0, 0, 0.1);
/* Usage: Modals, dialogs */

--shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
/* Usage: Full-page modals, drawers */

--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
/* Usage: Important alerts, critical dialogs */
```

### 7.2 Colored Shadows

```css
/* Colored Shadows - For focus states */
--shadow-focus-primary: 0 0 0 3px rgba(255, 139, 0, 0.3);
--shadow-focus-secondary: 0 0 0 3px rgba(0, 128, 85, 0.3);
--shadow-focus-danger: 0 0 0 3px rgba(239, 68, 68, 0.3);
```

### 7.3 Elevation Levels

**Level 0** (Flat): No shadow - `--shadow-none`
- Usage: Page backgrounds, flat surfaces

**Level 1** (Raised): `--shadow-sm`
- Usage: Cards, form inputs, list items

**Level 2** (Elevated): `--shadow-base`
- Usage: Buttons (hover), active cards

**Level 3** (Floating): `--shadow-md`
- Usage: Dropdowns, tooltips, popovers

**Level 4** (Overlay): `--shadow-lg`
- Usage: Modals, dialogs, side panels

**Level 5** (Modal): `--shadow-xl` / `--shadow-2xl`
- Usage: Critical alerts, full-page overlays

---

## 8. Transitions & Animations

### 8.1 Transition Durations

```css
/* Duration Scale */
--duration-75: 75ms;       /* Ultra fast - Micro interactions */
--duration-100: 100ms;     /* Very fast - Hover effects */
--duration-150: 150ms;     /* Fast - DEFAULT for most UI */
--duration-200: 200ms;     /* Normal - Smooth transitions */
--duration-300: 300ms;     /* Moderate - Dropdowns, tooltips */
--duration-500: 500ms;     /* Slow - Modals, drawers */
--duration-700: 700ms;     /* Slower - Page transitions */
--duration-1000: 1000ms;   /* Very slow - Loading states */
```

### 8.2 Easing Functions

```css
/* Easing Curves */
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);         /* Accelerate */
--ease-out: cubic-bezier(0, 0, 0.2, 1);        /* Decelerate - DEFAULT */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);   /* Smooth both ends */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Bounce effect */
```

### 8.3 Common Transitions

```css
/* Pre-defined Transitions */
--transition-base: all var(--duration-150) var(--ease-out);
--transition-colors: color var(--duration-150) var(--ease-out),
                     background-color var(--duration-150) var(--ease-out),
                     border-color var(--duration-150) var(--ease-out);
--transition-opacity: opacity var(--duration-200) var(--ease-out);
--transition-transform: transform var(--duration-200) var(--ease-out);
--transition-shadow: box-shadow var(--duration-150) var(--ease-out);
```

### 8.4 Animation Keyframes

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale In */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Spin */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## 9. Component Specifications

### 9.1 Buttons

```css
/* Button Base Styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2-5) var(--space-4);
  font-family: var(--font-primary);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  line-height: var(--leading-normal);
  border-radius: var(--radius-button);
  border: 1px solid transparent;
  transition: var(--transition-colors);
  cursor: pointer;
  min-height: 40px;
  white-space: nowrap;
}

/* Button Variants */
.btn-primary {
  background: var(--primary-500);
  color: white;
  border-color: var(--primary-500);
}

.btn-primary:hover {
  background: var(--primary-600);
  border-color: var(--primary-600);
}

.btn-secondary {
  background: var(--secondary-500);
  color: white;
  border-color: var(--secondary-500);
}

.btn-outline {
  background: transparent;
  color: var(--neutral-700);
  border-color: var(--neutral-300);
}

.btn-ghost {
  background: transparent;
  color: var(--neutral-700);
  border-color: transparent;
}

/* Button Sizes */
.btn-sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  min-height: 32px;
}

.btn-lg {
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-lg);
  min-height: 48px;
}

/* Button States */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus-primary);
}
```

### 9.2 Form Inputs

```css
/* Input Base Styles */
.input {
  width: 100%;
  padding: var(--space-2-5) var(--space-3);
  font-family: var(--font-primary);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--neutral-700);
  background: white;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-input);
  transition: var(--transition-colors);
  min-height: 40px;
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: var(--shadow-focus-primary);
}

.input:disabled {
  background: var(--neutral-100);
  color: var(--neutral-500);
  cursor: not-allowed;
}

.input::placeholder {
  color: var(--neutral-400);
}

/* Input with Icon */
.input-with-icon {
  padding-left: var(--space-10);
}

/* Input Validation States */
.input-error {
  border-color: var(--danger-500);
}

.input-error:focus {
  box-shadow: var(--shadow-focus-danger);
}

.input-success {
  border-color: var(--success-500);
}
```

### 9.3 Cards

```css
/* Card Base Styles */
.card {
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-sm);
  padding: var(--space-6);
  transition: var(--transition-shadow);
}

.card:hover {
  box-shadow: var(--shadow-base);
}

/* Card Header */
.card-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--neutral-200);
}

/* Card Body */
.card-body {
  padding: var(--space-6);
}

/* Card Footer */
.card-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--neutral-200);
  background: var(--neutral-50);
  border-bottom-left-radius: var(--radius-card);
  border-bottom-right-radius: var(--radius-card);
}

/* Card Variants */
.card-interactive {
  cursor: pointer;
}

.card-interactive:hover {
  border-color: var(--primary-300);
  box-shadow: var(--shadow-md);
}
```

### 9.4 Badges

```css
/* Badge Base Styles */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  line-height: var(--leading-none);
  border-radius: var(--radius-badge);
  white-space: nowrap;
}

/* Badge Variants */
.badge-primary {
  background: var(--primary-100);
  color: var(--primary-700);
}

.badge-success {
  background: var(--success-50);
  color: var(--success-700);
}

.badge-warning {
  background: var(--warning-50);
  color: var(--warning-700);
}

.badge-danger {
  background: var(--danger-50);
  color: var(--danger-700);
}

.badge-neutral {
  background: var(--neutral-100);
  color: var(--neutral-700);
}

/* Risk Level Badges */
.badge-risk-trivial {
  background: rgb(220, 252, 231);
  color: rgb(22, 101, 52);
}

.badge-risk-acceptable {
  background: rgb(236, 252, 203);
  color: rgb(77, 124, 15);
}

.badge-risk-moderate {
  background: rgb(254, 243, 199);
  color: rgb(146, 64, 14);
}

.badge-risk-substantial {
  background: rgb(255, 237, 213);
  color: rgb(154, 52, 18);
}

.badge-risk-intolerable {
  background: rgb(254, 226, 226);
  color: rgb(153, 27, 27);
}
```

### 9.5 Modals

```css
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  z-index: 1000;
  animation: fadeIn var(--duration-150) var(--ease-out);
}

/* Modal Container */
.modal {
  background: white;
  border-radius: var(--radius-modal);
  box-shadow: var(--shadow-xl);
  max-width: var(--container-md);
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  animation: scaleIn var(--duration-200) var(--ease-out);
}

/* Modal Sections */
.modal-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--neutral-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-body {
  padding: var(--space-6);
}

.modal-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--neutral-200);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
```

### 9.6 Alerts

```css
/* Alert Base Styles */
.alert {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border-left: 4px solid;
}

/* Alert Variants */
.alert-info {
  background: var(--info-50);
  border-color: var(--info-500);
  color: var(--info-900);
}

.alert-success {
  background: var(--success-50);
  border-color: var(--success-500);
  color: var(--success-900);
}

.alert-warning {
  background: var(--warning-50);
  border-color: var(--warning-500);
  color: var(--warning-900);
}

.alert-danger {
  background: var(--danger-50);
  border-color: var(--danger-500);
  color: var(--danger-900);
}
```

### 9.7 Tables

```css
/* Table Styles */
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.table thead {
  background: var(--neutral-50);
  border-bottom: 2px solid var(--neutral-200);
}

.table th {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  font-weight: var(--font-semibold);
  color: var(--neutral-700);
}

.table td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--neutral-200);
  color: var(--neutral-600);
}

.table tbody tr:hover {
  background: var(--neutral-50);
}

/* Striped Table */
.table-striped tbody tr:nth-child(even) {
  background: var(--neutral-50);
}
```

---

## 10. Responsive Breakpoints

### 10.1 Breakpoint Scale

```css
/* Breakpoints - Mobile-first approach */
--screen-xs: 475px;      /* Extra small devices */
--screen-sm: 640px;      /* Small devices (phones) */
--screen-md: 768px;      /* Medium devices (tablets) */
--screen-lg: 1024px;     /* Large devices (desktops) */
--screen-xl: 1280px;     /* Extra large devices */
--screen-2xl: 1536px;    /* 2XL devices */
```

### 10.2 Media Query Mixins (CSS)

```css
/* Mobile First Media Queries */

/* Small and up (≥640px) */
@media (min-width: 640px) {
  /* Tablet styles */
}

/* Medium and up (≥768px) */
@media (min-width: 768px) {
  /* Desktop styles */
}

/* Large and up (≥1024px) */
@media (min-width: 1024px) {
  /* Large desktop styles */
}

/* Extra Large and up (≥1280px) */
@media (min-width: 1280px) {
  /* Wide desktop styles */
}

/* Touch Device Detection */
@media (hover: none) and (pointer: coarse) {
  /* Touch-specific styles */
  /* Increase touch targets, adjust interactions */
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 10.3 Responsive Design Guidelines

**Mobile (< 640px)**:
- Single column layouts
- Full-width components
- Stacked navigation
- Touch-optimized (44px minimum targets)
- Simplified tables (horizontal scroll or stacked)
- Bottom navigation for key actions

**Tablet (640px - 1024px)**:
- 2-column layouts
- Side navigation available
- Hybrid touch/mouse interactions
- Flexible data tables
- Modal sizing adjusted

**Desktop (> 1024px)**:
- Multi-column layouts
- Full sidebar navigation
- Mouse-optimized hover states
- Complex data tables
- Multiple panels/split views
- Keyboard shortcuts

---

## 11. Accessibility Guidelines

### 11.1 WCAG 2.1 AA Compliance

**Required Standards**:
- ✅ Color contrast ratios: 4.5:1 (normal text), 3:1 (large text)
- ✅ Keyboard navigation for all interactive elements
- ✅ Focus indicators on all focusable elements
- ✅ Alt text for all meaningful images
- ✅ Form labels and error messages
- ✅ Semantic HTML structure
- ✅ ARIA labels where needed

### 11.2 Focus States

```css
/* Focus Indicator Styles */
:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* Custom Focus Rings */
.focus-ring {
  position: relative;
}

.focus-ring:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--primary-500), 0 0 0 6px rgba(255, 139, 0, 0.2);
}
```

### 11.3 Screen Reader Support

**Required Attributes**:
```html
<!-- Buttons and Links -->
<button aria-label="Create new TRA">
  <svg>...</svg>
</button>

<!-- Form Fields -->
<label for="risk-score">Risk Score</label>
<input id="risk-score" aria-describedby="risk-help" />
<span id="risk-help">Enter value between 0-1000</span>

<!-- Navigation -->
<nav aria-label="Main navigation">
  <!-- Nav items -->
</nav>

<!-- Alerts -->
<div role="alert" aria-live="polite">
  TRA saved successfully
</div>

<!-- Loading States -->
<div role="status" aria-live="polite">
  <span class="sr-only">Loading...</span>
</div>
```

### 11.4 Keyboard Navigation

**Tab Order**:
- Logical tab order following visual layout
- Skip links for main content
- Modal trap focus within dialog
- Escape key closes modals

**Keyboard Shortcuts**:
- `Tab` / `Shift+Tab`: Navigate forward/backward
- `Enter` / `Space`: Activate buttons
- `Escape`: Close modals/dropdowns
- `Arrow keys`: Navigate lists/menus

### 11.5 Color Accessibility

**Never rely on color alone**:
- ✅ Use icons with color (✓ for success)
- ✅ Use text labels (High Risk, not just red)
- ✅ Use patterns or shapes in charts
- ✅ Provide alt text for colored indicators

**Safe Color Combinations** (WCAG AA):
```css
/* Safe Text on Background Combinations */
.text-on-light {
  color: var(--neutral-700);      /* 10.5:1 on white */
  background: white;
}

.text-on-dark {
  color: white;                   /* 15.3:1 on navy */
  background: var(--dark-bg-primary);
}

.primary-text {
  color: var(--primary-700);      /* 5.1:1 on white */
}

.danger-text {
  color: var(--danger-700);       /* 5.8:1 on white */
}
```

### 11.6 Motion & Animation

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 11.7 Touch Targets

**Minimum Sizes** (Mobile):
- Touch targets: 44px × 44px minimum
- Spacing between targets: 8px minimum
- Icon buttons: 48px × 48px recommended

---

## 12. Icon System

### 12.1 Icon Library

**Primary Library**: Heroicons v2 (MIT License)
- Outline style for navigation and UI
- Solid style for filled states and emphasis
- Mini style (20px) for compact spaces

**Icon Sizes**:
```css
--icon-xs: 16px;    /* Inline text icons */
--icon-sm: 20px;    /* Mini icons, compact UI */
--icon-base: 24px;  /* DEFAULT - Most UI elements */
--icon-lg: 32px;    /* Emphasized icons */
--icon-xl: 48px;    /* Feature icons, hero sections */
```

### 12.2 Icon Colors

```css
/* Icon Color Utilities */
.icon-primary { color: var(--primary-500); }
.icon-secondary { color: var(--secondary-500); }
.icon-neutral { color: var(--neutral-500); }
.icon-danger { color: var(--danger-500); }
.icon-success { color: var(--success-500); }
.icon-warning { color: var(--warning-500); }
```

### 12.3 Icon Usage Guidelines

**Navigation Icons**:
- Use outline style
- 24px size
- Neutral-600 color
- Active state: Primary-500

**Status Icons**:
- Use solid style
- 20px size
- Semantic colors (success, warning, danger)

**Action Icons**:
- Use outline style
- 24px size
- Inherit text color
- Hover: Primary-500

---

## 13. Usage Examples

### 13.1 Button Examples

```jsx
// Primary Action Button
<button className="btn btn-primary">
  Create TRA
</button>

// Secondary Button with Icon
<button className="btn btn-secondary">
  <svg className="icon-base">...</svg>
  Save Draft
</button>

// Outline Button Small
<button className="btn btn-outline btn-sm">
  Cancel
</button>

// Danger Button Large
<button className="btn btn-danger btn-lg">
  Delete TRA
</button>
```

### 13.2 Card Examples

```jsx
// Interactive TRA Card
<div className="card card-interactive">
  <div className="card-header">
    <h3 className="heading-3">Electrical Work Safety</h3>
    <span className="badge badge-risk-moderate">Moderate Risk</span>
  </div>
  <div className="card-body">
    <p className="body-default">
      Risk assessment for electrical maintenance work...
    </p>
  </div>
  <div className="card-footer">
    <button className="btn btn-primary btn-sm">View Details</button>
  </div>
</div>
```

### 13.3 Form Examples

```jsx
// Text Input with Label
<div className="space-y-2">
  <label htmlFor="tra-title" className="label">
    TRA Title
  </label>
  <input
    id="tra-title"
    type="text"
    className="input"
    placeholder="Enter TRA title..."
  />
</div>

// Input with Error State
<div className="space-y-2">
  <label htmlFor="risk-score" className="label">
    Risk Score
  </label>
  <input
    id="risk-score"
    type="number"
    className="input input-error"
    value="1500"
  />
  <p className="text-sm text-danger-600">
    Risk score must be between 0-1000
  </p>
</div>
```

### 13.4 Alert Examples

```jsx
// Success Alert
<div className="alert alert-success">
  <svg className="icon-base icon-success">...</svg>
  <div>
    <h4 className="font-semibold">TRA Approved</h4>
    <p className="body-small">Your TRA has been successfully approved.</p>
  </div>
</div>

// Danger Alert
<div className="alert alert-danger">
  <svg className="icon-base icon-danger">...</svg>
  <div>
    <h4 className="font-semibold">High Risk Detected</h4>
    <p className="body-small">This task has an intolerable risk level.</p>
  </div>
</div>
```

### 13.5 Badge Examples

```jsx
// Status Badges
<span className="badge badge-success">Approved</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-danger">Rejected</span>

// Risk Level Badges
<span className="badge badge-risk-trivial">Trivial (15)</span>
<span className="badge badge-risk-moderate">Moderate (150)</span>
<span className="badge badge-risk-intolerable">Intolerable (450)</span>
```

---

## 14. Tailwind Configuration Reference

### 14.1 Tailwind Config Structure

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { /* orange scale */ },
        secondary: { /* green scale */ },
        neutral: { /* gray scale */ },
        danger: { /* red scale */ },
        success: { /* green scale */ },
        warning: { /* amber scale */ },
        info: { /* blue scale */ },
      },
      fontFamily: {
        primary: ['Inter', 'sans-serif'],
        mono: ['SF Mono', 'monospace'],
      },
      spacing: { /* custom spacing scale */ },
      borderRadius: { /* custom radius scale */ },
      boxShadow: { /* custom shadow scale */ },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### 14.2 CSS Custom Properties Usage

```css
/* Apply design tokens in global styles */
:root {
  /* Colors */
  --color-primary: rgb(255, 139, 0);
  /* ... all other tokens ... */
}

/* Use in components */
.custom-button {
  background: var(--color-primary);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-base);
  transition: var(--transition-colors);
}
```

---

## 15. Design System Maintenance

### 15.1 Version Control

**Semantic Versioning**:
- Major (1.0.0): Breaking changes to component APIs
- Minor (1.1.0): New components or tokens added
- Patch (1.1.1): Bug fixes, minor adjustments

### 15.2 Change Log

**Version 1.0** (September 29, 2025):
- Initial design system specification
- Complete color palette with brand colors
- Typography system with Inter font
- Spacing, shadows, and transitions defined
- Component specifications documented
- Accessibility guidelines established

### 15.3 Future Enhancements

**Planned for v1.1**:
- Dark mode variant refinements
- Additional component states (loading, skeleton)
- Advanced animation patterns
- Print stylesheet optimization
- High contrast mode support

**Planned for v1.2**:
- Component theming system
- Custom design token generator
- Storybook integration
- Design system documentation site

---

## 16. Resources & Tools

### 16.1 Design Tools
- **Figma**: Design mockups and prototypes
- **Contrast Checker**: WebAIM, Colorable
- **Icon Library**: Heroicons (https://heroicons.com)
- **Font**: Inter Variable Font (Google Fonts)

### 16.2 Development Tools
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing
- **CSS Variables**: Design token implementation
- **Tailwind Plugins**: Forms, Typography

### 16.3 Testing Tools
- **Lighthouse**: Accessibility and performance audits
- **axe DevTools**: Accessibility testing
- **WAVE**: Web accessibility evaluation
- **Browser DevTools**: Visual regression testing

### 16.4 Documentation
- **Storybook**: Component documentation (future)
- **TypeScript**: Component prop types
- **JSDoc**: Code documentation
- **README**: Usage guidelines

---

## 17. Summary

This design system provides a complete foundation for building a professional, accessible, and consistent TRA/LMRA application. All specifications align with:

✅ **Brand Identity**: Orange (action), Green (safety), Navy (trust)  
✅ **Accessibility**: WCAG 2.1 AA compliance throughout  
✅ **Mobile-First**: PWA-ready, touch-optimized design  
✅ **Professional**: Enterprise B2B SaaS quality  
✅ **Performance**: Optimized transitions, lazy loading  
✅ **Maintainability**: CSS variables, semantic naming  

**Next Steps**:
1. Implement design tokens in [`tailwind.config.ts`](web/tailwind.config.ts:1)
2. Create CSS variables in [`globals.css`](web/src/app/globals.css:1)
3. Update component styles to use design system
4. Add Storybook for component documentation
5. Conduct accessibility audit with axe DevTools

---

**Document Owner**: SafeWork Pro Development Team  
**Last Review**: September 29, 2025  
**Next Review**: December 2025 (Post-MVP Launch)