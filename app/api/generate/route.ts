import { NextResponse } from "next/server";
import { runGeneratePipeline } from "@/lib/agent/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  productDescription?: string;
  title?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const productDescription = body.productDescription?.trim() ?? "";
  if (productDescription.length < 8) {
    return NextResponse.json(
      { error: "productDescription is required (at least 8 characters)." },
      { status: 400 },
    );
  }

  const openAIApiKey = process.env.OPENAI_API_KEY;
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  const pexelsApiKey = process.env.PEXELS_API_KEY;

  if (!openAIApiKey || !tavilyApiKey || !pexelsApiKey) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing OPENAI_API_KEY, TAVILY_API_KEY, or PEXELS_API_KEY." },
      { status: 500 },
    );
  }

  try {
    const result = await runGeneratePipeline({
      productDescription,
      title: body.title?.trim(),
      openAIApiKey,
      tavilyApiKey,
      pexelsApiKey,
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
