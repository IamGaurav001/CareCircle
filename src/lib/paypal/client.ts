import "server-only";
import { z } from "zod";
import { createPaypalClient, verifyWebhookSignature, type PaypalClient, type PaypalRequest } from "./rest";

// PayPal settings are checked here rather than in lib/env, so PayPal works before the
// database is set up. Checked on first use, so `next build` does not need the keys.
const schema = z.object({
  PAYPAL_CLIENT_ID: z.string().min(1),
  PAYPAL_CLIENT_SECRET: z.string().min(1),
  PAYPAL_WEBHOOK_ID: z.string().min(1),
});

let setup: { client: PaypalClient; webhookId: string } | undefined;

function getSetup() {
  if (!setup) {
    const env = schema.parse(process.env);
    setup = {
      client: createPaypalClient({ clientId: env.PAYPAL_CLIENT_ID, clientSecret: env.PAYPAL_CLIENT_SECRET }),
      webhookId: env.PAYPAL_WEBHOOK_ID,
    };
  }
  return setup;
}

export function paypalRequest<T>(path: string, init?: PaypalRequest): Promise<T> {
  return getSetup().client.request<T>(path, init);
}

export function verifyWebhook(headers: Headers, event: unknown): Promise<boolean> {
  const { client, webhookId } = getSetup();
  return verifyWebhookSignature(client, webhookId, headers, event);
}
