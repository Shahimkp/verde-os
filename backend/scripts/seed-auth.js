const supabase = require('../src/config/supabase');

async function seed() {
  const email = process.env.AUTH_SEED_EMAIL;
  const password = process.env.AUTH_SEED_PASSWORD;
  const name = process.env.AUTH_SEED_NAME || 'Admin User';

  if (!email || !password) {
    console.error('Error: AUTH_SEED_EMAIL and AUTH_SEED_PASSWORD environment variables are required.');
    process.exit(1);
  }

  console.log('--- Starting Auth Seed ---');

  // 1. Create or fetch Auth user
  let userId;
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing auth users:', listError);
    process.exit(1);
  }

  const existingAuthUser = existingUsers.users.find(u => u.email === email);
  
  if (existingAuthUser) {
    console.log(`Auth user ${email} already exists.`);
    userId = existingAuthUser.id;
    // Ensure password is correct
    await supabase.auth.admin.updateUserById(userId, { password });
  } else {
    const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });
    
    if (createError) {
      console.error('Error creating auth user:', createError);
      process.exit(1);
    }
    userId = newAuthUser.user.id;
    console.log(`Created new Auth user ${email}`);
  }

  // 2. Ensure public.users record
  const { data: existingUser } = await supabase.from('users').select('id').eq('id', userId).single();
  if (!existingUser) {
    const { error: insertUserError } = await supabase.from('users').insert([{
      id: userId,
      email,
      name,
      initials: 'AU',
      avatar_bg: 'var(--primary)',
      is_active: true
    }]);
    if (insertUserError) {
      console.error('Error inserting public.users:', insertUserError);
      process.exit(1);
    }
    console.log(`Inserted public.users record.`);
  }

  // 3. Ensure Organization
  let orgId;
  const { data: orgs } = await supabase.from('organizations').select('id').eq('name', 'Verde Labs').limit(1);
  if (orgs && orgs.length > 0) {
    orgId = orgs[0].id;
  } else {
    const { data: newOrg, error: orgError } = await supabase.from('organizations').insert([{
      name: 'Verde Labs'
    }]).select().single();
    if (orgError) {
      console.error('Error creating organization:', orgError);
      process.exit(1);
    }
    orgId = newOrg.id;
    console.log(`Created organization Verde Labs`);
  }

  // 4. Ensure Role
  let roleId;
  const { data: roles } = await supabase.from('roles').select('id').eq('name', 'Admin').limit(1);
  if (roles && roles.length > 0) {
    roleId = roles[0].id;
  } else {
    const { data: newRole, error: roleError } = await supabase.from('roles').insert([{
      name: 'Admin'
    }]).select().single();
    if (roleError) {
      console.error('Error creating role Admin:', roleError);
      process.exit(1);
    }
    roleId = newRole.id;
    console.log(`Created role Admin`);
  }

  // 5. Ensure Organization Member
  const { data: existingMember } = await supabase.from('organization_members')
    .select('*')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .single();

  if (!existingMember) {
    const { error: memberError } = await supabase.from('organization_members').insert([{
      organization_id: orgId,
      user_id: userId,
      role_id: roleId,
      department: 'Management',
      status: 'Active'
    }]);
    if (memberError) {
      console.error('Error assigning member to org:', memberError);
      process.exit(1);
    }
    console.log(`Assigned user to organization.`);
  }

  console.log('--- Seed Complete ---');
  console.log('Auth seed complete. Credentials were supplied through environment variables.');
  process.exit(0);
}

seed();
