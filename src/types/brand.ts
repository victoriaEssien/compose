/** Brand Kit (spec section 10) and brand voice (spec section 27). */
import { z } from "zod";

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Expected a 6-digit hex color, for example #101014");

/** Only fonts whose TTF files ship in the repo, because Satori needs the bytes. */
export const fontFamilies = [
  "Inter",
  "Space Grotesk",
  "IBM Plex Sans",
  "Playfair Display",
  "JetBrains Mono",
] as const;

export const fontFamilySchema = z.enum(fontFamilies);

export const cardStyles = ["flat", "outlined", "elevated", "glass"] as const;
export const illustrationStyles = ["none", "line", "flat", "isometric", "three_d"] as const;
export const codeBlockStyles = ["dark", "light", "terminal"] as const;

export const cardStyleSchema = z.enum(cardStyles);
export const illustrationStyleSchema = z.enum(illustrationStyles);
export const codeBlockStyleSchema = z.enum(codeBlockStyles);

export const brandFontsSchema = z.object({
  primary: fontFamilySchema,
  secondary: fontFamilySchema,
});

export const brandColorsSchema = z.object({
  background: hexColorSchema,
  text: hexColorSchema,
  accent: hexColorSchema,
  muted: hexColorSchema,
});

export const brandStyleSchema = z.object({
  /** Corner radius in px, applied to cards and images by the renderer. */
  radius: z.number().int().min(0).max(48),
  card: cardStyleSchema,
  illustration: illustrationStyleSchema,
  codeBlock: codeBlockStyleSchema,
});

/** Free text rather than a structured list: it is inlined into prompts verbatim. */
export const brandVoiceSchema = z.string().max(1000);

export const brandKitSchema = z.object({
  name: z.string().min(1).max(60),
  username: z.string().min(1).max(40),
  logoUrl: z.url().nullable(),
  avatarUrl: z.url().nullable(),
  fonts: brandFontsSchema,
  colors: brandColorsSchema,
  style: brandStyleSchema,
  voice: brandVoiceSchema.nullable(),
});

export type BrandFonts = z.infer<typeof brandFontsSchema>;
export type BrandColors = z.infer<typeof brandColorsSchema>;
export type BrandStyle = z.infer<typeof brandStyleSchema>;
export type BrandKit = z.infer<typeof brandKitSchema>;
export type FontFamily = z.infer<typeof fontFamilySchema>;
export type CardStyle = z.infer<typeof cardStyleSchema>;
export type IllustrationStyle = z.infer<typeof illustrationStyleSchema>;
export type CodeBlockStyle = z.infer<typeof codeBlockStyleSchema>;

/** Seeded for every new user, and the fallback the renderer uses until one is saved. */
export const defaultBrandKit: BrandKit = {
  name: "Your brand",
  username: "@yourhandle",
  logoUrl: null,
  avatarUrl: null,
  fonts: { primary: "Inter", secondary: "Inter" },
  colors: { background: "#0B0B0F", text: "#F5F5F7", accent: "#6E56CF", muted: "#8A8A96" },
  style: { radius: 16, card: "flat", illustration: "line", codeBlock: "dark" },
  voice: null,
};

/**
 * True while the seeded placeholder is untouched anywhere, so the UI can prompt
 * for setup. Compared across the whole kit: someone who picks colors, fonts and
 * a voice has set their brand up, whether or not they renamed it.
 */
export function isDefaultBrandKit(kit: BrandKit) {
  return JSON.stringify(brandKitSchema.parse(kit)) === JSON.stringify(defaultBrandKit);
}

/**
 * The handle is drawn into the footer of every slide, so this one placeholder
 * survives into the exported PNG. Checked separately from the rest of the kit
 * because it is the only field that makes a file unpublishable.
 */
export function hasPlaceholderHandle(kit: BrandKit) {
  return kit.username.trim() === defaultBrandKit.username;
}
