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

  return <main className="shell">
    <header className="site-header"><div className="brand"><span>↗</span> Job Match <small>/ Resume review</small></div><p>Powered by TypeSafe Jev</p></header>
    <section className="hero"><div className="eyebrow">● &nbsp; Resume rubric explorer</div><h1>See how your resume<br /><em>scores across the rubric.</em></h1><p>Jev evaluates nine resume criteria and scores each experience bullet. Explore the scores, the evidence behind them, and a possible bullet order for your target role.</p></section>
    <div className="workspace">
      <section className="card form-card" aria-labelledby="form-title">
        <div className="card-title"><span className="step">01</span><div><h2 id="form-title">Start your review</h2><p>Share the resume you want to improve.</p></div></div>
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="resume-file">Resume file</label>
          <label className="upload" htmlFor="resume-file"><input id="resume-file" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={e => setFile(e.target.files?.[0] ?? null)} /><span>↑</span><strong>{file ? file.name : "Choose a file to upload"}</strong><small>PDF, DOCX or TXT · up to 5 MB</small></label>
          <div className="divider">or paste your resume</div>
          <label className="field-label" htmlFor="resume">Resume text</label><textarea id="resume" name="resume" rows={6} maxLength={40000} placeholder="Paste your resume here if you prefer…" />
          <div className="field-grid"><div><label className="field-label" htmlFor="targetRole">Target role *</label><input id="targetRole" name="targetRole" required maxLength={200} placeholder="e.g. Senior Product Designer" /></div><div><label className="field-label" htmlFor="languages">Additional languages <i>optional</i></label><input id="languages" name="languages" maxLength={1000} placeholder="e.g. Swedish, French" /></div></div>
          <label className="field-label" htmlFor="jobDescription">Job description <i>recommended</i></label><textarea id="jobDescription" name="jobDescription" rows={5} maxLength={12000} placeholder="Paste the role description for a more targeted review…" />
          <label className="field-label" htmlFor="projects">Extra projects or portfolio links <i>optional</i></label><textarea id="projects" name="projects" rows={3} maxLength={4000} placeholder="Anything relevant that your resume might be missing…" />
          <p className="privacy">Your resume is processed for this review and sent to TypeSafe for evaluation. This app does not save it.</p>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="submit" type="submit" disabled={loading}>{loading ? "Reviewing your resume…" : "Review my resume"}<span>↗</span></button>
        </form>
      </section>
      <aside className="card guide"><div className="card-title"><span className="step">02</span><h2>What Jev does</h2></div><div className="guide-item"><b>①</b><div><h3>Scores nine criteria</h3><p>Each criterion has four concrete rubric levels and a probability for each one.</p></div></div><div className="guide-item"><b>②</b><div><h3>Examines each bullet</h3><p>Accomplishment, impact, transferable capability, and target-role relevance are judged separately.</p></div></div><div className="guide-item"><b>③</b><div><h3>Orders within each role</h3><p>Code combines those bullet scores to surface important work earlier.</p></div></div><div className="rubric"><strong>THE BOUNDARY</strong><p>Jev makes typed judgments. Code calculates the weighted index and reads PDF page count.</p></div></aside>
    </div>
    {result && <section id="results" className="results" aria-live="polite"><div className="results-title"><div><span className="eyebrow">JEV EVALUATION</span><h2>Rubric results, lowest first.</h2></div><small>{result.model} · {result.dimensions.length + result.bullets.length * 4} Score questions · {result.checks.length} visible Noul questions</small></div>
      <div className="results-grid"><div className="card score-card"><div className="score-head">Weighted rubric index <small>Calculated in code</small></div><div className="big-score">{result.overall}<small>/100</small></div><p>This combines Jev&apos;s nine independent resume scores using fixed weights. It is not a hiring prediction.</p>{result.pageCount !== null && <p className="page-fact">PDF length: {result.pageCount} {result.pageCount === 1 ? "page" : "pages"} · read from the file</p>}</div><div className="card dimensions"><h3>Jev scores</h3>{result.dimensions.map((item, index) => <div className="dimension" key={item.id}><div><span><b className="rank">{index + 1}.</b> <span className="dimension-group">{item.group} / </span>{item.label}</span><strong>{item.value}/100</strong></div><div className="bar"><span style={{ width: `${item.value}%` }} /></div><small>Weight {item.weight}% · distribution confidence {Math.round(item.confidence * 100)}%</small><details className="probabilities"><summary>Show four rubric levels and probabilities</summary>{item.levels.map((level, levelIndex) => <div className="probability-row" key={levelIndex}><span>{levelIndex}. {level.description}</span><strong>{Math.round(level.probability * 100)}%</strong></div>)}</details></div>)}</div></div>
      <div className="card bullet-card"><div className="bullet-heading"><div><span className="eyebrow">EXPERIENCE BULLETS</span><h3>What belongs higher?</h3><p>Jev evaluates accomplishment beyond routine duties, evidence of impact, a capability you could repeat elsewhere, and fit with the target role. Each 0–100 figure is a normalized rubric score, not a success probability. The proposed order is calculated within each role: relevance 40%, impact 25%, accomplishment 20%, repeatable capability 15%.</p></div><small>{result.bullets.length} bullets scored</small></div>{result.bullets.length === 0 ? <p className="footnote">No experience bullets were detected. Use an Experience heading and bullet characters such as • or ● for bullet-level scoring.</p> : Array.from(new Set(result.bullets.map(bullet => bullet.role))).map(role => <div className="role-group" key={role}><h4>{role}</h4>{result.bullets.filter(bullet => bullet.role === role).toSorted((a, b) => a.suggestedPosition - b.suggestedPosition).map(bullet => <article className="bullet-row" key={bullet.id}><div className="bullet-position"><strong>#{bullet.suggestedPosition}</strong><small>was #{bullet.originalPosition}</small></div><div className="bullet-body"><p>{bullet.text}</p><div className="bullet-scores"><span>Accomplishment <b>{bullet.scores.accomplishment.value}</b></span><span>Impact <b>{bullet.scores.impact.value}</b></span><span>Repeatable <b>{bullet.scores.transferable.value}</b></span><span>Role fit <b>{bullet.scores.relevance.value}</b></span></div></div><strong className="bullet-priority">{bullet.priority}</strong></article>)}</div>)}{result.bulletsTruncated && <p className="footnote">Only the first 24 experience bullets were scored.</p>}</div>
      <div className="card signal-card"><div><span className="eyebrow">JEV YES/NO QUESTIONS</span><h3>Specific resume signals</h3><p>The percentage is Jev&apos;s probability that the statement is true. A value near 50% is uncertain.</p></div><div className="signals">{result.checks.map(check => <div className="signal" key={check.label}><span>{check.label}</span><strong>{Math.round(check.probability * 100)}%</strong></div>)}</div></div><p className="result-note">Confidence describes how concentrated a Score&apos;s probabilities are, not whether the resume is objectively good. Text extraction cannot verify fonts, columns, or visual layout.</p>
    </section>}
    <footer>Job Match · Better evidence. Better applications.</footer>
  </main>;
}
