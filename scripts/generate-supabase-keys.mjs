// Generates a JWT_SECRET and the matching ANON_KEY / SERVICE_ROLE_KEY pair
// for a self-hosted Supabase stack (e.g. the Railway deployment).
//
// Usage:
//   node scripts/generate-supabase-keys.mjs                  # new secret + keys
//   node scripts/generate-supabase-keys.mjs <existing-secret> # re-sign keys with an existing secret

import crypto from "node:crypto";

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function signJWT(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

const jwtSecret =
  process.argv[2] ??
  crypto.randomBytes(32).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 40);

const iat = Math.floor(Date.now() / 1000);
const exp = iat + 10 * 365 * 24 * 60 * 60; // 10 years, matches Supabase's own setup script

const anonKey = signJWT({ role: "anon", iss: "supabase", iat, exp }, jwtSecret);
const serviceRoleKey = signJWT({ role: "service_role", iss: "supabase", iat, exp }, jwtSecret);

console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ANON_KEY=${anonKey}`);
console.log(`SERVICE_ROLE_KEY=${serviceRoleKey}`);
