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

const jwtSecret = crypto.randomBytes(32).toString('hex');
const anonKey = makeJWT({ role: 'anon', iss: 'supabase', iat: 1700000000, exp: 2000000000 }, jwtSecret);
const serviceKey = makeJWT({ role: 'service_role', iss: 'supabase', iat: 1700000000, exp: 2000000000 }, jwtSecret);

console.log('\n================ SUPABASE KEYS ================');
console.log('\nJWT_SECRET:\n' + jwtSecret);
console.log('\nANON_KEY:\n' + anonKey);
console.log('\nSERVICE_ROLE_KEY:\n' + serviceKey);
console.log('\n===============================================');
