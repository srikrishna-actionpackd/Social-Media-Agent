import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonMarkdownStructuredOutputParser } from "@langchain/core/output_parsers";
import { llmCreativeSchema, type LlmCreative } from "@/lib/schema/postOutput";

const parser = JsonMarkdownStructuredOutputParser.fromZodSchema(llmCreativeSchema);

export type CaptionChainInput = {
  skill: string;
  title: string;
  productDescription: string;
  researchBrief: string;
  openAIApiKey: string;
};

export async function runCaptionChain(input: CaptionChainInput): Promise<LlmCreative> {
  const prompt = await ChatPromptTemplate.fromMessages([
    [
      "system",
      `{skill}

You output JSON only, following the format instructions exactly.
Caption structure:
- hook: one punchy opening line (no hashtags)
- value: 1–2 sentences on benefits + audience fit
- cta: one line, Instagram-native engagement CTA
- fullCaption: assemble hook, value, cta with tasteful line breaks (no hashtags inside fullCaption)
- hashtags: array of strings without # prefix
- creativeDirection: visual direction for photography / design
- pexelsSearchQuery: short stock-photo search query
- researchSummary: plain-language summary of insights implied by the research brief`,
    ],
    [
      "human",
      `Optional title: {title}

Product description:
{productDescription}

--- Research brief (from live search; treat as signals, not verified facts) ---
{researchBrief}

{format_instructions}`,
    ],
  ]).partial({
    format_instructions: parser.getFormatInstructions(),
  });

  const model = new ChatOpenAI({
    apiKey: input.openAIApiKey,
    model: "gpt-4o-mini",
    temperature: 0.75,
  });

  const messages = await prompt.formatMessages({
    skill: input.skill,
    title: input.title || "(none)",
    productDescription: input.productDescription,
    researchBrief: input.researchBrief.slice(0, 12000),
  });

  const res = await model.invoke(messages);
  const text =
    typeof res.content === "string"
      ? res.content
      : Array.isArray(res.content)
        ? res.content
            .map((c) => (typeof c === "object" && c && "text" in c ? String((c as { text?: string }).text) : ""))
            .join("\n")
        : String(res.content);

  const parsed = await parser.parse(text);
  return llmCreativeSchema.parse(parsed);
}
