/**
 * Material to Hazard Auto-Suggestions
 * Maps common materials and workplace conditions to typical hazards
 * Supports VCA compliance by suggesting appropriate hazards based on context
 */

import { Material, WorkplaceConditions, Hazard, HazardCategory } from '../types/tra';

/**
 * Material category with typical hazards
 */
interface MaterialHazardMapping {
  keywords: string[];
  hazardCategories: HazardCategory[];
  suggestions: {
    category: HazardCategory;
    description: string;
    controlMeasures: string[];
  }[];
}

/**
 * Comprehensive database of material-to-hazard mappings
 * Based on VCA 2017 v5.1 and Dutch construction industry standards
 */
const MATERIAL_HAZARD_DATABASE: MaterialHazardMapping[] = [
  // Chemical substances
  {
    keywords: ['chemisch', 'chemical', 'zuur', 'acid', 'base', 'oplosmiddel', 'solvent', 'thinner', 'verdunner'],
    hazardCategories: ['chemical', 'biological'],
    suggestions: [
      {
        category: 'chemical',
        description: 'Blootstelling aan chemische stoffen',
        controlMeasures: [
          'Gebruik persoonlijke beschermingsmiddelen (handschoenen, bril)',
          'Zorg voor adequate ventilatie',
          'Volg MSDS instructies',
        ],
      },
      {
        category: 'biological',
        description: 'Inademing van dampen of contact met huid',
        controlMeasures: [
          'Werk in goed geventileerde ruimte',
          'Draag beschermende kleding',
          'Bewaar MSDS binnen handbereik',
        ],
      },
    ],
  },

  // Hazardous materials - asbestos, lead, mercury
  {
    keywords: ['asbest', 'asbestos', 'lood', 'lead', 'kwik', 'mercury', 'pcb', 'pcb\'s'],
    hazardCategories: ['biological', 'environmental'],
    suggestions: [
      {
        category: 'biological',
        description: 'Blootstelling aan gevaarlijke stoffen met ernstige gezondheidsrisico\'s',
        controlMeasures: [
          'Werk alleen met gecertificeerd personeel',
          'Gebruik specifieke beschermingsmiddelen',
          'Volg wettelijke procedures voor verwijdering',
          'Documenteer alle werkzaamheden',
        ],
      },
      {
        category: 'environmental',
        description: 'Milieuverontreiniging door gevaarlijke stoffen',
        controlMeasures: [
          'Voorkom verspreiding naar omgeving',
          'Gebruik gecertificeerde afvoer',
          'Meld werkzaamheden bij bevoegd gezag',
        ],
      },
    ],
  },

  // Flammable materials
  {
    keywords: ['brandbaar', 'flammable', 'explosief', 'explosive', 'gas', 'benzine', 'diesel', 'lpg'],
    hazardCategories: ['fire_explosion', 'chemical'],
    suggestions: [
      {
        category: 'fire_explosion',
        description: 'Brandgevaar door ontvlambare stoffen',
        controlMeasures: [
          'Verbied open vuur en roken',
          'Gebruik vonkvrij gereedschap',
          'Zorg voor blusmiddelen in de buurt',
          'Controleer op lekkages',
        ],
      },
      {
        category: 'fire_explosion',
        description: 'Explosiegevaar',
        controlMeasures: [
          'Voorkom vonkvorming',
          'Zorg voor goede ventilatie',
          'Gebruik ATEX-gecertificeerd materiaal',
          'Houd veilige afstand tot ontstekingsbronnen',
        ],
      },
    ],
  },

  // Cement and concrete materials
  {
    keywords: ['cement', 'beton', 'concrete', 'stuc', 'mortel', 'specie', 'kalk', 'lime'],
    hazardCategories: ['chemical', 'ergonomic'],
    suggestions: [
      {
        category: 'chemical',
        description: 'Huid- en oogirritatie door cement (pH-waarde)',
        controlMeasures: [
          'Draag beschermende handschoenen',
          'Gebruik veiligheidsbril',
          'Was handen na contact',
          'Gebruik huidbeschermende crème',
        ],
      },
      {
        category: 'ergonomic',
        description: 'Zwaar tilwerk en fysieke belasting',
        controlMeasures: [
          'Gebruik tilhulpmiddelen',
          'Werk met meerdere personen',
          'Neem regelmatig pauzes',
          'Gebruik juiste tilhoudingen',
        ],
      },
    ],
  },

  // Paint and coating materials
  {
    keywords: ['verf', 'paint', 'coating', 'lak', 'lacquer', 'primer', 'grondverf'],
    hazardCategories: ['chemical', 'biological', 'fire_explosion'],
    suggestions: [
      {
        category: 'chemical',
        description: 'Blootstelling aan vluchtige organische stoffen (VOS)',
        controlMeasures: [
          'Zorg voor adequate ventilatie',
          'Gebruik ademhalingsbescherming',
          'Draag handschoenen en beschermende kleding',
        ],
      },
      {
        category: 'biological',
        description: 'Inademing van verfnevel en dampen',
        controlMeasures: [
          'Gebruik afzuiginstallatie',
          'Draag stofmasker of ademhalingsapparaat',
          'Neem regelmatig frisse lucht pauzes',
        ],
      },
      {
        category: 'fire_explosion',
        description: 'Brandgevaar door oplosmiddelen',
        controlMeasures: [
          'Geen open vuur',
          'Bewaar brandstoffen veilig',
          'Houd blusmiddelen bij de hand',
        ],
      },
    ],
  },

  // Wood and wood products
  {
    keywords: ['hout', 'wood', 'timber', 'triplex', 'plywood', 'mdf', 'spaanplaat', 'chipboard'],
    hazardCategories: ['physical', 'mechanical'],
    suggestions: [
      {
        category: 'physical',
        description: 'Inademing van houtstof',
        controlMeasures: [
          'Gebruik stofafzuiging',
          'Draag stofmasker',
          'Maak regelmatig schoon',
        ],
      },
      {
        category: 'mechanical',
        description: 'Snijwonden en splinters',
        controlMeasures: [
          'Gebruik veiligheidshandschoenen',
          'Controleer gereedschap voor gebruik',
          'Werk met scherp gereedschap',
        ],
      },
    ],
  },

  // Metal materials
  {
    keywords: ['staal', 'stalen', 'steel', 'ijzer', 'ijzeren', 'iron', 'aluminium', 'aluminum', 'metaal', 'metalen', 'metal', 'rvs', 'stainless'],
    hazardCategories: ['mechanical', 'physical', 'ergonomic'],
    suggestions: [
      {
        category: 'mechanical',
        description: 'Snijwonden aan scherpe randen',
        controlMeasures: [
          'Draag snijwerende handschoenen',
          'Gebruik juiste gereedschap',
          'Ontbramel scherpe randen',
        ],
      },
      {
        category: 'ergonomic',
        description: 'Zwaar tilwerk (metalen constructies)',
        controlMeasures: [
          'Gebruik hijsmiddelen',
          'Werk met meerdere personen',
          'Plan tilsituaties vooraf',
        ],
      },
      {
        category: 'physical',
        description: 'Geluidshinder bij metaalbewerking',
        controlMeasures: [
          'Gebruik gehoorbescherming',
          'Beperk blootstellingstijd',
          'Gebruik geluiddempers waar mogelijk',
        ],
      },
    ],
  },

  // Electrical materials
  {
    keywords: ['elektrisch', 'electric', 'kabel', 'cable', 'draad', 'wire', 'fitting', 'schakelaar', 'switch'],
    hazardCategories: ['electrical', 'fire_explosion'],
    suggestions: [
      {
        category: 'electrical',
        description: 'Elektrische schok en elektrocutie',
        controlMeasures: [
          'Schakel spanning uit voor werkzaamheden',
          'Gebruik isolerend gereedschap',
          'Werk volgens NEN 3140',
          'Laat installatie keuren',
        ],
      },
      {
        category: 'fire_explosion',
        description: 'Brandgevaar door elektrische installaties',
        controlMeasures: [
          'Controleer op beschadigingen',
          'Gebruik juiste beveiliging',
          'Voorkom overbelasting',
        ],
      },
    ],
  },

  // Insulation materials
  {
    keywords: ['isolatie', 'insulation', 'glaswol', 'glass wool', 'steenwol', 'rock wool', 'minerale wol'],
    hazardCategories: ['physical', 'biological'],
    suggestions: [
      {
        category: 'physical',
        description: 'Huidirritatie en inademing van vezels',
        controlMeasures: [
          'Draag beschermende kleding',
          'Gebruik stofmasker',
          'Was handen na werkzaamheden',
          'Vermijd stofvorming',
        ],
      },
    ],
  },

  // Adhesives and sealants
  {
    keywords: ['lijm', 'glue', 'adhesive', 'kit', 'sealant', 'silicone', 'foam', 'pur', 'polyurethaan'],
    hazardCategories: ['chemical', 'biological'],
    suggestions: [
      {
        category: 'chemical',
        description: 'Blootstelling aan chemische dampen',
        controlMeasures: [
          'Zorg voor goede ventilatie',
          'Gebruik handschoenen',
          'Volg productinstructies',
        ],
      },
      {
        category: 'biological',
        description: 'Huidcontact met irriterende stoffen',
        controlMeasures: [
          'Draag nitril handschoenen',
          'Voorkom huidcontact',
          'Was direct bij morsen',
        ],
      },
    ],
  },

  // Heavy materials
  {
    keywords: ['steen', 'stone', 'baksteen', 'brick', 'tegel', 'tile', 'plavuizen', 'tegels', 'klinkers'],
    hazardCategories: ['ergonomic', 'mechanical'],
    suggestions: [
      {
        category: 'ergonomic',
        description: 'Rugklachten door tillen en sjouwen',
        controlMeasures: [
          'Gebruik tilhulpmiddelen',
          'Til niet meer dan 23 kg alleen',
          'Gebruik juiste tilhouding',
          'Neem regelmatig pauzes',
        ],
      },
      {
        category: 'mechanical',
        description: 'Beknelling van vingers en voeten',
        controlMeasures: [
          'Draag veiligheidsschoenen',
          'Gebruik werkhandschoenen',
          'Werk met twee personen bij zware stukken',
        ],
      },
    ],
  },

  // Glass materials
  {
    keywords: ['glas', 'glass', 'ruit', 'window', 'spiegel', 'mirror'],
    hazardCategories: ['mechanical', 'physical'],
    suggestions: [
      {
        category: 'mechanical',
        description: 'Snijwonden door scherpe glasranden',
        controlMeasures: [
          'Draag snijwerende handschoenen',
          'Gebruik zuignappen voor transport',
          'Ruim glasscherven veilig op',
        ],
      },
    ],
  },

  // Plastic materials
  {
    keywords: ['kunststof', 'plastic', 'pvc', 'polyetheen', 'polystyreen', 'eps'],
    hazardCategories: ['chemical', 'fire_explosion'],
    suggestions: [
      {
        category: 'chemical',
        description: 'Dampen bij bewerking van kunststoffen',
        controlMeasures: [
          'Zorg voor afzuiging',
          'Gebruik ademhalingsbescherming bij smelten',
          'Werk in goed geventileerde ruimte',
        ],
      },
      {
        category: 'fire_explosion',
        description: 'Brandgevaar bij verwarmen/lassen',
        controlMeasures: [
          'Voorkom open vuur',
          'Houd blusmiddelen bij de hand',
          'Controleer werkgebied na werkzaamheden',
        ],
      },
    ],
  },
];

