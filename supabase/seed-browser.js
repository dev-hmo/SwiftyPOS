/**
 * SEED SCRIPT — Run in browser console at http://localhost:5173
 *
 * Prerequisites:
 *   1. Disable email confirmation in Supabase Dashboard → Authentication → Providers → Email
 *   2. Make sure all migrations are applied
 *
 * Open DevTools (F12) → Console → paste this entire script → Enter
 */

const SUPABASE_URL = 'https://geqdhromaqvzojbsxctt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nwvybyFsbjJzjGfV4HmgzA_fpH-PVJE';

const headers = {
  apikey: SUPABASE_KEY,
  'Content-Type': 'application/json',
};

async function signUp(email, password) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password }),
  });
  const d = await r.json();
  if (d.id) console.log(`  ✅ Created ${email} (id: ${d.id})`);
  else console.log(`  ❌ ${email}: ${d.msg || d.code}`);
  return d;
}

async function signIn(email, password) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password }),
  });
  return r.json();
}

async function rpc(token, fn, params) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { ...headers, Authorization: `Bearer ${token}` },
    body: JSON.stringify(params),
  });
  return r.json();
}

async function rest(token, method, path, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...headers, Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}

async function main() {
  console.log('🚀 Setting up test accounts...\n');

  // Step 1: Sign up all 3 users
  console.log('1. Creating users...');
  const sa = await signUp('superadmin@swiftypos.com', 'admin123');
  await new Promise(r => setTimeout(r, 1000));
  const ad = await signUp('admin@demo.com', 'admin123');
  await new Promise(r => setTimeout(r, 1000));
  const ca = await signUp('cashier@demo.com', 'admin123');
  await new Promise(r => setTimeout(r, 1000));

  // Step 2: Sign in as admin to create workspace
  console.log('\n2. Setting up admin workspace...');
  const adminLogin = await signIn('admin@demo.com', 'admin123');
  if (!adminLogin.access_token) {
    console.error('  ❌ Admin login failed:', adminLogin.msg);
    console.log('  Make sure email confirmation is OFF in Supabase Dashboard');
    return;
  }
  const adminToken = adminLogin.access_token;

  // Create tenant via RPC
  const tenantId = await rpc(adminToken, 'create_tenant_for_signup', {
    p_name: 'Demo Coffee Shop',
    p_slug: 'demo-coffee-shop',
  });
  console.log('  Tenant created:', tenantId);

  // Step 3: Get cashier user ID from auth
  const cashierLogin = await signIn('cashier@demo.com', 'admin123');
  if (!cashierLogin.access_token) {
    console.error('  ❌ Cashier login failed:', cashierLogin.msg);
    return;
  }

  // Step 4: Sign in as cashier to create their own tenant (we'll delete it later)
  // Cashier signup already created a tenant, now move them to admin's tenant

  // Step 5: Query admin's user_tenants to get the IDs we need
  const memberships = await rest(adminToken, 'GET', 'user_tenants?select=*');
  console.log('  Memberships:', memberships);

  // We need to use SQL for the role changes since REST can't do it easily with RLS
  console.log('\n3. Done! Now run this SQL in Supabase SQL Editor:');
  console.log(`
-- Get user IDs and fix roles
DO $$
DECLARE
  sa_id UUID;
  ad_id UUID;
  ca_id UUID;
  ad_tenant UUID;
  ca_tenant UUID;
BEGIN
  SELECT id INTO sa_id FROM auth.users WHERE email = 'superadmin@swiftypos.com';
  SELECT id INTO ad_id FROM auth.users WHERE email = 'admin@demo.com';
  SELECT id INTO ca_id FROM auth.users WHERE email = 'cashier@demo.com';
  SELECT tenant_id INTO ad_tenant FROM user_tenants WHERE user_id = ad_id LIMIT 1;
  SELECT tenant_id INTO ca_tenant FROM user_tenants WHERE user_id = ca_id LIMIT 1;

  -- Super admin: remove tenant membership, add to super_admins
  DELETE FROM user_tenants WHERE user_id = sa_id;
  INSERT INTO super_admins (user_id) VALUES (sa_id) ON CONFLICT DO NOTHING;

  -- Cashier: move to admin's tenant
  DELETE FROM user_tenants WHERE user_id = ca_id;
  INSERT INTO user_tenants (user_id, tenant_id, role, is_active)
  VALUES (ca_id, ad_tenant, 'cashier', true)
  ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = 'cashier', is_active = true;

  -- Delete orphan tenants
  DELETE FROM tenants WHERE id = ca_tenant AND id != ad_tenant;

  RAISE NOTICE 'Done!';
END $$;
  `);

  console.log('\n4. After running the SQL above, login with:');
  console.log('   Super Admin: superadmin@swiftypos.com / admin123 → /super-admin');
  console.log('   Admin:       admin@demo.com / admin123 → /admin');
  console.log('   Cashier:     cashier@demo.com / admin123 → /pos');
}

main().catch(console.error);
