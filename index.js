require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { log } = require('./logHelper');

const app = express();

// Configuration variables
const PORT = process.env.PORT || 3000;
const PASSWORD = process.env.PASSWORD;
const LOCK_FILE = path.join(__dirname, 'server.lock'); // Define the lock file path
process.title = 'filwalletd';

// Enable CORS for all routes
app.use(cors());
// Middleware to parse JSON requests
app.use(express.json());

// Shutdown function for graceful termination
const shutdown = () => {
    log('Received shutdown signal. Shutting down gracefully...');
    fs.unlink(LOCK_FILE, (err) => {
        if (err) {
            log('Failed to remove lock file:', err);
        } else {
            log('Lock file removed.');
        }
    });
    process.exit(0);  // Graceful shutdown
};

// Check if server is already running
if (fs.existsSync(LOCK_FILE)) {
    log('Server is already running. Exiting...');
    process.exit(1); // Exit if the server is already running
}

// Create an empty lock file
fs.writeFileSync(LOCK_FILE, ''); 

// Middleware to verify password
const verifyPassword = (req, res, next) => {
    const { password } = req.body;
    if (password !== PASSWORD) {
        return res.status(403).send('Forbidden: Invalid password');
    }
    next();
};

// Shutdown route
app.post('/shutdown', (req, res) => {
    log('Shutdown Request IP:', req.ip);
    const localhostRegex = /^::ffff:127\.0\.0\.1$|^127\.0\.0\.1$|^::1$/;

    if (!localhostRegex.test(req.ip)) {
        log('Unauthorized shutdown attempt from non-localhost');
        return res.status(403).json({ error: 'Forbidden: Access restricted to localhost' });
    }

    res.json({ message: 'Server is shutting down...' });
    log('Received shutdown request. Shutting down server...');
    shutdown();
});

// Sync route
app.post('/sync', verifyPassword, (req, res) => {
    const { ip } = req;
    log(`Sync Request IP: ${ip}`);

    exec('lotus sync wait', (error, stdout, stderr) => {
        if (error) {
            return res.status(500).send(`Error: ${stderr}`);
        }
        if (stdout.includes("Done!")) {
            res.json({ message: 'Sync completed', ok: true });
        } else {
            res.status(500).send(`Sync did not complete: ${stdout}`);
        }
    });
});

// Send route
app.post('/send', verifyPassword, (req, res) => {
    const { ip } = req;
    const { toAddress, amount } = req.body;

    // Log all relevant information in one line
    log(`Send Request IP: ${ip}, toAddress: ${toAddress}, amount: ${amount}`);

    const command = `lotus send ${toAddress} ${amount}`;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).send(`Error: ${stderr}`);
        }
        if (!stdout.includes("ERROR")) {
            res.json({
                message: 'Send completed',
                ok: true,
                toAddress: toAddress,
                amount: amount
            });
        } else {
            res.status(500).send(`Send did not complete: ${stdout}`);
        }
    });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    log(`Server running on http://0.0.0.0:${PORT}`);
    log(`Access it from your external IP: http://<your-external-ip>:${PORT}`);
});

// Handle manual shutdown with SIGINT and SIGTERM signals
process.on('SIGINT', shutdown);   // Handle Ctrl+C in the terminal
process.on('SIGTERM', shutdown);

// Ensure lock file is removed on exit
process.on('exit', () => {
    fs.unlink(LOCK_FILE, (err) => {
        if (err) {
            log('Failed to remove lock file on exit:', err);
        } else {
            log('Lock file removed on exit.');
        }
    });
});

