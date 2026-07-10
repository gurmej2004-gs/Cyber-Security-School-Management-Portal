// RBAC test: student cannot access /teachers
(async () => {
  const base = 'http://localhost:3000';
  const unique = Math.random().toString(36).slice(2, 8);
  const studentUsername = `stud_${unique}`;
  const studentPassword = 'Passw0rd!1';

  const json = (obj) => ({
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj),
  });

  const getText = async (res) => {
    try { return await res.text(); } catch { return ''; }
  };

  try {
    // Normalize admin password to ensure bcrypt-hashed login works
    try {
      await fetch(`${base}/api/update-password`, {
        method: 'POST',
        ...json({ username: 'admin', newPassword: '1234' }),
      });
      console.log('Admin password normalized');
    } catch (e) {
      console.warn('Warning: could not normalize admin password:', e);
    }

    // 1) Admin login
    let res = await fetch(`${base}/api/login`, {
      method: 'POST',
      ...json({ username: 'admin', password: '1234', role: 'admin' }),
    });
    const adminLogin = await res.json();
    if (!res.ok) throw new Error(`Admin login failed: ${JSON.stringify(adminLogin)}`);
    const adminToken = adminLogin.token;
    console.log('Admin login OK');

    // 2) Create student user (ignore if already exists)
    res = await fetch(`${base}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ username: studentUsername, password: studentPassword, role: 'student' }),
    });
    let createUserText = await getText(res);
    console.log('Create user status:', res.status, createUserText);

    // 3) Student login
    res = await fetch(`${base}/api/login`, {
      method: 'POST',
      ...json({ username: studentUsername, password: studentPassword, role: 'student' }),
    });
    const studentLogin = await res.json();
    if (!res.ok) throw new Error(`Student login failed: ${JSON.stringify(studentLogin)}`);
    const studentToken = studentLogin.token;
    console.log('Student login OK');

    // 4) Attempt to GET /teachers with student token (should be 403)
    res = await fetch(`${base}/teachers`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` },
    });
    const body = await getText(res);
    console.log('GET /teachers as student -> status:', res.status);
    console.log('Response body:', body);

    if (res.status !== 403) {
      console.error('TEST FAILED: Expected 403 Forbidden');
      process.exit(1);
    } else {
      console.log('TEST PASSED: Student is forbidden from /teachers');
    }
  } catch (e) {
    console.error('RBAC test error:', e);
    process.exit(1);
  }
})();
