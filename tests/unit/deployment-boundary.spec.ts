import { expect, test } from "@playwright/test";
import { deploymentEnvironment } from "@/lib/deployment";
import { serverClient, supabaseConfigured } from "@/lib/supabase/server-client";
import { supabaseInquiryStore } from "@/lib/inquiry/store";
import { resendTransport } from "@/lib/inquiry/notify";
import { submitInquiry } from "@/lib/inquiry/submit";
import {
  recordMeasurement,
  supabaseMeasurementStore,
} from "@/lib/measurement/store";
import { validateInquiry } from "@/lib/inquiry/schema";
import browserConfig, { HOSTED_SERVICES_UNSET } from "../../playwright.config";
import captureConfig from "../../playwright.capture.config";

/*
 * The deployment boundary — which environments may write, and to what.
 *
 * Trace: MTS-EXC-003 (production-only persistence; Preview never writes),
 *        MTS-DEC-007, MTS SECURITY-ARCHITECTURE; MPS-REQ-011 (no store means
 *        UNCONFIRMED, never received).
 *
 * NOTHING HERE CAN REACH A NETWORK.
 *
 * `globalThis.fetch` is replaced for every test with a recorder that answers
 * locally, and every configured host is under `.example.invalid`, a name that
 * RFC 6761 guarantees never resolves. A test that would have made a request
 * therefore records it instead, and the assertions are made against the
 * record. The environment is saved before each test and restored after it, and
 * the file runs serially because both are process-global.
 */

test.describe.configure({ mode: "serial" });

const VARIABLES = [
  "VERCEL_ENV",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "INQUIRY_NOTIFICATION_TO",
] as const;

const CONFIGURED = {
  NEXT_PUBLIC_SUPABASE_URL: "https://lab.example.invalid",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_only",
  RESEND_API_KEY: "re_test_only",
  RESEND_FROM_EMAIL: "lab@example.invalid",
  INQUIRY_NOTIFICATION_TO: "operator@example.invalid",
};

const VALID = {
  contactName: "Alex Rivera",
  contactEmail: "alex@acme.example.invalid",
  organization: "Acme Analytics",
  buyerRole: "Founder / CTO",
  stackSummary: "Next.js on Vercel, Supabase Postgres, Stripe webhooks",
  launchTrigger: "pre-launch",
  reviewAreas: ["authorization-and-rls"],
  reviewRequest:
    "We are preparing to launch a multi-tenant SaaS on Supabase and would like a review of our RLS policies.",
  authorizationStatus: "authorized-by-me",
  authorizationAcknowledged: true,
};

let saved: Record<string, string | undefined>;
let originalFetch: typeof globalThis.fetch;
let requests: string[];

function setEnvironment(values: Record<string, string | undefined>) {
  for (const name of VARIABLES) delete process.env[name];
  for (const [name, value] of Object.entries(values)) {
    if (value !== undefined) process.env[name] = value;
  }
}

