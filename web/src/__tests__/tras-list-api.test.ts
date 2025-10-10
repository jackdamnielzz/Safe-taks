import { GET } from "@/app/api/tras/route";
import { expect } from "@jest/globals";

describe("TRA list API route (basic)", () => {
  it("exports GET handler", () => {
    expect(GET).toBeDefined();
    expect(typeof GET).toBe("function");
  });
});
