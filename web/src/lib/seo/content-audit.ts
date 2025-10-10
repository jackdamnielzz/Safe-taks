/**
 * Content Audit for Schema Markup Opportunities
 * Analyzes SafeWork Pro content structure for AI/LLM optimization
 */

export interface ContentTypeAnalysis {
  contentType: string;
  contentTypeDutch: string;
  description: string;
  descriptionDutch: string;
  dataStructure: string;
  estimatedVolume: string;
  schemaOpportunities: SchemaOpportunity[];
  aiOptimizationPotential: "high" | "medium" | "low";
  priority: number; // 1-10 scale
  dutchLanguageOptimization: string[];
}

export interface SchemaOpportunity {
  schemaType: string;
  rationale: string;
  benefits: string[];
  implementationComplexity: "low" | "medium" | "high";
  aiValue: "high" | "medium" | "low";
}

/**
 * Content Audit Results - SafeWork Pro Schema Markup Analysis
 */
export const CONTENT_AUDIT_RESULTS: ContentTypeAnalysis[] = [
  {
    contentType: "TRA Documents (Task Risk Analysis)",
    contentTypeDutch: "TRA Documenten (Taak Risico Analyse)",
    description:
      "Comprehensive risk assessment documents with structured hazard identification, risk scoring, and control measures",
    descriptionDutch:
      "Uitgebreide risicoanalyse documenten met gestructureerde gevarenidentificatie, risicoscores en beheersmaatregelen",
    dataStructure:
      "Highly structured with Kinney & Wiruth methodology, task steps, hazards, control measures, approval workflows",
    estimatedVolume: "Variable - 10-100+ TRAs per organization",
    schemaOpportunities: [
      {
        schemaType: "Article",
        rationale:
          "TRA documents are comprehensive safety documents with clear structure, authorship, and publication dates",
        benefits: [
          "Enhanced rich snippets in search results",
          "Better content attribution and credibility",
          "Improved discoverability for safety professionals",
        ],
        implementationComplexity: "medium",
        aiValue: "high",
      },
      {
        schemaType: "Dataset",
        rationale:
          "TRA data contains structured risk assessment data that could be valuable for safety research",
        benefits: [
          "Research accessibility for safety studies",
          "Industry benchmarking capabilities",
          "Regulatory compliance transparency",
        ],
        implementationComplexity: "high",
        aiValue: "medium",
      },
    ],
    aiOptimizationPotential: "high",
    priority: 9,
    dutchLanguageOptimization: [
      "Nederlandse veiligheidsdocumentatie met VCA terminologie",
      "Risicoanalyse volgens Nederlandse normen en wetgeving",
      "Beheersmaatregelen afgestemd op Nederlandse bouwpraktijk",
      "Goedkeuringsworkflow volgens lokale procedures",
    ],
  },
  {
    contentType: "LMRA Sessions (Last Minute Risk Assessment)",
    contentTypeDutch: "LMRA Sessies (Laatste Minuut Risico Analyse)",
    description:
      "Mobile safety assessments with location verification, weather conditions, personnel and equipment checks",
    descriptionDutch:
      "Mobiele veiligheidsbeoordelingen met locatieverificatie, weersomstandigheden, personeel- en equipmentcontroles",
    dataStructure:
      "Structured workflow with 8 verification steps, GPS location, weather API integration, photo documentation",
    estimatedVolume: "High volume - 50-500+ LMRA sessions per organization per month",
    schemaOpportunities: [
      {
        schemaType: "Event",
        rationale:
          "LMRA sessions are time-specific safety events with location, participants, and outcomes",
        benefits: [
          "Enhanced event discoverability",
          "Location-based safety tracking",
          "Training and compliance verification",
        ],
        implementationComplexity: "medium",
        aiValue: "high",
      },
      {
        schemaType: "Article",
        rationale: "LMRA execution records contain detailed safety assessment information",
        benefits: [
          "Rich snippets for safety documentation",
          "Better search visibility for field procedures",
          "Professional credibility enhancement",
        ],
        implementationComplexity: "low",
        aiValue: "medium",
      },
    ],
    aiOptimizationPotential: "high",
    priority: 8,
    dutchLanguageOptimization: [
      "Nederlandse veiligheidsprotocollen en procedures",
      "Lokale weersomstandigheden via Nederlandse APIs",
      "Personeel competentie checks volgens Nederlandse normen",
      "Equipment verificatie met Nederlandse veiligheidsstandaarden",
    ],
  },
  {
    contentType: "Safety Templates",
    contentTypeDutch: "Veiligheid Sjablonen",
    description:
      "Industry-specific TRA templates for different work types (construction, electrical, plumbing, roofing, excavation, painting)",
    descriptionDutch:
      "Branche-specifieke TRA sjablonen voor verschillende werksoorten (bouw, elektra, loodgieter, dakwerk, grondwerk, schilderwerk)",
    dataStructure:
      "Structured templates with predefined hazards, control measures, and industry-specific requirements",
    estimatedVolume: "6 core templates with potential for expansion to 20+ industry variants",
    schemaOpportunities: [
      {
        schemaType: "Product",
        rationale:
          "Safety templates are reusable products with clear value propositions and industry categorization",
        benefits: [
          "Template marketplace visibility",
          "Industry-specific search targeting",
          "Pricing and feature comparison in search",
        ],
        implementationComplexity: "low",
        aiValue: "high",
      },
      {
        schemaType: "HowTo",
        rationale: "Templates provide step-by-step safety procedures for specific work types",
        benefits: [
          "Enhanced how-to rich results",
          "Voice search optimization for procedures",
          "Step-by-step guidance in search results",
        ],
        implementationComplexity: "medium",
        aiValue: "high",
      },
    ],
    aiOptimizationPotential: "high",
    priority: 7,
    dutchLanguageOptimization: [
      "VCA-conforme sjablonen voor Nederlandse bouwsector",
      "Branche-specifieke gevaren en beheersmaatregelen",
      "Nederlandse terminologie en wetgeving",
      "Praktijkvoorbeelden uit Nederlandse bouw/industrie",
    ],
  },
  {
    contentType: "Hazard Database",
    contentTypeDutch: "Gevaren Database",
    description:
      "100+ categorized hazards with risk assessments, control measures, and industry classifications",
    descriptionDutch:
      "100+ gecategoriseerde gevaren met risicoanalyses, beheersmaatregelen en brancheclassificaties",
    dataStructure:
      "Structured hazard library with categories, severity levels, keywords, and control recommendations",
    estimatedVolume: "100+ hazards with potential for growth to 500+ entries",
    schemaOpportunities: [
      {
        schemaType: "Dataset",
        rationale:
          "Hazard database is a comprehensive safety dataset valuable for research and AI training",
        benefits: [
          "Research accessibility and citation",
          "Industry safety benchmarking",
          "Regulatory transparency and compliance",
        ],
        implementationComplexity: "high",
        aiValue: "high",
      },
      {
        schemaType: "FAQPage",
        rationale: "Hazard information can be structured as safety questions and answers",
        benefits: [
          "Direct answers in voice search",
          "Enhanced safety knowledge base",
          "Professional expertise demonstration",
        ],
        implementationComplexity: "medium",
        aiValue: "medium",
      },
    ],
    aiOptimizationPotential: "medium",
    priority: 6,
    dutchLanguageOptimization: [
      "Nederlandse gevarenclassificatie en terminologie",
      "Beheersmaatregelen volgens Nederlandse wetgeving",
      "Branche-specifieke risicoanalyses",
      "Lokale veiligheidsnormen en richtlijnen",
    ],
  },
  {
    contentType: "Safety Guides & Documentation",
    contentTypeDutch: "Veiligheidsgidsen & Documentatie",
    description:
      "Best practices, procedures, and safety documentation for construction and industrial work",
    descriptionDutch:
      "Best practices, procedures en veiligheidsdocumentatie voor bouw en industrieel werk",
    dataStructure: "Article-style content with sections, procedures, and compliance information",
    estimatedVolume: "20-50 guides covering various safety topics and procedures",
    schemaOpportunities: [
      {
        schemaType: "Article",
        rationale:
          "Safety guides are authoritative articles with clear authorship and publication structure",
        benefits: [
          "Rich snippets for safety documentation",
          "Enhanced E-A-T signals for expertise",
          "Better content discoverability",
        ],
        implementationComplexity: "low",
        aiValue: "high",
      },
      {
        schemaType: "FAQPage",
        rationale:
          "Safety procedures often contain frequently asked questions about compliance and best practices",
        benefits: [
          "Direct answers in search results",
          "Voice search optimization",
          "Knowledge base enhancement",
        ],
        implementationComplexity: "low",
        aiValue: "high",
      },
    ],
    aiOptimizationPotential: "high",
    priority: 8,
    dutchLanguageOptimization: [
      "Nederlandstalige veiligheidsdocumentatie",
      "VCA en ISO 45001 compliance informatie",
      "Praktische handleidingen voor Nederlandse markt",
      "Lokale wet- en regelgeving referenties",
    ],
  },
  {
    contentType: "Organization Information",
    contentTypeDutch: "Organisatie Informatie",
    description: "Company details, certifications, contact information, and safety credentials",
    descriptionDutch:
      "Bedrijfsgegevens, certificeringen, contactinformatie en veiligheidskwalificaties",
    dataStructure:
      "Business information with certifications, locations, contact details, and service areas",
    estimatedVolume:
      "1 primary organization record per customer with potential for multiple locations",
    schemaOpportunities: [
      {
        schemaType: "Organization",
        rationale: "SafeWork Pro is a B2B SaaS company providing safety management solutions",
        benefits: [
          "Enhanced local business visibility",
          "Knowledge panel optimization",
          "Trust and credibility signals",
        ],
        implementationComplexity: "low",
        aiValue: "medium",
      },
      {
        schemaType: "LocalBusiness",
        rationale:
          "Safety management services with geographic service areas and contact information",
        benefits: [
          "Local search optimization",
          "Contact information in search results",
          "Business profile enhancement",
        ],
        implementationComplexity: "low",
        aiValue: "medium",
      },
    ],
    aiOptimizationPotential: "medium",
    priority: 5,
    dutchLanguageOptimization: [
      "Nederlandse bedrijfsregistratie en vindbaarheid",
      "VCA-certificering en ISO 45001 accreditatie",
      "Lokale contactgegevens en ondersteuning",
      "Nederlandse markt focus en expertise",
    ],
  },
];

