const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./school.db');

// Create admin user for testing
async function createAdminUser() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const stmt = db.prepare('INSERT OR REPLACE INTO users (username, password, role) VALUES (?, ?, ?)');
        stmt.run('admin', hashedPassword, 'admin', function(err) {
            if (err) {
                console.error('Error creating admin user:', err.message);
            } else {
                console.log('Admin user created successfully!');
                console.log('Username: admin');
                console.log('Password: admin123');
                console.log('Role: admin');
            }
            
            stmt.finalize();
            db.close();
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        db.close();
    }
}

createAdminUser();
