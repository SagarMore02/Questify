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
    if(user.status==="Inactive" && user.usertype==='Applicant'){
      console.log("User Not Active");
        return res.status(401).json({ message: 'Inactive User.' });
    }
    if(user.status!=="Active" && user.usertype!=='Applicant'){
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
  const sql = "SELECT * FROM exam_master";
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

//Fetch Exams for Applicant
app.get('/api/appgetexam', (req, res) => {
  console.log("serving exam");
  const filePath = path.join(__dirname, '../Frontend/HTML/ApplyforExam.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(err.status || 500).send('Error sending file');
    } else {
      console.log('File sent:', filePath);
    }
  });
});
app.post('/api/exams/apply', async (req, res) => {
  try {
    const { examID, adcard } = req.body;
    const userID = req.session.myid; // Assuming you're using sessions to track the logged-in user
    console.log("ExamID:", examID, "UserID:", userID, "ADcard:", adcard);

    // SQL query, inserting default values for other required columns
    const sql = `INSERT INTO Application_Master (applicationID, examID, adhaarcard, feesstatus, appstatus, attendance, marks)
                 VALUES (?, ?, ?, 'Pending', 'Pending', 'Pending', 0)`;

    const connection = await pool.getConnection();
    const [result] = await connection.execute(sql, [userID, examID, adcard]);
    connection.release();

    console.log(result);
    res.status(200).json({ message: 'Application successful', result });
  } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
          // Handle duplicate entry error
          console.log("al");
          res.status(409).json({ message: 'You Have Already Applied For this Exam' });
          // You can add custom handling here, like sending an appropriate response
      } else {
          // Handle other errors
          console.error(error);
          res.status(500).json({ error: 'Failed to apply for the exam' });
      }
    }  
});




//to Update Exam:
app.post('/updateExam', async(req, res) => {
  const { examID, name, app_start_date, app_end_date, exam_start_date, exam_end_date, exam_start_time, exam_end_time, total_marks, passing_marks, fees, syllabus } = req.body;
  console.log({
    examID,
    name,
    app_start_date,
    app_end_date,
    exam_start_date,
    exam_end_date,
    exam_start_time,
    exam_end_time,
    total_marks,
    passing_marks,
    fees,
    syllabus
});
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


// /api/exams

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
app.get('/organapplicant', async (req, res) => {
  console.log("organ");
  try {
    const sql = `SELECT 
                   app.applicationID AS id,
                   user.firstname AS applicantf_name,
                   user.lastname AS applicantl_name, 
                   exam.name AS name, 
                   app.adhaarcard AS adhaarcard, 
                   app.feesstatus as feestatus, 
                   app.appstatus as appstatus, 
                   app.attendance as attendance
                 FROM 
                   Application_Master app 
                 JOIN 
                   exam_master exam ON app.examID = exam.examID
                 JOIN
                   User_Master user ON app.applicationID = user.userID`;

    const [results] = await pool.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Error fetching applicant data:', err);
    res.status(500).json({ error: 'Failed to fetch applicant data' });
  }
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

app.post('/orgstatus', async (req, res) => {
  const { id, status } = req.body;
  console.log("id : ",id ,"status :",status)
  let connection;
  try {
    connection = await pool.getConnection();
    // Execute the update query
    const [result] = await connection.query('UPDATE application_master SET appstatus = ? WHERE applicationID = ?', [status, id]);
    //const [newresult] = await connection.query('select usertype from application_master where applicationID=?',[id]);
    // if(newresult.usertype==='Organization' && status==="Active"){
    
    //}
 
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
// /api/exams/apply
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

app.get('/start_exam', (req, res) => {
  const {examID} = req.query;
  req.session.testExamID=examID;
  console.log("serving home with examID:", req.session.testExamID);
  const filePath = path.join(__dirname, '../Frontend/HTML/temp_exam.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(err.status || 500).send('Error sending file');
    } else {
      console.log('File sent:', filePath);
    }
  });
});

app.post('/get-questions', async (req, res) => {
  const examId = req.session.testExamID; // examId comes from URL params
  let connection;

  // Modified query to fetch questions and their corresponding options from question_master
  const query = `
    SELECT questionID, question, optionA, optionB, optionC, optionD
    FROM question_master
    WHERE examID = ?;
  `;

  try {
    // Fetch questions and options from the database
    connection = await pool.getConnection();

    const [results] = await connection.query(query, [examId]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'No questions found for this exam.' });
    }
    console.log(results);

    // Format the questions and options into an array
    const questionsArray = results.map(row => ({
      id: row.questionID, // Add questionID to the object
      question: row.question,
      options: [row.optionA, row.optionB, row.optionC, row.optionD]
    }));

    // Send the formatted questions array back to the frontend
    res.json({ examId, questions: questionsArray });
  } catch (err) {
    console.error('Error fetching questions:', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release(); // Release the database connection
  }
});






app.get('/UpcomingExam', (req, res) => {
  console.log("serving Upcoming EXam");
  const filePath = path.join(__dirname, '../Frontend/HTML/AppliedExam.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(err.status || 500).send('Error sending file');
    } else {
      console.log('File sent:', filePath);
    }
  });
});
//********************************************************************************** */
//For Showing which tests applicant applies
app.get('/getappliedTest', async(req, res) => {
  //const { id, status } = req.body;
  //console.log("id : ",id ,"status :",status)
  let connection;
  try {
    connection = await pool.getConnection();
    // Execute the update query
    const me = 3
    const [result] = await connection.query('select * from exam_master where examID in (select examID from application_master where applicationID=?)', [req.session.myid]);//me]);//
    // Send success response
    res.json(result);
  } catch (err) {
    console.error('Error updating data:', err);
    res.status(500).json({ error: 'Failed to update user status' });
  } finally {
    if (connection) {
      connection.release(); // Ensure connection is released
    }
  }
});

//Notice Board:
// Example Node.js/Express API endpoint to get exam data
app.get('/notice/exams', async(req, res) => {
  const sql = "SELECT * FROM EXAM_MASTER WHERE examID in(select examID from application_master where applicationID=?)";  
  const connection = await pool.getConnection();
  const [exams] = await connection.query(sql,[req.session.myid]);
  res.json(exams);
});

//Insert Into Attempts:
app.post('/InsertAttempt', async (req, res) => {
  const{questionId,sel_answer}=req.body;
  const examId = req.session.testExamID; // examId comes from URL params
  let connection;

  const sql= 'Select * from Attempt_Master where examID=? and questionID=? and applicationID=?';
  // Modified query to fetch questions and their corresponding options from question_master
  const query = `INSERT INTO Attempt_Master (examID, questionID, applicationID, selected_option) VALUES(?,?,?,?)`;
  const updateQuery = 'UPDATE Attempt_Master SET selected_option = ? WHERE examID = ? AND questionID = ? AND applicationID = ?';
  try {
    // Fetch questions and options from the database
    connection = await pool.getConnection();
    const[result1]=await connection.query(sql,[examId,questionId,req.session.myid]);
    if(result1.length>0){
      const[results]=await connection.query(updateQuery,[sel_answer,examId,questionId,req.session.myid]);
      console.log(results);
      return res.status(200).json({ message: 'Attempted' });
    }else{
      const [results] = await connection.query(query, [examId,questionId,req.session.myid,sel_answer]);
      console.log(results);
      return res.status(200).json({ message: 'Attempted' });
    }
  } catch (err) {
    console.error('Error fetching questions:', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release(); // Release the database connection
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
