/**
 * Layout for signed-in pages. Auth guard and app navigation go here
 * (tasks.md, Phase 2 and 3).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh">{children}</div>;
}
