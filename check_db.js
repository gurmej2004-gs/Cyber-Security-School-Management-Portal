const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('school.db');

console.log('Database Tables:');
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error('Error fetching tables:', err);
        return;
    }
    
    tables.forEach(table => {
        console.log(`\nTable: ${table.name}`);
        console.log('----------------------------------------');
        
        // Get table structure
        db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
            if (err) {
                console.error('Error fetching table structure:', err);
                return;
            }
            
            console.log('Columns:');
            console.log(columns.map(c => `- ${c.name} (${c.type})`).join('\n'));
            
            // Get row count
            db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, row) => {
                console.log(`\nRow count: ${row.count}`);
                
                // Show sample data (first 5 rows)
                if (row.count > 0) {
                    db.all(`SELECT * FROM ${table.name} LIMIT 5`, (err, rows) => {
                        console.log('\nSample data:');
                        console.table(rows);
                        
                        // Close the database after the last table
                        if (table === tables[tables.length - 1]) {
                            db.close();
                        }
                    });
                } else {
                    console.log('No data found.');
                    // Close the database after the last table
                    if (table === tables[tables.length - 1]) {
                        db.close();
                    }
                }
            });
        });
    });
});
