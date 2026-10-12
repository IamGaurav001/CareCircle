// Plain PayPal REST client with no Next.js or env dependencies, so scripts can use it too.

// Sandbox only. Pooled money for real people needs legal advice first (see the plan doc).
const BASE_URL = "https://api-m.sandbox.paypal.com";

export type PaypalCredentials = { clientId: string; clientSecret: string };

export type PaypalRequest = { method?: string; body?: unknown; requestId?: string };

export type PaypalClient = ReturnType<typeof createPaypalClient>;

export class PaypalError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: unknown,
  ) {
    super(message);
  }
}

export function createPaypalClient({ clientId, clientSecret }: PaypalCredentials) {
  let cachedToken: { value: string; expiresAt: number } | null = null;

  async function getAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.value;

    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) {
      throw new PaypalError(`PayPal token request failed with ${res.status}`, res.status, await readBody(res));
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return cachedToken.value;
  }

  /**
   * Calls the PayPal REST API. Pass a stable requestId on every write (order capture)
   * so a retry is recognised by PayPal and cannot move money twice.
   */
  async function request<T>(path: string, init: PaypalRequest = {}): Promise<T> {
    const method = init.method ?? "GET";
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
        "Content-Type": "application/json",
        ...(init.requestId ? { "PayPal-Request-Id": init.requestId } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    if (!res.ok) {
      throw new PaypalError(`PayPal ${method} ${path} failed with ${res.status}`, res.status, await readBody(res));
    }
    return (await readBody(res)) as T;
  }

  return { getAccessToken, request };
}

/** Asks PayPal whether a webhook really came from PayPal for our webhook id. */
export async function verifyWebhookSignature(
  client: PaypalClient,
  webhookId: string,
  headers: Headers,
  event: unknown,
): Promise<boolean> {
  const result = await client.request<{ verification_status: string }>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: {
        auth_algo: headers.get("paypal-auth-algo"),
        cert_url: headers.get("paypal-cert-url"),
        transmission_id: headers.get("paypal-transmission-id"),
        transmission_sig: headers.get("paypal-transmission-sig"),
        transmission_time: headers.get("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: event,
      },
    },
  );
  return result.verification_status === "SUCCESS";
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
