import { POST } from "@/app/api/tras/route";
import { expect } from "@jest/globals";

describe("TRA POST API route (basic)", () => {
  it("exports POST handler", () => {
    expect(POST).toBeDefined();
    expect(typeof POST).toBe("function");
  });
});
