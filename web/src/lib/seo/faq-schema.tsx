"use client";

import React from "react";
import { FAQSchema, SchemaComponent, useSchema } from "./schema-components";

/**
 * FAQ Schema Implementation for Help System and Safety Knowledge Base
 *
 * This component implements FAQ schema markup optimized for:
 * - Dutch safety management questions
 * - VCA compliance questions
 * - Safety procedures and best practices
 * - Technical safety questions
 */

interface FAQSchemaProviderProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  contentTypeDutch: string;
  dutchLanguageOptimization?: string[];
  children?: React.ReactNode;
}

export const FAQSchemaProvider: React.FC<FAQSchemaProviderProps> = ({
  faqs,
  contentTypeDutch,
  dutchLanguageOptimization = [],
  children,
}) => {
  const { generateFAQSchema } = useSchema();

  const faqSchema: FAQSchema = generateFAQSchema({
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
    contentTypeDutch,
    dutchLanguageOptimization,
  });

  return <SchemaComponent schema={faqSchema}>{children}</SchemaComponent>;
};

/**
 * Specialized schema provider for VCA compliance FAQs
 */
interface VCAFAQSchemaProviderProps extends Omit<FAQSchemaProviderProps, "contentTypeDutch"> {
  vcaVersion?: string;
}

export const VCAFAQSchemaProvider: React.FC<VCAFAQSchemaProviderProps> = ({
  vcaVersion = "VCA 2017 v5.1",
  dutchLanguageOptimization = [],
  ...props
}) => {
  return (
    <FAQSchemaProvider
      {...props}
      contentTypeDutch={`VCA Compliance Veelgestelde Vragen - ${vcaVersion}`}
      dutchLanguageOptimization={[
        "VCA certificering",
        "veiligheidsnormen",
        "veiligheidsbeleid",
        "veiligheidsinspectie",
        "veiligheidsvoorschriften",
        "veilig werken",
        ...dutchLanguageOptimization,
      ]}
    />
  );
};

/**
 * Specialized schema provider for safety procedure FAQs
 */
interface SafetyFAQSchemaProviderProps extends Omit<FAQSchemaProviderProps, "contentTypeDutch"> {
  procedureType?: string;
}

export const SafetyFAQSchemaProvider: React.FC<SafetyFAQSchemaProviderProps> = ({
  procedureType = "General Safety",
  dutchLanguageOptimization = [],
  ...props
}) => {
  return (
    <FAQSchemaProvider
      {...props}
      contentTypeDutch={`${procedureType} Veelgestelde Vragen`}
      dutchLanguageOptimization={[
        "veiligheidsprocedures",
        "veiligheidsrichtlijnen",
        "veiligheidsmaatregelen",
        "veilig werken",
        "veiligheidsvoorschriften",
        ...dutchLanguageOptimization,
      ]}
    />
  );
};

/**
 * Specialized schema provider for LMRA execution FAQs
 */
interface LMRAFAQSchemaProviderProps extends Omit<FAQSchemaProviderProps, "contentTypeDutch"> {
  lmraContext?: string;
}

export const LMRAFAQSchemaProvider: React.FC<LMRAFAQSchemaProviderProps> = ({
  lmraContext = "General LMRA",
  dutchLanguageOptimization = [],
  ...props
}) => {
  return (
    <FAQSchemaProvider
      {...props}
      contentTypeDutch={`LMRA Veelgestelde Vragen - ${lmraContext}`}
      dutchLanguageOptimization={[
        "Laatste Minuut Risico Analyse",
        "veiligheidsinspectie",
        "werkplekinspectie",
        "veiligheidscontrole",
        "veiligheidsmaatregelen",
        "stop werk procedure",
        ...dutchLanguageOptimization,
      ]}
    />
  );
};

/**
 * Specialized schema provider for hazard identification FAQs
 */
interface HazardFAQSchemaProviderProps extends Omit<FAQSchemaProviderProps, "contentTypeDutch"> {
  hazardCategory?: string;
}

export const HazardFAQSchemaProvider: React.FC<HazardFAQSchemaProviderProps> = ({
  hazardCategory = "General Hazards",
  dutchLanguageOptimization = [],
  ...props
}) => {
  return (
    <FAQSchemaProvider
      {...props}
      contentTypeDutch={`Gevarenherkenning Veelgestelde Vragen - ${hazardCategory}`}
      dutchLanguageOptimization={[
        "gevarenherkenning",
        "risicoanalyse",
        "veiligheidsrisico",
        "gevaarlijk werk",
        "veiligheidsmaatregelen",
        "beschermingsmiddelen",
        ...dutchLanguageOptimization,
      ]}
    />
  );
};

/**
 * Specialized schema provider for equipment safety FAQs
 */
interface EquipmentFAQSchemaProviderProps extends Omit<FAQSchemaProviderProps, "contentTypeDutch"> {
  equipmentType?: string;
}

