"use client";

import { useState, type FormEvent } from "react";
import type { ReviewResult } from "@/lib/resume-review";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);

    const data = new FormData(event.currentTarget);
    if (file) data.set("file", file);
    if (!file && !String(data.get("resume") || "").trim()) {
      setError("Upload a resume or paste its text.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/review", { method: "POST", body: data });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Review failed.");
      setResult(payload as ReviewResult);
      window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Review failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <header className="site-header">
        <div className="brand"><span aria-hidden="true">↗</span> Job Match</div>
      </header>

      <section className="hero">
        <span className="eyebrow">Resume review</span>
        <h1>See what your resume shows.</h1>
        <p>Check how clearly your resume presents your experience, impact, and fit for the role you want.</p>
      </section>

      <section id="review" className="card form-card" aria-labelledby="form-title">
        <div className="card-title">
          <h2 id="form-title">Check your resume</h2>
          <p>Upload a file or paste the text below.</p>
        </div>
        <form onSubmit={submit} aria-busy={loading}>
          <label className="field-label" htmlFor="resume-file">Resume file</label>
          <label className="upload" htmlFor="resume-file">
            <input
              id="resume-file"
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
            <span aria-hidden="true">↑</span>
            <strong>{file ? file.name : "Choose a file"}</strong>
            <small>PDF, DOCX or TXT · up to 5 MB</small>
          </label>
          {file && <button className="remove-file" type="button" onClick={() => setFile(null)}>Remove file</button>}

          <div className="divider">or paste text</div>
          <label className="field-label" htmlFor="resume">Resume text</label>
          <textarea id="resume" name="resume" rows={5} maxLength={40000} disabled={Boolean(file)} placeholder="Paste your resume here…" />

          <label className="field-label" htmlFor="targetRole">Target role</label>
          <input id="targetRole" name="targetRole" required maxLength={200} placeholder="e.g. Senior Software Engineer" />

          <label className="field-label" htmlFor="jobDescription">Job description <span>optional</span></label>
          <textarea id="jobDescription" name="jobDescription" rows={4} maxLength={12000} placeholder="Paste a job description for a more specific review…" />

          <p className="privacy">Your resume is sent to an AI service for scoring. This app does not store it.</p>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="submit" type="submit" disabled={loading}>
            {loading ? "Checking your resume…" : "Check resume"}<span aria-hidden="true">↗</span>
          </button>
        </form>
      </section>

      {result && <section id="results" className="results" aria-live="polite">
        <div className="results-title">
          <span className="eyebrow">Your review</span>
          <h2>A closer look at your resume</h2>
        </div>

        <div className="results-grid">
          <div className="card score-card">
            <h3>Overall score</h3>
            <div className="big-score">{result.overall}<small>/100</small></div>
            <p>A weighted view of the criteria below. This score cannot predict a hiring decision.</p>
            {result.pageCount !== null && <p className="page-fact">PDF length: {result.pageCount} {result.pageCount === 1 ? "page" : "pages"}</p>}
          </div>

          <div className="card dimensions">
            <div className="section-heading">
              <h3>Review areas</h3>
              <p>Ordered from lowest score to highest.</p>
            </div>
            {result.dimensions.map((item) => <article className="dimension" key={item.id}>
              <div className="dimension-top">
                <div><small>{item.group}</small><h4>{item.label}</h4></div>
                <strong>{item.value}<span>/100</span></strong>
              </div>
              <div className="bar" aria-hidden="true"><span style={{ width: `${item.value}%` }} /></div>
              <details className="probabilities">
                <summary>How this was scored</summary>
                <p>Each level below shows how likely the resume was to match it.</p>
                {item.levels.map((level, index) => <div className="probability-row" key={index}>
                  <span>{level.description}</span><strong>{Math.round(level.probability * 100)}%</strong>
                </div>)}
              </details>
            </article>)}
          </div>
        </div>

        <section className="card bullet-card" aria-labelledby="bullets-title">
          <div className="section-heading">
            <div><h3 id="bullets-title">Experience bullets</h3><p>Within each role, bullets are sorted by fit and evidence. Compare the new position with the original.</p></div>
            <span>{result.bullets.length} checked</span>
          </div>
          {result.bullets.length === 0
            ? <p className="empty-note">No experience bullets were found. An “Experience” heading and bullet characters such as • help us identify them.</p>
            : Array.from(new Set(result.bullets.map((bullet) => bullet.role))).map((role, index) => {
              const bullets = result.bullets.filter((bullet) => bullet.role === role).toSorted((a, b) => a.suggestedPosition - b.suggestedPosition);
              return <details className="role-group" key={role} open={index === 0}>
                <summary><span>{role}</span><small>{bullets.length} {bullets.length === 1 ? "bullet" : "bullets"}</small></summary>
                {bullets.map((bullet) => <article className="bullet-row" key={bullet.id}>
                  <div className="bullet-position"><strong>#{bullet.suggestedPosition}</strong><small>was #{bullet.originalPosition}</small></div>
                  <div className="bullet-body">
                    <p>{bullet.text}</p>
                    <div className="bullet-scores">
                      <span>Accomplishment <b>{bullet.scores.accomplishment.value}</b></span>
                      <span>Impact <b>{bullet.scores.impact.value}</b></span>
                      <span>Repeatable skill <b>{bullet.scores.transferable.value}</b></span>
                      <span>Role fit <b>{bullet.scores.relevance.value}</b></span>
                    </div>
                  </div>
                  <strong className="bullet-priority"><span>Order score</span>{bullet.priority}<small>/100</small></strong>
                </article>)}
              </details>;
            })}
          {result.bulletsTruncated && <p className="footnote">Only the first 24 experience bullets were checked.</p>}
          <p className="footnote">The suggested order gives more weight to role fit and impact. Bullet scores describe the text as written.</p>
        </section>

        <section className="card signal-card" aria-labelledby="checks-title">
          <div className="section-heading"><h3 id="checks-title">Quick checks</h3><p>How likely each statement is to be true of your resume.</p></div>
          <div className="signals">{result.checks.map((check) => <div className="signal" key={check.label}>
            <span>{check.label}</span><strong>{Math.round(check.probability * 100)}%</strong>
          </div>)}</div>
        </section>
        <p className="result-note">Scores are guides for reviewing the text. File extraction cannot check visual layout, fonts, or columns.</p>
      </section>}
    </main>
  );
}
