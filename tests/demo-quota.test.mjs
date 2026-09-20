import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEMO_REVIEWS,
  demoCallAvailable,
  makeDemoCookie,
  readDemoCount,
  reserveDemoCall,
} from "../lib/demo-quota.ts";

test("demo cookies record only signed counts", () => {
  const ownerKey = "test-owner-key";
  assert.equal(readDemoCount(undefined, ownerKey), 0);
  for (let count = 1; count <= DEMO_REVIEWS; count += 1) {
    const cookie = makeDemoCookie(count, ownerKey);
    assert.equal(readDemoCount(cookie, ownerKey), count);
    assert.equal(readDemoCount(cookie, "another-owner-key"), 0);
    assert.equal(readDemoCount(`${count === 1 ? 2 : 1}.${cookie.slice(2)}`, ownerKey), 0);
    assert.equal(readDemoCount(`0.${cookie.slice(2)}`, ownerKey), 0);
  }
});

test("the shared demo budget resets on a new UTC day", () => {
  const firstDay = new Date("2026-09-20T12:00:00Z");
  for (let index = 0; index < 40; index += 1) {
    assert.equal(reserveDemoCall(firstDay), true);
  }
  assert.equal(demoCallAvailable(firstDay), false);
  assert.equal(reserveDemoCall(firstDay), false);
  assert.equal(reserveDemoCall(new Date("2026-09-21T00:00:00Z")), true);
});
