const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
const helmet = require('helmet');
const path = require('path');
const app = express();
const PORT = 3000;
const bcrypt = require ('bcryptjs');

// Custom error class (optional)
class CustomError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

//To not allow use of cache
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Cache-Control', 'post-check=0, pre-check=0');
  res.setHeader('Pragma', 'no-cache');
  next();
});


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
  secret: 'yourSecretKey',       // Secret key for signing the session ID cookie
  resave: false,                 // Prevent resaving session if not modified
  saveUninitialized: true,       // Save uninitialized sessions
  cookie: { 
    secure: false,               // Use true if using HTTPS
    maxAge: 3600000                // Cookie expiration time
  }
}));

// MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'sagar@123',
  //password:'pranav@06',
  //password:'root',
  //password:'101201',
  //password:'pranav@06',
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
    const sql = 'SELECT userID,username,firstname,lastname,mobile,email,password,usertype,status FROM user_master WHERE username = ?';
    const [result] = await connection.execute(sql, [username]);
    connection.release();

    if (result.length === 0) {
      console.log("No UserName");
      return res.status(404).json({ message: 'No such username found.' });
    }

    const user = result[0];
    const passwordsql=user.password;
    
    if (!await bcrypt.compare(password,passwordsql)) {
      console.log(password);
      return res.status(401).json({ message: 'Incorrect password.' });
    }
    if(user.status!=="Active"){
      console.log("User Not Active");
      return res.status(401).json({ message: 'Inactive User.' });
    }
    req.session.username=result[0].username;
    req.session.firstname=result[0].firstname;
    req.session.lastname=result[0].lastname;
    req.session.mobile=result[0].mobile;
    req.session.email=result[0].email;
    req.session.myid=result[0].userID;

    console.log("UserId:  "+req.session.myid);
    console.log("Username:  "+req.session.username);
    console.log("\n\n\n");

    switch(user.usertype){
      case 'Applicant':
        console.log('Login successful, redirecting...');
        res.status(200).json({ redirectURL: '/applicantDash' });
                        break;
      case 'Organizer':
        console.log('Login successful, redirecting...');
        res.status(200).json({ redirectURL: '/organ' });
                        break;
      case 'Organization':
        console.log('Login successful, redirecting...');
        res.status(200).json({ redirectURL: '/organ' });
                        break;
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error checking result[0] and password' });
  }
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

//To Show all the examns
app.get('/api/exams', async (req, res) => {
  const sql = "SELECT * FROM exam_master where organizerID=?";
  const connection = await pool.getConnection();
  const [result] = await connection.execute(sql,[req.session.myid]);
  connection.release();
  res.json(result);
  });

  app.post('/api/exams/myexam', async (req, res) => {
    const{examID}=req.body;
    const sql = "SELECT * FROM exam_master where examID=? And organizerID=?";
    const connection = await pool.getConnection();
    const [result] = await connection.execute(sql,[examID,req.session.myid]);
    connection.release();
    console.log(result);
    res.json(result);
    });


//To Update Status

app.post('/api/exams/updatestatus', async (req, res) => {
  const{examID,status}=req.body;
  const sql = "UPDATE exam_master set status = ? where examID = ? And organizerID =?";
  const connection = await pool.getConnection();
  const [result] = await connection.execute(sql,[status,examID,req.session.myid]);
  connection.release();
  console.log(result);
  res.json(result);
  });

//To Give Exams Page
app.get('/api/exam', (req, res) => {
  console.log("serving exam");
  const filePath = path.join(__dirname, '../Frontend/HTML/Exams.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(err.status || 500).send('Error sending file');
    } else {
      console.log('File sent:', filePath);
    }
  });
});


//to Update Exam:
app.post('/updateExam', async(req, res) => {
  const { examID, name, app_start_date, app_end_date, exam_start_date, exam_end_date, exam_start_time, exam_end_time, total_marks, passing_marks, fees, syllabus } = req.body;

  let connection;
  console.log("OrganizerID: " + req.session.myid);
  
  try {
      // Get the connection asynchronously
      connection = await pool.getConnection();
  
      // Prepare the SQL query for updating exam_master
      const sql = 'UPDATE exam_master SET name = ?, app_start_date = ?, app_end_date = ?, exam_start_time = ?, exam_start_date = ?, exam_end_date = ?, exam_end_time = ?, total_marks = ?, passing_marks = ?, fees = ?, syllabus = ?, timestamp = ? WHERE examID = ? AND organizerID=?';
  
      // Execute the query and update the data in the database
      const [result] = await connection.execute(sql, [name,app_start_date,app_end_date,exam_start_time,exam_start_date,exam_end_date,exam_end_time,total_marks,passing_marks,fees,syllabus,new Date(),examID,req.session.myid]);
  
      // Check if any rows were updated
      if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: "Exam not found or not authorized to update" });
      }
  
      console.log("Exam updated successfully, Exam ID: " + examID);
  
      // Respond with success (you can modify this based on your application's needs)
      res.json({
          success: true,
          message: "Exam updated successfully",
          examID: examID
      });
  
  } catch (error) {
      console.error("Error updating exam data:", error);
      res.status(500).json({ success: false, message: "Error updating exam" });
  } finally {
      if (connection) {
          connection.release(); // Make sure to release the connection
      }
  }
  
});

