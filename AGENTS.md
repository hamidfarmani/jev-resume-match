<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repository guide

- This is a Next.js 16 App Router application using TypeScript, React, and pnpm. Use `pnpm` and keep `pnpm-lock.yaml` in sync with dependency changes.
- `app/page.tsx` is the interactive review UI. `app/api/review/route.ts` validates uploads and calls the server-side review. Keep the API key and file parsing on the server.
- `lib/resume-file.ts` extracts text from PDF, DOCX, and TXT. `lib/experience-bullets.ts` identifies experience bullets. `lib/resume-review.ts` defines Jev questions, scoring weights, and ordering. `docs/resume-prompt.md` records the rubric that inspired these criteria.
- `DESIGN.md` is the visual design reference. Apply its typography, colors, spacing, and shapes to this resume workflow; keep product-specific controls and result data relevant to resume review.

## Review behavior

- Use Jev for narrow, typed judgments. Keep parsing, validation, weighted calculations, and ordering in code. Jev does not generate prose; this app presents scores and evidence signals rather than resume rewrites or hiring predictions.
- Keep the rubric levels concrete and independently understandable. When changing a question or weight, update the corresponding result labels and README so users can see what a score means. Treat scores and bullet order as exploratory until checked against representative resumes.
- A Score value is a probability-weighted position on rubric levels; its confidence measures how concentrated that distribution is. A Noul value is the probability of yes. Do not display either as a claim of objective correctness.
- Preserve `serverExternalPackages: ["pdf-parse"]` in `next.config.ts` unless PDF uploads have been verified through the Next.js route after changing it. Bundling the parser breaks PDF.js worker resolution in this project.

## Privacy and verification

- Resumes contain personal data. Do not commit real resumes, extracted text, API responses, or credentials. Use synthetic or redacted fixtures for checks. The key belongs in `.env.local` as `TYPESAFE_API_KEY`; `.env.example` contains only the variable name.
- Keep upload limits and useful validation errors in the route. Do not log resume text. A scanned PDF may have no extractable text, and text extraction cannot verify visual layout.
- Before finishing a change, run `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build`. For parser changes, also exercise a PDF upload through the route with a synthetic file; a standalone parser check does not catch Next.js worker problems.
