import { z } from "zod";

/** Fields produced by the LLM + parser (image filled separately). */
export const llmCreativeSchema = z.object({
  researchSummary: z
    .string()
    .min(1)
    .describe("2–5 sentences: key trends, viral angles, and direction grounded in the research brief"),
  hook: z.string().min(1),
  value: z.string().min(1),
  cta: z.string().min(1),
  fullCaption: z.string().min(1),
  hashtags: z.array(z.string()).min(8).max(20),
  creativeDirection: z.string().min(1),
  pexelsSearchQuery: z.string().min(1),
});

export type LlmCreative = z.infer<typeof llmCreativeSchema>;

export const imageSchema = z.object({
  url: z.string().url(),
  photographer: z.string(),
  photographerUrl: z.string().url(),
  alt: z.string(),
});

export type PostImage = z.infer<typeof imageSchema>;

export const postOutputSchema = z.object({
  researchSummary: z.string(),
  tavilyQuery: z.string(),
  caption: z.object({
    hook: z.string(),
    value: z.string(),
    cta: z.string(),
    fullCaption: z.string(),
  }),
  hashtags: z.array(z.string()),
  creativeDirection: z.string(),
  image: imageSchema,
  pexelsQuery: z.string(),
});

export type PostOutput = z.infer<typeof postOutputSchema>;