//get organizer dashboard
app.get('/organ', (req, res) => {
  console.log("serving home");
  const filePath = path.join(__dirname, '../Frontend/HTML/OrganizerDash.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(err.status || 500).send('Error sending file');
    } else {
      console.log('File sent:', filePath);
    }
  });
});
// Get Organizer DashBoard Applicants
app.get('/ApproveStudent', (req, res) => {
  const filePath = path.join(__dirname, '../Frontend/HTML/ApproveStudent.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(err.status || 500).send('Error sending file');
    } else {
      console.log('File sent:', filePath);
    }
  });
});

//get Applicant dashboard
app.get('/applicantDash', (req, res) => {
  console.log("serving applicant dash");
  const filePath = path.join(__dirname, '../Frontend/HTML/ApplicantMain.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(err.status || 500).send('Error sending file');
    } else {
      console.log('File sent:', filePath);
    }
  });
});

// generate test
app.get('/generattest', (req, res) => {
  console.log("serving test");
  const filePath = path.join(__dirname, '../Frontend/HTML/ExamCreation.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(err.status || 500).send('Error sending file');
    } else {
      res.fil
      console.log('File sent:', filePath);
    }
  });
});


// Add Questions:addQuestion
app.post('/addQuestion', async(req, res) => {
      const {question,option1,option2,option3,option4,question_marks,correctOpt} = req.body;
      try {
        connection = await pool.getConnection();
    
        // Insert into user_master
        const sql = 'INSERT INTO Question_Master(examID, question, optionA, optionB, optionC, optionD, answer_key, question_marks,timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)';
        const [result] = await connection.execute(sql, [req.session.examID, question, option1, option2, option3, option4, correctOpt, question_marks,new Date()]);
        res.status(200).json({ message: 'Registration successful!', receivedData: req.body });
    
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error processing request.');
      } finally {
        if (connection) connection.release();
      }

});

//Set Test : SetTest

app.get('/SetTest', (req, res) => {
  console.log("serving test");
  const filePath = path.join(__dirname, '../Frontend/HTML/teacher_que.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(err.status || 500).send('Error sending file');
    } else {
      //res.fil
      console.log('File sent:', filePath);
    }
  });
});

//Exam Creation:

app.post('/addExam', async(req, res) => {
  
  console.log("Adding Exam");
  const {examTitle,appStartDate,appEndDate,examStartDate,examEndDate,examStartTime,examEndTime,totalMarks,passingMarks,fees,syllabus} = req.body;
//************************************************************88888888888888888888 */
  let connection;
  console.log("OrganizerID:"+req.session.myid);
  try {
    connection = await pool.getConnection();

    // Insert into user_master
    const sql = 'INSERT INTO exam_master(organizerID, name, app_start_date, app_end_date, exam_start_time, exam_start_date, exam_end_date, exam_end_time,total_marks,passing_marks,fees,syllabus,timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await connection.execute(sql, [req.session.myid, examTitle, appStartDate, appEndDate, examStartTime, examStartDate, examEndDate, examEndTime,totalMarks,passingMarks,fees,syllabus,new Date()]);
    const newexamID = result.insertId; // Get the ID of the newly inserted user
    // Respond with success

    req.session.examID = newexamID;
    res.status(200).json({ ExamID:newexamID,message: 'Registration successful!', redirectURL: "/SetTest", receivedData: req.body });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error processing request.');
  } finally {
    if (connection) connection.release();
  }
  //************************************************************88888888888888888888 */

});


//Delete an Exam
app.post('/delExam', async(req, res) => {
  const {examID} = req.body;
  const sql = "DELETE FROM question_master WHERE examID=?";
  const connection = await pool.getConnection();
  const[result1]= await connection.execute(sql,[examID]);
  const sql1="DELETE FROM exam_master WHERE examID=?";
  const[result2]= await connection.execute(sql1,[examID]);
  connection.release();
  res.status(200).json({ redirectURL: "/api/exam", receivedData: req.body });
});





