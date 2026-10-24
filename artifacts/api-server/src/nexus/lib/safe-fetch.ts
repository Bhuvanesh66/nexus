import { lookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import { isIP, type LookupFunction } from "node:net";
import ipaddr from "ipaddr.js";
import { Agent, fetch as undiciFetch } from "undici";

/** Only globally routable addresses: no loopback, metadata, private, mapped or transition shortcuts. */
export function isPublicAddress(address: string): boolean {
  try {
    const parsed = ipaddr.process(address);
    if (parsed.range() !== "unicast") return false;
    if (parsed.kind() === "ipv6") {
      // Only native global IPv6. Excludes NAT64, IPv4 translation and local-use prefixes.
      return parsed.match(ipaddr.parse("2000::"), 3);
    }
    return true;
  } catch {
    return false;
  }
}

export function assertPublicUrl(input: string | URL): URL {
  const url = new URL(input);
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Only public HTTP(S) URLs without credentials may be fetched");
  }
  if (host === "localhost" || /\.(localhost|local|internal|home|test|invalid)$/.test(host)) {
    throw new Error("Local hostnames cannot be fetched");
  }
  // URL normalizes decimal, hexadecimal and short-form IPv4 before this check.
  if (isIP(host) && !isPublicAddress(host)) throw new Error("Non-public address cannot be fetched");
  return url;
}

type Resolver = (hostname: string) => Promise<LookupAddress[]>;

/** Validate the addresses used by the socket itself, not a separate preflight DNS lookup. */
export function createPublicLookup(
  resolve: Resolver = (hostname) => lookup(hostname, { all: true, verbatim: true }),
): LookupFunction {
  return (hostname, options, callback) => {
    void resolve(hostname).then((addresses) => {
      if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
        callback(new Error("DNS resolved to a non-public destination"), "");
        return;
      }
      const family = options.family === "IPv4" ? 4 : options.family === "IPv6" ? 6 : options.family;
      const usable = family ? addresses.filter((address) => address.family === family) : addresses;
      if (!usable.length) {
        callback(new Error("No public address for the requested family"), "");
        return;
      }
      if (options.all) callback(null, usable);
      else callback(null, usable[0].address, usable[0].family);
    }, (error: Error) => callback(error, ""));
  };
}

const publicDispatcher = new Agent({ connect: { lookup: createPublicLookup() } });
type Transport = (url: URL, init: RequestInit) => Promise<Response>;
const pinnedTransport: Transport = async (url, init) => {
  return await undiciFetch(url, {
    ...init,
    dispatcher: publicDispatcher,
  } as Parameters<typeof undiciFetch>[1]) as unknown as Response;
};

/** Rechecks every redirect; publicDispatcher pins DNS validation to each actual connection. */
export function createPublicFetch(transport: Transport = pinnedTransport) {
  return async (input: string | URL, init: RequestInit = {}): Promise<Response> => {
    let url = assertPublicUrl(input);
    let method = (init.method ?? "GET").toUpperCase();
    let body = init.body;
    const headers = new Headers(init.headers);
    for (let hop = 0; hop <= 5; hop++) {
      const response = await transport(url, { ...init, method, body, headers, redirect: "manual" });
      if (![301, 302, 303, 307, 308].includes(response.status)) return response;
      const location = response.headers.get("location");
      if (!location) return response;
      await response.body?.cancel();
      if (init.redirect === "error" || hop === 5) throw new Error("Redirect refused");
      const next = assertPublicUrl(new URL(location, url));
      if (next.origin !== url.origin) {
        for (const name of ["authorization", "proxy-authorization", "cookie", "x-api-key", "apikey"]) headers.delete(name);
      }
      if ((response.status === 303 && method !== "HEAD") || ([301, 302].includes(response.status) && method === "POST")) {
        method = "GET";
        body = undefined;
        headers.delete("content-type");
        headers.delete("content-length");
      }
      url = next;
    }
    throw new Error("Too many redirects");
  };
}

export const safeFetch = createPublicFetch();
