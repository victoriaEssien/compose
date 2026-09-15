import { describe, expect, it } from "vitest";

import { iconNodes } from "./icon-nodes";
import { resolveIcon } from "./icons";

describe("iconNodes", () => {
  it("gives every icon at least one drawable shape", () => {
    for (const [name, nodes] of Object.entries(iconNodes)) {
      expect(nodes.length, `${name} has no shapes`).toBeGreaterThan(0);
    }
  });

  it("uses only shapes Satori can draw", () => {
    const drawable = new Set(["path", "circle", "rect", "polyline", "polygon", "ellipse", "line"]);

    for (const [name, nodes] of Object.entries(iconNodes)) {
      for (const [tag] of nodes) {
        expect(drawable.has(tag), `${name} uses <${tag}>`).toBe(true);
      }
    }
  });

  it("keeps every shape's attributes", () => {
    for (const [name, nodes] of Object.entries(iconNodes)) {
      for (const [tag, attrs] of nodes) {
        expect(Object.keys(attrs).length, `${name} has a bare <${tag}>`).toBeGreaterThan(0);
      }
    }
  });
});

describe("resolveIcon", () => {
  it("matches a concept named directly in the hint", () => {
    expect(resolveIcon("database_icon")).toBe("database");
    expect(resolveIcon("rocket")).toBe("rocket");
  });

  it("matches through the alias table", () => {
    expect(resolveIcon("postgres_diagram")).toBe("database");
    expect(resolveIcon("cache_layer")).toBe("speed");
    expect(resolveIcon("api_flow")).toBe("network");
  });

  it("reads hints in any shape the planner writes them", () => {
    expect(resolveIcon("Database Icon")).toBe("database");
    expect(resolveIcon("query-plan-view")).toBe("database");
  });

  it("returns null rather than guessing", () => {
    expect(resolveIcon(null)).toBeNull();
    expect(resolveIcon("")).toBeNull();
    expect(resolveIcon("an_entirely_unrelated_thing")).toBeNull();
  });

  it("never points an alias at an icon that does not exist", () => {
    const hints = [
      "db",
      "sql",
      "api",
      "cache",
      "deploy",
      "error",
      "debug",
      "git",
      "auth",
      "security",
      "ai",
      "metrics",
      "docs",
      "team",
      "npm",
    ];

    for (const hint of hints) {
      const icon = resolveIcon(hint);
      expect(icon, `${hint} resolved to nothing`).not.toBeNull();
      expect(iconNodes[icon!], `${hint} resolved to a missing icon`).toBeDefined();
    }
  });
});