app.post('/register', async (req, res) => {
  console.log("Register Hit");
  const { fname, lname, email, mobileno, username, pass, confirmPassword, usertype, organId, location } = req.body;
  
  // Validate required fields
  if (!fname || !lname || !pass || !email || !usertype) {
    return res.status(400).send('All fields are required.');
  }
  
  // Ensure passwords match
  if (pass !== confirmPassword) {
    return res.status(400).send('Passwords do not match.');
  }
  const Salt = await bcrypt.genSalt(10);
  const hashedpassword = await bcrypt.hash(pass,Salt);

  console.log (hashedpassword);
  console.log("Inside register", organId);
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Check if the organization exists only if organId is provided and userType is 'Organizer'
    if (organId !== "-1" && usertype === 'Organizer') {
      const [orgRows] = await connection.query('SELECT * FROM user_master WHERE userID = ?', [organId]);

      if (orgRows.length === 0) {
        return res.status(500).json({ message: 'Organization not found.\nLength is :'+orgRows.length });
      }else if(orgRows[0].status!=="Active"){
        return res.status(500).json({ message: 'Organization not Active.' });
      }
    }
    //Check for Unique names:
    const sql1 = 'SELECT username,firstname,lastname,mobile,email,password,usertype,status FROM user_master WHERE username = ?';
    const [result1] = await connection.execute(sql1, [username.toLowerCase()]);
    connection.release();

    if (result1.length !== 0) {
      console.log("Duplicate Name");
      return res.status(404).json({ message: 'Duplicate Name' });
    }


    // Insert into user_master
    const sql = 'INSERT INTO user_master(username, password, firstname, lastname, usertype, mobile, email, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await connection.execute(sql, [username.toLowerCase(), hashedpassword, fname, lname, usertype, mobileno, email, new Date()]);
    const newUserID = result.insertId; // Get the ID of the newly inserted user
    
    // Insert into Organization if usertype is 'Organization'
    if (usertype === 'Organization') {
      const orgSql = 'INSERT INTO Organization(organizationID, name, location) VALUES (?, ?, ?)';
      await connection.execute(orgSql, [newUserID, fname, location]);
    }

    // Insert into organizer_organization only if organId is valid and userType is 'Organizer'
    if (organId !== "-1" && usertype === 'Organizer') {
      const insertOrgSql = 'INSERT INTO organizer_organization (organizerID, organizationID) VALUES (?, ?)';
      await connection.execute(insertOrgSql, [newUserID, organId]);
    }

    // Respond with success
    res.status(200).json({ message: 'Registration successful!', redirectURL: "/", receivedData: req.body });

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


app.get('/applicant', async (req, res) => {
  console.log("Okayyy");
  try {
      const [results] = await pool.query('SELECT userID AS id, username AS name, email, usertype ,status FROM User_Master where usertype="Applicant"');
      res.json(results);
  } catch (err) {
      console.error('Error fetching users data:', err);
      res.status(500).json({ error: 'Failed to fetch users data' });
  }
});
//safcihbwsaliuvbanziujfeiawe;gvnwioejfnaiuw;ejfvawio;egsvaowpesdjfaw;opackoefegvmeroboeb
app.post('/status', async (req, res) => {
  const { id, status } = req.body;
  console.log("id : ",id ,"status :",status)
  let connection;
  try {
    connection = await pool.getConnection();
    // Execute the update query
    const [result] = await connection.query('UPDATE user_master SET status = ? WHERE userId = ?', [status, id]);
    const [newresult] = await connection.query('select usertype from user_master where userId=?',[id]);
    if(newresult.usertype==='Organization' && status==="Active"){
    
    }
 
    // Check if any row was affected
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found or no change in status' });
    }
    // Send success response
    res.status(200).json({ message: 'Registration successful!', receivedData: req.body });
  } catch (err) {
    console.error('Error updating data:', err);
    res.status(500).json({ error: 'Failed to update user status' });
  } finally {
    if (connection) {
      connection.release(); // Ensure connection is released
    }
  }
});

app.get('/organizer', async (req, res) => {
  try {
      const [results] = await pool.query('SELECT userID AS id, username AS name, email, usertype,status FROM User_Master where usertype="Organizer"');
      res.json(results);
  } catch (err) {
      console.error('Error fetching organizations data:', err);
      res.status(500).json({ error: 'Failed to fetch organizations data' });
  }
});

app.get('/organization', async (req, res) => {
  try {
      const [results] = await pool.query('SELECT userID AS id, username AS name, email, usertype,status FROM User_Master where usertype="Organization"');
      res.json(results);
  } catch (err) {
      console.error('Error fetching organizations data:', err);
      res.status(500).json({ error: 'Failed to fetch organizations data' });
  }
});

app.get('/exam', async (req, res) => {
  try {
    console.log("Inside Exam...");
      const [results] = await pool.query('SELECT examID , name, app_start_date, exam_start_time, exam_end_time, status FROM Exam_Master');
      res.json(results);
  } catch (err) {
      console.error('Error fetching exams data:', err);
      res.status(500).json({ error: 'Failed to fetch exams data' });
  }
});

app.get('/applications', async (req, res) => {
  try {
      const [results] = await pool.query('SELECT applicationID , examID, adhaarcard, feesstatus FROM Application_Master');
      res.json(results);
  } catch (err) {
      console.error('Error fetching applications data:', err);
      res.status(500).json({ error: 'Failed to fetch applications data' });
  }
});

//Admin Apis END


app.get('/profile', (req, res) => {
  if (req.session.username) {
    // Assuming username is stored in session
    res.json({ username: req.session.username,firstname:req.session.firstname,lastname:req.session.lastname,mobile:req.session.mobile,email:req.session.email});
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

app.get('/logout', (req, res) => {
  console.log("Logging Out");
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Error logging out');
    }
    // Redirect to login page or home page
    res.status(200).json({message:'SuccessFull'}); // Adjust the redirect URL as needed
  });
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
