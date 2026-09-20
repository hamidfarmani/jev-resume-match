import assert from "node:assert/strict";
import test from "node:test";
import { extractExperienceBullets } from "../lib/experience-bullets.ts";

test("finds en-dash bullets under Work Experience and stops at Education", () => {
  const resume = "Summary\nA short summary.\nWork Experience\nEngineer, Example Co – 2021 - 2024\n– Built a reporting tool\n  for the support team.\n— Reduced manual steps.\nEducation\n• Unrelated education detail";
  assert.deepEqual(extractExperienceBullets(resume).map(({ text, role, originalPosition }) => ({ text, role, originalPosition })), [
    { text: "Built a reporting tool for the support team.", role: "Engineer, Example Co – 2021 - 2024", originalPosition: 1 },
    { text: "Reduced manual steps.", role: "Engineer, Example Co – 2021 - 2024", originalPosition: 2 },
  ]);
});

test("accepts common heading variants and separate role and date lines", () => {
  const resume = "Employment History:\nAnalyst, Example Co\n2022 – Present\n• Improved a dashboard.\nSkills\n• Spreadsheets\nResearch Experience\nAssistant, University – 2020 - 2021\n1. Published a synthetic report.\nProjects\n• Built an unrelated sample.";
  const bullets = extractExperienceBullets(resume);
  assert.equal(bullets.length, 2);
  assert.equal(bullets[0].role, "Analyst, Example Co — 2022 – Present");
  assert.equal(bullets[1].text, "Published a synthetic report.");
  assert.deepEqual(bullets.map(({ id }) => id), [0, 1]);
});

test("does not take bullets from unrelated sections or prose", () => {
  const resume = "Summary\n• A general claim.\nProjects\n• A side project.\nCareer History\nExample Co, 2021 – 2023\nA short paragraph without a bullet.\nSkills\n• A skill.";
  assert.deepEqual(extractExperienceBullets(resume), []);
});

test("recognizes a two-word experience heading", () => {
  assert.equal(extractExperienceBullets("Relevant Work Experience\n• Delivered a sample tool.").length, 1);
});
