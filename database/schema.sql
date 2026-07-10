-- School Management System - 2FA Database Schema
-- Create database and tables for Two-Factor Authentication

-- Create database
CREATE DATABASE IF NOT EXISTS school_management;
USE school_management;

-- Admins table - stores admin credentials and 2FA settings
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Admin OTPs table - stores OTP codes for 2FA
CREATE TABLE IF NOT EXISTS admin_otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    INDEX idx_admin_otp (admin_id, otp_code),
    INDEX idx_expires (expires_at)
);

-- Admin sessions table - tracks active admin sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    admin_id INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX admin_id (admin_id)
);

-- Insert sample admin user (password: admin123)
-- Hash: $2b$10$rQZ8ZqGQJqKqQqQqQqQqQu
INSERT INTO admins (email, password_hash, two_factor_enabled) VALUES 
('admin@school.com', '$2b$10$rQZ8ZqGQJqKqQqQqQqQqQu', TRUE)
ON DUPLICATE KEY UPDATE two_factor_enabled = TRUE;
