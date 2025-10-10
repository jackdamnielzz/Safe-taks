/**
 * SEO Integration System for SafeWork Pro
 * Comprehensive integration of schema markup with existing SEO strategy
 */

import { Metadata } from "next";
import { SCHEMA_STRATEGY } from "./schema-strategy";

export interface SEOMetadata extends Metadata {
  title?: string;
  description?: string;
  keywords?: string;
  openGraph?: {
    title?: string;
    description?: string;
    type?: string;
    url?: string;
    siteName?: string;
    locale?: string;
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    images?: string[];
    creator?: string;
  };
  robots?: string;
  canonical?: string;
  schema?: any[];
}

export interface PageSEOConfig {
  pageType:
    | "homepage"
    | "landing"
    | "product"
    | "article"
    | "faq"
    | "organization"
    | "event"
    | "dataset";
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  image?: string;
  schemaData?: Record<string, any>;
  locale?: string;
  lastModified?: string;
  publishDate?: string;
}

/**
 * Core SEO Integration Service
 */
export class SEOIntegrationService {
  private static instance: SEOIntegrationService;
  private schemaRegistry: Map<string, any[]> = new Map();

  static getInstance(): SEOIntegrationService {
    if (!SEOIntegrationService.instance) {
      SEOIntegrationService.instance = new SEOIntegrationService();
    }
    return SEOIntegrationService.instance;
  }

  /**
   * Generate comprehensive SEO metadata with schema integration
   */
  generateSEOMetadata(config: PageSEOConfig): SEOMetadata {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://app.safeworkpro.nl";
    const canonicalUrl =
      config.canonicalUrl || `${baseUrl}${this.getDefaultCanonical(config.pageType)}`;

    // Generate Open Graph data from schema
    const openGraph = this.generateOpenGraphData(config);

    // Generate Twitter Card data
    const twitter = this.generateTwitterCardData(config);

    // Generate robots directive based on page type
    const robots = this.generateRobotsDirective(config.pageType);

    // Generate schema markup
    const schema = this.generatePageSchema(config);

    return {
      title: config.title,
      description: config.description,
      keywords: config.keywords?.join(", "),
      authors: [{ name: "SafeWork Pro B.V.", url: "https://safeworkpro.nl" }],
      creator: "SafeWork Pro B.V.",
      publisher: "SafeWork Pro B.V.",
      formatDetection: {
        email: false,
        address: false,
        telephone: false,
      },
      metadataBase: new URL(baseUrl),
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph,
      twitter,
      robots,
      schema,
      other: {
        "article:author": "SafeWork Pro B.V.",
        "article:publisher": "https://safeworkpro.nl",
        "article:section": this.getArticleSection(config.pageType),
        ...(config.keywords &&
          config.keywords.length > 0 && {
            "article:tag": config.keywords.join(","),
          }),
      },
    };
  }

