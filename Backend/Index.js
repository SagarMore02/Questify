const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
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

// Serve static files from the 'Frontend/HTML' directory
app.use('/', express.static(path.join(__dirname, '../Frontend/HTML')));

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
  password: 'sagar@123',
  database: 'questify',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Serve 'home.html' on root path
app.get('/', (req, res) => {
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

app.get('/display', (req, res) => {
  console.log("In /display");
  const filePath = path.join(__dirname, '../Frontend/HTML/display.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(err.status || 500).send('Error sending file');
    } else {
      console.log('File sent:', filePath);
    }
  });
});

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

app.post('/your-endpoint', async (req, res) => {
  const { fname, lname, email, mobileno, username, pass, usertype } = req.body;

  if (!fname || !lname || !pass || !email || !usertype) {
    return res.status(400).send('All fields are required.');
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query('SELECT MAX(userID) as maxUserID FROM user_master');
    const maxUserID = rows[0].maxUserID || 100;
    const newUserID = maxUserID + 1;

    const sql = 'INSERT INTO user_master(userID, username, password, firstname, lastname, usertype, mobile, email, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await connection.execute(sql, [newUserID, username, pass, fname, lname, usertype, mobileno, email, new Date()]);

    console.log('Data inserted:', result);
    res.status(200).json({ message: 'Data received successfully', receivedData: req.body });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error storing data');
  } finally {
    if (connection) connection.release();
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
