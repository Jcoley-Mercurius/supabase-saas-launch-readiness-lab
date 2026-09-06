# Supabase SaaS Launch-Readiness Lab — MTS Discovery Brief

Status: Approved — Gate 1 complete  
MTS version: v0.1-draft  
Consumed authority: MPS v1.1 and MDS v1.0

## Discovery outcome

The project is a greenfield, public, no-account portfolio product and synthetic audit lab. The supplied workspace contains the approved MPS/MDS package and canonical design references, but no application repository, package manifest, runtime configuration, deployment configuration, database schema, or integration code.

MTS will therefore use the greenfield path. No framework, provider, package, production service, persistent agent skill, plugin, connector, database design, deployment target, or recurring cost has been approved yet.

## Approved product and experience constraints

- Responsive public web experience designed to convert Upwork prospects into authorized review or remediation inquiries.
- One coherent synthetic multi-tenant SaaS context with authorization/RLS, storage/configuration, webhook replay/idempotency, and reliability/recovery evidence.
- No account, live scanning, buyer upload, production credential, real customer record, billing, scheduling, contract, certification, or compliance-attestation path in R1.
- Evidence states and limitations must remain explicit, including vulnerable, remediated, untested, unavailable, running, and not applicable.
- Inquiry success, failure, retry, duplicate, acknowledgement, and unauthorized-request boundary states are required.
- WCAG 2.2 AA, the approved responsive compositions, canonical references, and MDS tokens/components govern implementation.

## Delivery observations

- Project mode: greenfield.
- Current workspace: planning and design artifacts only; not a Git repository.
- Owner/implementer: Josh Coley.
- Working environment: WSL/Ubuntu.
- Coding-agent workflow: Codex and Claude consume the same canonical MPS/MDS/MTS artifacts and project-level `AGENTS.md`.
- Team familiarity with common TypeScript, Vercel, and Supabase workflows is relevant evidence, but it does not constitute an approved project stack.

## Initial required technology capabilities

1. Responsive public application delivery.
2. Deterministic synthetic tenant, role, resource, and authorization evidence.
3. Secret-safe storage and configuration evidence.
4. Deterministic webhook replay and idempotency evidence.
5. Controlled failure injection, retry, recovery, and unavailable evidence.
6. Buyer-readable report and case-study publication.
7. Privacy-aware inquiry capture, acknowledgement, deduplication, abuse resistance, and recovery.
8. Privacy-safe measurement for the approved MPS metrics.
9. Responsive, accessibility, security, and canonical-reference verification.

These capabilities are requirement statements, not provider selections.

## Trust and data posture

The public browser, application runtime, data store, inquiry-delivery path, and any webhook/event boundary must be treated as separate trust boundaries. R1 uses synthetic scenario data. Inquiry contact details are the only intended personal data. Secrets and private credentials must never appear in the client, evidence, logs, analytics, URLs, screenshots, or repository.

The vulnerable demonstration must not expose a reusable live exploit path. Gate 3–5 architecture must determine how the lab proves a vulnerable state while keeping the deployed product safely bounded and the evidence truthful.

## Gate 1 approved decisions

1. **Cost and scale posture:** optimize for a low-traffic public portfolio launch, target a practical ceiling of **$50/month**, use free/low-cost tiers where they do not weaken evidence or reliability, and preserve an incremental scaling path.
2. **Inquiry retention:** retain inquiry records for **12 months after the latest activity**, permit earlier manual deletion, and retain only minimal delivery/deduplication metadata afterward when operationally necessary. This policy is authoritative in MPS v1.1.
3. **Repository posture:** create a new standalone Git repository for this lab, use preview and production environments, and keep the approved MPS/MDS/MTS package plus canonical references inside the repository.

## Gate status

Gate 1 is complete. Gate 2 is also complete for this greenfield stage: inspection confirmed that no application code, runtime, packages, services, or deployment configuration exists to classify. The repository-creation item remains open for implementation readiness and will trigger another inspection after bootstrap. Gate 3 is now proposed for approval in `mts/SUPABASE-LAUNCH-READINESS-CAPABILITY-MATRIX.md`; current provider research will follow without treating any familiar stack as pre-approved.
