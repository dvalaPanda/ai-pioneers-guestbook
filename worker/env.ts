/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  RATE_LIMITER_VISITORS: RateLimit;
  RATE_LIMITER_NOTES: RateLimit;
  TURNSTILE_SECRET_KEY: string;
  TURNSTILE_SITE_KEY: string;
}
