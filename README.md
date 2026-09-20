# Job Match

A simple resume review app. Upload a PDF, DOCX, or TXT file. Add the role you want and, optionally, a job description. The review shows an overall score, individual criteria, experience bullet scores, and a possible bullet order.

## Run locally

1. Run `pnpm install`.
2. Copy `.env.example` to `.env.local` and set `TYPESAFE_API_KEY`.
3. Run `pnpm dev` and open the local URL shown in the terminal.

The server key provides five demo reviews per browser. After that, visitors can enter their own TypeSafe key in the form. The entered key is sent to the server for that request and is not saved by this app. The app does not save resumes or results, but it sends extracted resume text and role context to TypeSafe. Scanned PDFs need OCR before upload.

To inspect the demo allowance locally, open `/api/review` in the same browser. It returns `remaining` and `demoAvailable`. Successful free reviews update the browser's signed `job_match_demo` cookie. Clicking **Check resume** again with unchanged inputs keeps the visible result and makes no new request. Change the file, target role, or job description to run another review.

The demo limit uses a signed browser cookie and an in-memory cap of 40 shared-key calls per server process per UTC day. It is a small-project safeguard, not a reliable public spending limit: clearing cookies or restarting/scaling the server can change the effective limit. If you deploy publicly, set a budget or cap with your API provider and add a shared rate-limit store before relying on free reviews at scale.

## Project notes

- [How it works](docs/how-it-works.md) explains Jev, the review pipeline, scoring, and where to experiment in code.
- [DESIGN.md](DESIGN.md) is the visual reference. Its colors, typography, spacing, and shapes are adapted to this focused resume workflow.
- [Original resume prompt](docs/resume-prompt.md) records the rubric that informed the review criteria.
- The footer links to [Hamid Farmani's GitHub profile](https://github.com/hamidfarmani); replace it with the repository URL after this project is published.

Run `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test:quota` (Node.js 22.6+), and `pnpm build` before shipping changes.
