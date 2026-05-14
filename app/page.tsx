"use client";

import Image from "next/image";
import JSZip from "jszip";
import { useCallback, useState } from "react";

type PostImage = {
  url: string;
  photographer: string;
  photographerUrl: string;
  alt: string;
};

type GenerateResponse = {
  researchSummary: string;
  tavilyQuery: string;
  caption: {
    hook: string;
    value: string;
    cta: string;
    fullCaption: string;
  };
  hashtags: string[];
  creativeDirection: string;
  image: PostImage;
  pexelsQuery: string;
};

function buildCaptionFile(data: GenerateResponse): string {
  const tags = data.hashtags.map((h) => `#${h}`).join(" ");
  return [
    "=== Instagram caption ===",
    "",
    data.caption.fullCaption,
    "",
    "=== Hook / Value / CTA ===",
    `Hook: ${data.caption.hook}`,
    `Value: ${data.caption.value}`,
    `CTA: ${data.caption.cta}`,
    "",
    "=== Hashtags ===",
    tags,
    "",
    "=== Creative direction ===",
    data.creativeDirection,
    "",
    "=== Image credit (Pexels) ===",
    `Photo by ${data.image.photographer}: ${data.image.photographerUrl}`,
    `Source: ${data.image.url}`,
    "",
    "=== Internal queries (debug) ===",
    `Tavily: ${data.tavilyQuery}`,
    `Pexels: ${data.pexelsQuery}`,
  ].join("\n");
}

export default function Home() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  const onGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productDescription: description,
          title: title.trim() || undefined,
        }),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof json === "object" && json && "error" in json
            ? String((json as { error: string }).error)
            : `Request failed (${res.status})`;
        throw new Error(msg);
      }
      setResult(json as GenerateResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [description, title]);

  const onDownloadPack = useCallback(async () => {
    if (!result) return;
    const zip = new JSZip();
    zip.file("caption.txt", buildCaptionFile(result));

    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(result.image.url)}`;
    const imgRes = await fetch(proxyUrl);
    if (!imgRes.ok) {
      setError("Could not download image for the ZIP. Try again.");
      return;
    }
    const blob = await imgRes.blob();
    zip.file("image.jpg", blob);

    const bytes = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(bytes);
    a.download = "social-media-post.zip";
    a.click();
    URL.revokeObjectURL(a.href);
  }, [result]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-12">
      <header className="space-y-2 border-b border-[var(--border)] pb-8">
        <p className="text-sm uppercase tracking-wide text-[var(--muted)]">AI Social Media Brand Agent</p>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">From product idea to post-ready pack</h1>
        <p className="text-[var(--muted)]">
          Trend scan (Tavily), caption + hashtags (LangChain + OpenAI), stock visual (Pexels), then download a ZIP.
        </p>
      </header>

      <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium">Input</h2>
        <label className="block space-y-1">
          <span className="text-sm text-[var(--muted)]">Optional title</span>
          <input
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] outline-none ring-[var(--accent)] focus:ring-2"
            placeholder="e.g. NitroBrew Protein Coffee"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-[var(--muted)]">Product description</span>
          <textarea
            className="min-h-[120px] w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] outline-none ring-[var(--accent)] focus:ring-2"
            placeholder='e.g. "Luxury protein coffee for gym professionals"'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={loading || description.trim().length < 8}
          onClick={onGenerate}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-zinc-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Generating…" : "Generate"}
        </button>
        {description.trim().length > 0 && description.trim().length < 8 && (
          <p className="text-sm text-[var(--muted)]">Enter at least 8 characters in the description.</p>
        )}
      </section>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {result && (
        <section className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium">Output</h2>
            <button
              type="button"
              onClick={onDownloadPack}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background)]"
            >
              Download post pack (ZIP)
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Research summary</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.researchSummary}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Caption</h3>
            <div className="grid gap-2 text-sm">
              <p>
                <span className="text-[var(--muted)]">Hook:</span> {result.caption.hook}
              </p>
              <p>
                <span className="text-[var(--muted)]">Value:</span> {result.caption.value}
              </p>
              <p>
                <span className="text-[var(--muted)]">CTA:</span> {result.caption.cta}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 text-sm whitespace-pre-wrap">
              {result.caption.fullCaption}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Hashtags</h3>
            <p className="text-sm text-[var(--accent)]">
              {result.hashtags.map((h) => `#${h}`).join(" ")}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Creative direction</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.creativeDirection}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Image</h3>
            <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-lg border border-[var(--border)]">
              <Image
                src={result.image.url}
                alt={result.image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
                unoptimized
              />
            </div>
            <p className="text-xs text-[var(--muted)]">
              Photo by{" "}
              <a className="underline" href={result.image.photographerUrl} target="_blank" rel="noreferrer">
                {result.image.photographer}
              </a>{" "}
              on Pexels
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
