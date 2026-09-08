-- =====================================================================
-- The documented delivery sequences for S3.
--
-- Trace: MPS-REQ-006/007, MPS-ACC-007/008.
--
-- This file is the single reviewable definition of every replay, ordering,
-- failure, and recovery claim the lab makes. A behaviour that is not
-- registered here is not claimed, and is never implied to hold.
--
-- Each sequence states its expected end state as two numbers — how many
-- payment commitments should exist for the target invoice, and how many cents
-- should have been applied in total. That is what makes "the same logical
-- event did not create a duplicate commitment" (MPS-ACC-007) a counted fact
-- rather than an impression left by a log.
--
-- No credential, key, token, or real address appears in any row
-- (MPS-REQ-013, MPS-ACC-015).
-- =====================================================================

truncate table synthetic.documented_steps, synthetic.documented_sequences;

-- ---------------------------------------------------------------------
-- Scenario: webhook-integrity
-- ---------------------------------------------------------------------

insert into synthetic.documented_sequences
  (id, scenario_id, ordinal, title, intent, consequence, target_invoice,
   expected_commitments, expected_applied_cents, expectation_text, expectation) values

('WHK-001', 'webhook-integrity', 1,
 'The same logical event is delivered twice',
 'The provider delivers invoice.paid for NW-2041, then delivers the same logical event again under a new delivery id — an at-least-once redelivery, a dashboard replay, or a backfill all look like this.',
 'The customer is committed twice for one payment. Duplicate charges, duplicated fulfilment, and a revenue figure that no longer matches the provider''s are the ordinary results.',
 'NW-2041', 1, 148000,
 'One commitment of 148000 cents for NW-2041, no matter how many times the event arrives.',
 'deny'),

('WHK-002', 'webhook-integrity', 2,
 'A forged event with a signature that does not verify',
 'A caller posts a well-formed invoice.paid body to the endpoint carrying a signature that does not recompute from the payload.',
 'Anyone who learns the endpoint URL can mark invoices paid, extend subscriptions, or release fulfilment without paying.',
 'NW-2042', 0, 0,
 'No commitment at all, because the body was not proven to come from the provider.',
 'deny'),

('WHK-003', 'webhook-integrity', 3,
 'A superseded event arrives after the newer one',
 'Sequence 2 of HL-0818 is delivered first and applied. Sequence 1, the older version of the same invoice, then arrives late — the ordinary result of a provider retry racing a fresh delivery.',
 'A stale amount overwrites the current one, so the recorded balance silently disagrees with the provider''s.',
 'HL-0818', 1, 15000,
 'Only the newer sequence 2 event is applied; the superseded sequence 1 event changes nothing.',
 'deny'),

('WHK-004', 'webhook-integrity', 4,
 'A legitimate, correctly signed, first-time event',
 'A single properly signed invoice.paid event for HL-0817 that has never been seen before. This is the path that must keep working after the fix.',
 'If this path stops committing, the remediation has broken payment processing rather than secured it.',
 'HL-0817', 1, 91200,
 'Exactly one commitment of 91200 cents, in both documented configurations.',
 'allow');

insert into synthetic.documented_steps (sequence_id, ordinal, delivery_id, label, note, expected_commitments_after) values
('WHK-001', 1, 'del_nw2041_a', 'First delivery of evt_nw2041_paid',
 'The provider''s first delivery of the logical event. Nothing has been processed yet.', 1),
('WHK-001', 2, 'del_nw2041_b', 'Replay: same logical event, new delivery id',
 'A second delivery carrying the SAME event_id under a different delivery_id. A receiver keyed on the delivery id sees something it has never seen before.', 1),

('WHK-002', 1, 'del_nw2042_forged', 'Forged delivery with an unverifiable signature',
 'The payload is well formed and the endpoint is correct; only the signature fails to recompute.', 0),

('WHK-003', 1, 'del_hl0818_v2', 'Current event: sequence 2, 15000 cents',
 'The newer version of the invoice arrives and is applied.', 1),
('WHK-003', 2, 'del_hl0818_v1', 'Superseded event: sequence 1, 9000 cents, arriving late',
 'The older version of the same invoice arrives after the newer one. It is correctly signed and is not a duplicate — only its order is wrong.', 1),

('WHK-004', 1, 'del_hl0817_clean', 'Single correctly signed first delivery',
 'The ordinary, legitimate case.', 1);

-- ---------------------------------------------------------------------
-- Scenario: reliability-and-recovery
-- ---------------------------------------------------------------------

insert into synthetic.documented_sequences
  (id, scenario_id, ordinal, title, intent, consequence, target_invoice,
   expected_commitments, expected_applied_cents, expectation_text, expectation) values

