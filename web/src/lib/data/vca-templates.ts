/**
 * VCA-Compliant TRA Templates for Dutch Construction Industry
 *
 * These templates provide industry-specific Task Risk Analysis structures
 * compliant with VCA (Veiligheid Checklist Aannemers) standards.
 *
 * All templates include:
 * - Industry-specific hazards
 * - Kinney & Wiruth risk scores
 * - Hierarchy of Controls (elimination → substitution → engineering → administrative → PPE)
 * - Dutch safety terminology
 * - VCA compliance metadata
 */

import type { TRATemplate } from "../types/template";

export const VCA_TEMPLATES: Omit<
  TRATemplate,
  "id" | "organizationId" | "createdBy" | "createdByName" | "createdAt" | "updatedAt"
>[] = [
  // ============================================================================
  // 1. BOUW & CONSTRUCTIE (General Construction)
  // ============================================================================
  {
    name: "Algemene Bouwwerkzaamheden",
    description:
      "Standaard TRA template voor algemene bouwwerkzaamheden op locatie. Inclusief steigers, gereedschap en bouwmaterialen.",
    industryCategory: "construction",
    hazardCategories: ["mechanical", "physical", "ergonomic", "environmental"],
    tags: ["bouw", "constructie", "steiger", "algemeen"],
    complianceFramework: "vca",
    vcaCertified: true,
    vcaVersion: "VCA 2017 v5.1",
    taskStepsTemplate: [
      {
        stepNumber: 1,
        description: "Voorbereiden werkplek en opstellen steiger",
        duration: 60,
        requiredPersonnel: 2,
        equipment: ["Steiger", "Gereedschap", "Persoonlijke beschermingsmiddelen"],
        hazards: [
          {
            id: "h1-1",
            description: "Vallen van hoogte tijdens steigeropbouw",
            category: "physical",
            typicalEffect: 40, // Serious injury - permanent disability
            typicalExposure: 2, // Once per month
            typicalProbability: 1, // Could happen
            recommendedControls: [
              {
                type: "engineering",
                description: "Gebruik gecertificeerde steigers met leuningen en plintplanken",
                priority: 1,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Steigerbouwers moeten NEN 2484 gecertificeerd zijn",
                priority: 2,
                isRequired: true,
              },
              {
                type: "ppe",
                description: "Draag valbeveiliging en veiligheidsharnas bij werk > 2,5 meter",
                priority: 3,
                isRequired: true,
              },
            ],
            legislationReference: "Arbeidsomstandighedenbesluit Artikel 3.16",
            vcaReference: "VCA Checklist 2.3 - Werken op hoogte",
          },
          {
            id: "h1-2",
            description: "Beknelling door materiaal tijdens opstelling",
            category: "mechanical",
            typicalEffect: 15, // Serious injury
            typicalExposure: 3, // Once per week
            typicalProbability: 0.5, // Conceivable
            recommendedControls: [
              {
                type: "administrative",
                description: "Toolbox meeting over veilig hijsen en tillen",
                priority: 2,
              },
              {
                type: "ppe",
                description: "Draag veiligheidsschoenen en werkhandschoenen",
                priority: 3,
                isRequired: true,
              },
            ],
            vcaReference: "VCA Checklist 2.5 - Hijsen en heffen",
          },
        ],
        safetyInstructions:
          "Controleer steiger op stabiliteit voordat u erop gaat werken. Gebruik altijd drie contactpunten bij klimmen.",
        preparationNotes: "Zorg dat het terrein vlak en stevig is. Verwijder obstakels.",
      },
      {
        stepNumber: 2,
        description: "Uitvoeren bouwwerkzaamheden",
        duration: 240,
        requiredPersonnel: 3,
        equipment: ["Elektrisch gereedschap", "Handgereedschap", "Bouwmaterialen"],
        hazards: [
          {
            id: "h2-1",
            description: "Geluidshinder door elektrisch gereedschap",
            category: "physical",
            typicalEffect: 7, // Serious injury - hearing damage
            typicalExposure: 6, // Once per day
            typicalProbability: 3, // Quite possible
            recommendedControls: [
              {
                type: "engineering",
                description: "Gebruik elektrisch gereedschap met geluidsdemping",
                priority: 1,
              },
              {
                type: "administrative",
                description: "Beperk blootstelling tot maximaal 8 uur per dag",
                priority: 2,
              },
              {
                type: "ppe",
                description: "Draag gehoorbescherming (oordoppen of oorkappen)",
                priority: 3,
                isRequired: true,
              },
            ],
            legislationReference: "Arbeidsomstandighedenbesluit Artikel 6.8",
          },
          {
            id: "h2-2",
            description: "Stofvorming bij zagen en boren",
            category: "chemical",
            typicalEffect: 15, // Respiratory issues
            typicalExposure: 6, // Daily
            typicalProbability: 6, // Likely
            recommendedControls: [
              {
                type: "engineering",
                description: "Gebruik gereedschap met afzuiginstallatie",
                priority: 1,
              },
              {
                type: "administrative",
                description: "Werk nat waar mogelijk om stof te reduceren",
                priority: 2,
              },
              {
                type: "ppe",
                description: "Draag FFP2 stofmasker bij stofvorming",
                priority: 3,
                isRequired: true,
              },
            ],
            legislationReference: "Arbeidsomstandighedenbesluit Artikel 4.2",
            vcaReference: "VCA Checklist 2.7 - Stof en dampen",
          },
        ],
        safetyInstructions:
          "Controleer elektrisch gereedschap voor gebruik. Werk volgens de veilige werkinstructies.",
      },
      {
        stepNumber: 3,
        description: "Opruimen werkplek en afbreken steiger",
        duration: 45,
        requiredPersonnel: 2,
        equipment: ["Steiger", "Opruimmateriaal"],
        hazards: [
          {
            id: "h3-1",
            description: "Struikelen over materialen en gereedschap",
            category: "physical",
            typicalEffect: 3, // Minor injury
            typicalExposure: 6, // Daily
            typicalProbability: 1, // Could happen
            recommendedControls: [
              {
                type: "administrative",
                description: "Houd werkplek opgeruimd en vrij van obstakels",
                priority: 2,
                isRequired: true,
              },
              {
                type: "ppe",
                description: "Draag veiligheidsschoenen met goede grip",
                priority: 3,
              },
            ],
          },
        ],
        safetyInstructions:
          "Ruim gereedschap direct op na gebruik. Controleer werkplek op achtergebleven materialen.",
      },
    ],
    requiredCompetencies: ["VCA Basis", "Steigerbouw NEN 2484"],
    version: 1,
    visibility: "system",
    isSystemTemplate: true,
    status: "published",
    usageCount: 0,
    language: "nl",
    isActive: true,
    isFeatured: true,
  },

  // ============================================================================
  // 2. ELEKTROTECHNIEK (Electrical Work)
  // ============================================================================
  {
    name: "Elektrische Installatiewerkzaamheden",
    description:
      "TRA template voor elektrische installatie- en onderhoudswerkzaamheden. Inclusief spanningsvrij maken en veilig werken aan elektrische installaties.",
    industryCategory: "electrical",
    hazardCategories: ["electrical", "physical", "fire_explosion"],
    tags: ["elektra", "installatie", "spanning", "NEN3140"],
    complianceFramework: "vca",
    vcaCertified: true,
    vcaVersion: "VCA 2017 v5.1",
    taskStepsTemplate: [
      {
        stepNumber: 1,
        description: "Spanningsvrij maken en beveiligen installatie",
        duration: 30,
        requiredPersonnel: 1,
        equipment: [
          "Spanningszoeker",
          "Vergrendelingsmaterialen",
          "Persoonlijke beschermingsmiddelen",
        ],
        hazards: [
          {
            id: "he1-1",
            description:
              "Elektrische schok door onbedoeld contact met onder spanning staande delen",
            category: "electrical",
            typicalEffect: 100, // Catastrophic - electrocution
            typicalExposure: 2, // Occasional
            typicalProbability: 0.2, // Practically impossible with procedures
            recommendedControls: [
              {
                type: "administrative",
                description: "Volg NEN 3140 procedure voor spanningsvrij maken (5 stappen)",
                priority: 1,
                isRequired: true,
              },
              {
                type: "engineering",
                description: "Gebruik vergrendeling en markering (LOTO procedure)",
                priority: 1,
                isRequired: true,
              },
              {
                type: "ppe",
                description: "Draag geïsoleerde handschoenen en veiligheidsschoenen",
                priority: 3,
                isRequired: true,
              },
            ],
            legislationReference: "Arbeidsomstandighedenbesluit Artikel 6.5",
            vcaReference: "VCA Checklist 2.6 - Elektriciteit",
            notes:
              "NEN 3140: 1. Schakelen 2. Beveiligen 3. Controleren 4. Aarden en kortsluiten 5. Afschermen",
          },
        ],
        safetyInstructions:
          "Controleer met spanningszoeker dat installatie daadwerkelijk spanningsvrij is. Plaats waarschuwingsborden.",
        preparationNotes:
          "Identificeer alle voedingspunten. Zorg voor communicatie met andere betrokkenen.",
      },
      {
        stepNumber: 2,
        description: "Uitvoeren elektrische werkzaamheden",
        duration: 180,
        requiredPersonnel: 2,
        equipment: ["Elektrisch gereedschap", "Meetapparatuur", "Installatiemateriaal"],
        hazards: [
          {
            id: "he2-1",
            description: "Kortsluiting bij onjuiste aansluiting",
            category: "electrical",
            typicalEffect: 40, // Serious burns
            typicalExposure: 1, // Rare
            typicalProbability: 0.5, // Conceivable
            recommendedControls: [
              {
                type: "administrative",
                description: "Volg installatievoorschriften en schema's nauwkeurig",
                priority: 2,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Laat werkzaamheden controleren door tweede monteur",
                priority: 2,
              },
            ],
          },
          {
            id: "he2-2",
            description: "Brand door oververhitting of vonkvorming",
            category: "fire_explosion",
            typicalEffect: 40, // Fire hazard
            typicalExposure: 0.5, // Very rare
            typicalProbability: 0.2, // Practically impossible
            recommendedControls: [
              {
                type: "engineering",
                description: "Gebruik juiste kabeldoorsnede volgens belasting",
                priority: 1,
              },
              {
                type: "administrative",
                description: "Houd brandblusser gereed op werkplek",
                priority: 2,
                isRequired: true,
              },
            ],
          },
        ],
        safetyInstructions:
          "Werk volgens installatievoorschriften. Gebruik geïsoleerd gereedschap.",
      },
      {
        stepNumber: 3,
        description: "Testen installatie en weer in bedrijf stellen",
        duration: 45,
        requiredPersonnel: 2,
        equipment: ["Meetapparatuur", "Testapparatuur"],
        hazards: [
          {
            id: "he3-1",
            description: "Onverwachte inschakeling tijdens test",
            category: "electrical",
            typicalEffect: 40,
            typicalExposure: 1,
            typicalProbability: 0.5,
            recommendedControls: [
              {
                type: "administrative",
                description: "Waarschuw alle betrokkenen voor inschakeling",
                priority: 2,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Test eerst met laag vermogen waar mogelijk",
                priority: 2,
              },
            ],
          },
        ],
        safetyInstructions: "Controleer alle aansluitingen. Test volgens NEN 1010 normen.",
        preparationNotes: "Zorg dat alle testapparatuur gekalibreerd is.",
      },
    ],
    requiredCompetencies: ["VCA VOL", "NEN 3140 Gecertificeerd", "Elektromonteur diploma"],
    version: 1,
    visibility: "system",
    isSystemTemplate: true,
    status: "published",
    usageCount: 0,
    language: "nl",
    isActive: true,
    isFeatured: true,
  },

  // ============================================================================
  // 3. LOODGIETERSWERK (Plumbing)
  // ============================================================================
  {
    name: "Loodgieterswerk en Sanitaire Installaties",
    description:
      "TRA template voor loodgieterswerk en sanitaire installaties. Inclusief waterleidingen, afvoer en verwarmingssystemen.",
    industryCategory: "plumbing",
    hazardCategories: ["mechanical", "physical", "chemical", "biological"],
    tags: ["loodgieter", "sanitair", "waterleiding", "cv"],
    complianceFramework: "vca",
    vcaCertified: true,
    vcaVersion: "VCA 2017 v5.1",
    taskStepsTemplate: [
      {
        stepNumber: 1,
        description: "Voorbereiden en afsluiten water-/verwarmingssysteem",
        duration: 30,
        requiredPersonnel: 1,
        equipment: ["Gereedschap", "Opvangmateriaal", "Persoonlijke beschermingsmiddelen"],
        hazards: [
          {
            id: "hp1-1",
            description: "Brandwonden door heet water of stoom",
            category: "physical",
            typicalEffect: 15, // Burns
            typicalExposure: 2, // Occasional
            typicalProbability: 1, // Could happen
            recommendedControls: [
              {
                type: "administrative",
                description: "Laat systeem afkoelen voordat u begint met werkzaamheden",
                priority: 1,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Controleer temperatuur met thermometer",
                priority: 2,
              },
              {
                type: "ppe",
                description: "Draag hittebestendige handschoenen",
                priority: 3,
              },
            ],
            vcaReference: "VCA Checklist 2.9 - Hoge en lage temperaturen",
          },
          {
            id: "hp1-2",
            description: "Waterlekkage en schade",
            category: "physical",
            typicalEffect: 3, // Property damage
            typicalExposure: 3, // Weekly
            typicalProbability: 1, // Could happen
            recommendedControls: [
              {
                type: "engineering",
                description: "Plaats opvangbakken onder afsluiters",
                priority: 1,
              },
              {
                type: "administrative",
                description: "Controleer afsluiters op functionaliteit voor gebruik",
                priority: 2,
              },
            ],
          },
        ],
        safetyInstructions:
          "Sluit hoofdkraan af. Laat systeem leeglopen. Plaats waarschuwingsborden.",
        preparationNotes: "Informeer bewoners/gebruikers over werkzaamheden.",
      },
      {
        stepNumber: 2,
        description: "Uitvoeren loodgieterswerkzaamheden",
        duration: 180,
        requiredPersonnel: 2,
        equipment: ["Snijgereedschap", "Lasapparatuur", "Leidingmateriaal"],
        hazards: [
          {
            id: "hp2-1",
            description: "Snijwonden door scherp gereedschap",
            category: "mechanical",
            typicalEffect: 7, // Cuts
            typicalExposure: 6, // Daily
            typicalProbability: 1, // Could happen
            recommendedControls: [
              {
                type: "engineering",
                description: "Gebruik gereedschap met veiligheidsmechanismen",
                priority: 1,
              },
              {
                type: "ppe",
                description: "Draag snijvaste handschoenen",
                priority: 3,
                isRequired: true,
              },
            ],
          },
          {
            id: "hp2-2",
            description: "Inademing van dampen bij solderen/lassen",
            category: "chemical",
            typicalEffect: 7, // Respiratory
            typicalExposure: 3, // Weekly
            typicalProbability: 3, // Quite possible
            recommendedControls: [
              {
                type: "engineering",
                description: "Zorg voor goede ventilatie of gebruik afzuiging",
                priority: 1,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Gebruik loodvrije soldeer waar mogelijk",
                priority: 2,
              },
              {
                type: "ppe",
                description: "Draag adembescherming bij beperkte ventilatie",
                priority: 3,
              },
            ],
            legislationReference: "Arbeidsomstandighedenbesluit Artikel 4.2",
          },
          {
            id: "hp2-3",
            description: "Contact met vervuild water of rioolwater",
            category: "biological",
            typicalEffect: 7, // Infection
            typicalExposure: 2, // Occasional
            typicalProbability: 1, // Could happen
            recommendedControls: [
              {
                type: "engineering",
                description: "Gebruik pompapparatuur om direct contact te voorkomen",
                priority: 1,
              },
              {
                type: "ppe",
                description: "Draag waterbestendige handschoenen en beschermende kleding",
                priority: 3,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Was handen grondig na contact met afvalwater",
                priority: 2,
                isRequired: true,
              },
            ],
          },
        ],
        safetyInstructions: "Werk volgens installatievoorschriften. Test leidingen op lekkage.",
      },
      {
        stepNumber: 3,
        description: "Testen en in bedrijf stellen systeem",
        duration: 45,
        requiredPersonnel: 2,
        equipment: ["Testapparatuur", "Vulmateriaal"],
        hazards: [
          {
            id: "hp3-1",
            description: "Lekkage onder druk tijdens test",
            category: "physical",
            typicalEffect: 7,
            typicalExposure: 2,
            typicalProbability: 0.5,
            recommendedControls: [
              {
                type: "administrative",
                description: "Test geleidelijk met toenemende druk",
                priority: 2,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Blijf op veilige afstand tijdens druktest",
                priority: 2,
              },
            ],
          },
        ],
        safetyInstructions: "Test volgens NEN-normen. Controleer alle verbindingen visueel.",
      },
    ],
    requiredCompetencies: [
      "VCA Basis",
      "Erkend loodgieter",
      "Gasveiligheidscertificaat (indien gas)",
    ],
    version: 1,
    visibility: "system",
    isSystemTemplate: true,
    status: "published",
    usageCount: 0,
    language: "nl",
    isActive: true,
    isFeatured: false,
  },

  // ============================================================================
  // 4. DAKWERKZAAMHEDEN (Roofing Work)
  // ============================================================================
  {
    name: "Dakwerkzaamheden en Dakreparaties",
    description:
      "TRA template voor dakwerkzaamheden, inclusief nieuwbouw, onderhoud en reparaties op platte en hellende daken.",
    industryCategory: "roofing",
    hazardCategories: ["physical", "environmental", "mechanical"],
    tags: ["dak", "hoogte", "bitumen", "reparatie"],
    complianceFramework: "vca",
    vcaCertified: true,
    vcaVersion: "VCA 2017 v5.1",
    taskStepsTemplate: [
      {
        stepNumber: 1,
        description: "Opstellen en beveiligen dakrandbeveiliging",
        duration: 60,
        requiredPersonnel: 2,
        equipment: ["Dakrandbeveiliging", "Valbeveiliging", "Ladders"],
        hazards: [
          {
            id: "hd1-1",
            description: "Vallen van dak tijdens opstelling beveiliging",
            category: "physical",
            typicalEffect: 100, // Fatal or permanent disability
            typicalExposure: 1, // Rare
            typicalProbability: 0.5, // Conceivable
            recommendedControls: [
              {
                type: "engineering",
                description: "Monteer collectieve dakrandbeveiliging volgens NEN-EN 13374",
                priority: 1,
                isRequired: true,
              },
              {
                type: "ppe",
                description: "Gebruik persoonlijke valbeveiliging (harnas + lifeline)",
                priority: 3,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Monteurs moeten VCA VOL en werken op hoogte gecertificeerd zijn",
                priority: 2,
                isRequired: true,
              },
            ],
            legislationReference: "Arbeidsomstandighedenbesluit Artikel 3.16",
            vcaReference: "VCA Checklist 2.3 - Werken op hoogte",
          },
        ],
        safetyInstructions:
          "Werk altijd met minimaal 2 personen. Bevestig valbeveiliging aan draagconstructie.",
        preparationNotes: "Inspecteer dak op belastbaarheid. Controleer weersomstandigheden.",
      },
      {
        stepNumber: 2,
        description: "Uitvoeren dakwerkzaamheden",
        duration: 300,
        requiredPersonnel: 3,
        equipment: ["Bitumen brander", "Dakbedekking", "Gereedschap"],
        hazards: [
          {
            id: "hd2-1",
            description: "Brand door werken met open vuur (bitumen)",
            category: "fire_explosion",
            typicalEffect: 40, // Severe burns
            typicalExposure: 6, // Daily
            typicalProbability: 1, // Could happen
            recommendedControls: [
              {
                type: "substitution",
                description: "Gebruik koudzelfklevende dakbedekking waar mogelijk",
                priority: 1,
              },
              {
                type: "engineering",
                description: "Houd brandblusser (poeder 6kg) direct bij de hand",
                priority: 1,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Controleer omgeving op brandbare materialen voorafgaand",
                priority: 2,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Werk volgens heetwerkvergunning procedures",
                priority: 2,
                isRequired: true,
              },
            ],
            vcaReference: "VCA Checklist 2.10 - Brand en explosie",
          },
          {
            id: "hd2-2",
            description: "Weersomstandigheden (wind, regen, temperatuur)",
            category: "environmental",
            typicalEffect: 15, // Hypothermia or heat stress
            typicalExposure: 6, // Daily
            typicalProbability: 3, // Quite possible
            recommendedControls: [
              {
                type: "administrative",
                description: "Stop werkzaamheden bij windkracht > 6 Beaufort",
                priority: 1,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Werk niet op nat/glad dak (vallingsgevaar)",
                priority: 1,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Verstrek voldoende water en rustpauzes bij hitte",
                priority: 2,
              },
            ],
            vcaReference: "VCA Checklist 2.9 - Hoge en lage temperaturen",
          },
          {
            id: "hd2-3",
            description: "Doorzakken dak door te hoge belasting",
            category: "physical",
            typicalEffect: 40, // Serious injury
            typicalExposure: 1, // Rare
            typicalProbability: 0.2, // Practically impossible
            recommendedControls: [
              {
                type: "engineering",
                description: "Gebruik loopplanken voor verdeling van gewicht",
                priority: 1,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Laat dak inspecteren door constructeur bij twijfel",
                priority: 2,
              },
            ],
          },
        ],
        safetyInstructions:
          "Werk systematisch vanaf veilig punt. Houd materialen binnen handbereik.",
      },
      {
        stepNumber: 3,
        description: "Afwerken en verwijderen beveiliging",
        duration: 45,
        requiredPersonnel: 2,
        equipment: ["Opruimmateriaal"],
        hazards: [
          {
            id: "hd3-1",
            description: "Vallen tijdens afbreken dakrandbeveiliging",
            category: "physical",
            typicalEffect: 100,
            typicalExposure: 1,
            typicalProbability: 0.5,
            recommendedControls: [
              {
                type: "administrative",
                description: "Verwijder dakrandbeveiliging als laatste actie",
                priority: 1,
                isRequired: true,
              },
              {
                type: "ppe",
                description: "Blijf valbeveiliging dragen tot op begane grond",
                priority: 3,
                isRequired: true,
              },
            ],
          },
        ],
        safetyInstructions:
          "Ruim gereedschap op en controleer werkplek. Verwijder beveiliging systematisch.",
      },
    ],
    requiredCompetencies: [
      "VCA VOL",
      "Dakdekker diploma",
      "Werken op hoogte certificaat",
      "Heetwerk certificaat",
    ],
    version: 1,
    visibility: "system",
    isSystemTemplate: true,
    status: "published",
    usageCount: 0,
    language: "nl",
    isActive: true,
    isFeatured: true,
  },

  // ============================================================================
  // 5. GRONDWERK & FUNDERINGEN (Groundwork & Foundations)
  // ============================================================================
  {
    name: "Grondwerk en Funderingswerkzaamheden",
    description:
      "TRA template voor grondwerk, graafwerkzaamheden en funderingen. Inclusief grondverzet, sleufgraven en betonwerk.",
    industryCategory: "groundwork",
    hazardCategories: ["mechanical", "physical", "environmental"],
    tags: ["grondwerk", "graven", "fundering", "grondverzet"],
    complianceFramework: "vca",
    vcaCertified: true,
    vcaVersion: "VCA 2017 v5.1",
    taskStepsTemplate: [
      {
        stepNumber: 1,
        description: "KLIC-melding en voorbereidingen terrein",
        duration: 120,
        requiredPersonnel: 2,
        equipment: ["Markeermateriaal", "Detectieapparatuur", "Afzetting"],
        hazards: [
          {
            id: "hg1-1",
            description: "Beschadiging kabels en leidingen",
            category: "electrical",
            typicalEffect: 100, // Fatal electrocution
            typicalExposure: 0.5, // Very rare with KLIC
            typicalProbability: 0.1, // Almost impossible with precautions
            recommendedControls: [
              {
                type: "administrative",
                description: "Voer KLIC-melding uit minimaal 3 werkdagen voor aanvang",
                priority: 1,
                isRequired: true,
              },
              {
                type: "engineering",
                description: "Gebruik kabel- en leidingdetector tijdens graven",
                priority: 1,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Graaf voorzichtig met hand binnen 0,5m van gemarkeerde ligging",
                priority: 2,
                isRequired: true,
              },
            ],
            legislationReference: "Wet Informatie-uitwisseling Ondergrondse Netten (WION)",
            vcaReference: "VCA Checklist 2.8 - Graven",
          },
        ],
        safetyInstructions:
          "Markeer alle kabels en leidingen op basis van KLIC-melding. Plaats waarschuwingsborden.",
        preparationNotes:
          "Bestudeer KLIC-tekeningen grondig. Informeer netbeheerders bij onduidelijkheden.",
      },
      {
        stepNumber: 2,
        description: "Graafwerkzaamheden en sleuven maken",
        duration: 240,
        requiredPersonnel: 3,
        equipment: ["Graafmachine", "Schoren", "Handgereedschap"],
        hazards: [
          {
            id: "hg2-1",
            description: "Instorten sleufwand tijdens graafwerkzaamheden",
            category: "physical",
            typicalEffect: 100, // Fatal - buried alive
            typicalExposure: 2, // Occasional
            typicalProbability: 0.5, // Conceivable
            recommendedControls: [
              {
                type: "engineering",
                description: "Breng sleufschotting aan bij diepte > 1,25m",
                priority: 1,
                isRequired: true,
              },
              {
                type: "engineering",
                description: "Houd veiligheidstalud aan (1:1 of volgens grondmechanisch advies)",
                priority: 1,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Houd materiaal en voertuigen minimaal 1m van sleufrand",
                priority: 2,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Inspecteer sleuf dagelijks op stabiliteit",
                priority: 2,
                isRequired: true,
              },
            ],
            legislationReference: "Arbeidsomstandighedenbesluit Artikel 3.12",
            vcaReference: "VCA Checklist 2.8 - Graven",
            notes: "Bij diepte > 5m altijd constructeur raadplegen",
          },
          {
            id: "hg2-2",
            description: "Aanrijding door graafmachine of verkeer",
            category: "mechanical",
            typicalEffect: 100, // Fatal
            typicalExposure: 6, // Daily
            typicalProbability: 0.5, // Conceivable
            recommendedControls: [
              {
                type: "engineering",
                description: "Zet werkgebied af met hekken en verkeersmaatregelen",
                priority: 1,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Gebruik verkeersbegeleider bij werkzaamheden nabij weg",
                priority: 2,
                isRequired: true,
              },
              {
                type: "ppe",
                description: "Draag fluo hesje (RWS klasse 3)",
                priority: 3,
                isRequired: true,
              },
            ],
            vcaReference: "VCA Checklist 2.11 - Verkeersmaatregelen",
          },
          {
            id: "hg2-3",
            description: "Grondwater in sleuf",
            category: "environmental",
            typicalEffect: 15, // Complications
            typicalExposure: 3, // Weekly
            typicalProbability: 1, // Could happen
            recommendedControls: [
              {
                type: "engineering",
                description: "Gebruik bemaling of pompen bij grondwater",
                priority: 1,
              },
              {
                type: "ppe",
                description: "Draag waterdichte laarzen",
                priority: 3,
              },
            ],
          },
        ],
        safetyInstructions:
          "Graaf systematisch en controleer stabiliteit. Communiceer met machinist via handsignalen.",
      },
      {
        stepNumber: 3,
        description: "Funderingswerk en terugvullen sleuf",
        duration: 180,
        requiredPersonnel: 4,
        equipment: ["Beton", "Wapening", "Verdichtingsapparatuur"],
        hazards: [
          {
            id: "hg3-1",
            description: "Cement-eczeem door contact met nat beton",
            category: "chemical",
            typicalEffect: 7, // Skin condition
            typicalExposure: 6, // Daily
            typicalProbability: 3, // Quite possible
            recommendedControls: [
              {
                type: "ppe",
                description: "Draag cementbestendige handschoenen",
                priority: 3,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Was handen na contact met beton",
                priority: 2,
              },
            ],
            legislationReference: "Arbeidsomstandighedenbesluit Artikel 4.2",
          },
          {
            id: "hg3-2",
            description: "Rug- en spierklachten door zware fysieke arbeid",
            category: "ergonomic",
            typicalEffect: 7, // Musculoskeletal injury
            typicalExposure: 6, // Daily
            typicalProbability: 1, // Could happen
            recommendedControls: [
              {
                type: "engineering",
                description: "Gebruik hijshulpmiddelen voor materiaal > 23kg",
                priority: 1,
              },
              {
                type: "administrative",
                description: "Wissel zware werkzaamheden af met lichter werk",
                priority: 2,
              },
              {
                type: "administrative",
                description: "Gebruik juiste til- en bukhouding",
                priority: 2,
              },
            ],
            vcaReference: "VCA Checklist 2.12 - Fysieke belasting",
          },
        ],
        safetyInstructions: "Verdicht grond in lagen. Controleer afwerking volgens specificaties.",
      },
    ],
    requiredCompetencies: [
      "VCA Basis",
      "Machinist certificaat",
      "Sleufstopper/schorder certificaat (indien van toepassing)",
    ],
    version: 1,
    visibility: "system",
    isSystemTemplate: true,
    status: "published",
    usageCount: 0,
    language: "nl",
    isActive: true,
    isFeatured: false,
  },

  // ============================================================================
  // 6. SCHILDERWERK (Painting and Decoration)
  // ============================================================================
  {
    name: "Schilderwerk Binnen en Buiten",
    description:
      "TRA template voor schilderwerkzaamheden binnen en buiten. Inclusief voorbehandeling, schilderen en afwerking.",
    industryCategory: "painting",
    hazardCategories: ["chemical", "physical", "ergonomic"],
    tags: ["schilderen", "verf", "spuiten", "afwerking"],
    complianceFramework: "vca",
    vcaCertified: true,
    vcaVersion: "VCA 2017 v5.1",
    taskStepsTemplate: [
      {
        stepNumber: 1,
        description: "Voorbereiden ondergrond en afplakken",
        duration: 120,
        requiredPersonnel: 2,
        equipment: ["Schuurmateriaal", "Afplakmateriaal", "Reinigingsmiddelen"],
        hazards: [
          {
            id: "hs1-1",
            description: "Stofvorming bij schuren",
            category: "chemical",
            typicalEffect: 7, // Respiratory
            typicalExposure: 6, // Daily
            typicalProbability: 6, // Likely
            recommendedControls: [
              {
                type: "engineering",
                description: "Gebruik schuurmachine met stofafzuiging",
                priority: 1,
              },
              {
                type: "administrative",
                description: "Werk nat waar mogelijk om stofvorming te reduceren",
                priority: 2,
              },
              {
                type: "ppe",
                description: "Draag FFP2 stofmasker bij droog schuren",
                priority: 3,
                isRequired: true,
              },
            ],
            legislationReference: "Arbeidsomstandighedenbesluit Artikel 4.2",
          },
          {
            id: "hs1-2",
            description: "Vallen van ladder of steiger",
            category: "physical",
            typicalEffect: 40, // Serious injury
            typicalExposure: 6, // Daily
            typicalProbability: 1, // Could happen
            recommendedControls: [
              {
                type: "engineering",
                description: "Gebruik steiger of werkplatform in plaats van ladder waar mogelijk",
                priority: 1,
              },
              {
                type: "administrative",
                description: "Gebruik ladder alleen voor licht werk < 30 minuten",
                priority: 2,
              },
              {
                type: "ppe",
                description: "Gebruik valbeveiliging bij werk > 2,5m hoogte",
                priority: 3,
              },
            ],
            vcaReference: "VCA Checklist 2.3 - Werken op hoogte",
          },
        ],
        safetyInstructions: "Zorg voor goede ventilatie. Bescherm vloer en meubilair tegen verf.",
        preparationNotes: "Controleer ondergrond op oude loodverf bij gebouwen voor 1978.",
      },
      {
        stepNumber: 2,
        description: "Aanbrengen primer en verfsysteem",
        duration: 240,
        requiredPersonnel: 2,
        equipment: ["Verfspuit", "Kwasten", "Rollen", "Verf en verdunners"],
        hazards: [
          {
            id: "hs2-1",
            description: "Inademing verfnevel en oplosmiddeldampen",
            category: "chemical",
            typicalEffect: 15, // Respiratory and neurological
            typicalExposure: 6, // Daily
            typicalProbability: 6, // Likely
            recommendedControls: [
              {
                type: "substitution",
                description:
                  "Gebruik watergedragen verf in plaats van oplosmiddelrijk waar mogelijk",
                priority: 1,
              },
              {
                type: "engineering",
                description: "Zorg voor goede natuurlijke of mechanische ventilatie",
                priority: 1,
                isRequired: true,
              },
              {
                type: "ppe",
                description: "Draag adembescherming (A2P2 filter) bij spuiten oplosmiddelverf",
                priority: 3,
                isRequired: true,
              },
            ],
            legislationReference: "Arbeidsomstandighedenbesluit Artikel 4.2",
            vcaReference: "VCA Checklist 2.7 - Stof en dampen",
          },
          {
            id: "hs2-2",
            description: "Huidcontact met verf en verdunners",
            category: "chemical",
            typicalEffect: 3, // Skin irritation
            typicalExposure: 6, // Daily
            typicalProbability: 3, // Quite possible
            recommendedControls: [
              {
                type: "ppe",
                description: "Draag beschermende handschoenen (nitril of neopreen)",
                priority: 3,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Gebruik huidbeschermingscrème voor start werk",
                priority: 2,
              },
              {
                type: "administrative",
                description: "Was handen met speciale huidreiniger (geen terpentine)",
                priority: 2,
              },
            ],
          },
          {
            id: "hs2-3",
            description: "Brand- en explosiegevaar door oplosmiddelen",
            category: "fire_explosion",
            typicalEffect: 40, // Burns and fire
            typicalExposure: 2, // Occasional
            typicalProbability: 0.5, // Conceivable
            recommendedControls: [
              {
                type: "administrative",
                description: "Verbied roken en open vuur in werkgebied",
                priority: 1,
                isRequired: true,
              },
              {
                type: "engineering",
                description: "Bewaar oplosmiddelen in brandveilige kast",
                priority: 1,
              },
              {
                type: "administrative",
                description: "Houd brandblusser gereed",
                priority: 2,
              },
            ],
            vcaReference: "VCA Checklist 2.10 - Brand en explosie",
          },
        ],
        safetyInstructions:
          "Werk systematisch van boven naar beneden. Voorkom verfnevelneerslag in ogen.",
      },
      {
        stepNumber: 3,
        description: "Afwerking en opruimen",
        duration: 60,
        requiredPersonnel: 2,
        equipment: ["Schoonmaakmiddelen", "Afvalinzameling"],
        hazards: [
          {
            id: "hs3-1",
            description: "RSI-klachten door repeterende bewegingen",
            category: "ergonomic",
            typicalEffect: 7, // Musculoskeletal
            typicalExposure: 6, // Daily
            typicalProbability: 1, // Could happen
            recommendedControls: [
              {
                type: "engineering",
                description: "Gebruik telescopische stelen voor plafondwerk",
                priority: 1,
              },
              {
                type: "administrative",
                description: "Wissel werkzaamheden af voor variatie in belasting",
                priority: 2,
              },
              {
                type: "administrative",
                description: "Neem regelmatig pauzes bij repetitief werk",
                priority: 2,
              },
            ],
            vcaReference: "VCA Checklist 2.12 - Fysieke belasting",
          },
        ],
        safetyInstructions: "Ventileer ruimte na afwerking. Verwijder afplakmateriaal zorgvuldig.",
        preparationNotes: "Voer verfafval af volgens regelgeving (chemisch afval).",
      },
    ],
    requiredCompetencies: ["VCA Basis", "Schilder diploma"],
    version: 1,
    visibility: "system",
    isSystemTemplate: true,
    status: "published",
    usageCount: 0,
    language: "nl",
    isActive: true,
    isFeatured: false,
  },

  // ============================================================================
  // 7. WERKEN IN BEPERKTE RUIMTES (Confined Space Entry)
  // ============================================================================
  {
    name: "Werken in Beperkte Ruimtes (Confined Space Entry)",
    description:
      "TRA template voor werkzaamheden in besloten ruimten zoals tanks, silo's en leidingsystemen. Richtlijnen voor gasmeting, ventilatie en reddingsprocedures.",
    industryCategory: "maintenance",
    hazardCategories: ["chemical", "physical", "mechanical", "environmental"],
    tags: ["confined_space", "tank", "afsluiting", "gasmeting"],
    complianceFramework: "vca",
    vcaCertified: true,
    vcaVersion: "VCA 2017 v5.1",
    taskStepsTemplate: [
      {
        stepNumber: 1,
        description: "Voorbereiding en risico-inventarisatie",
        duration: 60,
        requiredPersonnel: 2,
        equipment: [
          "Gasdetector",
          "Ventilator",
          "Afsluitmateriaal",
          "Persoonlijke beschermingsmiddelen",
        ],
        hazards: [
          {
            id: "hc1-1",
            description: "Aanwezigheid van giftige of verstikkende gassen",
            category: "chemical",
            typicalEffect: 100,
            typicalExposure: 1,
            typicalProbability: 0.5,
            recommendedControls: [
              {
                type: "administrative",
                description: "Voer atmosfeermetingen uit vóór betreding",
                priority: 1,
                isRequired: true,
              },
              {
                type: "engineering",
                description: "Ventileer besloten ruimte continu",
                priority: 1,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Stel reddingsplan en communicatieprocedure op",
                priority: 2,
                isRequired: true,
              },
            ],
            legislationReference: "Arbeidsomstandighedenbesluit Artikel 6.14",
            vcaReference: "VCA Checklist 3.4 - Besloten ruimtes",
          },
        ],
        safetyInstructions:
          "Meet altijd meerdere punten in de ruimte; gebruik vaste ventilatie indien mogelijk.",
        preparationNotes:
          "Bepaal risico's, stel reddingsteam paraat, en controleer ademluchtvoorziening.",
      },
      {
        stepNumber: 2,
        description: "Betreden en uitvoeren werkzaamheden",
        duration: 120,
        requiredPersonnel: 2,
        equipment: [
          "Valbeveiliging (indien nodig)",
          "Ademluchttoestel (indien vereist)",
          "EHBO-kit",
        ],
        hazards: [
          {
            id: "hc2-1",
            description: "Verstikking of bewustzijnsverlies tijdens werkzaamheden",
            category: "physical",
            typicalEffect: 100,
            typicalExposure: 1,
            typicalProbability: 0.2,
            recommendedControls: [
              {
                type: "administrative",
                description:
                  "Gebruik permit-to-work systeem en hou één persoon buiten als toezichthouder",
                priority: 1,
                isRequired: true,
              },
              {
                type: "engineering",
                description: "Gebruik persoonlijke gasmeters en alarm bij grenswaarden",
                priority: 1,
                isRequired: true,
              },
              {
                type: "ppe",
                description: "Ademluchtapparatuur gebruiken indien atmosfeer niet veilig is",
                priority: 2,
              },
            ],
          },
        ],
        safetyInstructions:
          "Continue communicatie met toezichthouder buiten; stop direct bij alarm.",
      },
      {
        stepNumber: 3,
        description: "Afsluiting en evaluatie",
        duration: 30,
        requiredPersonnel: 2,
        equipment: ["Logboek", "Reinigingsmiddelen"],
        hazards: [
          {
            id: "hc3-1",
            description: "Nalatigheid bij schoonmaken en afsluiten van aansluitingen",
            category: "mechanical",
            typicalEffect: 3,
            typicalExposure: 3,
            typicalProbability: 1,
            recommendedControls: [
              {
                type: "administrative",
                description: "Voer einde-checklist uit en update permit-registratie",
                priority: 2,
                isRequired: true,
              },
            ],
          },
        ],
        safetyInstructions: "Documenteer metingen en incidenten; voer lessons-learned uit.",
      },
    ],
    requiredCompetencies: ["VCA VOL", "Besloten Ruimte Training", "Redding en EHBO"],
    version: 1,
    visibility: "system",
    isSystemTemplate: true,
    status: "published",
    usageCount: 0,
    language: "nl",
    isActive: true,
    isFeatured: false,
  },

  // ============================================================================
  // 8. WERKEN OP HOOGTE (Working at Height)
  // ============================================================================
  {
    name: "Werken op Hoogte (Working at Height)",
    description:
      "TRA template voor werkzaamheden op hoogte inclusief steigers, ladders en dakwerk. Bevat valbeveiliging, access planning en weerscondities.",
    industryCategory: "roofing",
    hazardCategories: ["physical", "environmental"],
    tags: ["working_at_height", "valbeveiliging", "steiger", "ladder"],
    complianceFramework: "vca",
    vcaCertified: true,
    vcaVersion: "VCA 2017 v5.1",
    taskStepsTemplate: [
      {
        stepNumber: 1,
        description: "Opstelling en beveiliging werkplek op hoogte",
        duration: 90,
        requiredPersonnel: 2,
        equipment: [
          "Dakrandbeveiliging",
          "Valbeveiliging",
          "Ladders",
          "Persoonlijke beschermingsmiddelen",
        ],
        hazards: [
          {
            id: "hh1-1",
            description: "Vallen van hoogte tijdens opstelling of werkzaamheden",
            category: "physical",
            typicalEffect: 100,
            typicalExposure: 2,
            typicalProbability: 1,
            recommendedControls: [
              {
                type: "engineering",
                description: "Monteer collectieve randbeveiliging waar mogelijk",
                priority: 1,
                isRequired: true,
              },
              {
                type: "ppe",
                description: "Gebruik harnas en valstopapparaat bij onbeschermde randen",
                priority: 1,
                isRequired: true,
              },
              {
                type: "administrative",
                description: "Werk alleen bij geschikte weersomstandigheden",
                priority: 2,
              },
            ],
            legislationReference: "Arbeidsomstandighedenbesluit Artikel 3.16",
            vcaReference: "VCA Checklist 2.3 - Werken op hoogte",
          },
        ],
        safetyInstructions:
          "Controleer ankerpunten en bevestigingen; draag harnas tijdens hele operatie.",
      },
      {
        stepNumber: 2,
        description: "Uitvoeren werkzaamheden en materiaalhandling",
        duration: 240,
        requiredPersonnel: 3,
        equipment: ["Hijsmateriaal", "Loopplanken", "Handgereedschap"],
        hazards: [
          {
            id: "hh2-1",
            description: "Gevaar door vallende objecten",
            category: "physical",
            typicalEffect: 40,
            typicalExposure: 3,
            typicalProbability: 1,
            recommendedControls: [
              {
                type: "engineering",
                description: "Gebruik netten en valbescherming onder werkgebied",
                priority: 1,
              },
              {
                type: "administrative",
                description: "Markeer en bescherm werkgebied beneden",
                priority: 2,
                isRequired: true,
              },
              {
                type: "ppe",
                description: "Draag veiligheidsharnassen en helmen",
                priority: 3,
                isRequired: true,
              },
            ],
          },
        ],
        safetyInstructions:
          "Hef materialen veilig met juiste hijsprocedures; houd communicatie met grondteam.",
      },
      {
        stepNumber: 3,
        description: "Opruimen en controle na werkzaamheden",
        duration: 30,
        requiredPersonnel: 2,
        equipment: ["Opruimmateriaal"],
        hazards: [
          {
            id: "hh3-1",
            description: "Resterend risico na verwijderen beveiliging",
            category: "mechanical",
            typicalEffect: 15,
            typicalExposure: 1,
            typicalProbability: 0.5,
            recommendedControls: [
              {
                type: "administrative",
                description:
                  "Controleer werkplek en bevestig dat alle beveiliging verwijderd is volgens procedure",
                priority: 2,
              },
            ],
          },
        ],
        safetyInstructions: "Verwijder beveiliging systematisch; voer eindinspectie uit.",
      },
    ],
    requiredCompetencies: ["VCA VOL", "Werken op Hoogte certificaat", "Steigerbouw kennis"],
    version: 1,
    visibility: "system",
    isSystemTemplate: true,
    status: "published",
    usageCount: 0,
    language: "nl",
    isActive: true,
    isFeatured: true,
  },
];
