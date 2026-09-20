export type ExperienceBullet = {
  id: number;
  role: string;
  originalPosition: number;
  text: string;
};

const EXPERIENCE_HEADING = /^(?:(?:(?:relevant|related|additional|other)\s+)?(?:(?:professional|work|employment|career|industry|research|teaching|clinical|volunteer|volunteering|leadership|internship|internships)\s+)?experience|(?:professional|work|employment|career)\s+history|employment|internships?|positions held|professional background|work experience\s*(?:&|and)\s*leadership)$/i;
const OTHER_HEADING = /^(?:summary|profile|objective|education|academic background|projects?|technical skills?|skills|core competencies|qualifications|certifications?|licenses?|languages|soft skills|publications?|awards?|honors?|references|activities|interests|contact(?: information)?|additional information)$/i;
const BULLET = /^(?:[●•▪◦‣*\-–—]|\d{1,2}[.)])\s+/;
const ROLE_DATE = /(?:19|20)\d{2}.{0,30}(?:present|(?:19|20)\d{2})/i;

function heading(line: string): string {
  return line.replace(/\s*[:：]\s*$/, "").trim();
}

export function extractExperienceBullets(resume: string, limit = 24): ExperienceBullet[] {
  const lines = resume.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const bullets: ExperienceBullet[] = [];
  const positions = new Map<string, number>();
  let inExperience = false;
  let role = "Experience";
  let pendingRoleLine = "";
  let current = "";

  function flush() {
    if (!current) return;
    const originalPosition = (positions.get(role) ?? 0) + 1;
    positions.set(role, originalPosition);
    bullets.push({ id: bullets.length, role, originalPosition, text: current.slice(0, 500) });
    current = "";
  }

  for (const line of lines) {
    const section = heading(line);
    if (EXPERIENCE_HEADING.test(section)) {
      flush();
      inExperience = true;
      role = "Experience";
      pendingRoleLine = "";
      continue;
    }
    if (OTHER_HEADING.test(section)) {
      flush();
      inExperience = false;
      pendingRoleLine = "";
      continue;
    }
    if (!inExperience) continue;
    if (BULLET.test(line)) {
      flush();
      current = line.replace(BULLET, "");
      pendingRoleLine = "";
    } else if (ROLE_DATE.test(line)) {
      flush();
      role = [pendingRoleLine, line].filter(Boolean).join(" — ").slice(0, 140);
      pendingRoleLine = "";
    } else if (current) {
      current += ` ${line}`;
    } else if (line.length <= 140 && !/^skills\s*:/i.test(line)) {
      pendingRoleLine = line;
    }
    if (bullets.length >= limit) break;
  }
  if (bullets.length < limit) flush();
  return bullets.slice(0, limit);
}
