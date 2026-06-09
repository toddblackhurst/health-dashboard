import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const OPENAPI_PATH = new URL("../coach-openapi.json", import.meta.url);
const NETLIFY_TOML_PATH = new URL("../netlify.toml", import.meta.url);

function redirectBlockFor(toml, route) {
  const blocks = toml.split(/\n\[\[redirects\]\]\n/);
  return blocks.find(block => new RegExp(`from\\s*=\\s*"${route.replaceAll("/", "\\/")}"`).test(block));
}

test("sync-status is exposed as a clean GPT action route", async () => {
  const [openapiRaw, netlifyToml] = await Promise.all([
    readFile(OPENAPI_PATH, "utf8"),
    readFile(NETLIFY_TOML_PATH, "utf8"),
  ]);
  const openapi = JSON.parse(openapiRaw);

  const syncStatus = openapi.paths["/api/coach/sync-status"]?.get;
  assert.ok(syncStatus, "OpenAPI should expose GET /api/coach/sync-status");
  assert.equal(syncStatus.operationId, "getSyncStatus");
  assert.equal(openapi.components.securitySchemes.CoachSecret.name, "x-coach-secret");

  const redirect = redirectBlockFor(netlifyToml, "/api/coach/sync-status");
  assert.ok(redirect, "netlify.toml should expose /api/coach/sync-status");
  assert.match(redirect, /to\s*=\s*"\/api\/coach\?action=sync-status"/);
  assert.match(redirect, /status\s*=\s*200/);
});
