/**
 * Direct test of the next-intl mock to see if it's being used at all
 */

/* eslint-disable @typescript-eslint/no-require-imports */

describe("Direct next-intl mock test", () => {
  test("should use the mock and return Dutch translations", () => {
    // Import next-intl after jest setup
    const nextIntl = require("next-intl");
    
    console.log("next-intl module exports:", Object.keys(nextIntl));
    
    // Get the translation function
    const t = nextIntl.useTranslations();
    
    console.log("Translation function:", typeof t);
    console.log("Translation function:", t);
    
    // Test a key that should definitely be in our mock
    const result = t("templates.selector.title");
    console.log("Translation result for 'templates.selector.title':", result);
    
    // Test another key
    const result2 = t("templates.startFromScratch");
    console.log("Translation result for 'templates.startFromScratch':", result2);
    
    // Test the raw next-intl import
    const { useTranslations } = nextIntl;
    const t2 = useTranslations();
    const result3 = t2("templates.selector.title");
    console.log("Result using destructured useTranslations:", result3);
    
    // Check if the result is what we expect
    expect(result).toBe("Templates");
    expect(result2).toBe("Begin zonder template");
    expect(result3).toBe("Templates");
  });
});