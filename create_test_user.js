const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./school.db');

// Create a test student user with password same as username (for first-time login)
const testStudent = {
    username: 'student1',
    password: 'student1', // Will trigger first-time password change
    role: 'student'
};

// Insert the test student
const stmt = db.prepare('INSERT OR REPLACE INTO users (username, password, role) VALUES (?, ?, ?)');
stmt.run(testStudent.username, testStudent.password, testStudent.role, function(err) {
    if (err) {
        console.error('Error creating test student:', err.message);
    } else {
        console.log(`Test student created successfully!`);
        console.log(`Username: ${testStudent.username}`);
        console.log(`Password: ${testStudent.username} (same as username for first-time login)`);
        console.log('Role: student');
        console.log('\nTest the login flow with these credentials.');
    }
    
    stmt.finalize();
    db.close();
});
