import { fitColumns, fitSlide, textBlock } from "./fit";
import { resolveIcon } from "./icons";
import {
  Body,
  CodeBlock,
  Eyebrow,
  Frame,
  Heading,
  Illustration,
  Surface,
  codeBlockHeight,
} from "./primitives";
import type { TemplateKind } from "@/types/slide";
import type { SlideRenderContext } from "./types";

function Shell<K extends TemplateKind>({
  context,
  children,
}: {
  context: SlideRenderContext<K>;
  children: React.ReactNode;
}) {
  const icon = resolveIcon(context.slide.visual);
  const mark = context.illustrationUrl ?? (icon ? true : null);

  return (
    <Frame
      theme={context.theme}
      avatarUrl={context.brand.avatarUrl}
      username={context.brand.username}
      index={context.index}
      total={context.total}
    >
      {mark && (
        <div style={{ display: "flex", marginBottom: 40 }}>
          <Illustration theme={context.theme} icon={icon} imageUrl={context.illustrationUrl} />
        </div>
      )}
      {children}
    </Frame>
  );
}

function Stack({ gap, children }: { gap: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, width: "100%" }}>{children}</div>
  );
}

export function CoverSlide(context: SlideRenderContext<"cover">) {
  const { slide, theme } = context;
  const [headline, subheadline] = fitSlide(
    context,
    [textBlock(theme, "display", slide.headline), textBlock(theme, "body", slide.subheadline)],
    slide.subheadline ? 32 : 0,
  );

  return (
    <Shell context={context}>
      <Stack gap={32}>
        <Heading theme={theme} size="display" fontSize={headline}>
          {slide.headline}
        </Heading>
        {slide.subheadline && (
          <Body theme={theme} fontSize={subheadline}>
            {slide.subheadline}
          </Body>
        )}
      </Stack>
    </Shell>
  );
}

export function TextSlide(context: SlideRenderContext<"text">) {
  const { slide, theme } = context;
  const [heading, body] = fitSlide(
    context,
    [textBlock(theme, "heading", slide.heading), textBlock(theme, "body", slide.body)],
    32,
  );

  return (
    <Shell context={context}>
      <Stack gap={32}>
        <Heading theme={theme} fontSize={heading}>
          {slide.heading}
        </Heading>
        <Body theme={theme} fontSize={body}>
          {slide.body}
        </Body>
      </Stack>
    </Shell>
  );
}

/** Gutter the row number occupies, which the item text does not get to use. */
const listGutter = 104;

export function NumberedListSlide(context: SlideRenderContext<"numbered_list">) {
  const { slide, theme } = context;

  const titles = slide.items.map((item) =>
    textBlock(theme, "item", item.title, {
      font: { family: theme.fonts.primary, weight: 700 },
      inset: listGutter,
    }),
  );
  const captions = slide.items
    .filter((item) => item.body)
    .map((item) => textBlock(theme, "caption", item.body, { inset: listGutter }));

  // A row with no caption is shorter than its own number, which then sets the
  // row height. Charge that difference up front rather than measure around it.
  const numberExcess = Math.max(0, theme.type.heading * 1.2 - theme.type.item * 1.4);
  const gaps =
    44 +
    28 * Math.max(0, slide.items.length - 1) +
    8 * captions.length +
    numberExcess * (slide.items.length - captions.length);

  const sizes = fitSlide(
    context,
    [textBlock(theme, "heading", slide.heading), ...titles, ...captions],
    gaps,
  );

  // Blocks of the same role fit to the same size, so one row speaks for all of
  // them and the list still reads as a list.
  const heading = sizes[0];
  const rowTitle = sizes[1] ?? theme.type.item;
  const rowCaption = sizes[1 + titles.length] ?? theme.type.caption;

  return (
    <Shell context={context}>
      <Stack gap={44}>
        {slide.heading && (
          <Heading theme={theme} fontSize={heading}>
            {slide.heading}
          </Heading>
        )}
        <Stack gap={28}>
          {slide.items.map((item, position) => (
            <div key={position} style={{ display: "flex", width: "100%" }}>
              <span
                style={{
                  minWidth: listGutter,
                  // Shrinks by the same factor the rows did, so the ratio holds.
                  fontSize: theme.type.heading * (rowTitle / theme.type.item),
                  fontWeight: 700,
                  color: theme.colors.accent,
                }}
              >
                {String(position + 1).padStart(2, "0")}
              </span>
              <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
                <span style={{ fontSize: rowTitle, fontWeight: 700 }}>{item.title}</span>
                {item.body && (
                  <span
                    style={{
                      fontSize: rowCaption,
                      lineHeight: 1.4,
                      fontFamily: theme.fonts.secondary,
                      color: theme.colors.muted,
                    }}
                  >
                    {item.body}
                  </span>
                )}
              </div>
            </div>
          ))}
        </Stack>
      </Stack>
    </Shell>
  );
}

