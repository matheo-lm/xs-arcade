import { describe, expect, test } from "vitest";
import { resolveLocale } from "@shared/i18n";

describe("i18n locale resolution", () => {
  test("prioritizes query param over other sources", () => {
    const locale = resolveLocale({
      search: "?lang=es",
      storedLocale: "en",
      navigatorLanguages: ["en-US"]
    });

    expect(locale).toBe("es");
  });

  test("falls back to stored locale when query is absent", () => {
    const locale = resolveLocale({
      search: "",
      storedLocale: "es",
      navigatorLanguages: ["en-US"]
    });

    expect(locale).toBe("es");
  });

  test("falls back to navigator then en", () => {
    expect(
      resolveLocale({ search: "", storedLocale: null, navigatorLanguages: ["es-MX", "en-US"] })
    ).toBe("es");

    expect(resolveLocale({ search: "", storedLocale: null, navigatorLanguages: ["fr-FR"] })).toBe("en");
  });
});
