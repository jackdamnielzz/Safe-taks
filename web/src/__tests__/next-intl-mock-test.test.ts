/**
 * Test to verify next-intl mock is working correctly
 */

describe("next-intl mock verification", () => {
  test("should load and use Dutch translations", () => {
    // Import after Jest has set up mocks
    const { useTranslations } = require("next-intl");
    
    const t = useTranslations();
    
    // Test a few translation keys
    const title = t("templates.selector.title");
    const subtitle = t("templates.selector.subtitle");
    const startFromScratch = t("templates.startFromScratch");
    
    console.log("Translation test results:");
    console.log("  templates.selector.title =>", title);
    console.log("  templates.selector.subtitle =>", subtitle);
    console.log("  templates.startFromScratch =>", startFromScratch);
    
    // These should be Dutch translations, not keys
    expect(title).not.toBe("templates.selector.title");
    expect(subtitle).not.toBe("templates.selector.subtitle");
    expect(startFromScratch).toBe("Begin zonder template");
  });
});