export function CodeSlide(context: SlideRenderContext<"code">) {
  const { slide, theme, codeLines } = context;

  // The block sizes itself to its widest line, so its height is known up front
  // and the prose around it fits in what is left.
  const codeHeight = codeBlockHeight(slide.code, codeLines, theme);
  const [heading, explanation] = fitSlide(
    context,
    [textBlock(theme, "heading", slide.heading), textBlock(theme, "body", slide.explanation)],
    codeHeight + 32 * [slide.heading, slide.explanation].filter(Boolean).length,
  );

  return (
    <Shell context={context}>
      <Stack gap={32}>
        {slide.heading && (
          <Heading theme={theme} fontSize={heading}>
            {slide.heading}
          </Heading>
        )}
        <CodeBlock theme={theme} lines={codeLines} raw={slide.code} />
        {slide.explanation && (
          <Body theme={theme} fontSize={explanation}>
            {slide.explanation}
          </Body>
        )}
      </Stack>
    </Shell>
  );
}

export function ComparisonSlide(context: SlideRenderContext<"comparison">) {
  const { slide, theme } = context;
  const sides = [slide.left, slide.right];

  const headingSize = fitSlide(context, [textBlock(theme, "heading", slide.heading)], 0)[0];
  const headingHeight = slide.heading ? headingSize * 1.08 + 44 : 0;

  // Each surface is half the row, less the 24px between them and its own padding.
  const columnWidth = (theme.content.width - 24) / 2 - 64;
  const [bodySize] = fitColumns(
    context,
    sides.map((side) => [textBlock(theme, "item", side.body)]),
    columnWidth,
    headingHeight + 64 + theme.type.eyebrow * 1.2 + 16,
  );

  return (
    <Shell context={context}>
      <Stack gap={44}>
        {slide.heading && (
          <Heading theme={theme} fontSize={headingSize}>
            {slide.heading}
          </Heading>
        )}
        <div style={{ display: "flex", gap: 24, width: "100%" }}>
          {sides.map((side, position) => (
            <Surface key={position} theme={theme} style={{ flex: 1, gap: 16 }}>
              <span
                style={{
                  fontSize: theme.type.eyebrow,
                  fontWeight: 700,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: position === 0 ? theme.colors.muted : theme.colors.accent,
                }}
              >
                {side.label}
              </span>
              <span
                style={{
                  fontSize: bodySize,
                  lineHeight: 1.4,
                  fontFamily: theme.fonts.secondary,
                }}
              >
                {side.body}
              </span>
            </Surface>
          ))}
        </div>
      </Stack>
    </Shell>
  );
}

export function QuoteSlide(context: SlideRenderContext<"quote">) {
  const { slide, theme } = context;
  const [quote, attribution] = fitSlide(
    context,
    [textBlock(theme, "display", slide.quote), textBlock(theme, "body", slide.attribution)],
    theme.type.display * 0.6 + 32 * (slide.attribution ? 2 : 1),
  );

  return (
    <Shell context={context}>
      <Stack gap={32}>
        <span
          style={{
            fontSize: theme.type.display,
            fontWeight: 700,
            lineHeight: 0.6,
            color: theme.colors.accent,
          }}
        >
          &ldquo;
        </span>
        <Heading theme={theme} size="display" fontSize={quote}>
          {slide.quote}
        </Heading>
        {slide.attribution && (
          <Body theme={theme} fontSize={attribution}>
            {slide.attribution}
          </Body>
        )}
      </Stack>
    </Shell>
  );
}

