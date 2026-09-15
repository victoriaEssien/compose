"use client";

/** The last resort: this replaces the root layout, so it ships its own html and body. */
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100dvh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Compose could not start</h1>
        <p style={{ color: "#666", maxWidth: "28rem" }}>
          Reloading usually fixes this. Your posts are saved on the server, so nothing has been
          lost.
        </p>
        <button
          onClick={reset}
          style={{
            border: "1px solid #ddd",
            borderRadius: "0.5rem",
            padding: "0.5rem 1rem",
            cursor: "pointer",
          }}
        >
          Reload
        </button>
        <p style={{ color: "#999", fontSize: "0.75rem" }}>{error.message}</p>
      </body>
    </html>
  );
}
