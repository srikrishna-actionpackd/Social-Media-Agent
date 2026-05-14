import { z } from "zod";

const pexelsPhotoSchema = z.object({
  id: z.number(),
  alt: z.string().optional(),
  photographer: z.string(),
  photographer_url: z.string(),
  src: z.object({
    original: z.string().optional(),
    large2x: z.string().optional(),
    large: z.string().optional(),
    portrait: z.string().optional(),
    medium: z.string().optional(),
  }),
  width: z.number().optional(),
  height: z.number().optional(),
});

const pexelsSearchSchema = z.object({
  photos: z.array(pexelsPhotoSchema),
});

export type PexelsPick = {
  url: string;
  photographer: string;
  photographerUrl: string;
  alt: string;
};

export async function searchPexelsPhoto(
  query: string,
  apiKey: string,
  orientation: "portrait" | "square" | "landscape" = "portrait",
): Promise<PexelsPick | null> {
  const params = new URLSearchParams({
    query: query.trim(),
    per_page: "12",
    orientation,
  });

  const res = await fetch(`https://api.pexels.com/v1/search?${params.toString()}`, {
    headers: { Authorization: apiKey },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Pexels error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const json: unknown = await res.json();
  const parsed = pexelsSearchSchema.safeParse(json);
  if (!parsed.success || parsed.data.photos.length === 0) {
    return null;
  }

  const pick =
    parsed.data.photos.find((p) => p.src.large2x || p.src.large || p.src.portrait) ??
    parsed.data.photos[0];

  const url =
    pick.src.large2x ?? pick.src.large ?? pick.src.portrait ?? pick.src.medium ?? pick.src.original;
  if (!url) return null;

  return {
    url,
    photographer: pick.photographer,
    photographerUrl: pick.photographer_url,
    alt: pick.alt?.trim() || `${query} — lifestyle photo`,
  };
}
