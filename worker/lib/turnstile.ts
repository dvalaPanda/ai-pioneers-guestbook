import { clientIp } from "./clientIp";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
  hostname?: string;
  challenge_ts?: string;
  action?: string;
  cdata?: string;
}

export async function verifyTurnstile(
  token: string | undefined | null,
  secret: string,
  req: Request,
): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  form.append("remoteip", clientIp(req));
  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body: form });
    if (!res.ok) return false;
    const data = (await res.json()) as TurnstileResponse;
    return Boolean(data.success);
  } catch {
    return false;
  }
}
