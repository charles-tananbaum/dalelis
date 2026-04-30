/**
 * HousecallPro API client.
 * Docs: https://developer.housecallpro.com/
 *
 * All functions use native fetch with Bearer token auth.
 * Non-2xx responses throw an HcpApiError with the status code and body.
 */

const BASE_URL = 'https://api.housecallpro.com';

export interface HcpAddress {
  street: string;
  street_line_2?: string;
  city: string;
  state: string;
  zip: string;
  type: 'service';
}

export interface HcpCustomerPayload {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  addresses: HcpAddress[];
  lead_source?: string;
  tags?: string[];
  notifications_enabled: boolean;
}

export class HcpApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    message: string,
  ) {
    super(message);
    this.name = 'HcpApiError';
  }
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Token ${import.meta.env.HCP_API_KEY as string}`,
    'Content-Type': 'application/json',
  };
}

async function assertOk(res: Response, context: string): Promise<void> {
  if (!res.ok) {
    const body = await res.text();
    throw new HcpApiError(
      res.status,
      body,
      `HCP ${context} failed with status ${res.status}: ${body}`,
    );
  }
}

/**
 * Creates a new customer in HousecallPro.
 * Throws HcpApiError on non-2xx response.
 *
 * @returns The newly created customer's HCP ID string.
 */
export async function createCustomer(payload: HcpCustomerPayload): Promise<string> {
  const res = await fetch(`${BASE_URL}/v1/customers`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  await assertOk(res, 'createCustomer');

  const data = (await res.json()) as { id: string };
  return data.id;
}

/**
 * Adds a note to an existing HousecallPro customer record.
 * Throws HcpApiError on non-2xx response.
 */
export async function addNoteToCustomer(customerId: string, note: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/v1/customers/${customerId}/notes`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ note }),
  });

  await assertOk(res, 'addNoteToCustomer');
}
