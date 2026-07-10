const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

// Same encryption configuration as in app.js
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Use the same fixed encryption key as app.js
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ? 
    Buffer.from(process.env.ENCRYPTION_KEY, 'hex') : 
    Buffer.from('a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', 'hex');

// Helper function to encrypt text (same as app.js)
function encrypt(text) {
    if (!text) return text;
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Helper function to check if text is already encrypted
function isEncrypted(text) {
    if (!text || typeof text !== 'string') return false;
    return text.includes(':') && /^[a-f0-9]+:[a-f0-9]+$/i.test(text);
}

console.log('=== DATABASE ENCRYPTION MIGRATION ===\n');

const db = new sqlite3.Database('./school.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        return;
    }
    console.log('✓ Connected to school.db database\n');
    
    // Migrate students table
    console.log('1. MIGRATING STUDENTS TABLE...');
    console.log('=' .repeat(50));
    
    db.all('SELECT * FROM students', [], (err, students) => {
        if (err) {
            console.error('Error fetching students:', err.message);
            return;
        }
        
        console.log(`Found ${students.length} students to process`);
        
        let studentsUpdated = 0;
        let studentsProcessed = 0;
        
        students.forEach((student) => {
            const needsEncryption = {
                name: !isEncrypted(student.name),
                age: student.age && !isEncrypted(student.age.toString()),
                grade: student.grade && !isEncrypted(student.grade)
            };
            
            if (needsEncryption.name || needsEncryption.age || needsEncryption.grade) {
                console.log(`  Encrypting Student ID ${student.id}: ${student.name}`);
                
                const encryptedName = needsEncryption.name ? encrypt(student.name) : student.name;
                const encryptedAge = needsEncryption.age ? encrypt(student.age.toString()) : student.age;
                const encryptedGrade = needsEncryption.grade ? encrypt(student.grade) : student.grade;
                
                const updateSql = 'UPDATE students SET name = ?, age = ?, grade = ? WHERE id = ?';
                db.run(updateSql, [encryptedName, encryptedAge, encryptedGrade, student.id], function(err) {
                    if (err) {
                        console.error(`    ❌ Error updating student ${student.id}:`, err.message);
                    } else {
                        console.log(`    ✓ Student ${student.id} encrypted successfully`);
                        studentsUpdated++;
                    }
                    
                    studentsProcessed++;
                    if (studentsProcessed === students.length) {
                        console.log(`\n✓ Students migration complete: ${studentsUpdated}/${students.length} updated\n`);
                        migrateTeachers();
                    }
                });
            } else {
                console.log(`  Student ID ${student.id}: Already encrypted`);
                studentsProcessed++;
                if (studentsProcessed === students.length) {
                    console.log(`\n✓ Students migration complete: ${studentsUpdated}/${students.length} updated\n`);
                    migrateTeachers();
                }
            }
        });
        
        if (students.length === 0) {
            console.log('No students found to migrate\n');
            migrateTeachers();
        }
    });
    
    function migrateTeachers() {
        console.log('2. MIGRATING TEACHERS TABLE...');
        console.log('=' .repeat(50));
        
        db.all('SELECT * FROM teachers', [], (err, teachers) => {
            if (err) {
                console.error('Error fetching teachers:', err.message);
                return;
            }
            
            console.log(`Found ${teachers.length} teachers to process`);
            
            let teachersUpdated = 0;
            let teachersProcessed = 0;
            
            teachers.forEach((teacher) => {
                const needsEncryption = {
                    name: !isEncrypted(teacher.name),
                    subject: teacher.subject && !isEncrypted(teacher.subject),
                    experience: teacher.experience && !isEncrypted(teacher.experience.toString())
                };
                
                if (needsEncryption.name || needsEncryption.subject || needsEncryption.experience) {
                    console.log(`  Encrypting Teacher ID ${teacher.id}: ${teacher.name}`);
                    
                    const encryptedName = needsEncryption.name ? encrypt(teacher.name) : teacher.name;
                    const encryptedSubject = needsEncryption.subject ? encrypt(teacher.subject) : teacher.subject;
                    const encryptedExperience = needsEncryption.experience ? encrypt(teacher.experience.toString()) : teacher.experience;
                    
                    const updateSql = 'UPDATE teachers SET name = ?, subject = ?, experience = ? WHERE id = ?';
                    db.run(updateSql, [encryptedName, encryptedSubject, encryptedExperience, teacher.id], function(err) {
                        if (err) {
                            console.error(`    ❌ Error updating teacher ${teacher.id}:`, err.message);
                        } else {
                            console.log(`    ✓ Teacher ${teacher.id} encrypted successfully`);
                            teachersUpdated++;
                        }
                        
                        teachersProcessed++;
                        if (teachersProcessed === teachers.length) {
                            console.log(`\n✓ Teachers migration complete: ${teachersUpdated}/${teachers.length} updated\n`);
                            completeMigration();
                        }
                    });
                } else {
                    console.log(`  Teacher ID ${teacher.id}: Already encrypted`);
                    teachersProcessed++;
                    if (teachersProcessed === teachers.length) {
                        console.log(`\n✓ Teachers migration complete: ${teachersUpdated}/${teachers.length} updated\n`);
                        completeMigration();
                    }
                }
            });
            
            if (teachers.length === 0) {
                console.log('No teachers found to migrate\n');
                completeMigration();
            }
        });
    }
    
    function completeMigration() {
        console.log('3. VERIFICATION...');
        console.log('=' .repeat(50));
        
        // Verify encryption worked
        db.all('SELECT * FROM students LIMIT 3', [], (err, students) => {
            if (err) {
                console.error('Error verifying students:', err.message);
                return;
            }
            
            console.log('Sample encrypted students:');
            students.forEach((student, index) => {
                console.log(`  Student ${index + 1}:`);
                console.log(`    Name: ${student.name.substring(0, 50)}${student.name.length > 50 ? '...' : ''}`);
                console.log(`    Age: ${student.age}`);
                console.log(`    Grade: ${student.grade}`);
                console.log(`    Encrypted: ${isEncrypted(student.name) ? '✓' : '❌'}`);
                console.log('');
            });
            
            db.all('SELECT * FROM teachers LIMIT 2', [], (err, teachers) => {
                if (err) {
                    console.error('Error verifying teachers:', err.message);
                    return;
                }
                
                console.log('Sample encrypted teachers:');
                teachers.forEach((teacher, index) => {
                    console.log(`  Teacher ${index + 1}:`);
                    console.log(`    Name: ${teacher.name.substring(0, 50)}${teacher.name.length > 50 ? '...' : ''}`);
                    console.log(`    Subject: ${teacher.subject}`);
                    console.log(`    Experience: ${teacher.experience}`);
                    console.log(`    Encrypted: ${isEncrypted(teacher.name) ? '✓' : '❌'}`);
                    console.log('');
                });
                
                console.log('🔒 MIGRATION COMPLETE!');
                console.log('✓ All existing data has been encrypted');
                console.log('✓ Database is now secure');
                console.log('✓ Frontend will automatically decrypt data for display');
                console.log('\nRestart your server to see the changes in action!');
                
                db.close();
            });
        });
    }
});
