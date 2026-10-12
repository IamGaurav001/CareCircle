// PayPal sandbox payout test (tab 3 of the plan doc).
//
// Usage: npm run paypal:test -- <step> [args]
//   token                     check the sandbox credentials in .env.local
//   order [amount]            create a contribution order; open the printed link and pay as the sandbox buyer
//   capture                   capture that order, then retry with the same request id (must not charge twice)
//   payout <email> [amount]   pay the India sandbox account, then reuse the batch id (must be refused)
//   status                    show whether the payout reached the India account
//
// Amounts are USD. Progress is kept in scripts/.paypal-test-state.json between steps.

import { loadEnvConfig } from "@next/env";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createPaypalClient, PaypalError } from "../src/lib/paypal/rest";

loadEnvConfig(process.cwd());

type State = {
  orderId?: string;
  captureRequestId?: string;
  captureId?: string;
  senderBatchId?: string;
  payoutBatchId?: string;
};

type Order = { id: string; status: string; links: { rel: string; href: string }[] };

type CapturedOrder = {
  id: string;
  status: string;
  purchase_units: {
    payments: { captures: { id: string; status: string; amount: { value: string; currency_code: string } }[] };
  }[];
};

type PayoutCreated = { batch_header: { payout_batch_id: string; batch_status: string } };

type PayoutBatch = {
  batch_header: { payout_batch_id: string; batch_status: string };
  items: {
    payout_item_id: string;
    transaction_status: string;
    payout_item: { receiver: string; amount: { value: string; currency: string } };
    errors?: { name: string; message: string };
  }[];
};

const STATE_FILE = "scripts/.paypal-test-state.json";

function loadState(): State {
  return existsSync(STATE_FILE) ? (JSON.parse(readFileSync(STATE_FILE, "utf8")) as State) : {};
}

function saveState(update: State) {
  writeFileSync(STATE_FILE, JSON.stringify({ ...loadState(), ...update }, null, 2) + "\n");
}

function pass(message: string) {
  console.log(`PASS  ${message}`);
}

function fail(message: string) {
  console.log(`FAIL  ${message}`);
  process.exitCode = 1;
}

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.error("Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.local first (see .env.example).");
  process.exit(1);
}
const paypal = createPaypalClient({ clientId: PAYPAL_CLIENT_ID, clientSecret: PAYPAL_CLIENT_SECRET });

async function token() {
  await paypal.getAccessToken();
  pass("sandbox credentials work");
}

async function order([amount = "10.00"]: string[]) {
  const created = await paypal.request<Order>("/v2/checkout/orders", {
    method: "POST",
    requestId: randomUUID(),
    body: {
      intent: "CAPTURE",
      purchase_units: [
        { amount: { currency_code: "USD", value: amount }, description: "CareCircle test contribution" },
      ],
    },
  });
  saveState({ orderId: created.id, captureRequestId: undefined, captureId: undefined });

  pass(`order ${created.id} created for ${amount} USD (${created.status})`);
  const approve = created.links.find((link) => link.rel === "approve")?.href;
  console.log(`\nOpen this link, log in as the sandbox BUYER account and pay, then run "capture":\n${approve}`);
}

async function capture() {
  const state = loadState();
  if (!state.orderId) return fail('no order yet; run "order" first');

  // One request id per order, kept across runs, so every retry is the same capture to PayPal.
  const requestId = state.captureRequestId ?? randomUUID();
  saveState({ captureRequestId: requestId });

  const path = `/v2/checkout/orders/${state.orderId}/capture`;
  const first = await paypal.request<CapturedOrder>(path, { method: "POST", requestId });
  const captured = first.purchase_units[0].payments.captures[0];
  saveState({ captureId: captured.id });

  if (first.status === "COMPLETED") {
    pass(`captured ${captured.amount.value} ${captured.amount.currency_code} (capture ${captured.id})`);
  } else {
    fail(`order status is ${first.status}, capture status is ${captured.status}`);
  }

  const retry = await paypal.request<CapturedOrder>(path, { method: "POST", requestId });
  const retried = retry.purchase_units[0].payments.captures[0];
  if (retried.id === captured.id) {
    pass("retry with the same request id returned the same capture (no double charge)");
  } else {
    fail(`retry created a different capture ${retried.id}`);
  }
}

async function payout([receiver, amount = "5.00"]: string[]) {
  if (!receiver) return fail("give the India sandbox account's email: payout <email> [amount]");

  const senderBatchId = `carecircle-test-${Date.now()}`;
  const body = {
    sender_batch_header: { sender_batch_id: senderBatchId, email_subject: "CareCircle test payout" },
    items: [
      {
        recipient_type: "EMAIL",
        receiver,
        amount: { value: amount, currency: "USD" },
        note: "CareCircle sandbox payout test",
        sender_item_id: "test-item-1",
      },
    ],
  };

  const created = await paypal.request<PayoutCreated>("/v1/payments/payouts", { method: "POST", body });
  saveState({ senderBatchId, payoutBatchId: created.batch_header.payout_batch_id });
  pass(`payout of ${amount} USD to ${receiver} sent (batch ${created.batch_header.payout_batch_id}, ${created.batch_header.batch_status})`);

  // Reusing the batch id must be refused, so a retried release can never pay twice.
  try {
    await paypal.request<PayoutCreated>("/v1/payments/payouts", { method: "POST", body });
    fail("PayPal accepted the same sender_batch_id twice");
  } catch (error) {
    if (!(error instanceof PaypalError) || error.status >= 500) throw error;
    const name = (error.details as { name?: string } | null)?.name ?? error.status;
    pass(`second payout with the same batch id was refused (${name})`);
  }

  console.log('\nWait a minute, then run "status" to see whether the money arrived.');
}

async function status() {
  const state = loadState();
  if (!state.payoutBatchId) return fail('no payout yet; run "payout" first');

  const batch = await paypal.request<PayoutBatch>(`/v1/payments/payouts/${state.payoutBatchId}`);
  console.log(`Batch ${batch.batch_header.payout_batch_id}: ${batch.batch_header.batch_status}`);

  for (const item of batch.items) {
    const line = `${item.payout_item.amount.value} ${item.payout_item.amount.currency} to ${item.payout_item.receiver}: ${item.transaction_status}`;
    if (item.transaction_status === "SUCCESS") pass(line);
    else if (["PENDING", "UNCLAIMED", "ONHOLD", "NEW"].includes(item.transaction_status)) console.log(`WAIT  ${line}`);
    else fail(`${line}${item.errors ? ` (${item.errors.name}: ${item.errors.message})` : ""}`);
  }
}

const steps: Record<string, (args: string[]) => Promise<void>> = { token, order, capture, payout, status };

const [step, ...args] = process.argv.slice(2);
const run = steps[step ?? ""];
if (!run) {
  console.log("Usage: npm run paypal:test -- <token | order [amount] | capture | payout <email> [amount] | status>");
  process.exit(1);
}

run(args).catch((error: unknown) => {
  if (error instanceof PaypalError) {
    console.error(`FAIL  ${error.message}`);
    console.error(JSON.stringify(error.details, null, 2));
  } else {
    console.error(error);
  }
  process.exit(1);
});
