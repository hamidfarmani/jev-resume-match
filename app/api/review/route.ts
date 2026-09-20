import { AuthenticationError, PermissionDeniedError } from "@typesafe-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { DEMO_COOKIE, DEMO_REVIEWS, demoCallAvailable, demoCookieOptions, makeDemoCookie, readDemoCount, reserveDemoCall } from "@/lib/demo-quota";
import { extractResume } from "@/lib/resume-file";
import { reviewResume } from "@/lib/resume-review";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ACTIVE_REVIEWS = 4;
let activeReviews = 0;

function field(data: FormData, name: string, max: number): string {
  const value = data.get(name);
  if (typeof value !== "string") return "";
  if (value.length > max) throw new Error(`${name} is too long.`);
  return value.trim();
}

export async function GET(request: NextRequest) {
  const ownerKey = process.env.TYPESAFE_API_KEY || process.env.JEV_API_KEY;
  const used = ownerKey ? readDemoCount(request.cookies.get(DEMO_COOKIE)?.value, ownerKey) : DEMO_REVIEWS;
  return NextResponse.json({
    demoAvailable: Boolean(ownerKey) && demoCallAvailable(),
    remaining: DEMO_REVIEWS - used,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "This request is not allowed." }, { status: 403 });
  }
  if (activeReviews >= MAX_ACTIVE_REVIEWS) {
    return NextResponse.json({ error: "Too many reviews are running. Please try again shortly." }, { status: 429 });
  }
  activeReviews += 1;
  let usingOwnKey = false;
  try {
    const data = await request.formData();
    const file = data.get("file");
    const targetRole = field(data, "targetRole", 200);
    const jobDescription = field(data, "jobDescription", 12_000);
    const suppliedKey = field(data, "apiKey", 500);
    usingOwnKey = Boolean(suppliedKey);
    if (!targetRole) return Response.json({ error: "Enter a target role." }, { status: 400 });
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: "Choose a PDF, DOCX, or TXT resume." }, { status: 400 });
    }
    if (file instanceof File && file.size > MAX_FILE_BYTES) {
      return Response.json({ error: "The file must be 5 MB or smaller." }, { status: 400 });
    }
    if (suppliedKey && suppliedKey.length < 10) {
      return Response.json({ error: "Enter a valid API key." }, { status: 400 });
    }
    const ownerKey = process.env.TYPESAFE_API_KEY || process.env.JEV_API_KEY;
    const apiKey = suppliedKey || ownerKey;
    if (!apiKey) {
      return Response.json({ error: "Free checks are unavailable. Add your TypeSafe API key to continue." }, { status: 503 });
    }
    const used = ownerKey ? readDemoCount(request.cookies.get(DEMO_COOKIE)?.value, ownerKey) : DEMO_REVIEWS;
    if (!suppliedKey && used >= DEMO_REVIEWS) {
      return Response.json({ error: "Your two free checks are used. Add your TypeSafe API key to continue.", code: "demo_limit" }, { status: 429 });
    }
    const extracted = await extractResume(file);
    const resume = extracted.text.trim();
    if (resume.length < 100) return Response.json({ error: "Add a readable resume with at least 100 characters. Scanned PDFs need OCR before review." }, { status: 400 });
    if (resume.length > 40_000) return Response.json({ error: "The extracted resume is too long (40,000 character limit)." }, { status: 400 });
    if (!suppliedKey && !reserveDemoCall()) {
      return Response.json({ error: "Free checks are unavailable for now. Add your TypeSafe API key or try again tomorrow.", code: "demo_unavailable" }, { status: 429 });
    }
    const result = await reviewResume({ resume, targetRole, jobDescription, pageCount: extracted.pageCount }, apiKey);
    const response = NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
    if (!suppliedKey && ownerKey) {
      response.cookies.set(DEMO_COOKIE, makeDemoCookie(used + 1, ownerKey), demoCookieOptions);
      response.headers.set("X-Demo-Remaining", String(DEMO_REVIEWS - used - 1));
    }
    return response;
  } catch (error) {
    if (error instanceof Error && (/too long|Upload a PDF|PDF file is invalid|could not be read/.test(error.message))) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (usingOwnKey && (error instanceof AuthenticationError || error instanceof PermissionDeniedError)) {
      return Response.json({ error: "That API key was rejected. Check it in your TypeSafe account." }, { status: 401 });
    }
    console.error("Resume review failed", error instanceof Error ? error.name : "UnknownError");
    return Response.json({ error: "The review could not be completed. Please try again." }, { status: 502 });
  } finally {
    activeReviews -= 1;
  }
}