  /**
   * Generate Open Graph data from page configuration
   */
  private generateOpenGraphData(config: PageSEOConfig) {
    const baseImage = config.image || "/og-image-default.png";

    return {
      title: config.title,
      description: config.description,
      url: this.getDefaultCanonical(config.pageType),
      siteName: "SafeWork Pro",
      locale: config.locale || "nl_NL",
      type: this.getOpenGraphType(config.pageType),
      images: [
        {
          url: baseImage,
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
      ...(config.pageType === "article" && {
        article: {
          publishedTime: config.publishDate,
          modifiedTime: config.lastModified,
          authors: ["SafeWork Pro B.V."],
          tags: config.keywords,
        },
      }),
    };
  }

  /**
   * Generate Twitter Card data
   */
  private generateTwitterCardData(config: PageSEOConfig) {
    return {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
      images: [config.image || "/og-image-default.png"],
      creator: "@SafeWorkPro",
      site: "@SafeWorkPro",
    };
  }

  /**
   * Generate robots directive based on page type
   */
  private generateRobotsDirective(pageType: string): string {
    const baseRobots = "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1";

    switch (pageType) {
      case "homepage":
        return `${baseRobots},max-snippet:-1`;
      case "article":
        return `${baseRobots},max-snippet:-1`;
      case "product":
        return `${baseRobots},max-snippet:-1`;
      case "faq":
        return `${baseRobots},max-snippet:-1`;
      default:
        return baseRobots;
    }
  }

  /**
   * Get default canonical URL for page type
   */
  private getDefaultCanonical(pageType: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://app.safeworkpro.nl";

    switch (pageType) {
      case "homepage":
        return "/";
      case "landing":
        return "/landing";
      case "product":
        return "/pricing";
      case "article":
        return "/docs";
      case "faq":
        return "/help";
      case "organization":
        return "/about";
      case "event":
        return "/events";
      case "dataset":
        return "/hazards";
      default:
        return "/";
    }
  }

  /**
   * Get Open Graph type for page type
   */
  private getOpenGraphType(pageType: string): string {
    switch (pageType) {
      case "homepage":
      case "landing":
        return "website";
      case "product":
        return "product";
      case "article":
        return "article";
      case "faq":
        return "website";
      case "organization":
        return "website";
      case "event":
        return "event";
      case "dataset":
        return "website";
      default:
        return "website";
    }
  }

  /**
   * Get article section for structured data
   */
  private getArticleSection(pageType: string): string {
    switch (pageType) {
      case "homepage":
        return "Home";
      case "landing":
        return "Product";
      case "product":
        return "Pricing";
      case "article":
        return "Documentation";
      case "faq":
        return "Help";
      case "organization":
        return "About";
      case "event":
        return "Events";
      case "dataset":
        return "Safety Data";
      default:
        return "General";
    }
  }

  /**
   * Generate schema markup for page
   */
  private generatePageSchema(config: PageSEOConfig): any[] {
    const schemas: any[] = [];

    // Always include Organization schema on every page
    schemas.push(this.generateOrganizationSchema());

    // Add page-specific schema
    switch (config.pageType) {
      case "homepage":
        schemas.push(...this.generateHomepageSchemas(config));
        break;
      case "landing":
        schemas.push(...this.generateLandingSchemas(config));
        break;
      case "product":
        schemas.push(...this.generateProductSchemas(config));
        break;
      case "article":
        schemas.push(...this.generateArticleSchemas(config));
        break;
      case "faq":
        schemas.push(...this.generateFAQSchemas(config));
        break;
      case "event":
        schemas.push(...this.generateEventSchemas(config));
        break;
      case "dataset":
        schemas.push(...this.generateDatasetSchemas(config));
        break;
    }

    return schemas;
  }

  /**
   * Generate Organization schema for SafeWork Pro
   */
  private generateOrganizationSchema() {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "SafeWork Pro B.V.",
      description:
        "Professionele software voor TRA en LMRA veiligheidsbeheer in de bouw- en industriesector",
      url: "https://safeworkpro.nl",
      logo: "https://safeworkpro.nl/logo.png",
      foundingDate: "2024",
      address: {
        "@type": "PostalAddress",
        addressCountry: "NL",
        addressLocality: "Nederland",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: "info@safeworkpro.nl",
        availableLanguage: "Dutch",
      },
      sameAs: ["https://linkedin.com/company/safework-pro", "https://twitter.com/safeworkpro"],
      knowsAbout: [
        "Veiligheidsmanagement",
        "TRA (Taak Risico Analyse)",
        "LMRA (Laatste Minuut Risico Analyse)",
        "VCA Compliance",
        "ISO 45001",
        "Bouwveiligheid",
        "Industriële veiligheid",
      ],
      areaServed: "NL",
      serviceArea: {
        "@type": "Country",
        name: "Nederland",
      },
    };
  }

  /**
   * Generate homepage-specific schemas
   */
  private generateHomepageSchemas(config: PageSEOConfig) {
    return [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "SafeWork Pro",
        description: config.description,
        url: "https://safeworkpro.nl",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://app.safeworkpro.nl/search?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "SafeWork Pro",
        description: "Digital TRA and LMRA safety management platform",
        operatingSystem: "Web, iOS, Android",
        applicationCategory: "BusinessApplication",
        offers: {
          "@type": "Offer",
          price: "49",
          priceCurrency: "EUR",
          priceSpecification: {
            "@type": "PriceSpecification",
            price: "49",
            priceCurrency: "EUR",
            valueAddedTaxIncluded: true,
          },
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "150",
        },
      },
    ];
  }