function Placeholder<K extends TemplateKind>({
  context,
  label,
}: {
  context: SlideRenderContext<K>;
  label: string;
}) {
  return (
    <Surface
      theme={context.theme}
      style={{ width: "100%", height: 420, alignItems: "center", justifyContent: "center" }}
    >
      <span style={{ fontSize: context.theme.type.caption, color: context.theme.colors.faint }}>
        {label}
      </span>
    </Surface>
  );
}

export function ScreenshotSlide(context: SlideRenderContext<"screenshot">) {
  const { slide, theme, imageUrl } = context;
  const [heading, caption] = fitSlide(
    context,
    // The caption renders through Body, so it measures as body, not caption.
    [textBlock(theme, "heading", slide.heading), textBlock(theme, "body", slide.caption)],
    460 + 32 * [slide.heading, slide.caption].filter(Boolean).length,
  );

  return (
    <Shell context={context}>
      <Stack gap={32}>
        {slide.heading && (
          <Heading theme={theme} fontSize={heading}>
            {slide.heading}
          </Heading>
        )}
        {imageUrl ? (
          <img
            src={imageUrl}
            width={theme.width - theme.padding * 2}
            height={460}
            style={{ borderRadius: theme.radius, objectFit: "cover" }}
            alt=""
          />
        ) : (
          <Placeholder context={context} label="Pick a screenshot in the editor" />
        )}
        {slide.caption && (
          <Body theme={theme} fontSize={caption}>
            {slide.caption}
          </Body>
        )}
      </Stack>
    </Shell>
  );
}

export function ProjectSlide(context: SlideRenderContext<"project">) {
  const { slide, theme, imageUrl } = context;
  const [name, description] = fitSlide(
    context,
    [textBlock(theme, "heading", slide.name), textBlock(theme, "body", slide.description)],
    400 + 32 * (slide.url ? 3 : 2) + (slide.url ? theme.type.caption * 1.4 : 0),
  );

  return (
    <Shell context={context}>
      <Stack gap={32}>
        {imageUrl ? (
          <img
            src={imageUrl}
            width={theme.width - theme.padding * 2}
            height={400}
            style={{ borderRadius: theme.radius, objectFit: "cover" }}
            alt=""
          />
        ) : (
          <Placeholder context={context} label="Pick a project image in the editor" />
        )}
        <Heading theme={theme} fontSize={name}>
          {slide.name}
        </Heading>
        <Body theme={theme} fontSize={description}>
          {slide.description}
        </Body>
        {slide.url && (
          <span style={{ fontSize: theme.type.caption, color: theme.colors.accent }}>
            {slide.url.replace(/^https?:\/\//, "")}
          </span>
        )}
      </Stack>
    </Shell>
  );
}

export function FinalSlide(context: SlideRenderContext<"final">) {
  const { slide, theme } = context;
  const [heading, body] = fitSlide(
    context,
    [textBlock(theme, "display", slide.heading), textBlock(theme, "body", slide.body)],
    // Eyebrow plus its margin, the CTA pill, and the gaps between everything.
    theme.type.eyebrow * 1.2 + 24 + theme.type.item * 1.2 + 40 + 16 + 32 * (slide.body ? 3 : 2),
  );

  return (
    <Shell context={context}>
      <Stack gap={32}>
        <Eyebrow theme={theme}>That is it</Eyebrow>
        <Heading theme={theme} size="display" fontSize={heading}>
          {slide.heading}
        </Heading>
        {slide.body && (
          <Body theme={theme} fontSize={body}>
            {slide.body}
          </Body>
        )}
        <div
          style={{
            display: "flex",
            marginTop: 16,
            padding: "20px 32px",
            borderRadius: theme.radius,
            backgroundColor: theme.colors.accent,
          }}
        >
          <span
            style={{
              fontSize: theme.type.item,
              fontWeight: 700,
              color: theme.colors.background,
            }}
          >
            {slide.cta}
          </span>
        </div>
      </Stack>
    </Shell>
  );
}
