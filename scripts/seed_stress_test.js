require('dotenv').config();
const db = require('../db');

const SECRET_KEY = process.env.CLERK_SECRET_KEY;

const FIRST_NAMES = ['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fajar', 'Gita', 'Hadi', 'Indah', 'Joko', 'Kartika', 'Lia', 'Maya', 'Nugroho', 'Oscar', 'Putri', 'Rizky', 'Siti', 'Taufik', 'Utami', 'Vina', 'Wawan', 'Yudi', 'Zahra'];
const LAST_NAMES = ['Pratama', 'Santoso', 'Wijaya', 'Kusuma', 'Saputra', 'Hidayat', 'Nugraha', 'Setiawan', 'Utomo', 'Wibowo', 'Firmansyah', 'Suryono', 'Ramadhan', 'Laksana', 'Kurniawan'];
const ROLES = ['reporter', 'reporter', 'reporter', 'reporter', 'staff', 'reporter'];

const FACILITIES = ['Classroom X-RPL 1', 'Classroom XI-TKJ 2', 'Computer Lab 3', 'Library', 'Main Cafeteria', 'Restroom 2nd Floor', 'Sports Field', 'Main Auditorium', 'Technical Workshop'];
const ITEMS = ['Student Desk', 'Student Chair', 'LCD Projector', 'Power Outlet', 'LED Light', 'Ceiling Fan', 'Split AC', 'Wooden Door', 'Glass Window', 'Sink Faucet'];
const DAMAGE_TYPES = ['Physical Damage', 'Not Turning On', 'Electrical Short Circuit', 'Water Leak', 'Broken Hinge', 'Cracked / Fractured'];
const URGENCIES = ['Low', 'Medium', 'High'];
const STATUSES = ['pending', 'in_progress', 'resolved', 'rejected'];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function createOrFetchClerkUser(email, firstName, lastName) {
  if (!SECRET_KEY) return null;
  try {
    const res = await fetch('https://api.clerk.com/v1/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_address: [email],
        skip_password_requirement: true,
        first_name: firstName,
        last_name: lastName,
        public_metadata: { role: 'reporter' }
      })
    });
    const data = await res.json();
    if (res.ok) {
      return { id: data.id, isNew: true };
    } else if (res.status === 422 && data.errors && data.errors[0] && data.errors[0].code === 'form_identifier_exists') {
      // User already exists in Clerk, fetch user list to get ID
      const listRes = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, {
        headers: { 'Authorization': `Bearer ${SECRET_KEY}` }
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        if (Array.isArray(listData) && listData.length > 0) {
          return { id: listData[0].id, isNew: false };
        }
      }
    }
  } catch (err) {
    // Suppress network/rate limit errors
  }
  return null;
}

async function seedStressTest() {
  console.log('🚀 Starting stress test user & report seeding...');

  const TOTAL_USERS = 1000;
  const BATCH_SIZE = 100;
  
  console.log(`Phase 1: Seeding ${TOTAL_USERS} users into PostgreSQL database...`);

  // Clear previous stress test data
  await db.query("DELETE FROM users WHERE email LIKE 'stress_user_%@example.com'");
  await db.query("DELETE FROM reports WHERE reporter_email LIKE 'stress_user_%@example.com'");

  let createdUsers = 0;
  for (let i = 0; i < TOTAL_USERS; i += BATCH_SIZE) {
    const values = [];
    const params = [];
    let paramIdx = 1;

    for (let j = 0; j < BATCH_SIZE && (i + j) < TOTAL_USERS; j++) {
      const userIndex = i + j + 1;
      const id = `user_stress_${String(userIndex).padStart(4, '0')}`;
      const firstName = getRandomElement(FIRST_NAMES);
      const lastName = getRandomElement(LAST_NAMES);
      const name = `${firstName} ${lastName}`;
      const email = `stress_user_${userIndex}@example.com`;
      const role = getRandomElement(ROLES);

      values.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
      params.push(id, email, name, role);
      createdUsers++;
    }

    const query = `
      INSERT INTO users (id, email, name, role)
      VALUES ${values.join(', ')}
      ON CONFLICT (id) DO NOTHING;
    `;
    await db.query(query, params);
  }

  console.log(`✅ Successfully seeded ${createdUsers} users in PostgreSQL.`);

  console.log(`Phase 2: Seeding ${TOTAL_USERS} sample damage reports for load testing...`);
  
  let createdReports = 0;
  for (let i = 0; i < TOTAL_USERS; i += BATCH_SIZE) {
    const values = [];
    const params = [];
    let paramIdx = 1;

    for (let j = 0; j < BATCH_SIZE && (i + j) < TOTAL_USERS; j++) {
      const userIndex = i + j + 1;
      const reporterName = `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;
      const reporterEmail = `stress_user_${userIndex}@example.com`;
      const room = getRandomElement(FACILITIES);
      const facility = 'Fasilitas Belajar';
      const item = getRandomElement(ITEMS);
      const damageType = getRandomElement(DAMAGE_TYPES);
      const urgency = getRandomElement(URGENCIES);
      const desc = `Laporan kerusakan ${item} di ${room}. Kondisi ${damageType}. Mohon penanganan segera.`;
      const photo = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
      const status = getRandomElement(STATUSES);

      values.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, '', $${paramIdx++}, $${paramIdx++})`);
      params.push(reporterName, reporterEmail, room, facility, item, damageType, urgency, desc, photo, status);
      createdReports++;
    }

    const query = `
      INSERT INTO reports (reporter_name, reporter_email, room_location, facility_type, item_type, damage_type, urgency_level, damage_description, damage_cause, photo_path, status)
      VALUES ${values.join(', ')};
    `;
    await db.query(query, params);
  }

  console.log(`✅ Successfully seeded ${createdReports} facility damage reports in PostgreSQL.`);

  console.log(`Phase 3: Synchronizing & registering batch users with Clerk REST API...`);
  let clerkNewCount = 0;
  let clerkSyncedCount = 0;

  for (let i = 1; i <= 30; i++) {
    const email = `stress_user_${i}@example.com`;
    const result = await createOrFetchClerkUser(email, 'StressUser', `${i}`);
    if (result) {
      if (result.isNew) clerkNewCount++;
      else clerkSyncedCount++;

      // Update PostgreSQL user record with real Clerk ID
      await db.query('UPDATE users SET id = $1 WHERE email = $2', [result.id, email]);
    }
  }
  console.log(`✅ Clerk REST API sync complete: ${clerkNewCount} new users created, ${clerkSyncedCount} existing users synchronized.`);

  console.log('\n🎉 Stress testing dataset setup complete!');
  console.log(`- 1,000 Users populated in PostgreSQL 'users' table`);
  console.log(`- 1,000 Reports populated in PostgreSQL 'reports' table`);
  console.log(`- Clerk Cloud API Users linked to PostgreSQL`);

  process.exit(0);
}

seedStressTest().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
