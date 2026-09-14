/*
 * Which deployment this code is running in.
 *
 * Trace: MTS-DEC-007 (preview and production environments); MTS
 *        SECURITY-ARCHITECTURE ("use preview-safe notification destinations
 *        and separate environment variables"); MTS-CAP-008 (measurement rows
 *        carry the environment so preview traffic never pollutes a product
 *        metric).
 *
 * Vercel sets VERCEL_ENV on the server for every deployment. Anything else —
 * a workstation, a CI runner, a container — is local, which is the safe
 * default: nothing in this repository may treat an unknown environment as
 * production.
 *
 * It reads one variable and holds no secret, so it is safe on both sides of
 * the server boundary. It is nonetheless imported only by server modules
 * today; VERCEL_ENV is not exposed to the browser, where it would read as
 * "local" and quietly mislabel an event.
 */

export type DeploymentEnvironment = "local" | "preview" | "production";

export function deploymentEnvironment(): DeploymentEnvironment {
  if (process.env.VERCEL_ENV === "production") return "production";
  if (process.env.VERCEL_ENV === "preview") return "preview";
  return "local";
}
