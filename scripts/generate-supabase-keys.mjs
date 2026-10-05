import crypto from 'crypto';

function base64url(str) {
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function makeJWT(payload, secret) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret).update(header + '.' + body).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return header + '.' + body + '.' + signature;
}

// Hex only, so values are safe to embed in connection URIs.
const secret = (bytes) => crypto.randomBytes(bytes).toString('hex');

const jwtSecret = secret(32);
const anonKey = makeJWT({ role: 'anon', iss: 'supabase', iat: 1700000000, exp: 2000000000 }, jwtSecret);
const serviceKey = makeJWT({ role: 'service_role', iss: 'supabase', iat: 1700000000, exp: 2000000000 }, jwtSecret);

// Paste this block into Railway → Project Settings → Shared Variables → Raw Editor.
console.log('\n================ SUPABASE KEYS ================\n');
console.log(`POSTGRES_PASSWORD=${secret(24)}`);
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ANON_KEY=${anonKey}`);
console.log(`SERVICE_ROLE_KEY=${serviceKey}`);
console.log(`PG_META_CRYPTO_KEY=${secret(32)}`);
console.log(`DASHBOARD_USERNAME=supabase`);
console.log(`DASHBOARD_PASSWORD=${secret(16)}`);
console.log('\n===============================================');
