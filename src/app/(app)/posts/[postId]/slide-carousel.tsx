"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SlideCarousel({
  previews,
  labels,
  downloadUrls,
}: {
  previews: React.ReactNode[];
  labels: string[];
  downloadUrls: string[];
}) {
  const [active, setActive] = useState(0);
  const last = previews.length - 1;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full flex-wrap items-center justify-center gap-2">
        {labels.map((label, index) => (
          <button
            key={label + index}
            type="button"
            onClick={() => setActive(index)}
            aria-current={index === active ? "true" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs transition-colors",
              index === active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous slide"
          disabled={active === 0}
          onClick={() => setActive((current) => Math.max(0, current - 1))}
        >
          &larr;
        </Button>

        {previews.map((preview, index) => (
          <div key={index} hidden={index !== active}>
            {preview}
          </div>
        ))}

        <Button
          variant="outline"
          size="icon"
          aria-label="Next slide"
          disabled={active === last}
          onClick={() => setActive((current) => Math.min(last, current + 1))}
        >
          &rarr;
        </Button>
      </div>

      <Button asChild variant="outline" size="sm">
        <a href={downloadUrls[active]} download>
          Download slide {active + 1}
        </a>
      </Button>
    </div>
  );
}
