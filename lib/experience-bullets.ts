export type ExperienceBullet = {
  id: number;
  role: string;
  originalPosition: number;
  text: string;
};

const START = /^(?:professional|work|relevant)?\s*experience$/i;
const END = /^(?:projects?|technical skills?|skills|education|certifications?|languages|soft skills|publications?|volunteer(?:ing)?|awards?)$/i;
const BULLET = /^[●•▪◦‣*-]\s+/;
const ROLE_DATE = /(?:19|20)\d{2}.{0,30}(?:present|(?:19|20)\d{2})/i;

export function extractExperienceBullets(resume: string, limit = 24): ExperienceBullet[] {
  const lines = resume.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const start = lines.findIndex((line) => START.test(line));
  if (start < 0) return [];

  const bullets: ExperienceBullet[] = [];
  const positions = new Map<string, number>();
  let role = "Experience";
  let current = "";

  function flush() {
    if (!current) return;
    const originalPosition = (positions.get(role) ?? 0) + 1;
    positions.set(role, originalPosition);
    bullets.push({ id: bullets.length, role, originalPosition, text: current.slice(0, 500) });
    current = "";
  }

  for (const line of lines.slice(start + 1)) {
    if (END.test(line)) break;
    if (BULLET.test(line)) {
      flush();
      current = line.replace(BULLET, "");
    } else if (/^skills\s*:/i.test(line)) {
      flush();
    } else if (ROLE_DATE.test(line)) {
      flush();
      role = line.slice(0, 140);
    } else if (current) {
      current += ` ${line}`;
    }
    if (bullets.length >= limit) break;
  }
  if (bullets.length < limit) flush();
  return bullets.slice(0, limit);
}