export const EquipmentFAQSchemaProvider: React.FC<EquipmentFAQSchemaProviderProps> = ({
  equipmentType = "Safety Equipment",
  dutchLanguageOptimization = [],
  ...props
}) => {
  return (
    <FAQSchemaProvider
      {...props}
      contentTypeDutch={`${equipmentType} Veelgestelde Vragen`}
      dutchLanguageOptimization={[
        "veiligheidsuitrusting",
        "beschermingsmiddelen",
        "veilig gebruik",
        "onderhoud",
        "veiligheidskeuring",
        "veiligheidsvoorschriften",
        ...dutchLanguageOptimization,
      ]}
    />
  );
};

/**
 * Predefined FAQ content for common safety questions
 */
export const COMMON_SAFETY_FAQS = {
  vca: [
    {
      question: "Wat is VCA certificering?",
      answer:
        "VCA staat voor Veiligheid, Gezondheid en Milieu (VGM) Checklist Aannemers. Het is een certificeringsprogramma dat de veiligheid op de werkplek waarborgt in de Nederlandse bouw- en industriesector.",
    },
    {
      question: "Hoe lang is een VCA certificaat geldig?",
      answer:
        "Een VCA certificaat is 10 jaar geldig. Echter, de VCA-checklist zelf wordt regelmatig bijgewerkt, dus het is belangrijk om op de hoogte te blijven van de nieuwste versie.",
    },
    {
      question: "Welke VCA versies zijn er beschikbaar?",
      answer:
        "De meest recente versie is VCA 2017 v5.1. Er zijn verschillende VCA certificaten: VCA*, VCA** (voor leidinggevenden), en VCA Petrochemie voor de petrochemische industrie.",
    },
  ],
  lmra: [
    {
      question: "Wanneer moet ik een LMRA uitvoeren?",
      answer:
        "Een Laatste Minuut Risico Analyse (LMRA) moet worden uitgevoerd voordat u begint met een taak, vooral wanneer de werkomstandigheden zijn veranderd of wanneer u een nieuwe taak uitvoert.",
    },
    {
      question: "Wat zijn de 8 stappen van een LMRA?",
      answer:
        "De 8 stappen zijn: 1) Stop en denk na, 2) Identificeer gevaren, 3) Beoordeel risico's, 4) Bepaal maatregelen, 5) Voer taak uit, 6) Controleer tijdens uitvoering, 7) Stop bij gevaar, 8) Evalueer na afloop.",
    },
    {
      question: 'Wanneer zeg ik "Stop werk"?',
      answer:
        'Zeg "Stop werk" wanneer u een onveilige situatie ontdekt die niet onmiddellijk kan worden opgelost. Veiligheid heeft altijd prioriteit boven productiviteit.',
    },
  ],
  hazards: [
    {
      question: "Wat zijn de meest voorkomende gevaren op bouwplaatsen?",
      answer:
        "De meest voorkomende gevaren zijn: vallen van hoogte, struikelen en uitglijden, werken met gevaarlijke stoffen, lawaai, trillingen, en werken met bewegende machines.",
    },
    {
      question: "Hoe herken ik een gevaarlijke situatie?",
      answer:
        "Een gevaarlijke situatie herkent u aan: afwijkende geluiden, vreemde geuren, lekkages, beschadigde apparatuur, onstabiele constructies, en situaties die afwijken van de normale werkprocedures.",
    },
    {
      question: "Wat is de hiërarchie van veiligheidsmaatregelen?",
      answer:
        "De hiërarchie is: 1) Eliminatie, 2) Substitutie, 3) Technische maatregelen, 4) Organisatorische maatregelen, 5) Persoonlijke beschermingsmiddelen (PBM).",
    },
  ],
};

/**
 * Utility function to generate FAQ schema for dynamic content
 * Note: This is a pure function that doesn't use React hooks
 */
export const createFAQSchema = (data: Omit<FAQSchema, "@context" | "@type">): FAQSchema => {
  // This is a pure function that doesn't use React hooks
  // The hook-based generation should be done in React components
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...data,
  } as FAQSchema;
};

/**
 * Hook to manage FAQ content with schema integration
 */
export const useFAQSchema = () => {
  const generateVCAFAQs = (vcaVersion?: string): typeof COMMON_SAFETY_FAQS.vca => {
    return COMMON_SAFETY_FAQS.vca;
  };

  const generateLMRAFAQs = (): typeof COMMON_SAFETY_FAQS.lmra => {
    return COMMON_SAFETY_FAQS.lmra;
  };

  const generateHazardFAQs = (): typeof COMMON_SAFETY_FAQS.hazards => {
    return COMMON_SAFETY_FAQS.hazards;
  };

  return {
    generateVCAFAQs,
    generateLMRAFAQs,
    generateHazardFAQs,
    commonFAQs: COMMON_SAFETY_FAQS,
  };
};

export default FAQSchemaProvider;
