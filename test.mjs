import test from "node:test";
import assert from "node:assert/strict";
import { run } from "./src/index.js";

const originalFetch = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = originalFetch; });

test("notifies when today is already checked in", async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), options });
    if (String(url).includes("glados.one")) return new Response(JSON.stringify({ message: "Checkin Repeats!" }), { status: 200 });
    return new Response(JSON.stringify({ code: 0 }), { status: 200 });
  };
  await run({ GLADOS_COOKIE: "koa:sess=test", SERVERCHAN_SENDKEY: "SCT123" });
  assert.equal(requests.length, 2);
  assert.match(String(requests[1].options.body), /title=GLaDOS\+%E4%BB%8A%E6%97%A5%E5%B7%B2%E7%AD%BE%E5%88%B0/);
});

test("check-in still works without notification configuration", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ message: "Checkin!" }), { status: 200 });
  await assert.doesNotReject(() => run({ GLADOS_COOKIE: "koa:sess=test" }));
});

test("reports expired cookie and rejects", async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url: String(url), options });
    if (String(url).includes("glados.one")) return new Response(JSON.stringify({ message: "Please login" }), { status: 401 });
    return new Response(JSON.stringify({ code: 0 }), { status: 200 });
  };
  await assert.rejects(() => run({ GLADOS_COOKIE: "old", SERVERCHAN_SENDKEY: "SCT123" }), /HTTP 401/);
  assert.equal(requests.length, 2);
  assert.match(String(requests[1].options.body), /GLADOS_COOKIE/);
});