test.beforeEach(() => {
  saved = Object.fromEntries(
    VARIABLES.map((name) => [name, process.env[name]]),
  );
  originalFetch = globalThis.fetch;
  requests = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url =
      input instanceof Request ? input.url : new URL(String(input)).toString();
    requests.push(url);
    // Refuse anything that is not a test host, loudly, before answering.
    if (!new URL(url).hostname.endsWith(".example.invalid")) {
      throw new Error(`unexpected request to ${url}`);
    }
    return new Response(JSON.stringify({ message: "recorded, not sent" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }) as typeof globalThis.fetch;
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  setEnvironment(saved);
});

test.describe("deployment classification", () => {
  test("only VERCEL_ENV=preview is Preview; unset and unknown are local", () => {
    setEnvironment({});
    expect(deploymentEnvironment()).toBe("local");
    setEnvironment({ VERCEL_ENV: "development" });
    expect(deploymentEnvironment()).toBe("local");
    setEnvironment({ VERCEL_ENV: "preview" });
    expect(deploymentEnvironment()).toBe("preview");
    setEnvironment({ VERCEL_ENV: "production" });
    expect(deploymentEnvironment()).toBe("production");
  });
});

test.describe("the shared server client", () => {
  test("missing values create no client and no write", async () => {
    for (const environment of [undefined, "production"]) {
      setEnvironment({ VERCEL_ENV: environment });
      expect(supabaseConfigured()).toBe(false);
      expect(serverClient("inquiry")).toBeNull();
      expect(serverClient("measurement")).toBeNull();
    }
    expect(requests).toEqual([]);
  });

  test("Preview creates no client and no write even with every value present", async () => {
    setEnvironment({ VERCEL_ENV: "preview", ...CONFIGURED });
    expect(supabaseConfigured()).toBe(false);
    expect(serverClient("inquiry")).toBeNull();
    expect(serverClient("measurement")).toBeNull();

    expect(await supabaseInquiryStore.submit(validated())).toEqual({
      outcome: "unconfigured",
    });
    await supabaseInquiryStore.recordDelivery("ref", "sent");
    await supabaseMeasurementStore.record({
      event: "report_viewed",
      surface: "report",
    });
    expect(requests).toEqual([]);
  });

  test("Production with values present is not blocked", async () => {
    setEnvironment({ VERCEL_ENV: "production", ...CONFIGURED });
    expect(supabaseConfigured()).toBe(true);
    expect(serverClient("inquiry")).not.toBeNull();

    // The request is attempted — and recorded by the stub, not sent.
    await supabaseMeasurementStore.record({
      event: "report_viewed",
      surface: "report",
    });
    expect(requests).toHaveLength(1);
    expect(new URL(requests[0]).hostname).toBe("lab.example.invalid");
  });

  test("local with values present is configured, not mistaken for Preview", () => {
    setEnvironment({ ...CONFIGURED });
    expect(deploymentEnvironment()).toBe("local");
    expect(supabaseConfigured()).toBe(true);
    expect(serverClient("inquiry")).not.toBeNull();
  });
});

test.describe("inquiry persistence and notification", () => {
  test("an unconfigured store returns unconfirmed/unconfigured", async () => {
    setEnvironment({});
    expect(await supabaseInquiryStore.submit(validated())).toEqual({
      outcome: "unconfigured",
    });
    expect(await submitInquiry(VALID)).toEqual({
      state: "unconfirmed",
      reason: "unconfigured",
    });
    expect(requests).toEqual([]);
  });

  test("a Preview inquiry is unconfirmed and sends nothing anywhere", async () => {
    setEnvironment({ VERCEL_ENV: "preview", ...CONFIGURED });
    // The real store and the real Resend transport, not injected fakes.
    expect(await submitInquiry(VALID)).toEqual({
      state: "unconfirmed",
      reason: "unconfigured",
    });
    expect(requests).toEqual([]);
  });

  test("an unconfigured Resend sends nothing", async () => {
    setEnvironment({
      RESEND_FROM_EMAIL: CONFIGURED.RESEND_FROM_EMAIL,
      INQUIRY_NOTIFICATION_TO: CONFIGURED.INQUIRY_NOTIFICATION_TO,
    });
    expect(
      await resendTransport.send({
        from: CONFIGURED.RESEND_FROM_EMAIL,
        to: CONFIGURED.INQUIRY_NOTIFICATION_TO,
        replyTo: VALID.contactEmail,
        subject: "subject",
        text: "text",
      }),
    ).toEqual({ sent: false, failureClass: "unconfigured" });
    expect(requests).toEqual([]);
  });
});

test.describe("measurement", () => {
  test("without a client it makes no database call and never throws", async () => {
    for (const values of [{}, { VERCEL_ENV: "preview", ...CONFIGURED }]) {
      setEnvironment(values);
      await expect(
        recordMeasurement({ event: "report_viewed", surface: "report" }),
      ).resolves.toBeUndefined();
    }
    expect(requests).toEqual([]);
  });
});

test.describe("the browser suite cannot reach a hosted service", () => {
  test("its web server is forcibly unconfigured", () => {
    expect(HOSTED_SERVICES_UNSET).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      RESEND_API_KEY: "",
      RESEND_FROM_EMAIL: "",
      INQUIRY_NOTIFICATION_TO: "",
    });
  });

  test("both harnesses that serve the app pass that environment", () => {
    for (const [name, config] of [
      ["playwright.config", browserConfig],
      ["playwright.capture.config", captureConfig],
    ] as const) {
      const server = config.webServer;
      expect(server && !Array.isArray(server), name).toBe(true);
      expect((server as { env?: Record<string, string> }).env, name).toEqual(
        HOSTED_SERVICES_UNSET,
      );
    }
  });
});

function validated() {
  const result = validateInquiry(VALID);
  if (!result.ok) throw new Error("fixture inquiry must validate");
  return result.value;
}
