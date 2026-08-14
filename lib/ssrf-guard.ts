import dns from "node:dns";
import net from "node:net";
import { Agent } from "undici";

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("::ffff:")) {
      const v4 = lower.slice(7);
      if (net.isIPv4(v4)) return isPrivateIp(v4);
    }
    return false;
  }
  return true;
}

export const ssrfSafeAgent = new Agent({
  connect: {
    lookup: (hostname, options, callback) => {
      dns.lookup(hostname, { all: true, verbatim: true }, (err, addresses) => {
        if (err) return callback(err, []);
        if (addresses.length === 0) return callback(new Error("No address found"), []);
        if (addresses.some((a) => isPrivateIp(a.address))) {
          return callback(new Error("Blocked: private or internal address"), []);
        }
        callback(null, addresses);
      });
    },
  },
});