  /**
   * Generate landing page schemas
   */
  private generateLandingSchemas(config: PageSEOConfig) {
    return [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "SafeWork Pro SaaS Platform",
        description: config.description,
        brand: {
          "@type": "Brand",
          name: "SafeWork Pro B.V.",
        },
        category: "Safety Management Software",
        offers: [
          {
            "@type": "Offer",
            price: "49",
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            priceSpecification: {
              "@type": "PriceSpecification",
              price: "49",
              priceCurrency: "EUR",
              valueAddedTaxIncluded: true,
            },
          },
        ],
      },
    ];
  }

  /**
   * Generate product page schemas
   */
  private generateProductSchemas(config: PageSEOConfig) {
    return [
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "TRA & LMRA Safety Management",
        description: config.description,
        provider: {
          "@type": "Organization",
          name: "SafeWork Pro B.V.",
        },
        serviceType: "Safety Management Software",
        areaServed: "NL",
        serviceOutput: "Digital safety documentation and compliance",
      },
    ];
  }

  /**
   * Generate article schemas
   */
  private generateArticleSchemas(config: PageSEOConfig) {
    return [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: config.title,
        description: config.description,
        author: {
          "@type": "Organization",
          name: "SafeWork Pro B.V.",
          url: "https://safeworkpro.nl",
        },
        publisher: {
          "@type": "Organization",
          name: "SafeWork Pro B.V.",
          logo: {
            "@type": "ImageObject",
            url: "https://safeworkpro.nl/logo.png",
          },
        },
        datePublished: config.publishDate || new Date().toISOString(),
        dateModified: config.lastModified || new Date().toISOString(),
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": this.getDefaultCanonical(config.pageType),
        },
        articleSection: this.getArticleSection(config.pageType),
        keywords: config.keywords?.join(", "),
      },
    ];
  }

  /**
   * Generate FAQ schemas
   */
  private generateFAQSchemas(config: PageSEOConfig) {
    return [
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Wat is een TRA (Taak Risico Analyse)?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Een TRA is een systematische methode om risico's te identificeren en beheersen voordat werkzaamheden beginnen.",
            },
          },
          {
            "@type": "Question",
            name: "Wat is een LMRA (Laatste Minuut Risico Analyse)?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Een LMRA is een laatste controle voordat werkzaamheden starten om nieuwe risico's te identificeren.",
            },
          },
        ],
      },
    ];
  }

  /**
   * Generate event schemas
   */
  private generateEventSchemas(config: PageSEOConfig) {
    return [
      {
        "@context": "https://schema.org",
        "@type": "Event",
        name: "LMRA Safety Sessions",
        description: config.description,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        location: {
          "@type": "Place",
          name: "Construction and Industrial Sites",
          address: {
            "@type": "PostalAddress",
            addressCountry: "NL",
          },
        },
        organizer: {
          "@type": "Organization",
          name: "SafeWork Pro B.V.",
        },
      },
    ];
  }

  /**
   * Generate dataset schemas
   */
  private generateDatasetSchemas(config: PageSEOConfig) {
    return [
      {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: "Hazard Identification Database",
        description: "Comprehensive database of workplace hazards for safety management",
        creator: {
          "@type": "Organization",
          name: "SafeWork Pro B.V.",
        },
        publisher: {
          "@type": "Organization",
          name: "SafeWork Pro B.V.",
        },
        datePublished: "2024-01-01",
        dateModified: new Date().toISOString(),
        spatialCoverage: {
          "@type": "Place",
          name: "Netherlands",
        },
        temporalCoverage: "2024/",
        license: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      },
    ];
  }

  /**
   * Register schema for global management
   */
  registerSchema(pageType: string, schema: any[]) {
    this.schemaRegistry.set(pageType, schema);
  }

  /**
   * Get registered schemas
   */
  getRegisteredSchemas(): Map<string, any[]> {
    return new Map(this.schemaRegistry);
  }

  /**
   * Clear schema registry
   */
  clearSchemaRegistry() {
    this.schemaRegistry.clear();
  }
}

/**
 * Generate Dutch-localized content for schema
 */
export function generateDutchContent(contentType: "safety" | "compliance" | "industry") {
  const dutchContent = {
    safety: {
      keywords: [
        "veiligheid",
        "veiligheidsmanagement",
        "arbeidsveiligheid",
        "bouwveiligheid",
        "industriële veiligheid",
        "veilig werken",
        "risicoanalyse",
        "veiligheidsinspectie",
      ],
      description: "Professionele veiligheidsmanagement software voor bouw en industrie",
      expertise: [
        "VCA compliance",
        "ISO 45001 certificering",
        "ARBO wetgeving",
        "Risico-inventarisatie en -evaluatie",
        "Veiligheidsplannen",
        "Werkplekinspecties",
      ],
    },
    compliance: {
      keywords: [
        "VCA certificering",
        "ISO 45001",
        "ARBO compliance",
        "veiligheidsnormen",
        "regelgeving",
        "certificering",
        "audit",
        "veiligheidsbeleid",
      ],
      description: "VCA en ISO 45001 compliance ondersteuning voor veiligheidsmanagement",
      expertise: [
        "VCA 2017/5.1 certificering",
        "ISO 45001 implementatie",
        "ARBO wetgeving compliance",
        "Audit voorbereiding",
      ],
    },
    industry: {
      keywords: [
        "bouwsector",
        "industrie",
        "techniek",
        "infrastructuur",
        "utiliteit",
        "civiele techniek",
        "installatietechniek",
        "metaalindustrie",
      ],
      description: "Gespecialiseerde veiligheidssoftware voor bouw- en industriesector",
      expertise: [
        "Bouwveiligheid",
        "Industriële veiligheid",
        "Technische installaties",
        "Infrastructuur projecten",
        "Utiliteitsbouw",
      ],
    },
  };

  return dutchContent[contentType] || dutchContent.safety;
}

