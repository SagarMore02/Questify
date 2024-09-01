const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
const helmet = require('helmet');
const path = require('path');
const app = express();
const PORT = 3000;

// Custom error class (optional)
class CustomError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Serve static files from the 'Frontend/CSS' directory
app.use('/css', express.static(path.join(__dirname, '../Frontend/CSS')));

//For Images
app.use('/img', express.static(path.join(__dirname, '../Frontend/IMAGES')));

// Serve static files from the 'Frontend/HTML' directory

//JavaScript
app.use('/js', express.static(path.join(__dirname, '../Frontend/SCRIPT')));

// CSP settings
app.use(helmet.contentSecurityPolicy({
  directives: {
      defaultSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      scriptSrc: ["'self'", "https://code.jquery.com", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      styleSrc: ["'self'", "https://stackpath.bootstrapcdn.com", "'unsafe-inline'"]
  }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

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

// Serve 'home.html' on root path
app.get('/', (req, res) => {
  console.log("serving home");
  const filePath = path.join(__dirname, '../Frontend/HTML/home.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(err.status || 500).send('Error sending file');
    } else {
      console.log('File sent:', filePath);
    }
  });
});
app.get('/t', (req, res) => {
  console.log("serving home");
  const filePath = path.join(__dirname, '../Frontend/HTML/home2.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(err.status || 500).send('Error sending file');
    } else {
      console.log('File sent:', filePath);
    }
  });
});
app.use('/', express.static(path.join(__dirname, '../Frontend/HTML')));

app.post('/login-packet', async (req, res) => {
  const { username, password } = req.body;
  console.log("Username: " + username);
  console.log("Password: " + password);

  if (!username || !password) {
    console.log("Empty packet");
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const connection = await pool.getConnection();

  try {
    const sql = 'SELECT username, password FROM user_master WHERE username = ?';
    const [result] = await connection.execute(sql, [username]);
    connection.release();

    if (result.length === 0) {
      console.log("No UserName");
      return res.status(404).json({ message: 'No such username found.' });
    }

    const user = result[0];

    if (user.password !== password) {
      console.log("Wrong Pass");
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    console.log('Login successful, redirecting...');
    res.status(200).json({ redirectURL: '/display' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error checking username and password' });
  }
});

app.post('/register', async (req, res) => {
  const { fname, lname, email, mobileno, username, pass, confirmPassword, usertype, organId } = req.body;
  // Validate required fields
  if (!fname || !lname || !pass || !email || !usertype) {
    return res.status(400).send('All fields are required.');
  }
  let connection;
  try {
    connection = await pool.getConnection();

    // Check if the organization exists only if organId is provided and userType is 'Organizer'
    if (organId !== "-1" && usertype === 'Organizer') {
      const [orgRows] = await connection.query('SELECT * FROM Organization WHERE OrganizationID = ?', [organId]);

      if (orgRows.length === 0) {
        return res.status(400).send('Organization not found.');
      }
    }
    // Insert into user_master
    const sql = 'INSERT INTO user_master(username, password, firstname, lastname, usertype, mobile, email, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await connection.execute(sql, [username, pass, fname, lname, usertype, mobileno, email, new Date()]);
    const newUserID = result.insertId; // Get the ID of the newly inserted user

    // Insert into organizer_organization only if organId is valid and userType is 'Organizer'
    if (organId !== "-1" && usertype === 'Organizer') {
      const insertOrgSql = 'INSERT INTO organizer_organization (organizerID, organizationID) VALUES (?, ?)';
      await connection.execute(insertOrgSql, [newUserID, organId]);
    }
    // Respond with success
    res.status(200).json({ message: 'Registration successful!', receivedData: req.body });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error processing request.');
  } finally {
    if (connection) connection.release();
  }
});



//Admin Apis
app.get('/admin', (req, res) => {
  const filePath = path.join(__dirname, '../Frontend/HTML/Index.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(err.status || 500).send('Error sending file');
    } else {
      console.log('File sent:', filePath);
    }
  });
});



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
//Admin Apis END

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
