import { noul, score, TypeSafeClient } from "@typesafe-ai/sdk";
import { extractExperienceBullets, type ExperienceBullet } from "@/lib/experience-bullets";

export type ReviewInput = {
  resume: string;
  targetRole: string;
  jobDescription: string;
  pageCount: number | null;
};

const dimensions = [
  { id: "summary", label: "Summary value", group: "Summary", weight: 15 },
  { id: "achievement", label: "Achievements vs duties", group: "Experience", weight: 20 },
  { id: "impact", label: "Impact evidence", group: "Experience", weight: 15 },
  { id: "ownership", label: "Ownership and initiative", group: "Experience", weight: 10 },
  { id: "relevance", label: "Target-role relevance", group: "Role fit", weight: 15 },
  { id: "ordering", label: "Important work first", group: "Role fit", weight: 10 },
  { id: "roleContext", label: "Company context", group: "Structure", weight: 5 },
  { id: "clarity", label: "Readable structure", group: "Structure", weight: 5 },
  { id: "skills", label: "Supported skills", group: "Skills", weight: 5 },
] as const;

const questions = {
  summary: score("Evaluate only the resume summary for the target role. Apply the summary standards: 3–5 concise sentences from the employer's perspective; years of experience, relevant work, current focus, and next direction or value for this role. If absent, use the first level.", [
    "No summary, or a generic personal objective with no employer value.",
    "Some relevant background, but most key context or role-specific value is missing.",
    "Clear relevant background and value, but one or two key details are missing or vague.",
    "Concise, specific employer-focused summary covering experience, work, current focus, and fit for the role.",
  ]),
  achievement: score("Across the experience section, how often do bullets describe accomplishments the candidate could reasonably be proud of, rather than routine job responsibilities? Judge the writing, not the candidate's worth.", [
    "Experience is absent or consists almost entirely of generic duties.",
    "A few completed tasks are named, but most bullets still read as responsibilities.",
    "Several bullets describe improvements, deliveries, or meaningful contributions; some duties remain.",
    "Most bullets clearly describe meaningful accomplishments beyond routine responsibility.",
  ]),
  impact: score("Across the experience section, how well are outcomes and beneficiaries evidenced? Credit credible qualitative outcomes as well as supported numbers; do not demand invented metrics.", [
    "No outcomes or beneficiaries are described.",
    "Benefits are mostly vague claims without a concrete result.",
    "Several concrete results or beneficiaries appear, but impact is uneven or missing in many bullets.",
    "Most important bullets include specific, credible results, scale, or clearly described beneficiaries.",
  ]),
  ownership: score("Does the experience section show initiative, decisions, or methods that demonstrate a capability the candidate could repeat in another company? Avoid mistaking an action verb alone for ownership.", [
    "No clear personal contribution or repeatable capability is visible.",
    "Some tasks are attributed to the candidate, but ownership or method is unclear.",
    "Several examples show ownership or a transferable method, though evidence is uneven.",
    "Strong repeated evidence of initiative, decisions, and transferable capability across roles.",
  ]),
  relevance: score("How directly does the resume's evidence support the target role and, when provided, the job description? Judge the document's presentation of fit, not whether the person deserves the job. Treat missing job description as unknown, not a penalty.", [
    "Little or no evidence tied to the target role.",
    "Some adjacent evidence, but the connection to the target role is weak.",
    "Relevant work is present and reasonably prominent, with some missed opportunities to tailor it.",
    "Strong, prominent evidence and natural terminology directly aligned with the target role.",
  ]),
  ordering: score("Are the most compelling and target-relevant achievements prominent near the top of the summary and within each role? Evaluate content ordering, not the chronology of jobs. When no job description is supplied, use the target role as the reference.", [
    "Important target-relevant evidence is buried or hard to find.",
    "Some relevant evidence appears early, but stronger examples are often buried below weaker bullets.",
    "Most relevant achievements are reasonably prominent, with some ordering opportunities.",
    "The strongest target-relevant evidence is consistently easy to see first.",
  ]),
  roleContext: score("Can a reader unfamiliar with the employers understand what each company, product, or team does and why the work mattered? Do not require a literal one-line company description if context is already clear.", [
    "Employers or roles are missing, or company context is absent throughout.",
    "Context is available for only a few roles; several employers remain hard to understand.",
    "Most roles include enough product or company context, with some gaps.",
    "Each important role gives a new reader clear company or product context.",
  ]),
  clarity: score("Evaluate only the readability and information structure visible in the extracted resume text: clear header, role titles and dates, section ordering, concise content, and company context. Do not infer visual columns, fonts, or actual page layout from plain text.", [
    "Key sections or role information are missing; difficult to follow.",
    "Some structure exists, but roles, dates, or section boundaries are hard to scan.",
    "Mostly clear structure with minor clutter or missing context.",
    "Clear header, sections, roles, dates, and concise content that is easy to scan.",
  ]),
  skills: score("Evaluate whether the resume makes role-relevant technologies, tools, methods, or domain skills easy to find and backs them with work evidence. Do not reward a long unsupported keyword list.", [
    "No discoverable relevant skills or tools.",
    "A few relevant skills appear, but they are scattered or unsupported.",
    "Relevant skills are easy to find and mostly supported by work evidence.",
    "Compact, well-grouped relevant skills with clear evidence in experience or projects.",
  ]),
  quantified: noul("Do most achievement bullets in the resume include a credible measure of result or scale, such as time, percentage, users, volume, revenue, or a concrete before-and-after? Answer no if there are no achievement bullets."),
  companyContext: noul("For the roles in the resume, is there enough company or product context for an unfamiliar reader to understand the work? Answer no if there are no roles."),
  actionBullets: noul("Do most experience bullets begin with a strong action verb and describe something the candidate did or delivered? Answer no if there are no experience bullets."),
};