/**
 * SEO utility functions for common operations
 */
export const SEOUtils = {
  /**
   * Generate meta description from content
   */
  generateMetaDescription(content: string, maxLength: number = 155): string {
    if (content.length <= maxLength) return content;

    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");

    return lastSpace > 0 ? truncated.substring(0, lastSpace) + "..." : truncated + "...";
  },

  /**
   * Generate keywords from content and existing keywords
   */
  generateKeywords(content: string, existingKeywords: string[] = []): string[] {
    const dutchStopWords = [
      "de",
      "het",
      "een",
      "en",
      "van",
      "op",
      "in",
      "te",
      "voor",
      "met",
      "bij",
      "naar",
      "uit",
      "over",
      "door",
      "als",
      "bij",
      "tot",
      "aan",
    ];

    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !dutchStopWords.includes(word));

    const wordCount = words.reduce(
      (acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const sortedWords = Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    return [...new Set([...existingKeywords, ...sortedWords])];
  },

  /**
   * Generate canonical URL for dynamic pages
   */
  generateCanonicalUrl(basePath: string, params: Record<string, string | number> = {}): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://app.safeworkpro.nl";
    let url = `${baseUrl}${basePath}`;

    const queryParams = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join("&");

    if (queryParams) {
      url += `?${queryParams}`;
    }

    return url;
  },

  /**
   * Generate structured data for safety-specific content
   */
  generateSafetyStructuredData(contentType: "tra" | "lmra" | "hazard" | "template", data: any) {
    const baseSchema = {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      creator: {
        "@type": "Organization",
        name: "SafeWork Pro B.V.",
      },
      publisher: {
        "@type": "Organization",
        name: "SafeWork Pro B.V.",
      },
      dateModified: new Date().toISOString(),
      inLanguage: "nl-NL",
    };

    switch (contentType) {
      case "tra":
        return {
          ...baseSchema,
          "@type": "Article",
          headline: `TRA: ${data.title || "Taak Risico Analyse"}`,
          description: data.description || "Taak Risico Analyse voor veiligheidsmanagement",
          articleSection: "Safety Management",
          keywords: ["TRA", "veiligheid", "risicoanalyse", "bouw", "industrie"],
        };

      case "lmra":
        return {
          ...baseSchema,
          "@type": "Event",
          name: `LMRA: ${data.title || "Laatste Minuut Risico Analyse"}`,
          description:
            data.description || "Laatste Minuut Risico Analyse voor operationele veiligheid",
          startDate: data.startDate || new Date().toISOString(),
          location: data.location || "Construction/Industrial Site",
        };

      case "hazard":
        return {
          ...baseSchema,
          "@type": "Dataset",
          name: `Hazard: ${data.name || "Arbeidsrisico"}`,
          description: data.description || "Geïdentificeerd arbeidsrisico in veiligheidsmanagement",
          keywords: ["hazard", "risico", "veiligheid", "arbeidsongeval", "preventie"],
        };

      case "template":
        return {
          ...baseSchema,
          "@type": "Product",
          name: `Template: ${data.name || "Veiligheidssjabloon"}`,
          description: data.description || "Professioneel veiligheidssjabloon voor compliance",
          category: "Safety Management Template",
        };

      default:
        return baseSchema;
    }
  },
};

/**
 * React hook for SEO integration
 */
export function useSEOIntegration() {
  const seoService = SEOIntegrationService.getInstance();

  const generateMetadata = (config: PageSEOConfig): SEOMetadata => {
    return seoService.generateSEOMetadata(config);
  };

  const generateDutchContent = (type: "safety" | "compliance" | "industry") => {
    return generateDutchContent(type);
  };

  const generateSafetyStructuredData = (
    contentType: "tra" | "lmra" | "hazard" | "template",
    data: any
  ) => {
    return SEOUtils.generateSafetyStructuredData(contentType, data);
  };

  return {
    generateMetadata,
    generateDutchContent,
    generateSafetyStructuredData,
    seoUtils: SEOUtils,
  };
}

/**
 * Next.js metadata generator for pages
 */
export function generatePageMetadata(config: PageSEOConfig): Metadata {
  const seoService = SEOIntegrationService.getInstance();
  const metadata = seoService.generateSEOMetadata(config);

  // Return Next.js Metadata format (without schema, as it needs to be handled separately)
  const { schema, ...nextMetadata } = metadata;

  return nextMetadata;
}

/**
 * Schema integration helper for pages
 */
export function generatePageSchema(config: PageSEOConfig): any[] {
  const seoService = SEOIntegrationService.getInstance();
  return seoService.generateSEOMetadata(config).schema || [];
}

export default SEOIntegrationService;
