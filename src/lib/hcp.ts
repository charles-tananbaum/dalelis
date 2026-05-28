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
  mobile_number?: string;
  addresses: HcpAddress[];
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
  const res = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  await assertOk(res, 'createCustomer');

  const data = (await res.json()) as { id: string };
  return data.id;
}

/**
 * Adds a note to an existing HousecallPro customer record via PUT.
 * Throws HcpApiError on non-2xx response.
 */
export async function addNoteToCustomer(customerId: string, note: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/customers/${customerId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ notes: note }),
  });

  await assertOk(res, 'addNoteToCustomer');
}

/**
 * Finds an HCP customer by email address.
 * Returns the first matching customer ID, or null if not found or on error.
 * Never throws.
 */
export async function findCustomerByEmail(email: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/customers?email=${encodeURIComponent(email)}&page_size=1`,
      { headers: authHeaders() },
    );
    if (!res.ok) {
      const body = await res.text();
      console.error(`[hcp] findCustomerByEmail failed with status ${res.status}: ${body}`);
      return null;
    }
    const data = (await res.json()) as { customers: { id: string }[] };
    return data.customers[0]?.id ?? null;
  } catch (err) {
    console.error('[hcp] findCustomerByEmail error:', err);
    return null;
  }
}

/**
 * Updates an HCP customer's tags by removing and adding specified values.
 * Fetches current tags, computes the new set, then PATCHes the customer.
 * Never throws — logs errors and returns silently.
 */
export async function updateCustomerTags(
  customerId: string,
  removeTags: string[],
  addTags: string[],
): Promise<void> {
  try {
    const getRes = await fetch(`${BASE_URL}/customers/${customerId}`, {
      headers: authHeaders(),
    });
    if (!getRes.ok) {
      const body = await getRes.text();
      console.error(`[hcp] updateCustomerTags GET failed with status ${getRes.status}: ${body}`);
      return;
    }
    const customer = (await getRes.json()) as { tags: string[] };
    const currentTags: string[] = customer.tags ?? [];

    const removeSet = new Set(removeTags);
    const filtered = currentTags.filter((t) => !removeSet.has(t));
    const merged = Array.from(new Set([...filtered, ...addTags]));

    const patchRes = await fetch(`${BASE_URL}/customers/${customerId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ tags: merged }),
    });
    if (!patchRes.ok) {
      const body = await patchRes.text();
      console.error(`[hcp] updateCustomerTags PATCH failed with status ${patchRes.status}: ${body}`);
    }
  } catch (err) {
    console.error('[hcp] updateCustomerTags error:', err);
  }
}
