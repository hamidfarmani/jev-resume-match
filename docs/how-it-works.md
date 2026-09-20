# How the resume review works

## What Jev does here

[Jev](https://docs.typesafe.ai/) is a TypeSafe System One model that turns text and application state into typed judgments. This app uses two question types from `@typesafe-ai/sdk`:

- `score(question, four levels)` returns a distribution over four rubric levels, an expected score from 0 to 3, and a confidence measure.
- `noul(question)` returns a probability of yes for a yes/no statement.

Jev does not write resume advice or rewrite bullets. The questions define what to judge; ordinary TypeScript code combines and orders the answers. This keeps the public interface focused on reading a resume review while leaving the Jev setup easy to change in code.

## Request flow

1. `app/page.tsx` collects a file or pasted text, a required target role, and an optional job description. The form posts to `/api/review`.
2. `app/api/review/route.ts` checks the inputs and runs in the Node.js runtime. A file is limited to 5 MB. Resume text is limited to 40,000 characters, the job description to 12,000 characters, and the role to 200 characters.
3. `lib/resume-file.ts` extracts text from PDF, DOCX, or TXT. PDF files also supply a page count. Scanned PDFs without embedded text need OCR first. Extracted text cannot prove how the visual layout looks.
4. `lib/experience-bullets.ts` finds up to 25 experience bullets so the app can detect when its 24-bullet review limit was reached.
5. `lib/resume-review.ts` sends two `systemOne` requests in parallel when bullets are present: one for the full resume rubric and yes/no checks, and one for up to 24 individual bullets. With no extracted bullets, only the full resume request runs.
6. The route returns JSON. The page shows the overall score, criterion details, bullet scores and suggested positions, and quick checks. Results are kept in component state; this app does not persist them.

The API uses `TYPESAFE_API_KEY` from `.env.local`; `JEV_API_KEY` is also accepted for compatibility. The model is pinned to `jev-1.13.0` in `lib/resume-review.ts`. The API key never goes to the browser.

## Scoring

Each four-level answer is converted from its expected 0–3 score to a rounded 0–100 value with `score / 3 × 100`. The per-level probabilities are available under “How this was scored.” They express the model's distribution across the defined levels, not certainty that the resume is objectively good or bad.

| Review area | Overall weight |
| --- | ---: |
| Summary value | 15% |
| Achievements vs duties | 20% |
| Impact evidence | 15% |
| Ownership and initiative | 10% |
| Target-role relevance | 15% |
| Important work first | 10% |
| Company context | 5% |
| Readable structure | 5% |
| Supported skills | 5% |

The overall score is the weighted sum of these nine values. Lower-scoring areas appear first so a reader can find the most useful review points quickly. The rubric gives extra weight to achievements, credible impact, and role fit; it does not reward duties or unsupported keyword lists merely for being present. The underlying questions and four concrete levels live in `lib/resume-review.ts`; [the original prompt](resume-prompt.md) explains the source of those priorities.

Every extracted experience bullet is scored for accomplishment, impact, repeatable skill, and target-role relevance. Its ordering score uses 20% accomplishment, 25% impact, 15% repeatable skill, and 40% role fit. Code sorts bullets within each role by that score, breaking ties by original position. The original and suggested positions remain visible. The three quick checks estimate whether most achievements include a measure, whether roles have company context, and whether most experience bullets start with an action.

## Limits and experimentation

Scores are a guide to the text as written, not a hiring prediction. A missing job description leaves role fit based on the target role. Numeric impact is useful when credible, but the rubric also credits concrete qualitative outcomes. Text extraction can miss content or reading order in complex files, and it cannot inspect fonts, columns, or visual hierarchy. The experience parser may miss bullets in unusual formats.

For experiments, edit the rubric questions, level descriptions, weights, or bullet ordering formula in `lib/resume-review.ts`. Update this document and the public labels if you change score meanings. Compare outputs with a small set of synthetic or redacted resumes reviewed by people before treating scores as calibrated. Do not commit real resumes, extracted text, credentials, or API responses.
