"use client";

import React from "react";
import Tour from "reactour";
import { useProductTour } from "../../hooks/useProductTour";

// Dutch translations for the tour
const tourContent = {
  welcome: {
    title: "Welkom bij SafeWork Pro!",
    content:
      "Laat ons u wegwijs maken in de belangrijkste functies van SafeWork Pro. Deze rondleiding duurt slechts een paar minuten en helpt u snel op weg.",
  },
  createTra: {
    title: "TRA's Aanmaken",
    content:
      "Hier kunt u nieuwe Taak Risicoanalyses (TRA's) aanmaken. Selecteer een sjabloon, voeg gevaren toe en bepaal beheersingsmaatregelen voor veilig werken.",
  },
  executeLmra: {
    title: "LMRA's Uitvoeren",
    content:
      "Voer Last Minute Risicoanalyses uit op de werkplek. Controleer omgevingsfactoren, teamleden en uitrusting voordat u begint met werken.",
  },
  viewReports: {
    title: "Rapporten Bekijken",
    content:
      "Bekijk uitgebreide rapporten over veiligheidsprestaties, risicotrends en compliance. Exporteer gegevens voor verdere analyse.",
  },
  navigation: {
    title: "Navigatie",
    content:
      "Gebruik het hoofdmenu om tussen verschillende onderdelen te navigeren. Uw profiel en instellingen vindt u rechtsboven.",
  },
  completed: {
    title: "Rondleiding Voltooid!",
    content:
      "U bent nu klaar om SafeWork Pro te gebruiken. Heeft u vragen? Bekijk de help-sectie of neem contact op met ons support team.",
  },
};

const tourButtons = {
  skip: "Overslaan",
  back: "Terug",
  next: "Volgende",
  last: "Voltooien",
};

/**
 * ProductTour Component
 *
 * Provides an interactive walkthrough of SafeWork Pro's key features using React Joyride.
 * Features Dutch localization and responsive design.
 *
 * Tour Steps:
 * 1. Welcome message
 * 2. Create TRA functionality
 * 3. Execute LMRA functionality
 * 4. View Reports functionality
 * 5. Navigation overview
 */
export function ProductTour() {
  const { tourState, handleJoyrideCallback } = useProductTour();

  // Custom styles for the tour tooltips
  const joyrideStyles = {
    options: {
      arrowColor: "#ffffff",
      backgroundColor: "#ffffff",
      overlayColor: "rgba(0, 0, 0, 0.4)",
      primaryColor: "#f97316", // Orange-500 from SafeWork Pro brand
      textColor: "#1f2937", // Gray-800
      width: 380,
      zIndex: 1000,
    },
    tooltip: {
      borderRadius: 12,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      padding: 24,
    },
    tooltipContainer: {
      textAlign: "left" as const,
    },
    tooltipTitle: {
      color: "#1f2937",
      fontSize: 18,
      fontWeight: 600,
      lineHeight: 1.4,
      marginBottom: 12,
    },
    tooltipContent: {
      color: "#4b5563",
      fontSize: 14,
      lineHeight: 1.6,
      marginBottom: 16,
    },
    tooltipFooter: {
      marginTop: 16,
    },
    buttonNext: {
      backgroundColor: "#f97316",
      borderRadius: 8,
      border: "none",
      color: "#ffffff",
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 500,
      padding: "8px 16px",
      marginLeft: 8,
      transition: "all 0.2s ease-in-out",
    },
    buttonBack: {
      backgroundColor: "transparent",
      border: "1px solid #d1d5db",
      borderRadius: 8,
      color: "#6b7280",
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 500,
      padding: "8px 16px",
      marginLeft: 8,
      transition: "all 0.2s ease-in-out",
    },
    buttonSkip: {
      backgroundColor: "transparent",
      border: "none",
      color: "#9ca3af",
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 400,
      padding: "8px 0",
      textDecoration: "underline",
    },
    spotlight: {
      borderRadius: 8,
    },
  };

  // Get content for current step
  const getStepContent = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return tourContent.welcome;
      case 1:
        return tourContent.createTra;
      case 2:
        return tourContent.executeLmra;
      case 3:
        return tourContent.viewReports;
      case 4:
        return tourContent.navigation;
      default:
        return tourContent.welcome;
    }
  };

  // Enhanced steps with Dutch content
  const enhancedSteps = tourState.steps.map((step, index) => {
    const content = getStepContent(index);
    return {
      ...step,
      title: content.title,
      content: content.content,
    };
  });

  // Custom locale for button text
  const locale = {
    back: tourButtons.back,
    close: "Sluiten",
    last: tourButtons.last,
    next: tourButtons.next,
    open: "Open het dialoogvenster",
    skip: tourButtons.skip,
  };

  // Map Joyride-style steps to Reactour steps
  const reactourSteps = enhancedSteps.map((s) => ({
    selector: s.target,
    content: (
      <div>
        <div style={joyrideStyles.tooltipTitle as React.CSSProperties}>{s.title}</div>
        <div style={joyrideStyles.tooltipContent as React.CSSProperties}>{s.content}</div>
      </div>
    ),
    // Reactour doesn't use placement; keep spotlight padding via styles if needed
  }));

  return (
    <Tour
      steps={reactourSteps}
      isOpen={tourState.run}
      onRequestClose={() =>
        // reuse existing handler: mark as skipped
        handleJoyrideCallback({ status: "skipped", type: "tour:close" })
      }
      getCurrentStep={(i: number) => {
        /* keep sync if needed */ return;
      }}
      rounded={8}
      maskClassName="reactour-mask"
      className="reactour-tooltip"
    />
  );
}

/**
 * TourProvider Component
 *
 * Wrapper component that provides the ProductTour to the entire application.
 * Should be placed high in the component tree, typically in the root layout.
 */
export function TourProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ProductTour />
    </>
  );
}

export default ProductTour;
