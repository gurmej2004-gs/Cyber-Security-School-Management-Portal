const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');

const app = express();
const PORT = 3000;

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'school_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create database connection pool
const pool = mysql.createPool(dbConfig);

// Session store configuration
const sessionStore = new MySQLStore({
    clearExpired: true,
    checkExpirationInterval: 900000, // 15 minutes
    expiration: 900000 // 15 minutes
}, pool);

// Email transporter configuration (using Gmail SMTP)
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // Replace with your email
        pass: 'your-app-password'     // Replace with your app password
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    key: 'admin_session',
    secret: 'your-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 15 * 60 * 1000 // 15 minutes
    }
}));

// Middleware to check if admin is authenticated
const requireAuth = (req, res, next) => {
    if (!req.session.adminId) {
        return res.redirect('/login.html');
    }
    next();
};

// Middleware to check if admin is NOT authenticated (for login pages)
const requireGuest = (req, res, next) => {
    if (req.session.adminId) {
        return res.redirect('/admin-dashboard.html');
    }
    next();
};

// Helper function to generate 6-digit OTP
function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

// Helper function to send OTP email
async function sendOTPEmail(email, otp) {
    const mailOptions = {
        from: 'School Management System <your-email@gmail.com>',
        to: email,
        subject: 'Admin Login OTP - School Management System',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Admin Login Verification</h2>
                <p>Your One-Time Password (OTP) for admin login is:</p>
                <div style="background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 24px; font-weight: bold; letter-spacing: 3px;">${otp}</span>
                </div>
                <p><strong>Important:</strong></p>
                <ul>
                    <li>This OTP is valid for 5 minutes only</li>
                    <li>This OTP can be used only once</li>
                    <li>Do not share this OTP with anyone</li>
                </ul>
                <p style="color: #666; font-size: 12px;">If you didn't request this OTP, please contact IT support immediately.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}: ${otp}`);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
}

// Helper function to clean expired OTPs
async function cleanExpiredOTPs() {
    const connection = await pool.getConnection();
    try {
        await connection.execute(
            'DELETE FROM admin_otps WHERE expires_at < NOW() OR used = TRUE'
        );
    } catch (error) {
        console.error('Error cleaning expired OTPs:', error);
    } finally {
        connection.release();
    }
}

// ROUTES

// POST /login - Handle login with email and password
app.post('/login', requireGuest, async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const connection = await pool.getConnection();
        
        // Get admin by email
        const [adminRows] = await connection.execute(
            'SELECT id, email, password_hash, two_factor_enabled FROM admins WHERE email = ?',
            [email]
        );
        
        connection.release();
        
        if (adminRows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }
        
        const admin = adminRows[0];
        
        // Verify password
        const passwordMatch = await bcrypt.compare(password, admin.password_hash);
        
        if (!passwordMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }
        
        // Password is correct, check if 2FA is enabled
        if (admin.two_factor_enabled) {
            // Store admin ID in session temporarily (not authenticated yet)
            req.session.tempAdminId = admin.id;
            req.session.tempAdminEmail = admin.email;
            
            // Generate and send OTP
            const otp = generateOTP();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
            
            const connection2 = await pool.getConnection();
            try {
                // Store OTP in database
                await connection2.execute(
                    'INSERT INTO admin_otps (admin_id, otp_code, expires_at) VALUES (?, ?, ?)',
                    [admin.id, otp, expiresAt]
                );
                
                // Send OTP via email
                const emailSent = await sendOTPEmail(admin.email, otp);
                
                if (!emailSent) {
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Failed to send OTP email' 
                    });
                }
                
                res.json({ 
                    success: true, 
                    requires2FA: true,
                    message: 'OTP sent to your email' 
                });
                
            } catch (error) {
                console.error('Error storing OTP:', error);
                res.status(500).json({ 
                    success: false, 
                    message: 'Failed to generate OTP' 
                });
            } finally {
                connection2.release();
            }
        } else {
            // No 2FA required, create session directly
            req.session.adminId = admin.id;
            req.session.adminEmail = admin.email;
            delete req.session.tempAdminId;
            delete req.session.tempAdminEmail;
            
            res.json({ 
                success: true, 
                requires2FA: false,
                message: 'Login successful' 
            });
        }
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login' 
        });
    }
});

