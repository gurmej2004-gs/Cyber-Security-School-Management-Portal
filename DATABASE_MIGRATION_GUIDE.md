# Database Migration Guide: SQLite to Enterprise Databases

## Overview

This guide provides a comprehensive migration strategy for transitioning from the current SQLite implementation to enterprise-grade databases (PostgreSQL or MySQL) while maintaining security, performance, and data integrity.

## Current Architecture

### SQLite Implementation
- **Database**: Single-file SQLite database (`school.db`)
- **Encryption**: Application-level AES-256-CBC encryption
- **Performance**: Suitable for development and small-to-medium deployments
- **Limitations**: Single-writer, limited concurrent access, no native encryption at rest

### Encrypted Fields (Current)
```javascript
// Students Table
name: encrypt(studentName)        // AES-256-CBC encrypted
age: encrypt(studentAge.toString()) // AES-256-CBC encrypted  
grade: encrypt(studentGrade)      // AES-256-CBC encrypted

// Teachers Table
name: encrypt(teacherName)        // AES-256-CBC encrypted
subject: encrypt(teacherSubject)  // AES-256-CBC encrypted
experience: encrypt(experience.toString()) // AES-256-CBC encrypted
```

## Migration Options

### Option 1: PostgreSQL with Native Encryption

#### Prerequisites
```bash
# Install PostgreSQL with TDE extension
sudo apt-get install postgresql-15 postgresql-15-tde
```

#### Configuration
```sql
-- Enable transparent data encryption
CREATE EXTENSION IF NOT EXISTS pg_tde;

-- Create encrypted tablespace
CREATE TABLESPACE encrypted_data 
LOCATION '/var/lib/postgresql/encrypted' 
WITH (encryption_key_id = 'school_mgmt_key');

-- Create tables with encryption
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name TEXT,
    age INTEGER,
    grade TEXT,
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) TABLESPACE encrypted_data;
```

#### Migration Script (PostgreSQL)
```javascript
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();

async function migrateToPostgreSQL() {
    const pgPool = new Pool({
        user: process.env.PG_USER,
        host: process.env.PG_HOST,
        database: process.env.PG_DATABASE,
        password: process.env.PG_PASSWORD,
        port: process.env.PG_PORT,
        ssl: { rejectUnauthorized: false }
    });

    const sqliteDb = new sqlite3.Database('school.db');
    
    // Migrate students
    sqliteDb.all('SELECT * FROM students', async (err, rows) => {
        for (const row of rows) {
            // Decrypt from SQLite (application-level)
            const decryptedName = decrypt(row.name);
            const decryptedAge = row.age ? parseInt(decrypt(row.age)) : null;
            const decryptedGrade = row.grade ? decrypt(row.grade) : null;
            
            // Insert into PostgreSQL (database-level encryption)
            await pgPool.query(
                'INSERT INTO students (name, age, grade, user_id) VALUES ($1, $2, $3, $4)',
                [decryptedName, decryptedAge, decryptedGrade, row.user_id]
            );
        }
    });
}
```

### Option 2: MySQL with Enterprise Encryption

#### Prerequisites
```bash
# Install MySQL Enterprise Edition
sudo apt-get install mysql-enterprise-server
```

#### Configuration
```sql
-- Enable encryption at rest
SET GLOBAL innodb_encrypt_tables = ON;
SET GLOBAL innodb_encrypt_log = ON;
SET GLOBAL innodb_encryption_threads = 4;

-- Create encrypted database
CREATE DATABASE school_mgmt 
ENCRYPTION = 'Y';

USE school_mgmt;

-- Create tables with encryption
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) ENCRYPTED,
    age INT ENCRYPTED,
    grade VARCHAR(50) ENCRYPTED,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENCRYPTION = 'Y';
```