/**
 * Suggest hazards based on materials used in task
 */
export function suggestHazardsFromMaterials(materials: Material[]): Hazard[] {
  const suggestions: Hazard[] = [];
  const seenTypes = new Set<string>();

  for (const material of materials) {
    // Check if material is hazardous or requires MSDS
    if (material.hazardous || material.msdsRequired) {
      const materialName = material.name.toLowerCase();
      
      // Find matching mappings
      for (const mapping of MATERIAL_HAZARD_DATABASE) {
        const matches = mapping.keywords.some(keyword => 
          materialName.includes(keyword.toLowerCase())
        );
        
        if (matches) {
          // Add suggestions that haven't been added yet
          for (const suggestion of mapping.suggestions) {
            const uniqueKey = `${suggestion.category}-${suggestion.description}`;
            if (!seenTypes.has(uniqueKey)) {
              suggestions.push({
                id: `suggested-${Date.now()}-${suggestions.length}`,
                description: suggestion.description,
                category: suggestion.category,
                source: 'custom',
                // Set initial risk scores - user should adjust based on actual situation
                effectScore: material.hazardous ? 15 : 7,
                exposureScore: 3,
                probabilityScore: 1,
                riskScore: material.hazardous ? 45 : 21,
                riskLevel: material.hazardous ? 'possible' : 'acceptable',
                controlMeasures: suggestion.controlMeasures.map((desc, idx) => ({
                  id: `control-${Date.now()}-${idx}`,
                  type: idx === 0 ? 'engineering' : idx === 1 ? 'administrative' : 'ppe',
                  description: desc,
                })),
                residualRiskLevel: 'acceptable',
              });
              seenTypes.add(uniqueKey);
            }
          }
          break; // Found a match, no need to check other mappings for this material
        }
      }
      
      // Generic suggestion for hazardous materials without specific mapping
      if (suggestions.length === 0 && (material.hazardous || material.msdsRequired)) {
        suggestions.push({
          id: `suggested-generic-${Date.now()}`,
          description: `Risico's bij gebruik van ${material.name} - raadpleeg MSDS`,
          category: 'chemical',
          source: 'custom',
          effectScore: 7,
          exposureScore: 3,
          probabilityScore: 1,
          riskScore: 21,
          riskLevel: 'acceptable',
          controlMeasures: [
            {
              id: `control-generic-1`,
              type: 'administrative',
              description: 'Raadpleeg MSDS voor specifieke maatregelen',
            },
            {
              id: `control-generic-2`,
              type: 'ppe',
              description: 'Gebruik geschikte persoonlijke beschermingsmiddelen',
            },
            {
              id: `control-generic-3`,
              type: 'engineering',
              description: 'Zorg voor adequate ventilatie',
            },
          ],
          residualRiskLevel: 'acceptable',
        });
      }
    }
  }

  return suggestions;
}

