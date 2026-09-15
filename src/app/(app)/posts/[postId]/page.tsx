export default async function Page({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Your Post</h1>
      <p className="text-muted-foreground mt-2">
        Placeholder for post {postId}. See tasks.md, Phase 6.
      </p>
    </main>
  );
}