// POST /verify-otp - Verify OTP and complete login
app.post('/verify-otp', requireGuest, async (req, res) => {
    const { otp } = req.body;
    
    // Check if we have a temporary admin session
    if (!req.session.tempAdminId) {
        return res.status(400).json({ 
            success: false, 
            message: 'No login session found' 
        });
    }
    
    try {
        const connection = await pool.getConnection();
        
        // Get the most recent OTP for this admin
        const [otpRows] = await connection.execute(
            'SELECT id, otp_code, expires_at, used FROM admin_otps WHERE admin_id = ? ORDER BY created_at DESC LIMIT 1',
            [req.session.tempAdminId]
        );
        
        if (otpRows.length === 0) {
            connection.release();
            return res.status(400).json({ 
                success: false, 
                message: 'No OTP found' 
            });
        }
        
        const otpRecord = otpRows[0];
        
        // Check if OTP is expired
        if (new Date() > new Date(otpRecord.expires_at)) {
            connection.release();
            return res.status(400).json({ 
                success: false, 
                message: 'OTP has expired' 
            });
        }
        
        // Check if OTP has already been used
        if (otpRecord.used) {
            connection.release();
            return res.status(400).json({ 
                success: false, 
                message: 'OTP has already been used' 
            });
        }
        
        // Check if OTP matches
        if (otp !== otpRecord.otp_code) {
            connection.release();
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid OTP' 
            });
        }
        
        // OTP is valid - mark as used and create session
        await connection.execute(
            'UPDATE admin_otps SET used = TRUE WHERE id = ?',
            [otpRecord.id]
        );
        
        connection.release();
        
        // Create authenticated session
        req.session.adminId = req.session.tempAdminId;
        req.session.adminEmail = req.session.tempAdminEmail;
        delete req.session.tempAdminId;
        delete req.session.tempAdminEmail;
        
        res.json({ 
            success: true, 
            message: 'OTP verified successfully' 
        });
        
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during OTP verification' 
        });
    }
});

// POST /resend-otp - Resend OTP
app.post('/resend-otp', requireGuest, async (req, res) => {
    if (!req.session.tempAdminId) {
        return res.status(400).json({ 
            success: false, 
            message: 'No login session found' 
        });
    }
    
    try {
        // Clean expired OTPs first
        await cleanExpiredOTPs();
        
        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
        
        const connection = await pool.getConnection();
        try {
            // Store new OTP
            await connection.execute(
                'INSERT INTO admin_otps (admin_id, otp_code, expires_at) VALUES (?, ?, ?)',
                [req.session.tempAdminId, otp, expiresAt]
            );
            
            // Send OTP via email
            const emailSent = await sendOTPEmail(req.session.tempAdminEmail, otp);
            
            if (!emailSent) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to send OTP email' 
                });
            }
            
            res.json({ 
                success: true, 
                message: 'New OTP sent to your email' 
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to resend OTP' 
        });
    }
});

// POST /logout - Handle logout
app.post('/logout', requireAuth, async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error during logout' 
            });
        }
        
        res.clearCookie('admin_session');
        res.json({ 
            success: true, 
            message: 'Logged out successfully' 
        });
    });
});

// POST /toggle-2fa - Enable/disable 2FA for admin
app.post('/toggle-2fa', requireAuth, async (req, res) => {
    const { enabled } = req.body;
    
    try {
        const connection = await pool.getConnection();
        
        await connection.execute(
            'UPDATE admins SET two_factor_enabled = ? WHERE id = ?',
            [enabled, req.session.adminId]
        );
        
        connection.release();
        
        res.json({ 
            success: true, 
            message: `2FA ${enabled ? 'enabled' : 'disabled'} successfully` 
        });
        
    } catch (error) {
        console.error('Toggle 2FA error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update 2FA settings' 
        });
    }
});

// GET /admin-info - Get current admin info
app.get('/admin-info', requireAuth, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [adminRows] = await connection.execute(
            'SELECT id, email, two_factor_enabled FROM admins WHERE id = ?',
            [req.session.adminId]
        );
        
        connection.release();
        
        if (adminRows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Admin not found' 
            });
        }
        
        res.json({ 
            success: true, 
            admin: adminRows[0] 
        });
        
    } catch (error) {
        console.error('Get admin info error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get admin info' 
        });
    }
});

// Clean expired OTPs every 5 minutes
setInterval(cleanExpiredOTPs, 5 * 60 * 1000);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('2FA Admin Login System Ready');
});
