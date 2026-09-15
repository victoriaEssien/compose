/** Shiki runs here and hands the templates plain tokens, because Satori is sync. */
import "server-only";
import { createHighlighter } from "shiki";
import type { Highlighter } from "shiki";

import type { CodeLine } from "@/templates";
import type { CodeBlockStyle } from "@/types/brand";

const languages = [
  "typescript",
  "javascript",
  "tsx",
  "jsx",
  "python",
  "sql",
  "bash",
  "json",
  "html",
  "css",
  "go",
  "rust",
  "java",
  "ruby",
  "php",
  "yaml",
  "markdown",
] as const;

const themes: Record<CodeBlockStyle, string> = {
  dark: "github-dark",
  light: "github-light",
  terminal: "github-dark",
};

const aliases: Record<string, string> = {
  ts: "typescript",
  js: "javascript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  console: "bash",
  py: "python",
  yml: "yaml",
  md: "markdown",
  golang: "go",
  rb: "ruby",
  postgres: "sql",
  postgresql: "sql",
};

let pending: Promise<Highlighter> | undefined;

function highlighter() {
  pending ??= createHighlighter({
    langs: [...languages],
    themes: ["github-dark", "github-light"],
  });
  return pending;
}

export async function highlightCode(
  code: string,
  language: string,
  style: CodeBlockStyle,
): Promise<CodeLine[]> {
  const shiki = await highlighter();
  const requested = language.trim().toLowerCase();
  const resolved = aliases[requested] ?? requested;

  // An unrecognised language still renders, just without colour.
  const lang = languages.find((known) => known === resolved) ?? "text";
  const { tokens } = shiki.codeToTokens(code, { lang, theme: themes[style] });

  return tokens.map((line) =>
    line.map((token) => ({ text: token.content, color: token.color ?? "#E6EDF3" })),
  );
}
