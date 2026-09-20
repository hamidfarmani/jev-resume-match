# Job Match

A simple resume review app. Upload a PDF, DOCX, or TXT file, or paste your resume text. Add the role you want and, optionally, a job description. The review shows an overall score, individual criteria, experience bullet scores, and a possible bullet order.

## Run locally

1. Run `pnpm install`.
2. Copy `.env.example` to `.env.local` and set `TYPESAFE_API_KEY`.
3. Run `pnpm dev` and open the local URL shown in the terminal.

The API key stays on the server. The app does not save resumes or results, but it sends resume text and role context to TypeSafe for scoring. Scanned PDFs need OCR before upload.

## Project notes

- [How it works](docs/how-it-works.md) explains Jev, the review pipeline, scoring, and where to experiment in code.
- [DESIGN.md](DESIGN.md) is the visual reference. Its colors, typography, spacing, and shapes are adapted to this focused resume workflow.
- [Original resume prompt](docs/resume-prompt.md) records the rubric that informed the review criteria.

Run `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` before shipping changes.
