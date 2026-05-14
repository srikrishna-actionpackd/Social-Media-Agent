import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

export function createTrendResearchTool(apiKey: string) {
  return new TavilySearchResults({
    apiKey,
    maxResults: 5,
    searchDepth: "basic",
    includeAnswer: true,
  });
}

type TavilySnippet = { title?: string; url?: string; content?: string };

/**
 * TavilySearchResults returns a JSON string of results; normalize into a compact brief.
 */
export function normalizeTavilyResults(raw: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [
      "## Trend scan (raw)",
      raw.slice(0, 4000),
      raw.length > 4000 ? "\n…(truncated)" : "",
    ].join("\n");
  }

  const lines: string[] = ["## Trend & angle signals (from search snippets)"];

  if (Array.isArray(parsed)) {
    parsed.forEach((item, i) => {
      const s = item as TavilySnippet;
      const title = s.title ?? "Result";
      const url = s.url ? ` (${s.url})` : "";
      const body = (s.content ?? "").replace(/\s+/g, " ").trim().slice(0, 320);
      lines.push(`### ${i + 1}. ${title}${url}`, body || "(no snippet)");
    });
  } else if (parsed && typeof parsed === "object") {
    lines.push(JSON.stringify(parsed).slice(0, 3500));
  } else {
    lines.push(String(parsed));
  }

  lines.push(
    "",
    "### Marketing direction (synthesize from above)",
    "- Viral angles to lean into: (derive from themes above)",
    "- Hooks / phrases worth echoing: (paraphrase; do not copy long passages)",
    "- What to avoid: (overclaims, off-tone trends, irrelevant aesthetics)",
  );

  return lines.join("\n");
}

export function buildTavilyQuery(productDescription: string, title?: string): string {
  const base = [title, productDescription].filter(Boolean).join(" — ");
  return `${base} Instagram content trends marketing hooks 2026`;
}