('REL-001', 'reliability-and-recovery', 1,
 'Processing fails downstream, and the provider retries the same delivery',
 'The dependency the handler writes to is unavailable on the first attempt. The provider retries the same delivery id, as an at-least-once provider does, and the dependency is available by then.',
 'If the event was marked processed before the work was done, the retry is discarded as a duplicate and the payment is lost silently — no error, no queue, no alert, and a customer who paid.',
 'HL-0817', 1, 91200,
 'The failed attempt leaves nothing behind, and the retry produces exactly one commitment of 91200 cents.',
 'deny'),

('REL-002', 'reliability-and-recovery', 2,
 'A sustained outage across three attempts, then recovery',
 'The dependency stays unavailable for three consecutive delivery attempts and is restored before the fourth. This is the shape of a real incident rather than a single blip.',
 'A receiver that cannot survive a multi-attempt outage loses every event that arrived during it, and the loss is only discovered by reconciliation, if at all.',
 'NW-2042', 1, 32500,
 'Three failed attempts change nothing, and the attempt after recovery produces exactly one commitment of 32500 cents.',
 'deny'),

('REL-003', 'reliability-and-recovery', 3,
 'Recovery followed by a manual replay must not double-apply',
 'After a failure and a successful retry, an operator also replays the same logical event from the provider dashboard — the ordinary human response to an incident, and the point at which a fragile receiver turns one incident into two.',
 'Recovery work itself becomes the cause of the duplicate commitment, which is the failure mode operators are least likely to anticipate.',
 'HL-0818', 1, 15000,
 'Recovery and the manual replay together still leave exactly one commitment of 15000 cents.',
 'deny'),

('REL-004', 'reliability-and-recovery', 4,
 'An unrelated event delivered during the outage window',
 'While one delivery is failing repeatedly, an unrelated invoice.paid event for a different invoice arrives and must be processed normally.',
 'If a single failing dependency stalls unrelated events, an isolated outage becomes a total processing outage.',
 'NW-2041', 1, 148000,
 'The unrelated event commits exactly once, in both documented configurations, regardless of the failure around it.',
 'allow');

insert into synthetic.documented_steps (sequence_id, ordinal, delivery_id, label, note, expected_commitments_after) values
('REL-001', 1, 'del_hl0817_flaky', 'Attempt 1 — the downstream dependency is unavailable',
 'The handler cannot complete its work. What it leaves behind is the whole question.', 0),
('REL-001', 2, 'del_hl0817_flaky', 'Attempt 2 — the provider retries the same delivery',
 'The same delivery id, retried. A receiver that recorded attempt 1 as processed will discard this.', 1),

('REL-002', 1, 'del_nw2042_outage', 'Attempt 1 — dependency unavailable', 'The outage begins.', 0),
('REL-002', 2, 'del_nw2042_outage', 'Attempt 2 — dependency still unavailable', 'The provider backs off and retries.', 0),
('REL-002', 3, 'del_nw2042_outage', 'Attempt 3 — dependency still unavailable', 'The outage continues past the point where a fragile receiver has already given up.', 0),
('REL-002', 4, 'del_nw2042_outage', 'Attempt 4 — the dependency is restored',
 'Recovery. Whether this attempt can still commit is what separates a recoverable receiver from a lossy one.', 1),

('REL-003', 1, 'del_hl0818_flaky', 'Attempt 1 — dependency unavailable', 'The failure that prompts the incident.', 0),
('REL-003', 2, 'del_hl0818_flaky', 'Attempt 2 — the provider retries and succeeds', 'Automatic recovery completes.', 1),
('REL-003', 3, 'del_hl0818_replay', 'An operator also replays the event from the dashboard',
 'The same logical event under a new delivery id, sent by hand after the incident.', 1),

('REL-004', 1, 'del_nw2042_outage', 'An unrelated delivery fails', 'The outage affects this delivery only.', 0),
('REL-004', 2, 'del_nw2041_c', 'The unrelated event for NW-2041 is delivered', 'It must be processed normally.', 1),
('REL-004', 3, 'del_nw2042_outage', 'The failing delivery is retried and fails again', 'The failure continues around the healthy event.', 1);

-- Every registered step must name a delivery that exists. The registry holds
-- no foreign key, because the reset path truncates the deliveries table, so
-- the check is made here instead.
do $$
declare missing text;
begin
  select string_agg(distinct s.delivery_id, ', ') into missing
    from synthetic.documented_steps s
    left join synthetic.webhook_deliveries d on d.delivery_id = s.delivery_id
   where d.delivery_id is null;
  if missing is not null then
    raise exception 'documented step(s) reference unknown deliveries: %', missing;
  end if;
end $$;
