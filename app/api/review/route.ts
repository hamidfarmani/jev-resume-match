import { extractResume } from "@/lib/resume-file";
import { reviewResume } from "@/lib/resume-review";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function field(data: FormData, name: string, max: number): string {
  const value = data.get(name);
  if (typeof value !== "string") return "";
  if (value.length > max) throw new Error(`${name} is too long.`);
  return value.trim();
}

export async function POST(request: Request) {
  if (!process.env.TYPESAFE_API_KEY && !process.env.JEV_API_KEY) {
    return Response.json({ error: "Resume reviews are temporarily unavailable." }, { status: 503 });
  }
  try {
    const data = await request.formData();
    const file = data.get("file");
    const pasted = field(data, "resume", 40_000);
    const targetRole = field(data, "targetRole", 200);
    const jobDescription = field(data, "jobDescription", 12_000);
    if (!targetRole) return Response.json({ error: "Enter a target role." }, { status: 400 });
    if (file instanceof File && file.size > MAX_FILE_BYTES) {
      return Response.json({ error: "The file must be 5 MB or smaller." }, { status: 400 });
    }
    const extracted = file instanceof File && file.size > 0
      ? await extractResume(file)
      : { text: pasted, pageCount: null };
    const resume = extracted.text.trim();
    if (resume.length < 100) return Response.json({ error: "Add a readable resume with at least 100 characters. Scanned PDFs need OCR before review." }, { status: 400 });
    if (resume.length > 40_000) return Response.json({ error: "The extracted resume is too long (40,000 character limit)." }, { status: 400 });
    const result = await reviewResume({ resume, targetRole, jobDescription, pageCount: extracted.pageCount });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && (/too long|Upload a PDF|PDF file is invalid|could not be read/.test(error.message))) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("Resume review failed", error);
    return Response.json({ error: "The review could not be completed. Please try again." }, { status: 502 });
  }
}
