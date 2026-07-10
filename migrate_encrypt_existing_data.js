const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
require('dotenv').config();

// AES Encryption Configuration (same as app.js)
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ? 
    Buffer.from(process.env.ENCRYPTION_KEY, 'hex') : 
    Buffer.from('a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', 'hex');

// Helper function to encrypt text
function encrypt(text) {
    if (!text) return text;
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Helper function to check if text is already encrypted (contains ':' separator)
function isEncrypted(text) {
    return text && typeof text === 'string' && text.includes(':') && text.split(':').length === 2;
}

// Migration script to encrypt existing unencrypted data
async function migrateEncryptExistingData() {
    console.log('='.repeat(60));
    console.log('DATABASE ENCRYPTION MIGRATION SCRIPT');
    console.log('='.repeat(60));
    
    const db = new sqlite3.Database('school.db');
    
    try {
        let studentsUpdated = 0;
        let teachersUpdated = 0;
        
        // Migrate Students Table
        console.log('\n1. Migrating Students Table:');
        console.log('-'.repeat(40));
        
        await new Promise((resolve, reject) => {
            db.all('SELECT * FROM students', [], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                console.log(`Found ${rows.length} student records to check`);
                
                let processedCount = 0;
                
                if (rows.length === 0) {
                    resolve();
                    return;
                }
                
                rows.forEach((row) => {
                    let needsUpdate = false;
                    let updates = {};
                    
                    // Check and encrypt name
                    if (row.name && !isEncrypted(row.name)) {
                        updates.name = encrypt(row.name);
                        needsUpdate = true;
                        console.log(`  Encrypting name for student ID ${row.id}: ${row.name}`);
                    }
                    
                    // Check and encrypt age
                    if (row.age && !isEncrypted(row.age.toString())) {
                        updates.age = encrypt(row.age.toString());
                        needsUpdate = true;
                        console.log(`  Encrypting age for student ID ${row.id}: ${row.age}`);
                    }
                    
                    // Check and encrypt grade
                    if (row.grade && !isEncrypted(row.grade)) {
                        updates.grade = encrypt(row.grade);
                        needsUpdate = true;
                        console.log(`  Encrypting grade for student ID ${row.id}: ${row.grade}`);
                    }
                    
                    if (needsUpdate) {
                        const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
                        const updateValues = Object.values(updates);
                        updateValues.push(row.id);
                        
                        db.run(`UPDATE students SET ${updateFields} WHERE id = ?`, updateValues, function(err) {
                            if (err) {
                                console.error(`Error updating student ID ${row.id}:`, err);
                            } else {
                                studentsUpdated++;
                                console.log(`  ✅ Updated student ID ${row.id}`);
                            }
                            
                            processedCount++;
                            if (processedCount === rows.length) {
                                resolve();
                            }
                        });
                    } else {
                        console.log(`  ✅ Student ID ${row.id} already encrypted`);
                        processedCount++;
                        if (processedCount === rows.length) {
                            resolve();
                        }
                    }
                });
            });
        });
        
        // Migrate Teachers Table
        console.log('\n2. Migrating Teachers Table:');
        console.log('-'.repeat(40));
        
        await new Promise((resolve, reject) => {
            db.all('SELECT * FROM teachers', [], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                console.log(`Found ${rows.length} teacher records to check`);
                
                let processedCount = 0;
                
                if (rows.length === 0) {
                    resolve();
                    return;
                }
                
                rows.forEach((row) => {
                    let needsUpdate = false;
                    let updates = {};
                    
                    // Check and encrypt name
                    if (row.name && !isEncrypted(row.name)) {
                        updates.name = encrypt(row.name);
                        needsUpdate = true;
                        console.log(`  Encrypting name for teacher ID ${row.id}: ${row.name}`);
                    }
                    
                    // Check and encrypt subject
                    if (row.subject && !isEncrypted(row.subject)) {
                        updates.subject = encrypt(row.subject);
                        needsUpdate = true;
                        console.log(`  Encrypting subject for teacher ID ${row.id}: ${row.subject}`);
                    }
                    
                    // Check and encrypt experience
                    if (row.experience && !isEncrypted(row.experience.toString())) {
                        updates.experience = encrypt(row.experience.toString());
                        needsUpdate = true;
                        console.log(`  Encrypting experience for teacher ID ${row.id}: ${row.experience}`);
                    }
                    
                    if (needsUpdate) {
                        const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
                        const updateValues = Object.values(updates);
                        updateValues.push(row.id);
                        
                        db.run(`UPDATE teachers SET ${updateFields} WHERE id = ?`, updateValues, function(err) {
                            if (err) {
                                console.error(`Error updating teacher ID ${row.id}:`, err);
                            } else {
                                teachersUpdated++;
                                console.log(`  ✅ Updated teacher ID ${row.id}`);
                            }
                            
                            processedCount++;
                            if (processedCount === rows.length) {
                                resolve();
                            }
                        });
                    } else {
                        console.log(`  ✅ Teacher ID ${row.id} already encrypted`);
                        processedCount++;
                        if (processedCount === rows.length) {
                            resolve();
                        }
                    }
                });
            });
        });
        
        // Migration Summary
        console.log('\n' + '='.repeat(60));
        console.log('MIGRATION SUMMARY:');
        console.log('='.repeat(60));
        console.log(`✅ Students updated: ${studentsUpdated}`);
        console.log(`✅ Teachers updated: ${teachersUpdated}`);
        console.log(`✅ Total records encrypted: ${studentsUpdated + teachersUpdated}`);
        console.log('✅ Migration completed successfully');
        console.log('='.repeat(60));
        
        // Verify migration by checking a few records
        console.log('\n3. Post-Migration Verification:');
        console.log('-'.repeat(40));
        
        await new Promise((resolve) => {
            db.get('SELECT * FROM students LIMIT 1', [], (err, row) => {
                if (err || !row) {
                    console.log('No students found for verification');
                    resolve();
                    return;
                }
                
                const nameEncrypted = isEncrypted(row.name);
                const ageEncrypted = row.age ? isEncrypted(row.age) : true;
                const gradeEncrypted = row.grade ? isEncrypted(row.grade) : true;
                
                console.log(`Sample Student (ID ${row.id}):`);
                console.log(`  Name encrypted: ${nameEncrypted ? '✅' : '❌'}`);
                console.log(`  Age encrypted: ${ageEncrypted ? '✅' : '❌'}`);
                console.log(`  Grade encrypted: ${gradeEncrypted ? '✅' : '❌'}`);
                resolve();
            });
        });
        
        await new Promise((resolve) => {
            db.get('SELECT * FROM teachers LIMIT 1', [], (err, row) => {
                if (err || !row) {
                    console.log('No teachers found for verification');
                    resolve();
                    return;
                }
                
                const nameEncrypted = isEncrypted(row.name);
                const subjectEncrypted = row.subject ? isEncrypted(row.subject) : true;
                const experienceEncrypted = row.experience ? isEncrypted(row.experience) : true;
                
                console.log(`Sample Teacher (ID ${row.id}):`);
                console.log(`  Name encrypted: ${nameEncrypted ? '✅' : '❌'}`);
                console.log(`  Subject encrypted: ${subjectEncrypted ? '✅' : '❌'}`);
                console.log(`  Experience encrypted: ${experienceEncrypted ? '✅' : '❌'}`);
                resolve();
            });
        });
        
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        db.close();
        console.log('\nDatabase connection closed.');
    }
}

// Run the migration
migrateEncryptExistingData().catch(console.error);
