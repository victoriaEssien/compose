/** One sample slide per template, shared by the renderer and remap tests. */
import type { SlideSpecOf, TemplateKind } from "@/types/slide";

export const sampleSlides: { [K in TemplateKind]: SlideSpecOf<K> } = {
  cover: {
    template: "cover",
    headline: "You probably don't need Redis yet",
    subheadline: "The 400ms query was a missing index, not a caching problem.",
    visual: "database_icon",
  },
  text: {
    template: "text",
    heading: "Read the query plan first",
    body: "EXPLAIN showed a sequential scan over two million rows. The database was doing exactly what it was asked to do, just slowly.",
    visual: null,
  },
  numbered_list: {
    template: "numbered_list",
    heading: "Three things that helped",
    items: [
      { title: "Measure before you cache", body: "Profile the query, do not guess at it." },
      { title: "Index the filter column", body: "One index took 400ms down to 2ms." },
      { title: "Keep the infra boring", body: null },
    ],
    visual: null,
  },
  code: {
    template: "code",
    heading: "One index, no Redis",
    language: "sql",
    code: "create index concurrently\n  on post (user_id);\n\nanalyze post;",
    explanation: "Concurrently, so the table keeps serving reads while it builds.",
    visual: null,
  },
  comparison: {
    template: "comparison",
    heading: "Before and after",
    left: { label: "Before", body: "Sequential scan over 2M rows, roughly 400ms per request." },
    right: { label: "After", body: "Index scan, roughly 2ms per request." },
    visual: null,
  },
  quote: {
    template: "quote",
    quote: "Premature optimisation is the root of all evil.",
    attribution: "Donald Knuth",
    visual: null,
  },
  screenshot: {
    template: "screenshot",
    heading: "The query plan",
    assetId: null,
    caption: "An index scan where there used to be a sequential scan.",
    visual: null,
  },
  project: {
    template: "project",
    name: "Tracer",
    description: "An open-source finder for your shell history, built in a weekend.",
    assetId: null,
    url: "https://example.com/tracer",
    visual: null,
  },
  final: {
    template: "final",
    heading: "Reach for the index first",
    body: "Caching cannot fix what the database is doing slowly on purpose.",
    cta: "Follow for more backend notes",
    visual: null,
  },
};
