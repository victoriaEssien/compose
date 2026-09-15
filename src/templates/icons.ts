import { iconNodes } from "./icon-nodes";
import type { IconName } from "./icon-nodes";

/**
 * The planner emits snake_case hints like "database_icon" or "query_plan_view".
 * These are the words it actually reaches for, mapped onto the icon set.
 */
const aliases: Record<string, IconName> = {
  db: "database",
  postgres: "database",
  postgresql: "database",
  sql: "database",
  query: "database",
  table: "database",
  row: "database",
  schema: "database",
  api: "network",
  endpoint: "network",
  request: "network",
  http: "network",
  dns: "network",
  traffic: "network",
  cache: "speed",
  redis: "speed",
  performance: "speed",
  latency: "speed",
  optimisation: "speed",
  optimization: "speed",
  benchmark: "speed",
  fast: "speed",
  slow: "clock",
  time: "clock",
  duration: "clock",
  timeout: "clock",
  deploy: "rocket",
  launch: "rocket",
  ship: "rocket",
  release: "rocket",
  error: "warning",
  fail: "warning",
  failure: "warning",
  alert: "warning",
  problem: "warning",
  debug: "bug",
  debugging: "bug",
  fix: "bug",
  issue: "bug",
  git: "branch",
  github: "branch",
  merge: "branch",
  commit: "branch",
  auth: "lock",
  login: "lock",
  encryption: "lock",
  security: "shield",
  password: "key",
  token: "key",
  secret: "key",
  build: "tools",
  tool: "tools",
  config: "settings",
  setup: "settings",
  ai: "brain",
  llm: "brain",
  model: "brain",
  prompt: "brain",
  lesson: "idea",
  insight: "idea",
  tip: "idea",
  screenshot: "image",
  photo: "image",
  picture: "image",
  docs: "book",
  documentation: "book",
  guide: "book",
  team: "users",
  user: "users",
  people: "users",
  audience: "users",
  metric: "chart",
  metrics: "chart",
  analytics: "chart",
  graph: "chart",
  data: "chart",
  plan: "chart",
  scale: "growth",
  increase: "growth",
  storage: "folder",
  bucket: "folder",
  directory: "folder",
  memory: "cpu",
  hardware: "cpu",
  web: "globe",
  internet: "globe",
  site: "globe",
  website: "globe",
  done: "success",
  complete: "success",
  result: "success",
  library: "package",
  dependency: "package",
  npm: "package",
  bundle: "package",
};

/**
 * The whole vocabulary, so the editor can show it instead of asking the user to
 * guess at a dictionary they cannot see.
 */
export const iconNames = Object.keys(iconNodes) as IconName[];

/** Null when nothing matches, which is a fine outcome: the slide just has no mark. */
export function resolveIcon(hint: string | null): IconName | null {
  if (!hint) return null;

  for (const token of hint.toLowerCase().split(/[^a-z0-9]+/)) {
    if (token in iconNodes) return token as IconName;
    if (token in aliases) return aliases[token];
  }

  return null;
}