/**
 * Get hazard suggestions for workplace conditions
 */
export function suggestHazardsFromConditions(conditions: WorkplaceConditions): Hazard[] {
  const suggestions: Hazard[] = [];

  // Dark lighting
  if (conditions.lighting === 'dark' || conditions.lighting === 'poor') {
    suggestions.push({
      id: `condition-lighting-${Date.now()}`,
      description: 'Onvoldoende verlichting verhoogt struikel- en valgevaar',
      category: 'environmental',
      source: 'custom',
      effectScore: 7,
      exposureScore: 6,
      probabilityScore: 3,
      riskScore: 126,
      riskLevel: 'possible',
      controlMeasures: [
        {
          id: `control-lighting-1`,
          type: 'engineering',
          description: 'Zorg voor adequate werkverlichting (min. 200 lux)',
        },
        {
          id: `control-lighting-2`,
          type: 'ppe',
          description: 'Gebruik hoofdlampen indien nodig',
        },
        {
          id: `control-lighting-3`,
          type: 'administrative',
          description: 'Markeer obstakels duidelijk',
        },
      ],
      residualRiskLevel: 'acceptable',
    });
  }

  // Poor ventilation
  if (conditions.ventilation === 'poor' || conditions.ventilation === 'none') {
    suggestions.push({
      id: `condition-ventilation-${Date.now()}`,
      description: 'Slechte ventilatie kan leiden tot gezondheidsklachten en concentratieverlies',
      category: 'environmental',
      source: 'custom',
      effectScore: 7,
      exposureScore: 6,
      probabilityScore: 3,
      riskScore: 126,
      riskLevel: 'possible',
      controlMeasures: [
        {
          id: `control-ventilation-1`,
          type: 'engineering',
          description: 'Verbeter natuurlijke ventilatie (ramen/deuren)',
        },
        {
          id: `control-ventilation-2`,
          type: 'engineering',
          description: 'Gebruik mechanische ventilatie indien nodig',
        },
        {
          id: `control-ventilation-3`,
          type: 'administrative',
          description: 'Neem regelmatig pauzes in frisse lucht',
        },
      ],
      residualRiskLevel: 'acceptable',
    });
  }

  // Extreme or hot temperature
  if (conditions.temperature === 'extreme' || conditions.temperature === 'hot') {
    suggestions.push({
      id: `condition-temperature-${Date.now()}`,
      description: 'Extreme temperaturen verhogen risico op uitputting en hittestress',
      category: 'physical',
      source: 'custom',
      effectScore: 15,
      exposureScore: 6,
      probabilityScore: 3,
      riskScore: 270,
      riskLevel: 'substantial',
      controlMeasures: [
        {
          id: `control-temperature-1`,
          type: 'administrative',
          description: 'Zorg voor voldoende drinkwater (min. 1 liter/uur)',
        },
        {
          id: `control-temperature-2`,
          type: 'administrative',
          description: 'Plan werk in koelere uren (ochtend/avond)',
        },
        {
          id: `control-temperature-3`,
          type: 'administrative',
          description: 'Neem regelmatig koelpauzes (elke 30 min)',
        },
        {
          id: `control-temperature-4`,
          type: 'ppe',
          description: 'Gebruik koelkleding indien beschikbaar',
        },
      ],
      residualRiskLevel: 'acceptable',
    });
  }

  // Cold temperature
  if (conditions.temperature === 'cold') {
    suggestions.push({
      id: `condition-cold-${Date.now()}`,
      description: 'Lage temperaturen kunnen leiden tot onderkoeling en verminderde concentratie',
      category: 'physical',
      source: 'custom',
      effectScore: 7,
      exposureScore: 6,
      probabilityScore: 3,
      riskScore: 126,
      riskLevel: 'possible',
      controlMeasures: [
        {
          id: `control-cold-1`,
          type: 'ppe',
          description: 'Draag warme werkkleding in lagen',
        },
        {
          id: `control-cold-2`,
          type: 'administrative',
          description: 'Neem regelmatig opwarmpauzes',
        },
        {
          id: `control-cold-3`,
          type: 'engineering',
          description: 'Zorg voor verwarmde pauzeruimte',
        },
      ],
      residualRiskLevel: 'acceptable',
    });
  }

  // Extreme noise
  if (conditions.noise === 'extreme' || conditions.noise === 'loud') {
    suggestions.push({
      id: `condition-noise-${Date.now()}`,
      description: 'Hoge geluidsniveaus (>80 dB) kunnen gehoorschade veroorzaken',
      category: 'physical',
      source: 'custom',
      effectScore: 15,
      exposureScore: 6,
      probabilityScore: 6,
      riskScore: 540,
      riskLevel: 'high',
      controlMeasures: [
        {
          id: `control-noise-1`,
          type: 'ppe',
          description: 'Gebruik gehoorbescherming (oordoppen of -kappen)',
        },
        {
          id: `control-noise-2`,
          type: 'administrative',
          description: 'Beperk blootstellingstijd (<8 uur bij 85 dB)',
        },
        {
          id: `control-noise-3`,
          type: 'engineering',
          description: 'Overweeg geluidsisolatie of -dempers',
        },
        {
          id: `control-noise-4`,
          type: 'administrative',
          description: 'Voer periodieke gehoorcontroles uit',
        },
      ],
      residualRiskLevel: 'acceptable',
    });
  }

  // Unstable ground
  if (conditions.groundCondition === 'unstable' || conditions.groundCondition === 'slippery') {
    suggestions.push({
      id: `condition-ground-${Date.now()}`,
      description: 'Onstabiele of gladde ondergrond verhoogt val- en struikelgevaar',
      category: 'mechanical',
      source: 'custom',
      effectScore: 15,
      exposureScore: 6,
      probabilityScore: 3,
      riskScore: 270,
      riskLevel: 'substantial',
      controlMeasures: [
        {
          id: `control-ground-1`,
          type: 'ppe',
          description: 'Draag antislip veiligheidsschoenen (S3 categorie)',
        },
        {
          id: `control-ground-2`,
          type: 'engineering',
          description: 'Gebruik steunpunten waar mogelijk',
        },
        {
          id: `control-ground-3`,
          type: 'administrative',
          description: 'Markeer gevaarlijke zones met hekken/tape',
        },
        {
          id: `control-ground-4`,
          type: 'engineering',
          description: 'Stabiliseer ondergrond indien mogelijk',
        },
      ],
      residualRiskLevel: 'acceptable',
    });
  }

  // Uneven ground
  if (conditions.groundCondition === 'uneven') {
    suggestions.push({
      id: `condition-uneven-${Date.now()}`,
      description: 'Onegale ondergrond verhoogt struikelgevaar',
      category: 'mechanical',
      source: 'custom',
      effectScore: 7,
      exposureScore: 6,
      probabilityScore: 3,
      riskScore: 126,
      riskLevel: 'possible',
      controlMeasures: [
        {
          id: `control-uneven-1`,
          type: 'ppe',
          description: 'Draag stevige veiligheidsschoenen',
        },
        {
          id: `control-uneven-2`,
          type: 'administrative',
          description: 'Markeer hoogteverschillen',
        },
        {
          id: `control-uneven-3`,
          type: 'engineering',
          description: 'Egaliseer waar mogelijk',
        },
      ],
      residualRiskLevel: 'acceptable',
    });
  }

  // Confined space
  if (conditions.spaceConstraint === 'confined' || conditions.spaceConstraint === 'cramped') {
    suggestions.push({
      id: `condition-space-${Date.now()}`,
      description: 'Beperkte ruimte verhoogt risico op knel- en beknellingsgevaar',
      category: 'other',
      source: 'custom',
      effectScore: 15,
      exposureScore: 6,
      probabilityScore: 1,
      riskScore: 90,
      riskLevel: 'possible',
      controlMeasures: [
        {
          id: `control-space-1`,
          type: 'administrative',
          description: 'Volg besloten ruimte procedures (VCA)',
        },
        {
          id: `control-space-2`,
          type: 'engineering',
          description: 'Zorg voor adequate verlichting',
        },
        {
          id: `control-space-3`,
          type: 'administrative',
          description: 'Communiceer regelmatig met buitenpost',
        },
        {
          id: `control-space-4`,
          type: 'administrative',
          description: 'Gebruik evacuatieplan en redmiddelen',
        },
      ],
      residualRiskLevel: 'acceptable',
    });
  }

  // Extreme weather exposure
  if (conditions.weatherExposure === 'extreme' || conditions.weatherExposure === 'exposed') {
    suggestions.push({
      id: `condition-weather-${Date.now()}`,
      description: 'Blootstelling aan extreme weersomstandigheden',
      category: 'environmental',
      source: 'custom',
      effectScore: 7,
      exposureScore: 6,
      probabilityScore: 3,
      riskScore: 126,
      riskLevel: 'possible',
      controlMeasures: [
        {
          id: `control-weather-1`,
          type: 'administrative',
          description: 'Monitor weersvoorspelling',
        },
        {
          id: `control-weather-2`,
          type: 'administrative',
          description: 'Stop werk bij extreme weersomstandigheden',
        },
        {
          id: `control-weather-3`,
          type: 'ppe',
          description: 'Gebruik weer- en winddichte kleding',
        },
        {
          id: `control-weather-4`,
          type: 'engineering',
          description: 'Zorg voor beschutting indien mogelijk',
        },
      ],
      residualRiskLevel: 'acceptable',
    });
  }

  return suggestions;
}

/**
 * Get all hazard suggestions for materials and conditions combined
 */
export function suggestAllHazards(
  materials?: Material[],
  conditions?: WorkplaceConditions
): Hazard[] {
  const suggestions: Hazard[] = [];

  // Add material-based suggestions
  if (materials && materials.length > 0) {
    suggestions.push(...suggestHazardsFromMaterials(materials));
  }

  // Add condition-based suggestions
  if (conditions) {
    suggestions.push(...suggestHazardsFromConditions(conditions));
  }

  return suggestions;
}