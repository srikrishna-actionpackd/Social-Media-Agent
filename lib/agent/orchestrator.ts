import { loadAgentSkill } from "@/lib/agent/loadSkill";
import { runCaptionChain } from "@/lib/chains/caption";
import { searchPexelsPhoto } from "@/lib/clients/pexels";
import { postOutputSchema, type PostOutput } from "@/lib/schema/postOutput";
import {
  buildTavilyQuery,
  createTrendResearchTool,
  normalizeTavilyResults,
} from "@/lib/tools/tavilyTrends";

function normalizeHashtags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tags) {
    const s = t.replace(/^#/, "").trim().replace(/\s+/g, "");
    if (!s || seen.has(s.toLowerCase())) continue;
    seen.add(s.toLowerCase());
    out.push(s);
    if (out.length >= 20) break;
  }
  return out;
}

export type GenerateInput = {
  productDescription: string;
  title?: string;
  openAIApiKey: string;
  tavilyApiKey: string;
  pexelsApiKey: string;
};

export async function runGeneratePipeline(input: GenerateInput): Promise<PostOutput> {
  const skill = loadAgentSkill();
  const tavilyQuery = buildTavilyQuery(input.productDescription, input.title);

  const tavilyTool = createTrendResearchTool(input.tavilyApiKey);
  const tavilyRaw = await tavilyTool.invoke(tavilyQuery);
  const researchBrief = normalizeTavilyResults(tavilyRaw);

  const creative = await runCaptionChain({
    skill,
    title: input.title ?? "",
    productDescription: input.productDescription,
    researchBrief,
    openAIApiKey: input.openAIApiKey,
  });

  let image = await searchPexelsPhoto(creative.pexelsSearchQuery, input.pexelsApiKey, "portrait");
  if (!image) {
    image = await searchPexelsPhoto(creative.pexelsSearchQuery, input.pexelsApiKey, "square");
  }
  if (!image) {
    const fallbackQuery = input.productDescription.split(/\s+/).slice(0, 5).join(" ");
    image = await searchPexelsPhoto(fallbackQuery, input.pexelsApiKey, "portrait");
  }
  if (!image) {
    throw new Error("No suitable Pexels image found for this query. Try a different description.");
  }

  const hashtags = normalizeHashtags(creative.hashtags);

  const output: PostOutput = {
    researchSummary: creative.researchSummary,
    tavilyQuery,
    caption: {
      hook: creative.hook,
      value: creative.value,
      cta: creative.cta,
      fullCaption: creative.fullCaption,
    },
    hashtags,
    creativeDirection: creative.creativeDirection,
    image: {
      url: image.url,
      photographer: image.photographer,
      photographerUrl: image.photographerUrl,
      alt: image.alt,
    },
    pexelsQuery: creative.pexelsSearchQuery,
  };

  return postOutputSchema.parse(output);
}
