import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set(["images.pexels.com"]);

function isAllowedPexelsUrl(url: URL): boolean {
  if (!ALLOWED_HOSTS.has(url.hostname)) return false;
  if (url.protocol !== "https:") return false;
  return true;
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "Missing url query parameter" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!isAllowedPexelsUrl(target)) {
    return NextResponse.json({ error: "URL host not allowed" }, { status: 400 });
  }

  const upstream = await fetch(target.toString(), { redirect: "follow" });
  if (!upstream.ok) {
    return NextResponse.json({ error: `Upstream ${upstream.status}` }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
  const buf = Buffer.from(await upstream.arrayBuffer());

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