#### Migration Script (MySQL)
```javascript
const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();

async function migrateToMySQL() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        ssl: { rejectUnauthorized: false }
    });

    const sqliteDb = new sqlite3.Database('school.db');
    
    // Migrate students
    sqliteDb.all('SELECT * FROM students', async (err, rows) => {
        for (const row of rows) {
            // Decrypt from SQLite (application-level)
            const decryptedName = decrypt(row.name);
            const decryptedAge = row.age ? parseInt(decrypt(row.age)) : null;
            const decryptedGrade = row.grade ? decrypt(row.grade) : null;
            
            // Insert into MySQL (database-level encryption)
            await connection.execute(
                'INSERT INTO students (name, age, grade, user_id) VALUES (?, ?, ?, ?)',
                [decryptedName, decryptedAge, decryptedGrade, row.user_id]
            );
        }
    });
}
```

## Migration Strategy

### Phase 1: Preparation (1-2 weeks)

1. **Environment Setup**
   ```bash
   # Create backup of current database
   cp school.db school_backup_$(date +%Y%m%d).db
   
   # Set up target database environment
   docker-compose up -d postgresql  # or mysql
   ```

2. **Database Abstraction Layer**
   ```javascript
   // database/connection.js
   class DatabaseConnection {
       constructor(type = 'sqlite') {
           this.type = type;
           this.connection = this.createConnection();
       }
       
       createConnection() {
           switch(this.type) {
               case 'postgresql':
                   return new Pool(pgConfig);
               case 'mysql':
                   return mysql.createConnection(mysqlConfig);
               default:
                   return new sqlite3.Database('school.db');
           }
       }
   }
   ```

3. **Parallel Testing Environment**
   - Set up staging environment with target database
   - Run existing test suite against both databases
   - Performance benchmarking

### Phase 2: Data Migration (1 week)

1. **Schema Migration**
   ```sql
   -- PostgreSQL schema
   CREATE TABLE IF NOT EXISTS students (
       id SERIAL PRIMARY KEY,
       name TEXT NOT NULL,
       age INTEGER,
       grade TEXT,
       user_id INTEGER REFERENCES users(id),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   ) TABLESPACE encrypted_data;
   ```

2. **Data Transfer**
   - Export decrypted data from SQLite
   - Import into target database with native encryption
   - Verify data integrity and encryption status

3. **Application Updates**
   ```javascript
   // Remove application-level encryption for migrated fields
   // Keep encryption functions for backward compatibility
   
   async function createStudent(name, age, grade, userId) {
       // No longer need encrypt() - database handles it
       const sql = 'INSERT INTO students (name, age, grade, user_id) VALUES (?, ?, ?, ?)';
       return await db.query(sql, [name, age, grade, userId]);
   }
   ```

### Phase 3: Production Deployment (1 week)

1. **Blue-Green Deployment**
   - Deploy new version with database abstraction
   - Switch traffic gradually
   - Monitor performance and error rates

2. **Performance Optimization**
   ```sql
   -- PostgreSQL optimizations
   CREATE INDEX idx_students_user_id ON students(user_id);
   CREATE INDEX idx_students_grade ON students(grade);
   
   -- MySQL optimizations
   ALTER TABLE students ADD INDEX idx_user_id (user_id);
   ALTER TABLE students ADD INDEX idx_grade (grade);
   ```

3. **Monitoring Setup**
   ```javascript
   // Database performance monitoring
   const dbMetrics = {
       connectionPool: pool.totalCount,
       activeConnections: pool.idleCount,
       queryTime: Date.now() - queryStart,
       encryptionStatus: 'ENABLED'
   };
   ```

## Security Considerations

### Encryption Key Management

#### PostgreSQL
```sql
-- Key rotation
SELECT pg_tde_rotate_key('school_mgmt_key');

-- Key backup
SELECT pg_tde_export_key('school_mgmt_key', '/secure/backup/location');
```

#### MySQL
```sql
-- Key rotation
ALTER INSTANCE ROTATE INNODB MASTER KEY;

-- Key management
SELECT * FROM performance_schema.keyring_keys;
```

### Access Control

#### PostgreSQL Row-Level Security
```sql
-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY student_access_policy ON students
    FOR ALL TO app_user
    USING (user_id = current_setting('app.current_user_id')::int);
```

