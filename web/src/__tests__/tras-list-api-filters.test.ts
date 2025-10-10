import { GET } from "@/app/api/tras/route";
import { expect } from "@jest/globals";

describe("TRA list API - filters/pagination (smoke)", () => {
  it("exports GET handler", () => {
    expect(GET).toBeDefined();
    expect(typeof GET).toBe("function");
  });

  // Additional integration-style tests require Firestore emulator; smoke checks are present.
});
