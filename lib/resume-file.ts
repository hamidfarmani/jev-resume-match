import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export async function extractResume(file: File): Promise<{ text: string; pageCount: number | null }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = file.name.toLowerCase().split(".").pop();

  if (extension === "pdf") {
    if (bytes.subarray(0, 4).toString() !== "%PDF") throw new Error("The PDF file is invalid.");
    const parser = new PDFParse({ data: bytes });
    try {
      const result = await parser.getText();
      return { text: result.text, pageCount: result.total };
    } catch (error) {
      console.error("PDF text extraction failed", error instanceof Error ? error.name : "UnknownError");
      throw new Error("The PDF could not be read. Try exporting it again or use a DOCX or TXT file.");
    } finally {
      await parser.destroy();
    }
  }
  if (extension === "docx") {
    try {
      const result = await mammoth.extractRawText({ buffer: bytes });
      return { text: result.value, pageCount: null };
    } catch {
      throw new Error("The DOCX could not be read. Try exporting it again or use a PDF or TXT file.");
    }
  }
  if (extension === "txt") return { text: bytes.toString("utf8"), pageCount: null };
  throw new Error("Upload a PDF, DOCX, or TXT file.");
}
