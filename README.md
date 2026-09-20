# Job Match resume review

A Next.js resume rubric explorer using [TypeSafe Jev](https://docs.typesafe.ai/) for typed judgments. It accepts PDF, DOCX, TXT, or pasted text, then reports ordered criterion scores, level probabilities, experience-bullet scores, and yes/no evidence checks.

## Run locally

1. Install dependencies: `pnpm install`
2. Copy `.env.example` to `.env.local` and set `TYPESAFE_API_KEY` (the existing `JEV_API_KEY` name also works).
3. Start the app: `pnpm dev`

The API key stays on the server. Reviews are processed in memory and are not saved by this app. The resume text and supplied role context are sent to TypeSafe. The app uses the pinned `jev-1.13.0` model so that scores do not change silently when an alias moves.

## How the rubric works

The criteria come from [`docs/resume-prompt.md`](docs/resume-prompt.md). Nine Jev Score questions assess summary value, achievements versus duties, impact evidence, ownership, target relevance, ordering, company context, readability, and skills. Three Noul questions check measured results, company context, and action-led bullets. Optional project and language fields add one question each. Code sorts the criterion scores and combines them into a weighted index. Each criterion exposes Jev's full four-level probability distribution.

Experience bullets are extracted from an Experience section (up to 24). Jev scores each one independently for accomplishment, impact, transferable capability, and relevance to the target role. Code calculates a possible order within each role, weighted toward role relevance. The original order remains visible. A PDF page count is read from the file itself; visual layout cannot be verified from extracted text. DOCX and pasted text do not have a trustworthy page count.

Jev does not generate text. This app presents its judgments for inspection; it does not generate recommendations, rewrite resume lines, or make hiring predictions. The score-based bullet order is a ranking to inspect, not an instruction to change the resume automatically. The original prompt also includes resume creation; this version implements a scoring example.

Upload size is limited to 5 MB, extracted resume text to 40,000 characters, and job description to 12,000 characters. Scanned PDFs require OCR before upload. To calibrate scores, compare the output against a set of resumes you have reviewed manually and adjust the rubric and weights in `lib/resume-review.ts`.

## Check the project

Run `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build`.
