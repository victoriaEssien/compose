import { Body, CodeBlock, Eyebrow, Frame, Heading, Surface } from "./primitives";
import type { TemplateKind } from "@/types/slide";
import type { SlideRenderContext } from "./types";

function Shell<K extends TemplateKind>({
  context,
  children,
}: {
  context: SlideRenderContext<K>;
  children: React.ReactNode;
}) {
  return (
    <Frame
      theme={context.theme}
      avatarUrl={context.brand.avatarUrl}
      username={context.brand.username}
      index={context.index}
      total={context.total}
    >
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

  return (
    <Shell context={context}>
      <Stack gap={32}>
        <Heading theme={theme} size="display">
          {slide.headline}
        </Heading>
        {slide.subheadline && <Body theme={theme}>{slide.subheadline}</Body>}
      </Stack>
    </Shell>
  );
}

export function TextSlide(context: SlideRenderContext<"text">) {
  const { slide, theme } = context;

  return (
    <Shell context={context}>
      <Stack gap={32}>
        <Heading theme={theme}>{slide.heading}</Heading>
        <Body theme={theme}>{slide.body}</Body>
      </Stack>
    </Shell>
  );
}

export function NumberedListSlide(context: SlideRenderContext<"numbered_list">) {
  const { slide, theme } = context;

  return (
    <Shell context={context}>
      <Stack gap={44}>
        {slide.heading && <Heading theme={theme}>{slide.heading}</Heading>}
        <Stack gap={28}>
          {slide.items.map((item, position) => (
            <div key={item.title} style={{ display: "flex", width: "100%" }}>
              <span
                style={{
                  minWidth: 104,
                  fontSize: theme.type.heading,
                  fontWeight: 700,
                  color: theme.colors.accent,
                }}
              >
                {String(position + 1).padStart(2, "0")}
              </span>
              <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
                <span style={{ fontSize: theme.type.item, fontWeight: 700 }}>{item.title}</span>
                {item.body && (
                  <span
                    style={{
                      fontSize: theme.type.caption,
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

  return (
    <Shell context={context}>
      <Stack gap={32}>
        {slide.heading && <Heading theme={theme}>{slide.heading}</Heading>}
        <CodeBlock theme={theme} lines={codeLines} raw={slide.code} />
        {slide.explanation && <Body theme={theme}>{slide.explanation}</Body>}
      </Stack>
    </Shell>
  );
}

export function ComparisonSlide(context: SlideRenderContext<"comparison">) {
  const { slide, theme } = context;

  return (
    <Shell context={context}>
      <Stack gap={44}>
        {slide.heading && <Heading theme={theme}>{slide.heading}</Heading>}
        <div style={{ display: "flex", gap: 24, width: "100%" }}>
          {[slide.left, slide.right].map((side, position) => (
            <Surface key={side.label} theme={theme} style={{ flex: 1, gap: 16 }}>
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
                  fontSize: theme.type.item,
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
        <Heading theme={theme} size="display">
          {slide.quote}
        </Heading>
        {slide.attribution && <Body theme={theme}>{slide.attribution}</Body>}
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

  return (
    <Shell context={context}>
      <Stack gap={32}>
        {slide.heading && <Heading theme={theme}>{slide.heading}</Heading>}
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
        {slide.caption && <Body theme={theme}>{slide.caption}</Body>}
      </Stack>
    </Shell>
  );
}

export function ProjectSlide(context: SlideRenderContext<"project">) {
  const { slide, theme, imageUrl } = context;

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
        <Heading theme={theme}>{slide.name}</Heading>
        <Body theme={theme}>{slide.description}</Body>
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

  return (
    <Shell context={context}>
      <Stack gap={32}>
        <Eyebrow theme={theme}>That is it</Eyebrow>
        <Heading theme={theme} size="display">
          {slide.heading}
        </Heading>
        {slide.body && <Body theme={theme}>{slide.body}</Body>}
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
