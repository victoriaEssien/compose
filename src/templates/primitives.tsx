import { createElement } from "react";
import type { CSSProperties, ReactNode } from "react";

import { iconNodes } from "./icon-nodes";
import type { IconName } from "./icon-nodes";

import { fitCodeFontSize } from "./theme";
import type { SlideTheme } from "./theme";
import type { CodeLine } from "./types";

/**
 * Satori draws flexbox and inline styles only, so every template composes these
 * rather than Tailwind classes. Same code paints the preview and the PNG.
 */
export function Frame({
  theme,
  avatarUrl,
  username,
  index,
  total,
  children,
}: {
  theme: SlideTheme;
  avatarUrl: string | null;
  username: string;
  index: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: theme.width,
        height: theme.height,
        padding: theme.padding,
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.fonts.primary,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          alignItems: theme.align === "center" ? "center" : "flex-start",
          textAlign: theme.align,
        }}
      >
        {children}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              width={44}
              height={44}
              style={{ borderRadius: 22, objectFit: "cover" }}
              alt=""
            />
          ) : (
            <div
              style={{
                display: "flex",
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: theme.colors.accent,
              }}
            />
          )}
          <span
            style={{
              marginLeft: 16,
              fontSize: theme.type.footer,
              fontFamily: theme.fonts.secondary,
              color: theme.colors.muted,
            }}
          >
            {username}
          </span>
        </div>

        {total > 1 && (
          <span style={{ fontSize: theme.type.footer, color: theme.colors.faint }}>
            {index + 1} / {total}
          </span>
        )}
      </div>
    </div>
  );
}

export function Eyebrow({ theme, children }: { theme: SlideTheme; children: ReactNode }) {
  return (
    <span
      style={{
        fontSize: theme.type.eyebrow,
        fontWeight: 700,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: theme.colors.accent,
        marginBottom: 24,
      }}
    >
      {children}
    </span>
  );
}

export function Heading({
  theme,
  size = "heading",
  fontSize,
  children,
}: {
  theme: SlideTheme;
  size?: "display" | "heading";
  /** A fitted size from fit.ts. Falls back to what the Brand Kit asks for. */
  fontSize?: number;
  children: ReactNode;
}) {
  return (
    <span
      style={{
        fontSize: fontSize ?? (size === "display" ? theme.type.display : theme.type.heading),
        fontWeight: 700,
        lineHeight: 1.08,
        letterSpacing: -1,
      }}
    >
      {children}
    </span>
  );
}

export function Body({
  theme,
  color,
  fontSize,
  children,
}: {
  theme: SlideTheme;
  color?: string;
  fontSize?: number;
  children: ReactNode;
}) {
  return (
    <span
      style={{
        fontSize: fontSize ?? theme.type.body,
        lineHeight: 1.45,
        fontFamily: theme.fonts.secondary,
        color: color ?? theme.colors.muted,
      }}
    >
      {children}
    </span>
  );
}

export function Surface({
  theme,
  style,
  children,
}: {
  theme: SlideTheme;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 32,
        borderRadius: theme.radius,
        backgroundColor: theme.surface.background,
        border: theme.surface.border,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const codePalettes = {
  dark: { background: "#0D1117", border: "none", text: "#E6EDF3" },
  light: { background: "#F6F8FA", border: "1px solid #D0D7DE", text: "#24292F" },
  terminal: { background: "#000000", border: "none", text: "#E6EDF3" },
} as const;

const codePadding = 32;
const codeLineHeight = 1.5;

function codeLayout(lines: CodeLine[] | null, raw: string, theme: SlideTheme) {
  const palette = codePalettes[theme.codeBlock];
  const content = lines ?? raw.split("\n").map((text) => [{ text, color: palette.text }]);

  const longestLine = content.reduce(
    (widest, line) =>
      Math.max(
        widest,
        line.reduce((n, token) => n + token.text.length, 0),
      ),
    0,
  );

  return { palette, content, fontSize: fitCodeFontSize(longestLine, theme) };
}

/** What CodeBlock will occupy, so the prose around it can be fitted to the rest. */
export function codeBlockHeight(raw: string, lines: CodeLine[] | null, theme: SlideTheme) {
  const { content, fontSize } = codeLayout(lines, raw, theme);

  return codePadding * 2 + content.length * fontSize * codeLineHeight;
}

export function CodeBlock({
  theme,
  lines,
  raw,
}: {
  theme: SlideTheme;
  lines: CodeLine[] | null;
  raw: string;
}) {
  const { palette, content, fontSize } = codeLayout(lines, raw, theme);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        padding: codePadding,
        borderRadius: theme.radius,
        backgroundColor: palette.background,
        border:
          theme.codeBlock === "terminal" ? `1px solid ${theme.colors.accent}` : palette.border,
        fontFamily: "JetBrains Mono",
        fontSize,
        lineHeight: codeLineHeight,
      }}
    >
      {content.map((line, lineIndex) => (
        <div key={lineIndex} style={{ display: "flex" }}>
          {line.length === 0 ? (
            <span style={{ whiteSpace: "pre" }}> </span>
          ) : (
            line.map((token, tokenIndex) => (
              <span key={tokenIndex} style={{ color: token.color, whiteSpace: "pre" }}>
                {token.text}
              </span>
            ))
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Satori cannot resolve React components, so lucide icons are drawn from stored
 * shape data as intrinsic SVG elements instead.
 */
export function Illustration({
  theme,
  icon,
  imageUrl,
  size = 72,
}: {
  theme: SlideTheme;
  icon: IconName | null;
  imageUrl: string | null;
  size?: number;
}) {
  if (imageUrl) {
    return (
      // Transparent PNG, so it is contained on the brand background rather than cropped.
      <img
        src={imageUrl}
        width={size * 2}
        height={size * 2}
        style={{ objectFit: "contain" }}
        alt=""
      />
    );
  }

  if (!icon) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={theme.colors.accent}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconNodes[icon].map(([tag, attrs], index) => createElement(tag, { key: index, ...attrs }))}
    </svg>
  );
}
