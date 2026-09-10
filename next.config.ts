import type { NextConfig } from "next";

/*
 * Response security headers (MTS-OBS-048).
 *
 * SECURITY-ARCHITECTURE.md Controls covers input validation, abuse control,
 * RLS and grants, secret handling, data separation, retention, preview-safe
 * destinations, and dependency management. It says nothing about response
 * headers, so this closes a gap rather than departing from anything approved.
 * The owner delegated the specific choice on 2026-09-09; what follows is the
 * conventional set, and each one is here for a stated reason rather than
 * because a scanner asks for it.
 *
 * The Content-Security-Policy sent here carries `frame-ancestors` ONLY. A full
 * policy — `script-src` and the rest — is deliberately absent: Next.js serves
 * its bootstrap and RSC payload through inline <script> elements, so a policy
 * this app would actually pass needs per-request nonces threaded through
 * middleware. A `script-src` with `unsafe-inline` would be the appearance of
 * the control without the control, which is precisely the claim this product
 * exists to argue against. Carried as its own item rather than faked here.
 * `frame-ancestors` is included because it governs embedding rather than
 * script execution, so it is enforceable today at no such cost.
 *
 * The evidence surfaces render code and logs as TEXT and execute nothing, so
 * none of these headers affects how a scenario, excerpt, or report displays.
 */
const securityHeaders = [
  /*
   * The report and scenario routes serve excerpts whose content type must be
   * taken literally; sniffing is how a text/plain excerpt becomes script.
   */
  { key: "X-Content-Type-Options", value: "nosniff" },

  /*
   * R1 has no embeddable surface and no partner framing it. Denying frames
   * outright keeps a severity-ranked report from being reframed as someone
   * else's finding.
   */
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },

  /*
   * A scenario URL names the vulnerability class being demonstrated. Sending
   * only the origin off-site keeps that out of third-party referer logs.
   */
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  /*
   * The lab asks for no device capability at all. MPS-REQ-013 is explicit that
   * no upload path exists, so the camera and microphone denials are the header
   * form of a boundary the product already keeps.
   */
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  /*
   * The framework version is not a fact a visitor needs, and it is the first
   * thing an automated scan reads.
   */
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
