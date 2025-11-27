/**
 * Simple next-intl mock that returns hardcoded Dutch translations
 * This is a fallback to test if the basic mock approach works
 */

const React = require("react");

// Simple hardcoded translations for testing
const translations = {
  // Template selector translations
  "templates.selector.title": "Templates",
  "templates.selector.subtitle": "Kies een TRA-template om snel te starten",
  "templates.selector.searchPlaceholder": "Zoek templates...",
  "templates.selector.filterByCategory": "Filter op categorie",
  "templates.selector.allCategories": "Alle categorieën",
  "templates.selector.templatesFound": "templates gevonden",
  "templates.selector.resetFilters": "Filters resetten",
  "templates.selector.noTemplatesFound": "Geen templates gevonden",
  "templates.selector.noTemplatesDescription": "Er zijn geen templates die aan uw zoekcriteria voldoen.",
  "templates.selector.loading": "Templates laden...",
  "templates.selector.startFromScratch": "Begin zonder template",
  "templates.selector.startFromScratchDesc": "Maak een nieuwe TRA vanaf nul",
  "templates.selector.selectedIndicator": "Template geselecteerd: {name}",
  "templates.selector.loadError": "Kan template niet laden",
  
  // Other translations
  "templates.hazards": "gevaren",
  "templates.steps": "stappen",
  "templates.standard": "Standaard",
  "templates.startFromScratch": "Begin zonder template",
  "templates.startFromScratchDesc": "Maak een nieuwe TRA vanaf nul",
  
  // Wizard translations
  "wizard.createTitle": "TRA Aanmaken",
  "wizard.titleLabel": "TRA Titel",
  "wizard.descriptionLabel": "Beschrijving",
  "wizard.projectRequired": "Project is verplicht",
  "wizard.next": "Volgende",
  "wizard.back": "Terug",
  
  // Control measures
  "tra.controlMeasures.title": "Beheersmaatregelen",
  "tra.controlMeasures.addCustom": "Nieuwe maatregel",
  "tra.controlMeasures.add": "Toevoegen",
  "tra.controlMeasures.delete": "Verwijderen",
  "tra.controlMeasures.suggestedTitle": "Suggesties uit bibliotheek",
  "tra.controlMeasures.noneAdded": "Er zijn nog geen beheersmaatregelen toegevoegd.",
  "tra.controlMeasures.helpText": "Gebruik de voorgestelde maatregelen of voeg eigen maatregelen toe.",
  "tra.controlMeasures.summaryCount": "Aantal beheersmaatregelen: {count}",
  "tra.controlMeasures.descriptionPlaceholder": "Geef een omschrijving (minimaal 10 tekens)",
  "tra.controlMeasures.responsiblePlaceholder": "Naam of rol van de verantwoordelijke",
  "tra.controlMeasures.type": "Type",
  "tra.controlMeasures.description": "Beschrijving",
  "tra.controlMeasures.responsible": "Verantwoordelijke",
  "tra.controlMeasures.status": "Status",
  "tra.controlMeasures.validation.minOne": "Voeg ten minste één beheersmaatregel toe.",
  "tra.controlMeasures.validation.descriptionMin": "Beschrijving moet minimaal 10 tekens bevatten.",
  "tra.controlMeasures.hierarchy.elimination": "Eliminatie",
  "tra.controlMeasures.hierarchy.substitution": "Vervanging",
  "tra.controlMeasures.hierarchy.engineering": "Technische maatregelen",
  "tra.controlMeasures.hierarchy.administrative": "Organisatorische maatregelen",
  "tra.controlMeasures.hierarchy.ppe": "Persoonlijke beschermingsmiddelen",
  "tra.controlMeasures.statuses.planned": "Gepland",
  "tra.controlMeasures.statuses.in_progress": "In uitvoering",
  "tra.controlMeasures.statuses.completed": "Voltooid",
  "tra.controlMeasures.statuses.verified": "Geverifieerd",
  
  // Project selector
  "safety.tra.wizard.projectSelector.label": "Project",
  "safety.tra.wizard.projectSelector.placeholder": "Selecteer een project",
  "safety.tra.wizard.projectSelector.loading": "Projecten laden...",
  "safety.tra.wizard.projectSelector.noResults": "Geen projecten gevonden",
  "safety.tra.wizard.projectSelector.searchPlaceholder": "Zoek projecten...",
  "safety.tra.wizard.projectSelector.loadError": "Kan projecten niet laden"
};

function useTranslations(namespace) {
  return (key, vars) => {
    // If namespace is provided, prepend it to the key
    const fullKey = namespace ? `${namespace}.${key}` : key;
    
    // Look up the translation
    const translation = translations[fullKey];
    
    if (!translation) {
      console.warn(`[next-intl simple mock] Translation not found for key: ${fullKey}`);
      return fullKey; // Return key as fallback
    }
    
    // Handle variable substitution
    if (vars && typeof vars === "object") {
      let text = translation;
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
      return text;
    }
    
    return translation;
  };
}

function useFormatter() {
  return {
    formatDate: (d) => (d ? new Date(d).toLocaleString("nl-NL") : ""),
    formatNumber: (n) => {
      if (n === null || n === undefined) return "";
      return new Intl.NumberFormat("nl-NL").format(n);
    },
  };
}

function NextIntlClientProvider({ children }) {
  return React.createElement(React.Fragment, null, children);
}

module.exports = {
  useTranslations,
  useFormatter,
  NextIntlClientProvider,
  default: {
    useTranslations,
    useFormatter,
    NextIntlClientProvider,
  },
};