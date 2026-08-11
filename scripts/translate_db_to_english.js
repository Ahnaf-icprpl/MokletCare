require('dotenv').config();
const db = require('../db');

async function makeAllEnglish() {
  console.log('Translating database labels and reports to English...');

  // Update dropdown_options labels
  await db.query(`
    UPDATE dropdown_options SET label = 'Classroom' WHERE label LIKE '%Ruang Kelas%';
    UPDATE dropdown_options SET label = 'Computer Lab' WHERE label LIKE '%Ruang Lab%';
    UPDATE dropdown_options SET label = 'Library' WHERE label LIKE '%Perpustakaan%';
    UPDATE dropdown_options SET label = 'Cafeteria / Canteen' WHERE label LIKE '%Kantin%';
    UPDATE dropdown_options SET label = 'Restroom / Bathroom' WHERE label LIKE '%Toilet%';
    UPDATE dropdown_options SET label = 'Sports Field / Gym' WHERE label LIKE '%Lapangan%';
    UPDATE dropdown_options SET label = 'Auditorium' WHERE label LIKE '%Aula%';
    UPDATE dropdown_options SET label = 'Workshop' WHERE label LIKE '%Bengkel%';
    UPDATE dropdown_options SET label = 'Staff / Faculty Room' WHERE label LIKE '%Ruang Guru%';
  `);

  // Update existing reports urgency and damage description if Indonesian
  await db.query(`
    UPDATE reports SET urgency_level = 'High' WHERE urgency_level = 'Darurat / Penting' OR urgency_level = 'high';
    UPDATE reports SET urgency_level = 'Medium' WHERE urgency_level = 'Sedang' OR urgency_level = 'medium';
    UPDATE reports SET urgency_level = 'Low' WHERE urgency_level = 'low';
    
    UPDATE reports SET damage_type = 'Physical Damage' WHERE damage_type = 'Patah / Rusak Fisik';
    UPDATE reports SET damage_type = 'Not Turning On' WHERE damage_type = 'Tidak Menyala';
    UPDATE reports SET damage_type = 'Electrical Short Circuit' WHERE damage_type = 'Korsleting Listrik';
    UPDATE reports SET damage_type = 'Water Leak / Dripping' WHERE damage_type = 'Bocor / Menetes';
    UPDATE reports SET damage_type = 'Hinge Detached' WHERE damage_type = 'Engsel Lepas';
    UPDATE reports SET damage_type = 'Cracked / Fractured' WHERE damage_type = 'Retak';

    UPDATE reports SET room_location = REPLACE(room_location, 'Kelas', 'Class') WHERE room_location LIKE '%Kelas%';
    UPDATE reports SET room_location = REPLACE(room_location, 'Laboratorium', 'Lab') WHERE room_location LIKE '%Laboratorium%';
    UPDATE reports SET room_location = REPLACE(room_location, 'Perpustakaan', 'Library') WHERE room_location LIKE '%Perpustakaan%';
    UPDATE reports SET room_location = REPLACE(room_location, 'Kantin', 'Cafeteria') WHERE room_location LIKE '%Kantin%';
    UPDATE reports SET room_location = REPLACE(room_location, 'Toilet', 'Restroom') WHERE room_location LIKE '%Toilet%';
    UPDATE reports SET room_location = REPLACE(room_location, 'Lapangan', 'Field') WHERE room_location LIKE '%Lapangan%';
    UPDATE reports SET room_location = REPLACE(room_location, 'Aula', 'Auditorium') WHERE room_location LIKE '%Aula%';
    UPDATE reports SET room_location = REPLACE(room_location, 'Bengkel', 'Workshop') WHERE room_location LIKE '%Bengkel%';
    UPDATE reports SET room_location = REPLACE(room_location, 'Lantai', 'Floor') WHERE room_location LIKE '%Lantai%';
    UPDATE reports SET room_location = REPLACE(room_location, 'Utama', 'Main') WHERE room_location LIKE '%Utama%';
  `);

  console.log('✅ Successfully translated all database options and report records to English!');
  process.exit(0);
}

makeAllEnglish().catch(err => {
  console.error('Translation error:', err);
  process.exit(1);
});
