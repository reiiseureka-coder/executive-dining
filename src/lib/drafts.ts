// Keep browser-stored drafts local. Ignore malformed or obsolete stored fields.
export function readDraft<T extends Record<string, unknown>>(
  key: string,
  defaults: T,
): T {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return defaults;
    const candidate = parsed as Record<string, unknown>;
    const safe: Record<string, unknown> = { ...defaults };
    for (const [field, value] of Object.entries(defaults)) {
      const stored = candidate[field];
      if (Array.isArray(value)) {
        if (
          Array.isArray(stored) &&
          stored.every((item) => typeof item === "string")
        )
          safe[field] = stored;
      } else if (value && typeof value === "object") {
        if (
          stored &&
          typeof stored === "object" &&
          !Array.isArray(stored) &&
          Object.keys(value).every(
            (part) =>
              typeof (stored as Record<string, unknown>)[part] === "number",
          )
        )
          safe[field] = stored;
      } else if (typeof stored === typeof value) safe[field] = stored;
    }
    return safe as T;
  } catch {
    return defaults;
  }
}
