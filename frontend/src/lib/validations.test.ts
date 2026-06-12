import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./validations";

describe("loginSchema", () => {
  it("accepts a valid login", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "secret" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "secret" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts a strong password", () => {
    const result = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "Str0ngPass",
      phone: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a weak password", () => {
    const result = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "weak",
    });
    expect(result.success).toBe(false);
  });
});
