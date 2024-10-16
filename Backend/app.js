const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const helmet = require('helmet');
const app = express();
const PORT = 3000;

// MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '101201',
    database: 'questify',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(cors());


// CSP settings
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        scriptSrc: ["'self'", "https://code.jquery.com", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
        styleSrc: ["'self'", "https://stackpath.bootstrapcdn.com", "'unsafe-inline'"]
    }
}));


// Enable CORS if needed
//app.use(cors());

// Serve static files from the 'Frontend/HTML' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve data endpoints
app.get('/applicant', async (req, res) => {
    console.log("Okayyy");
    try {
        const [results] = await pool.query('SELECT userID AS id, username AS name, email, usertype,status AS role FROM User_Master where usertype="Applicant"');
        res.json(results);
    } catch (err) {
        console.error('Error fetching users data:', err);
        res.status(500).json({ error: 'Failed to fetch users data' });
    }
});

app.get('/organizer', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT userID AS id, username AS name, email, usertype,status AS role FROM User_Master where usertype="Organizer"');
        res.json(results);
    } catch (err) {
        console.error('Error fetching organizations data:', err);
        res.status(500).json({ error: 'Failed to fetch organizations data' });
    }
});

app.get('/organization', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT userID AS id, username AS name, email, usertype,status AS role FROM User_Master where usertype="Organization"');
        res.json(results);
    } catch (err) {
        console.error('Error fetching organizations data:', err);
        res.status(500).json({ error: 'Failed to fetch organizations data' });
    }
});

app.get('/exams', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT examID AS id, name, app_start_date, app_end_date FROM Exam_Master');
        res.json(results);
    } catch (err) {
        console.error('Error fetching exams data:', err);
        res.status(500).json({ error: 'Failed to fetch exams data' });
    }
});

app.get('/applications', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT applicationID AS id, examID, adhaarcard, feesstatus FROM Application_Master');
        res.json(results);
    } catch (err) {
        console.error('Error fetching applications data:', err);
        res.status(500).json({ error: 'Failed to fetch applications data' });
    }
});

app.get('/questions', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT questionID AS id, examID, question, optionA, optionB, optionC, optionD FROM Question_Master');
        res.json(results);
    } catch (err) {
        console.error('Error fetching questions data:', err);
        res.status(500).json({ error: 'Failed to fetch questions data' });
    }
});

app.get('/attempts', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT attemptID AS id, examID, questionID, applicationID, selected_option, correct_option, marks_obt FROM Attempt_Master');
        res.json(results);
    } catch (err) {
        console.error('Error fetching attempts data:', err);
        res.status(500).json({ error: 'Failed to fetch attempts data' });
    }
});

app.get('/transactions', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT trans_id AS id, exam_id, paidfees, upi_token FROM Transaction_Master');
        res.json(results);
    } catch (err) {
        console.error('Error fetching transactions data:', err);
        res.status(500).json({ error: 'Failed to fetch transactions data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
