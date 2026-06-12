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

test("coach memory actions are exposed as clean GPT action routes", async () => {
  const [openapiRaw, netlifyToml] = await Promise.all([
    readFile(OPENAPI_PATH, "utf8"),
    readFile(NETLIFY_TOML_PATH, "utf8"),
  ]);
  const openapi = JSON.parse(openapiRaw);

  const routes = [
    ["/api/coach/observations", "post", "recordCoachObservation", "record-observation"],
    ["/api/coach/memory", "get", "listCoachMemory", "list-memory"],
    ["/api/coach/memory/correct", "post", "correctCoachMemory", "correct-memory"],
    ["/api/coach/memory/retire", "post", "retireCoachMemory", "retire-memory"],
    ["/api/coach/weekly-review", "get", "buildWeeklyReview", "weekly-review"],
    ["/api/coach/workout-debrief", "post", "recordWorkoutDebrief", "workout-debrief"],
    ["/api/coach/workout-debriefs", "get", "listWorkoutDebriefs", "workout-debriefs"],
    ["/api/coach/motra-template", "post", "buildMotraDebriefTemplate", "motra-template"],
  ];

  for (const [route, method, operationId, action] of routes) {
    assert.equal(openapi.paths[route]?.[method]?.operationId, operationId);
    const redirect = redirectBlockFor(netlifyToml, route);
    assert.ok(redirect, `netlify.toml should expose ${route}`);
    assert.match(redirect, new RegExp(`to\\s*=\\s*"\\/api\\/coach\\?action=${action}"`));
    assert.match(redirect, /status\s*=\s*200/);
  }

  assert.ok(openapi.components.schemas.CoachMemoryContext);
  assert.ok(openapi.components.schemas.CoachObservation);
  assert.ok(openapi.components.schemas.WeeklyReviewResponse);
  assert.equal(openapi.components.securitySchemes.CoachSecret.name, "x-coach-secret");
});

test("coach OpenAPI component references resolve", async () => {
  const openapi = JSON.parse(await readFile(OPENAPI_PATH, "utf8"));
  const refs = [];

  function collectRefs(value) {
    if (!value || typeof value !== "object") return;
    if (typeof value.$ref === "string") refs.push(value.$ref);
    for (const child of Object.values(value)) collectRefs(child);
  }

  collectRefs(openapi);
  for (const ref of refs) {
    assert.match(ref, /^#\/components\/schemas\//, `unexpected ref ${ref}`);
    const name = ref.split("/").at(-1);
    assert.ok(openapi.components.schemas[name], `missing schema ${name}`);
  }
});

test("coach OpenAPI actions declare operation-level CoachSecret security", async () => {
  const openapi = JSON.parse(await readFile(OPENAPI_PATH, "utf8"));

  assert.deepEqual(openapi.security, [{ CoachSecret: [] }]);
  assert.equal(openapi.components.securitySchemes.CoachSecret.in, "header");
  assert.equal(openapi.components.securitySchemes.CoachSecret.name, "x-coach-secret");

  for (const [route, pathItem] of Object.entries(openapi.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      assert.deepEqual(
        operation.security,
        [{ CoachSecret: [] }],
        `${method.toUpperCase()} ${route} should not rely only on global security inheritance`,
      );
    }
  }
});
