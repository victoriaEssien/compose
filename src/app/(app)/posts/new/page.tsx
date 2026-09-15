import { CreatePostForm } from "./create-post-form";

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Create a post</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Compose reads what you paste, structures it, and plans the slides. You can edit everything
        afterwards.
      </p>

      <div className="mt-8">
        <CreatePostForm />
      </div>
    </main>
  );
}
