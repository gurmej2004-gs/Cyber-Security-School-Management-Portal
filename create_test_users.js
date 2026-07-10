const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Initialize SQLite database
const db = new sqlite3.Database('./school.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
    } else {
        console.log('Database connected for test user creation');
    }
});

async function createTestUsers() {
    const testUsers = [
        { username: 'teacher1', password: 'teacher123', role: 'teacher' },
        { username: 'student1', password: 'student123', role: 'student' },
        { username: 'student2', password: 'student456', role: 'student' },
        { username: 'student5', password: 'student5', role: 'student' }
    ];

    console.log('Creating test users...');

    for (const user of testUsers) {
        try {
            // Hash the password
            const hashedPassword = await bcrypt.hash(user.password, 10);
            
            // Insert user
            await new Promise((resolve, reject) => {
                const stmt = db.prepare('INSERT OR REPLACE INTO users (username, password, role) VALUES (?, ?, ?)');
                stmt.run(user.username, hashedPassword, user.role, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(`✓ Created ${user.role}: ${user.username}`);
                        resolve(this.lastID);
                    }
                    stmt.finalize();
                });
            });

            // If it's a student, create a corresponding student record
            if (user.role === 'student') {
                const userId = await new Promise((resolve, reject) => {
                    db.get('SELECT id FROM users WHERE username = ?', [user.username], (err, row) => {
                        if (err) reject(err);
                        else resolve(row.id);
                    });
                });

                await new Promise((resolve, reject) => {
                    const stmt = db.prepare('INSERT OR REPLACE INTO students (name, age, grade, user_id) VALUES (?, ?, ?, ?)');
                    let studentName, age, grade;
                    
                    if (user.username === 'student1') {
                        studentName = 'John Doe';
                        age = 16;
                        grade = '10th';
                    } else if (user.username === 'student2') {
                        studentName = 'Jane Smith';
                        age = 17;
                        grade = '11th';
                    } else if (user.username === 'student5') {
                        studentName = 'Mike Johnson';
                        age = 15;
                        grade = '9th';
                    }
                    
                    stmt.run(studentName, age, grade, userId, function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            console.log(`✓ Created student profile for ${user.username}`);
                            resolve(this.lastID);
                        }
                        stmt.finalize();
                    });
                });
            }

        } catch (error) {
            console.error(`Error creating user ${user.username}:`, error.message);
        }
    }

    console.log('\nTest users created successfully!');
    console.log('Login credentials:');
    console.log('- Admin: admin / 1234');
    console.log('- Teacher: teacher1 / teacher123');
    console.log('- Student1: student1 / student123');
    console.log('- Student2: student2 / student456');
    console.log('- Student5: student5 / student5');
    
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
}

createTestUsers();
