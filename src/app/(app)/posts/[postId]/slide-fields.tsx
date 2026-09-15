"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { maxListItems, slideTextLimits as limit } from "@/types/slide";
import type { SlideSpec } from "@/types/slide";

type Update = (next: SlideSpec) => void;

function Field({
  label,
  value,
  max,
  rows,
  mono,
  onChange,
}: {
  label: string;
  value: string;
  max: number;
  rows?: number;
  mono?: boolean;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  const over = value.length > max;

  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className={over ? "text-destructive text-xs" : "text-muted-foreground text-xs"}>
          {value.length}/{max}
        </span>
      </div>
      {rows ? (
        <Textarea
          id={id}
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={mono ? "font-mono text-xs" : undefined}
        />
      ) : (
        <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </div>
  );
}

/** One editor per template. Explicit beats a form generator nobody can read. */
export function SlideFields({ slide, onChange }: { slide: SlideSpec; onChange: Update }) {
  switch (slide.template) {
    case "cover":
      return (
        <>
          <Field
            label="Headline"
            value={slide.headline}
            max={limit.headline}
            rows={2}
            onChange={(headline) => onChange({ ...slide, headline })}
          />
          <Field
            label="Subheadline"
            value={slide.subheadline ?? ""}
            max={limit.subheadline}
            rows={2}
            onChange={(value) => onChange({ ...slide, subheadline: value || null })}
          />
        </>
      );

    case "text":
      return (
        <>
          <Field
            label="Heading"
            value={slide.heading}
            max={limit.heading}
            onChange={(heading) => onChange({ ...slide, heading })}
          />
          <Field
            label="Body"
            value={slide.body}
            max={limit.body}
            rows={4}
            onChange={(body) => onChange({ ...slide, body })}
          />
        </>
      );

    case "numbered_list":
      return (
        <>
          <Field
            label="Heading"
            value={slide.heading ?? ""}
            max={limit.heading}
            onChange={(value) => onChange({ ...slide, heading: value || null })}
          />
          {slide.items.map((item, index) => (
            <div key={index} className="grid gap-1.5 rounded-md border p-3">
              <Field
                label={`Item ${index + 1}`}
                value={item.title}
                max={limit.itemTitle}
                onChange={(title) =>
                  onChange({
                    ...slide,
                    items: slide.items.map((row, at) => (at === index ? { ...row, title } : row)),
                  })
                }
              />
              <Field
                label={`Item ${index + 1} detail`}
                value={item.body ?? ""}
                max={limit.itemBody}
                rows={2}
                onChange={(value) =>
                  onChange({
                    ...slide,
                    items: slide.items.map((row, at) =>
                      at === index ? { ...row, body: value || null } : row,
                    ),
                  })
                }
              />
              {slide.items.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="justify-self-start"
                  onClick={() =>
                    onChange({ ...slide, items: slide.items.filter((_, at) => at !== index) })
                  }
                >
                  Remove item
                </Button>
              )}
            </div>
          ))}
          {slide.items.length < maxListItems && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onChange({ ...slide, items: [...slide.items, { title: "New point", body: null }] })
              }
            >
              Add item
            </Button>
          )}
        </>
      );

    case "code":
      return (
        <>
          <Field
            label="Heading"
            value={slide.heading ?? ""}
            max={limit.heading}
            onChange={(value) => onChange({ ...slide, heading: value || null })}
          />
          <Field
            label="Language"
            value={slide.language}
            max={limit.language}
            onChange={(language) => onChange({ ...slide, language })}
          />
          <Field
            label="Code"
            value={slide.code}
            max={limit.code}
            rows={8}
            mono
            onChange={(code) => onChange({ ...slide, code })}
          />
          <Field
            label="Explanation"
            value={slide.explanation ?? ""}
            max={limit.explanation}
            rows={2}
            onChange={(value) => onChange({ ...slide, explanation: value || null })}
          />
        </>
      );

    case "comparison":
      return (
        <>
          <Field
            label="Heading"
            value={slide.heading ?? ""}
            max={limit.heading}
            onChange={(value) => onChange({ ...slide, heading: value || null })}
          />
          {(["left", "right"] as const).map((side) => (
            <div key={side} className="grid gap-1.5 rounded-md border p-3">
              <Field
                label={`${side === "left" ? "Left" : "Right"} label`}
                value={slide[side].label}
                max={limit.comparisonLabel}
                onChange={(label) =>
                  onChange({ ...slide, [side]: { ...slide[side], label } } as SlideSpec)
                }
              />
              <Field
                label={`${side === "left" ? "Left" : "Right"} body`}
                value={slide[side].body}
                max={limit.comparisonBody}
                rows={3}
                onChange={(body) =>
                  onChange({ ...slide, [side]: { ...slide[side], body } } as SlideSpec)
                }
              />
            </div>
          ))}
        </>
      );

    case "quote":
      return (
        <>
          <Field
            label="Quote"
            value={slide.quote}
            max={limit.quote}
            rows={4}
            onChange={(quote) => onChange({ ...slide, quote })}
          />
          <Field
            label="Attribution"
            value={slide.attribution ?? ""}
            max={limit.attribution}
            onChange={(value) => onChange({ ...slide, attribution: value || null })}
          />
        </>
      );

    case "screenshot":
      return (
        <>
          <Field
            label="Heading"
            value={slide.heading ?? ""}
            max={limit.heading}
            onChange={(value) => onChange({ ...slide, heading: value || null })}
          />
          <Field
            label="Caption"
            value={slide.caption ?? ""}
            max={limit.caption}
            rows={2}
            onChange={(value) => onChange({ ...slide, caption: value || null })}
          />
        </>
      );

    case "project":
      return (
        <>
          <Field
            label="Project name"
            value={slide.name}
            max={limit.projectName}
            onChange={(name) => onChange({ ...slide, name })}
          />
          <Field
            label="Description"
            value={slide.description}
            max={limit.projectDescription}
            rows={3}
            onChange={(description) => onChange({ ...slide, description })}
          />
          <Field
            label="URL"
            value={slide.url ?? ""}
            max={120}
            onChange={(value) => onChange({ ...slide, url: value || null })}
          />
        </>
      );

    case "final":
      return (
        <>
          <Field
            label="Heading"
            value={slide.heading}
            max={limit.heading}
            rows={2}
            onChange={(heading) => onChange({ ...slide, heading })}
          />
          <Field
            label="Body"
            value={slide.body ?? ""}
            max={limit.finalBody}
            rows={3}
            onChange={(value) => onChange({ ...slide, body: value || null })}
          />
          <Field
            label="Call to action"
            value={slide.cta}
            max={limit.cta}
            rows={2}
            onChange={(cta) => onChange({ ...slide, cta })}
          />
        </>
      );
  }
}
