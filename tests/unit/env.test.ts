import { afterEach, describe, expect, it, vi } from "vitest";
import { publicEnv } from "@/lib/env";

describe("publicEnv", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("aceita URL e chave válidas", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://exemplo.supabase.co");
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "sb_publishable_xxxxxxxxxxxxxxxx",
    );
    expect(publicEnv().NEXT_PUBLIC_SUPABASE_URL).toBe(
      "https://exemplo.supabase.co",
    );
  });

  it("explica o que falta quando não configurado", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(() => publicEnv()).toThrow(/\.env\.local/);
  });
});