#### MySQL Enterprise Audit
```sql
-- Enable audit logging
INSTALL PLUGIN audit_log SONAME 'audit_log.so';
SET GLOBAL audit_log_policy = 'ALL';
```

## Performance Benchmarks

### Expected Performance Improvements

| Metric | SQLite | PostgreSQL | MySQL |
|--------|--------|------------|-------|
| Concurrent Connections | 1 writer | 100+ | 150+ |
| Query Performance | Good | Excellent | Excellent |
| Encryption Overhead | 5-10% | 2-5% | 2-5% |
| Backup/Recovery | File copy | Point-in-time | Point-in-time |
| High Availability | None | Built-in | Built-in |

### Load Testing
```javascript
// Performance test script
async function loadTest() {
    const concurrentUsers = 50;
    const operationsPerUser = 100;
    
    const results = await Promise.all(
        Array(concurrentUsers).fill().map(async () => {
            const startTime = Date.now();
            for (let i = 0; i < operationsPerUser; i++) {
                await createStudent(`Test User ${i}`, 20, 'A', 1);
            }
            return Date.now() - startTime;
        })
    );
    
    console.log(`Average time per user: ${results.reduce((a, b) => a + b) / results.length}ms`);
}
```

## Rollback Strategy

### Emergency Rollback
```bash
#!/bin/bash
# rollback.sh

echo "Starting emergency rollback to SQLite..."

# Stop application
systemctl stop school-mgmt-app

# Restore SQLite database
cp school_backup_$(date +%Y%m%d).db school.db

# Revert application configuration
export DB_TYPE=sqlite

# Restart application
systemctl start school-mgmt-app

echo "Rollback completed successfully"
```

### Data Synchronization
```javascript
// Sync data back to SQLite if needed
async function syncToSQLite() {
    const pgData = await pgPool.query('SELECT * FROM students');
    
    for (const row of pgData.rows) {
        // Re-encrypt for SQLite storage
        const encryptedName = encrypt(row.name);
        const encryptedAge = encrypt(row.age.toString());
        const encryptedGrade = encrypt(row.grade);
        
        sqliteDb.run(
            'INSERT OR REPLACE INTO students (id, name, age, grade, user_id) VALUES (?, ?, ?, ?, ?)',
            [row.id, encryptedName, encryptedAge, encryptedGrade, row.user_id]
        );
    }
}
```

## Compliance and Audit

### Encryption Verification
```sql
-- PostgreSQL: Verify encryption status
SELECT schemaname, tablename, encryption_key_id 
FROM pg_tde_tables 
WHERE schemaname = 'public';

-- MySQL: Verify encryption status
SELECT TABLE_SCHEMA, TABLE_NAME, CREATE_OPTIONS 
FROM information_schema.TABLES 
WHERE CREATE_OPTIONS LIKE '%ENCRYPTION%';
```

### Audit Trail
```javascript
// Enhanced audit logging for enterprise databases
class AuditLogger {
    static async logDataAccess(userId, operation, table, recordId) {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            user_id: userId,
            operation: operation,
            table_name: table,
            record_id: recordId,
            encryption_status: 'ENABLED',
            compliance_level: 'ENTERPRISE'
        };
        
        await db.query(
            'INSERT INTO audit_log (timestamp, user_id, operation, table_name, record_id, metadata) VALUES (?, ?, ?, ?, ?, ?)',
            [auditEntry.timestamp, auditEntry.user_id, auditEntry.operation, auditEntry.table_name, auditEntry.record_id, JSON.stringify(auditEntry)]
        );
    }
}
```

## Conclusion

This migration strategy provides a robust path from SQLite to enterprise databases while maintaining the highest security standards. The phased approach ensures minimal downtime and risk, while the native database encryption capabilities provide enhanced performance and compliance features for production deployments.

The combination of proper planning, comprehensive testing, and robust rollback procedures ensures a successful migration that strengthens the overall security posture of the school management system.