/**
 * Priority ranking for schema implementation
 */
export function getImplementationPriority(): ContentTypeAnalysis[] {
  return CONTENT_AUDIT_RESULTS.sort((a, b) => b.priority - a.priority);
}

/**
 * Get content types with high AI optimization potential
 */
export function getHighAIValueContent(): ContentTypeAnalysis[] {
  return CONTENT_AUDIT_RESULTS.filter((content) => content.aiOptimizationPotential === "high");
}

/**
 * Get schema types that provide immediate SEO benefits
 */
export function getQuickWinSchemas(): string[] {
  const quickWins = [
    "Organization", // Immediate business profile enhancement
    "Article", // Rich snippets for content
    "FAQPage", // Voice search and direct answers
    "Product", // Template marketplace visibility
  ];
  return quickWins;
}

/**
 * Calculate total schema markup opportunities
 */
export function getSchemaOpportunitySummary() {
  const totalContentTypes = CONTENT_AUDIT_RESULTS.length;
  const totalSchemas = CONTENT_AUDIT_RESULTS.reduce(
    (sum, content) => sum + content.schemaOpportunities.length,
    0
  );

  const highAIValue = CONTENT_AUDIT_RESULTS.filter(
    (c) => c.aiOptimizationPotential === "high"
  ).length;
  const mediumAIValue = CONTENT_AUDIT_RESULTS.filter(
    (c) => c.aiOptimizationPotential === "medium"
  ).length;

  return {
    totalContentTypes,
    totalSchemas,
    highAIValue,
    mediumAIValue,
    implementationComplexity: {
      low: CONTENT_AUDIT_RESULTS.filter((c) =>
        c.schemaOpportunities.some((s) => s.implementationComplexity === "low")
      ).length,
      medium: CONTENT_AUDIT_RESULTS.filter((c) =>
        c.schemaOpportunities.some((s) => s.implementationComplexity === "medium")
      ).length,
      high: CONTENT_AUDIT_RESULTS.filter((c) =>
        c.schemaOpportunities.some((s) => s.implementationComplexity === "high")
      ).length,
    },
  };
}
