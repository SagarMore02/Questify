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

//For Images
app.use('/img', express.static(path.join(__dirname, '../Frontend/IMAGES')));

// Serve static files from the 'Frontend/HTML' directory
app.use('/', express.static(path.join(__dirname, '../Frontend/HTML')));
//JavaScript
app.use('/js', express.static(path.join(__dirname, '../Frontend/SCRIPT')));



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


app.get('/Signup', (req, res) => {
  console.log("In /Signup");
  const filePath = path.join(__dirname, '../Frontend/HTML/Signup.html');
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


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