const bulletRubrics = {
  accomplishment: [
    "Only a routine responsibility or vague activity is stated.",
    "A specific task is stated, but the accomplishment or improvement is unclear.",
    "A delivered change, improvement, or initiative is clear.",
    "A substantial accomplishment with clear personal contribution beyond routine work is described.",
  ],
  impact: [
    "No result, beneficiary, or useful consequence is stated.",
    "A benefit is claimed, but it is vague or unsupported.",
    "A concrete result or beneficiary is named, though magnitude is unclear.",
    "A credible result has a supported measure, scale, or clear before-and-after.",
  ],
  transferable: [
    "The bullet is too vague to show a reusable capability.",
    "It shows a narrow task, but little about the method or skill that could transfer.",
    "It demonstrates a recognizable method, decision, or skill useful in another setting.",
    "It strongly demonstrates a repeatable capability through the method, scope, and outcome.",
  ],
  relevance: [
    "The work has no visible connection to the target role or job description.",
    "The work is adjacent to the target role, with an indirect connection.",
    "The work clearly supports a relevant capability for the target role.",
    "The work directly supports a central need of the target role or job description.",
  ],
} as const;

type BulletCriterion = keyof typeof bulletRubrics;
const bulletCriteria = Object.keys(bulletRubrics) as BulletCriterion[];

function makeBulletQuestions(bullets: ExperienceBullet[]) {
  const result: Record<string, ReturnType<typeof score>> = {};
  for (const bullet of bullets) {
    for (const criterion of bulletCriteria) {
      result[`bullet_${bullet.id}_${criterion}`] = score(
        `Evaluate only \`bullets[${bullet.id}].text\` in the context of \`bullets[${bullet.id}].role\`, \`target_role\`, and \`job_description\`. Rate its ${criterion} as written; do not credit facts not in the bullet. If no job description is provided, judge relevance to the target role alone.`,
        bulletRubrics[criterion],
      );
    }
  }
  return result;
}

export type BulletReview = ExperienceBullet & {
  suggestedPosition: number;
  priority: number;
  scores: Record<BulletCriterion, { value: number; confidence: number }>;
};

export type ReviewResult = {
  overall: number;
  dimensions: { id: string; label: string; group: string; value: number; confidence: number; weight: number; levels: { description: string; probability: number }[] }[];
  checks: { label: string; probability: number }[];
  bullets: BulletReview[];
  bulletsTruncated: boolean;
  pageCount: number | null;
  model: string;
};

export async function reviewResume(input: ReviewInput, apiKey: string): Promise<ReviewResult> {
  const client = new TypeSafeClient({ apiKey, logLevel: "off", retry: { maxRetries: 0 } });
  const extractedBullets = extractExperienceBullets(input.resume, 25);
  const bullets = extractedBullets.slice(0, 24);
  const [response, bulletResponse] = await Promise.all([client.systemOne({
    model: "jev-1.13.0",
    state: {
      resume: input.resume,
      target_role: input.targetRole,
      job_description: input.jobDescription || "Not provided",
    },
    questions,
  }), bullets.length ? client.systemOne({
    model: "jev-1.13.0",
    state: {
      target_role: input.targetRole,
      job_description: input.jobDescription || "Not provided",
      bullets: bullets.map(({ id, role, text }) => ({ id, role, text })),
    },
    questions: makeBulletQuestions(bullets),
  }) : Promise.resolve(null)]);

  const scored = dimensions.map((dimension) => {
    const answer = response.answers[dimension.id];
    return {
      ...dimension,
      value: Math.round((answer.score / 3) * 100),
      confidence: answer.confidence,
      levels: ([0, 1, 2, 3] as const).map((index) => ({
        description: String(answer.legend[index]),
        probability: answer.probabilities[index] ?? 0,
      })),
    };
  });
  const overall = Math.round(scored.reduce((sum, item) => sum + item.value * item.weight / 100, 0));
  const checks = [
    { label: "Most achievement bullets show measured results", probability: response.answers.quantified.noul },
    { label: "Roles have enough company context", probability: response.answers.companyContext.noul },
    { label: "Most experience bullets are action-led", probability: response.answers.actionBullets.noul },
  ];

  const reviewedBullets: BulletReview[] = bullets.map((bullet) => {
    const scores = Object.fromEntries(bulletCriteria.map((criterion) => {
      const answer = bulletResponse!.answers[`bullet_${bullet.id}_${criterion}`];
      return [criterion, { value: Math.round(answer.score / 3 * 100), confidence: answer.confidence }];
    })) as BulletReview["scores"];
    const priority = Math.round(
      scores.relevance.value * 0.4 + scores.impact.value * 0.25 +
      scores.accomplishment.value * 0.2 + scores.transferable.value * 0.15,
    );
    return { ...bullet, scores, priority, suggestedPosition: 0 };
  });
  const roles = new Map<string, BulletReview[]>();
  for (const bullet of reviewedBullets) {
    const group = roles.get(bullet.role) ?? [];
    group.push(bullet);
    roles.set(bullet.role, group);
  }
  for (const group of roles.values()) {
    group.toSorted((a, b) => b.priority - a.priority || a.originalPosition - b.originalPosition)
      .forEach((bullet, index) => { bullet.suggestedPosition = index + 1; });
  }

  return {
    overall,
    dimensions: scored.toSorted((a, b) => a.value - b.value),
    checks,
    bullets: reviewedBullets,
    bulletsTruncated: extractedBullets.length > bullets.length,
    pageCount: input.pageCount,
    model: response.model,
  };
}
