/**
 * Debug test for next-intl mock - detailed logging
 */

describe("next-intl mock debugging", () => {
  test("should debug translation lookup", () => {
    // Import after Jest has set up mocks
    const { useTranslations } = require("next-intl");
    
    const t = useTranslations();
    
    // Test individual lookups with detailed logging
    console.log("=== Testing translation lookups ===");
    
    // Test a simple translation
    const templateTitle = t("templates.selector.title");
    console.log("templates.selector.title =>", templateTitle);
    console.log("Expected: Templates");
    
    // Test a different key
    const startFromScratch = t("templates.startFromScratch");
    console.log("templates.startFromScratch =>", startFromScratch);
    console.log("Expected: Begin zonder template");
    
    // Test nested key
    const subtitle = t("templates.selector.subtitle");
    console.log("templates.selector.subtitle =>", subtitle);
    console.log("Expected: Kies een TRA-template om snel te starten");
    
    // Verify they are translations, not keys
    expect(templateTitle).toBe("Templates");
    expect(startFromScratch).toBe("Begin zonder template");
    expect(subtitle).toBe("Kies een TRA-template om snel te starten");
  });
});