import { test } from "node:test";
import assert from "node:assert/strict";
import type { LookupAddress, LookupOptions } from "node:dns";
import { assertPublicUrl, createPublicFetch, createPublicLookup, isPublicAddress, safeFetch } from "../src/nexus/lib/safe-fetch";

const blocked = [
  "0.0.0.0", "10.0.0.1", "127.0.0.1", "169.254.169.254", "172.16.0.1",
  "192.168.0.1", "100.64.0.1", "100.100.100.200", "192.0.0.5", "192.0.2.1",
  "198.18.0.1", "198.51.100.1", "203.0.113.1", "224.0.0.1", "240.0.0.1",
  "::", "::1", "::ffff:127.0.0.1", "::ffff:a00:1", "fc00::1", "fe80::1",
  "ff02::1", "2001:db8::1", "2002:7f00:1::", "64:ff9b::7f00:1",
];

test("rejects private, metadata, reserved, mapped and transition IPs", () => {
  for (const address of blocked) {
    assert.equal(isPublicAddress(address), false, address);
    const host = address.includes(":") ? `[${address}]` : address;
    assert.throws(() => assertPublicUrl(`http://${host}/`), undefined, address);
  }
  assert.equal(isPublicAddress("8.8.8.8"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
});

test("URL normalization cannot disguise internal IPv4, schemes or credentials", () => {
  for (const url of [
    "http://2130706433/", "http://0x7f000001/", "http://017700000001/",
    "http://127.1/", "http://127.0.1/", "http://localhost/", "http://host.internal/",
    "file:///etc/passwd", "ftp://example.com/a", "http://user:pass@example.com/",
  ]) assert.throws(() => assertPublicUrl(url), undefined, url);
});

function resolveWith(resolver: () => Promise<LookupAddress[]>, options: LookupOptions = {}) {
  return new Promise<string | LookupAddress[]>((resolve, reject) => {
    createPublicLookup(resolver)("public.example", options, (error, address) => {
      if (error) reject(error);
      else resolve(address);
    });
  });
}

test("socket DNS lookup refuses private and mixed public/private answers", async () => {
  for (const address of blocked) {
    await assert.rejects(resolveWith(async () => [{ address, family: address.includes(":") ? 6 : 4 }]));
  }
  await assert.rejects(resolveWith(async () => [
    { address: "8.8.8.8", family: 4 }, { address: "10.0.0.1", family: 4 },
  ], { all: true }));
  assert.equal(await resolveWith(async () => [{ address: "8.8.8.8", family: 4 }]), "8.8.8.8");
});

test("each new socket lookup revalidates DNS, including a rebinding answer", async () => {
  let calls = 0;
  const resolver = async () => [{ address: ++calls === 1 ? "8.8.8.8" : "127.0.0.1", family: 4 }];
  assert.equal(await resolveWith(resolver), "8.8.8.8");
  await assert.rejects(resolveWith(resolver));
});

test("redirects cannot reach a private or non-HTTP destination", async () => {
  for (const destination of [
    "http://169.254.169.254/latest/meta-data", "http://2130706433/",
    "http://[::ffff:127.0.0.1]/", "http://[fc00::1]/", "//127.0.0.1/",
    "file:///etc/passwd",
  ]) {
    let requests = 0;
    const fetch = createPublicFetch(async () => {
      requests++;
      return new Response(null, { status: 302, headers: { location: destination } });
    });
    await assert.rejects(fetch("https://example.com"));
    assert.equal(requests, 1, "private redirect must be rejected before any second request");
  }
});

test("valid redirects work; cross-origin redirects drop credentials", async () => {
  let requests = 0;
  const fetch = createPublicFetch(async (url, init) => {
    requests++;
    if (requests === 1) return new Response(null, { status: 302, headers: { location: "https://example.org/article" } });
    assert.equal(url.href, "https://example.org/article");
    const headers = new Headers(init.headers);
    assert.equal(headers.has("authorization"), false);
    assert.equal(headers.has("cookie"), false);
    assert.equal(headers.has("x-api-key"), false);
    return new Response("article text");
  });
  assert.equal(await (await fetch("https://example.com", {
    headers: { authorization: "test-only", cookie: "test-only", "x-api-key": "test-only" },
  })).text(), "article text");
  assert.equal(requests, 2);
});

test("redirect loops and provider redirects fail closed", async () => {
  let requests = 0;
  const fetch = createPublicFetch(async () => {
    requests++;
    return new Response(null, { status: 302, headers: { location: "/again" } });
  });
  await assert.rejects(fetch("https://example.com"));
  assert.equal(requests, 6);
  requests = 0;
  await assert.rejects(fetch("https://example.com", { redirect: "error" }));
  assert.equal(requests, 1);
});

test("public HTTPS still works with the DNS-pinned dispatcher", async () => {
  const response = await safeFetch("https://example.com", { signal: AbortSignal.timeout(15_000) });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Example Domain/);
});
