import { describe, expect, it } from "vitest";
import {
  CONSENT_COOKIE,
  consentFromCookieString,
  parseConsent,
  serializeConsent,
} from "@/modules/consent/cookies";

describe("consentimento de cookies", () => {
  it("grava e lê a escolha", () => {
    const raw = serializeConsent(
      { measurement: true, ads: false },
      new Date("2026-11-16T12:00:00Z"),
    );
    expect(parseConsent(raw)).toEqual({
      v: 1,
      at: "2026-11-16T12:00:00.000Z",
      measurement: true,
      ads: false,
    });
  });

  it("acha o cookie no meio dos outros", () => {
    const raw = serializeConsent({ measurement: false, ads: true });
    const found = consentFromCookieString(
      `tema=escuro; ${CONSENT_COOKIE}=${raw}; outro=1`,
    );
    expect(found?.ads).toBe(true);
    expect(found?.measurement).toBe(false);
  });

  it("sem cookie, versão antiga ou valor estranho vale como sem escolha", () => {
    expect(consentFromCookieString("tema=escuro")).toBeNull();
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent("lixo")).toBeNull();
    expect(
      parseConsent(
        encodeURIComponent(
          JSON.stringify({
            v: 0,
            at: "2026-01-01",
            measurement: true,
            ads: true,
          }),
        ),
      ),
    ).toBeNull();
    expect(
      parseConsent(
        encodeURIComponent(
          JSON.stringify({
            v: 1,
            at: "2026-01-01",
            measurement: "sim",
            ads: true,
          }),
        ),
      ),
    ).toBeNull();
  });
});
