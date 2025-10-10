/**
 * Sample Jest test to verify Jest configuration
 * This file demonstrates basic Jest functionality
 */

describe("Jest Configuration Test", () => {
  it("should pass basic test", () => {
    expect(true).toBe(true);
  });

  it("should handle basic math operations", () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
    expect(3 * 4).toBe(12);
    expect(8 / 2).toBe(4);
  });

  it("should handle string operations", () => {
    const greeting = "Hello, World!";
    expect(greeting).toContain("World");
    expect(greeting).toHaveLength(13);
    expect(greeting.toLowerCase()).toBe("hello, world!");
  });

  it("should handle array operations", () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers).toHaveLength(5);
    expect(numbers).toContain(3);
    expect(numbers).toEqual([1, 2, 3, 4, 5]);
  });

  it("should handle object operations", () => {
    const user = {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
    };

    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("name", "John Doe");
    expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  it("should handle promises", async () => {
    const promise = Promise.resolve("Success!");
    await expect(promise).resolves.toBe("Success!");
  });

  it("should handle async functions", async () => {
    const asyncFunction = async () => {
      return new Promise((resolve) => {
        setTimeout(() => resolve("Async result"), 100);
      });
    };

    const result = await asyncFunction();
    expect(result).toBe("Async result");
  });
});
