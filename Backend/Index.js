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
  //password:'Aditya@123',
  password: 'sagar@123',
  //password:'pr@n@v06',
  //password:'root',
  //password:'101201',
  database: 'Questify',
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

app.get('/admin', (req, res) => {
  console.log("serving home");
  const filePath = path.join(__dirname, '../Frontend/HTML/AdminLogin.html');
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
        res.status(200).json({ redirectURL: '/OrganizationFrame.html' });
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

  app.get('/api/stu/exams', async (req, res) => {
    const sql = "SELECT * FROM exam_master;";
    const connection = await pool.getConnection();
    const [result] = await connection.execute(sql,[req.session.myid]);
    connection.release();
    res.json(result);
    });

  app.post('/api/exams/myexam', async (req, res) => {
    const{examID}=req.body;
    req.session.organExam=examID;
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

app.post('/updateExam', async (req, res) => {
  const examID=req.session.organExam;
  const {
      //examID,
      name,
      app_start_date,
      app_end_date,
      exam_start_date,
      exam_start_time,
      exam_end_time,
      total_marks,
      passing_marks,
      fees,
      syllabus
  } = req.body;
  const exam_end_date = exam_start_date;
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

  try {
      // Get the current date and time
      const currentDateTime = new Date(); // Keep as Date object
      
      // Get the connection asynchronously
      connection = await pool.getConnection();
      
      // Execute SQL to get existing exam timings
      const err_sql = `SELECT exam_start_date, exam_start_time, exam_end_date, exam_end_time FROM exam_master WHERE examID = ?`;
      const [existingExam] = await connection.execute(err_sql, [examID]);

      // Check if the exam exists
      if (existingExam.length === 0) {
          return res.status(404).json({ success: false, message: "Exam not found." });
      }

      const { 
          exam_start_date: existingExamStartDate, 
          exam_start_time: existingExamStartTime, 
          exam_end_date: existingExamEndDate, 
          exam_end_time: existingExamEndTime 
      } = existingExam[0];

      // Combine existing exam date and time for comparisons
      const existingExamStartDateTime = new Date(`${existingExamStartDate}`);
      const existingExamEndDateTime = new Date(`${existingExamEndDate}`);

      console.log("Current Date:", currentDateTime);
      console.log("Exam Start DateTime:", existingExamStartDateTime);
      console.log("Exam End DateTime:", existingExamEndDateTime);

      // Check if current date and time is within the exam period
      if (currentDateTime >= existingExamStartDateTime) {
          return res.status(400).json({ success: false, message: "Exam is live and cannot be edited." });
      }

      // Combine application dates for validation
      const appStartDateTime = new Date(app_start_date);
      const appEndDateTime = new Date(app_end_date);

      // Check if application start date is after application end date
      if (appStartDateTime > appEndDateTime) {
          return res.status(400).json({ success: false, message: "Application start date cannot be after application end date." });
      }

      // Combine new exam dates for validation
      const newExamStartDateTime = new Date(`${exam_start_date}T${exam_start_time}`);
      const newExamEndDateTime = new Date(`${exam_end_date}T${exam_end_time}`);

      // Check if exam start date is after exam end date
      if (newExamStartDateTime > newExamEndDateTime) {
          return res.status(400).json({ success: false, message: "Exam start date cannot be after exam end date." });
      }

      // Prepare the SQL query for updating exam_master
      const sql = 'UPDATE exam_master SET name = ?, app_start_date = ?, app_end_date = ?, exam_start_time = ?, exam_start_date = ?, exam_end_date = ?, exam_end_time = ?, total_marks = ?, passing_marks = ?, fees = ?, syllabus = ?, timestamp = ? WHERE examID = ?';
      console.log(name, app_start_date, app_end_date, exam_start_time, exam_start_date, exam_end_date, exam_end_time, total_marks, passing_marks, fees, syllabus, new Date(), examID);

      // Execute the query and update the data in the database
      const [result] = await connection.execute(sql, [name, app_start_date, app_end_date, exam_start_time, exam_start_date, exam_end_date, exam_end_time, total_marks, passing_marks, fees, syllabus, new Date(), examID]);
      
      console.log("Editing Exam ID:", examID);
      
      // Check if any rows were updated
      if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: "Exam not found or not authorized to update" });
      }

      console.log("Exam updated successfully, Exam ID:", examID);

      // Respond with success
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
          connection.release(); // Ensure connection is released
      }
  }
});





// //to Update Exam:
// app.post('/updateExam', async (req, res) => {
//   const {
//       examID,
//       name,
//       app_start_date,
//       app_end_date,
//       exam_start_date,
//       //exam_end_date,
//       exam_start_time,
//       exam_end_time,
//       total_marks,
//       passing_marks,
//       fees,
//       syllabus
//   } = req.body;
//   const exam_end_date = exam_start_date;
//   console.log({
//       examID,
//       name,
//       app_start_date,
//       app_end_date,
//       exam_start_date,
//       exam_end_date,
//       exam_start_time,
//       exam_end_time,
//       total_marks,
//       passing_marks,
//       fees,
//       syllabus
//   });

//   let connection;

//   try {
//       // Get the current date and time
//       const currentDateTime = new Date();

//       // Get the connection asynchronously
//       connection = await pool.getConnection();
      
//       // Execute err_sql to get existing exam timings
//       const err_sql = `SELECT exam_start_date, exam_start_time, exam_end_date, exam_end_time FROM exam_master WHERE examID = ?`;
//       const [existingExam] = await connection.execute(err_sql, [examID]);

//       // Check if the exam exists
//       if (existingExam.length === 0) {
//           return res.status(404).json({ success: false, message: "Exam not found." });
//       }

//       const { 
//           exam_start_date: existingExamStartDate, 
//           exam_start_time: existingExamStartTime, 
//           exam_end_date: existingExamEndDate, 
//           exam_end_time: existingExamEndTime 
//       } = existingExam[0];

//       console.log("*******", existingExamStartTime)

//       // Combine existing exam date and time for comparisons
//       const existingExamStartDateTime = new Date(existingExamStartDate);
//       const existingExamStartDateTimeWithTime = new Date(`${existingExamStartDate.toISOString().split('T')[0]}T${existingExamStartTime}`);
//       const existingExamEndDateTime = new Date(existingExamEndDate);
//       const existingExamEndDateTimeWithTime = new Date(`${existingExamEndDate.toISOString().split('T')[0]}T${existingExamEndTime}`);

//       console.log("====>", existingExamStartDateTimeWithTime);
//       console.log("====>", existingExamEndDateTimeWithTime);
//       console.log("====>", currentDateTime);

//       // Check if current date and time is within the exam period
//       if (currentDateTime >= existingExamStartDateTimeWithTime && currentDateTime <= existingExamEndDateTimeWithTime) {
//           return res.status(400).json({ success: false, message: "Exam is live and cannot be edited." });
//       }

//       // Combine application dates for validation
//       const appStartDateTime = new Date(app_start_date);
//       const appEndDateTime = new Date(app_end_date);

//       // Check if application start date is after application end date
//       if (appStartDateTime > appEndDateTime) {
//           return res.status(400).json({ success: false, message: "Application start date cannot be after application end date." });
//       }

//       // Combine new exam dates for validation
//       const newExamStartDateTime = new Date(`${exam_start_date}T${exam_start_time}`);
//       const newExamEndDateTime = new Date(`${exam_end_date}T${exam_end_time}`);

//       // Check if exam start date is after exam end date
//       if (newExamStartDateTime > newExamEndDateTime) {
//           return res.status(400).json({ success: false, message: "Exam start date cannot be after exam end date." });
//       }

//       // Prepare the SQL query for updating exam_master
//       const sql = 'UPDATE exam_master SET name = ?, app_start_date = ?, app_end_date = ?, exam_start_time = ?, exam_start_date = ?, exam_end_date = ?, exam_end_time = ?, total_marks = ?, passing_marks = ?, fees = ?, syllabus = ?, timestamp = ? WHERE examID = ?';
      
//       // Execute the query and update the data in the database
//       const [result] = await connection.execute(sql, [name, app_start_date, app_end_date, exam_start_time, exam_start_date, exam_end_date, exam_end_time, total_marks, passing_marks, fees, syllabus, new Date(), examID]);
//       console.log("Editing Exam ID ::" , examID);
//       // Check if any rows were updated
//       if (result.affectedRows === 0) {
//           return res.status(404).json({ success: false, message: "Exam not found or not authorized to update" });
//       }

//       console.log("Exam updated successfully, Exam ID: " + examID);

//       // Respond with success
//       res.json({
//           success: true,
//           message: "Exam updated successfully",
//           examID: examID
//       });

//   } catch (error) {
//       console.error("Error updating exam data:", error);
//       res.status(500).json({ success: false, message: "Error updating exam" });
//   } finally {
//       if (connection) {
//           connection.release(); // Make sure to release the connection
//       }
//   }
// });



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
app.post('/addQuestion', async (req, res) => {
  const { question, question_marks, options, correctOpt } = req.body;
  let triggerTest=false;
  const paddedOptions = Array(6).fill(null).map((_, i) => options[i] || null);
  console.log(...paddedOptions);
  let connection;
  try {
      connection = await pool.getConnection();
      
      // Get the exam's total marks from exam_master
      const check_exam_marks = `SELECT total_marks FROM exam_master WHERE examID = ?`;
      const [check_exam_result] = await connection.execute(check_exam_marks, [req.session.examID]);

      // Get the sum of current question marks for this exam from Question_Master
      const check_question_marks = `SELECT IFNULL(SUM(question_marks), 0) AS questotal FROM Question_Master WHERE examID = ?`;
      const [check_question_result] = await connection.execute(check_question_marks, [req.session.examID]);

      const currentTotalMarks = Number(check_question_result[0].questotal);
      const examTotalMarks = Number(check_exam_result[0].total_marks);
      console.log("Current Marks:",(currentTotalMarks+Number(question_marks)));
      console.log("Exam Total Marks",examTotalMarks);
      // Check if adding the new question's marks would exceed the total marks allowed for the exam
      if (examTotalMarks < (currentTotalMarks + Number(question_marks))) {
        console.log("Current Marks Inside IF:",(currentTotalMarks+Number(question_marks)));
          res.status(400).json({ 
              message: 'Question Marks are Exceeding Exam Total Marks!', 
              receivedData: req.body,
              currentTotalMarks,
              triggerSetTest:triggerTest,
              attemptedQuestionMarks: question_marks
          });
          return;  // Stop further execution after sending a response
      }

      const sql = `
          INSERT INTO Question_Master 
          (examID, question, optionA, optionB, optionC, optionD, optionE, optionF, answer_key, question_marks, timestamp) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await connection.execute(sql, [
          req.session.examID,
          question,
          ...paddedOptions,
          correctOpt,
          question_marks,
          new Date()
      ]);
      if (examTotalMarks == (currentTotalMarks + Number(question_marks))) {
        triggerTest=true;
      }
      res.status(200).json({ message: 'Question added successfully!',triggerSetTest:triggerTest, receivedData: req.body });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error processing request.');
  } finally {
      if (connection) connection.release();
  }
});



app.get('/getApplicantResult', (req, res) => {
  console.log("Applicant Results :",req.session.myid);
  const filePath = path.join(__dirname, '../Frontend/HTML/ApplicantResults.html');
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

//Result:::
app.get('/ApplicantResult', async (req, res) => {
  const appID = req.session.myid; // Get the applicant ID from the session
  const example = 'SELECT PersonalID FROM application_master where applicationID=? AND attendance!="Pending"';


  const sql = `SELECT
      a.PersonalID ,
      e.passing_marks,
      u.userID AS applicationID,
      u.firstname AS applicant_name,
      u.lastname AS applicant_lastname,
      e.examID as examID,
      e.name AS exam_name,
      (SELECT COALESCE(SUM(q.question_marks), 0) 
       FROM attempt_master a
       JOIN question_master q ON a.examID = q.examID AND a.questionID = q.questionID
       WHERE a.applicationID = u.userID AND a.examID = e.examID AND a.selected_option = q.answer_key) AS marks_obtained, 
      e.total_marks,
      CASE 
          WHEN (SELECT COALESCE(SUM(q.question_marks), 0) 
                FROM attempt_master a
                JOIN question_master q ON a.examID = q.examID AND a.questionID = q.questionID
                WHERE a.applicationID = u.userID AND a.examID = e.examID AND a.selected_option = q.answer_key) >= e.passing_marks 
          THEN 'Passed'
          ELSE 'Failed'
      END AS status
  FROM 
      User_Master u
  JOIN 
      Application_Master a ON u.userID = a.applicationID
  JOIN 
      Exam_Master e ON a.examID = e.examID
  WHERE 
      u.userID = ?;`;

  let connection;
  try {
      connection = await pool.getConnection();
      const [exampleRes] = await connection.query(example, [appID]);
      console.log("Application Status:",exampleRes);
      if (exampleRes.length > 0) {
        // Extract PersonalIDs from exampleRes
        const personalIDs = exampleRes.map(row => row.PersonalID);
        const [result] = await connection.query(sql, [appID]); // Use connection.query instead of connection.execute
        const filteredResults = result.filter(row => personalIDs.includes(row.PersonalID));
        console.log("Filtered Result: ",result);
        console.log("Filtered Result: ",filteredResults);
        console.log("Personal IDs from exampleRes:", personalIDs);
        console.log("Results from the main query:", result);
        res.status(200).json(filteredResults);
      }else{
        res.status(500).json({ error: 'NA' });
      }
       // Correct the syntax for sending JSON response
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' }); // Send an error response
  } finally {
      if (connection) connection.release(); // Release the connection back to the pool
  }
});

//Check IF there is any test

app.get('/CheckTest', async(req, res) => {
  console.log("serving Check Test");
  const sql = 'Select * from question_master where examID=?';
  const connection = await pool.getConnection();
  const [result] = await connection.query(sql,[req.session.examID]);
  if(result.length>0){
    console.log("Values");
    res.status(200).json({message:'There are Values'});
  }else{
    res.status(400).json({message:'Please Add atleast one question'});
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
  const connection = await pool.getConnection();
  const attempts='Delete from attempt_master WHERE examID=?';
  const[result0]=await connection.execute(attempts,[examID]);
  const sql = "DELETE FROM question_master WHERE examID=?";
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
      console.log("Inserting in organizer_organization");
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
    const filePath = path.join(__dirname, '../Frontend/HTML/Index.html'); // Adjust the path as necessary
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(err.status || 500).send('Error sending file');
        } else {
          console.log('File sent:', filePath);
        }
      });
    //res.status(200).json({message:'SuccessFull'}); // Adjust the redirect URL as needed
  });
});

app.get('/start_exam', async (req, res) => {
  const {examID} = req.query;
  req.session.testExamID=examID;
  const sql ='Select appstatus,attendance from Application_Master where applicationID=? and examID=?';
  let connection = await pool.getConnection();

  const [result]= await connection.execute(sql,[req.session.myid,examID]);
  console.log("Application Status:",result[0].appstatus);
  console.log("Examid: ",examID,"UserID: ",req.session.myid);
  console.log("Application Attendance:",result[0].attendance);
  if(result[0].appstatus==='Active' && result[0].attendance!='Present'){
  console.log("serving home with examID:", req.session.testExamID);
  const filePath = path.join(__dirname, '../Frontend/HTML/exam.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(err.status || 500).json({message:'Error sending file'});
    }
  });
}else{
  
}
});

app.post('/get-questions', async (req, res) => {
  const examId = req.session.testExamID; // examId comes from URL params
  let connection;
  
  // Modified query to fetch questions and their corresponding options from question_master
  const query = `SELECT q.questionID, q.examID, q.question, q.optionA, q.optionB, q.optionC, q.optionD,q.optionE, q.optionF, 
       e.exam_start_time, e.exam_end_time 
        FROM question_master q 
        JOIN exam_master e ON q.examID = e.examID
        WHERE q.examID = ?
        GROUP BY q.questionID, q.examID, q.question, q.optionA, q.optionB, q.optionC, q.optionD,q.optionE,q.optionF, e.exam_start_time, e.exam_end_time;
`;

  try {
    // Fetch questions and options from the database
    connection = await pool.getConnection();

    const [results] = await connection.query(query, [examId]);

    if (results.length === 0) {
      console.log("eroor");
      return res.status(404).json({ message: 'No questions found for this exam.' });
    }
    console.log(results);

    // Format the questions and options into an array
    const questionsArray = results.map(row => ({
      id: row.questionID, // Add questionID to the object
      question: row.question,
      options: [row.optionA, row.optionB, row.optionC, row.optionD,row.optionE,row.optionF]
    }));

    // Send the formatted questions array back to the frontend
    res.json({ examId, questions: questionsArray,exam_end_time: results[0].exam_end_time });
  } catch (err) {
    console.error('Error fetching questions:', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release(); // Release the database connection
  }
});
//Update Questions Api
app.post('/updateQuestion', async (req, res) => {
  const {questionId,updatedQuestion,options,correctOption,totalMarks}=req.body
  const examID = req.session.organExam;
  let connection;
  // Modified query to fetch questions and their corresponding options from question_master
  const query = `select * from question_master where questionID=?;`;
  const ins_query=`Insert Into question_master(examID,question,optionA,optionB,optionC,optionD,optionE,optionF,answer_key,question_marks) values(?,?,?,?,?,?,?,?);`;
  const update_query =`UPDATE question_master set question=?,optionA=?,optionB=?,optionC=?,optionD=?,optionE=?,optionF=?,answer_key=?,question_marks=? where questionID=?`;
  try {
    // Fetch questions and options from the database
    connection = await pool.getConnection();

    const [results] = await connection.query(query, [questionId]);

    if (results.length === 0) {
      //return res.status(404).json({ message: 'No questions found for this exam.' });
      const[ins_result]=await connection.query(ins_query,[examID,updatedQuestion,options[1],options[2],options[3],options[4],options[5],options[6],correctOption,totalMarks]);;
    
    }else{
      const[update_result]=await connection.query(update_query,[updatedQuestion,options[1],options[2],options[3],options[4],options[5],options[6],correctOption,totalMarks,questionId]);
    }
    res.status(200).json({ message:"Success" });
  } catch (err) {
    console.error('Error fetching questions:', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release(); // Release the database connection
  }
});

//Delete THe QUestion::
app.post('/deleteQuestion', async (req, res) => {
  const { questionId } = req.body;

  // Check if questionId is provided
  if (!questionId) {
      return res.status(400).json({ message: 'Question ID is required' });
  }

  let connection;
  try {
      // Get a connection from the pool
      connection = await pool.getConnection();

      // SQL query to delete the question by its ID
      const deleteQuery = 'DELETE FROM Question_Master WHERE questionID = ?';
      const [result] = await connection.query(deleteQuery, [questionId]);

      // Check if any rows were affected
      if (result.affectedRows > 0) {
          return res.status(200).json({ message: 'Question deleted successfully' });
      } else {
          return res.status(404).json({ message: 'Question not found' });
      }
  } catch (error) {
      console.error('Error deleting question:', error);
      return res.status(500).json({ message: 'Error deleting question' });
  } finally {
      // Release the connection back to the pool
      if (connection) {
          connection.release();
      }
  }
});


//Get Editing Questions
app.post('/get-my-questions', async (req, res) => {
  console.log("In get my ques");
  const examId = req.session.organExam; // examId comes from URL params
  let connection;

  // Modified query to fetch questions and their corresponding options from question_master
  const query = `select q.questionID, q.question, q.optionA, q.optionB, q.optionC, q.optionD,q.optionE,q.optionF,e.exam_start_time,e.exam_end_time,q.question_marks from question_master q join exam_master e on e.examID=?;`;

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
      options: [row.optionA, row.optionB, row.optionC, row.optionD,row.optionE, row.optionF],
      totalMarks: row.question_marks
    }));

    // Send the formatted questions array back to the frontend
    res.json({ examId, questions: questionsArray,exam_end_time: results[0].exam_end_time });
  } catch (err) {
    console.error('Error fetching questions:', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release(); // Release the database connection
  }
});



app.get('/Exam', (req, res) => {
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
    console.log("req.session.myid==",req.session.myid);
    const [result] = await connection.query('select * from exam_master where examID in (select examID from application_master where attendance="Pending" and applicationID=?)', [req.session.myid]);//me]);//
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
  console.log(questionId);
  connection = await pool.getConnection();
  const err_atten= `select attendance from Application_Master where examID=? and applicationID=?`;
  const[atten] = await connection.execute(err_atten,[examId,req.session.myid]);
  if(atten[0].attendance!=='Pending'){
    console.log("Attendence: ",atten[0].attendence,"ExamId: ",examId,"Application id : ",req.session.myid);
    return res.status(400).json({ amessage: 'Exam is Over!!' });
  }
  const sql= 'Select * from Attempt_Master where examID=? and questionID=? and applicationID=?';
  // Modified query to fetch questions and their corresponding options from question_master
  const query = `INSERT INTO Attempt_Master (examID, questionID, applicationID, selected_option) VALUES(?,?,?,?)`;
  const updateQuery = 'UPDATE Attempt_Master SET selected_option = ? WHERE examID = ? AND questionID = ? AND applicationID = ?';
  try {
    // Fetch questions and options from the database
    
    const[result1]=await connection.query(sql,[examId,questionId,req.session.myid]);
    console.log(result1.length);
    if(result1.length>0 ){
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

//submit
app.post('/submitTest', async (req, res) => { // examId comes from URL params
  let connection;
  const examId = req.session.testExamID
  //const sql= 'Select * from Attempt_Master where examID=? and questionID=? and applicationID=?';
  // Modified query to fetch questions and their corresponding options from question_master
  //const query = `INSERT INTO Attempt_Master (examID, questionID, applicationID, selected_option) VALUES(?,?,?,?)`;
  const updateQuery = 'UPDATE Application_master SET attendance = "Present" WHERE examID = ? AND applicationID = ?';
  try {
    // Fetch questions and options from the database
    connection = await pool.getConnection();
    console.log("Setting Updated Value: ExamID: ",examId,"ApplicationID: ",req.session.myid);
    const[result1]=await connection.query(updateQuery,[examId,req.session.myid]);
    return res.status(200).json({ message: 'Attempted' });
  } catch (err) {
    console.error('Error fetching questions:', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    if (connection) connection.release(); // Release the database connection
  }
});

// app.post('/check-result', async (req, res) => {
//   const { studentid, examid } = req.body;

  

//   const connection = await pool.getConnection();

//   try {
//     // Query 1: Fetch passing marks
//     const passQuery = 'SELECT passing_marks FROM exam_master WHERE examID = ?';
//     const [passResult] = await connection.query(passQuery, [examid]);

//     if (!passResult.length) {
//       return res.status(404).json({ message: 'Exam not found' });
//     }

//     const passingMarks = passResult[0].passing_marks;

//     // Query 2: Fetch attempt and question data
//     const fetchMarksQuery = `
//       SELECT 
//       a.examID, 
//       a.questionID, 
//       a.selected_option, 
//       q.answer_key, 
//       q.question_marks,
//       e.total_marks,
//       e.passing_marks
//       FROM attempt_master a
//       JOIN question_master q 
//           ON a.examID = q.examID AND a.questionID = q.questionID
//       JOIN exam_master e 
//           ON a.examID = e.examID
//       WHERE a.examID = ?;`;

//     const [attemptResults] = await connection.query(fetchMarksQuery, [examid]);
    
//     if (attemptResults.length<=0) {
//       return res.status(404).json({ message: 'No attempts found for this student or exam' });
//     }
//     console.log("Checking Result FOr organizer");
//     // Initialize total score
//     let totalScore = 0;
//     let passing_marks=0;
//     let totalMarks=0;

//     // Process each question: Compare selected_option with answer_key and sum marks if correct
//     attemptResults.forEach(row => {
//       if (row.selected_option === row.answer_key) {
//         totalScore += row.question_marks;
//       }
//     });

//     attemptResults.forEach(row => {
//       passing_marks=row.passing_marks;
//       totalMarks = row.total_marks;
//     });


//     // Determine pass or fail based on totalScore and passingMarks
//     const status = totalScore >= passingMarks ? 'Passed' : 'Failed';

//     // Return the result to the frontend
//     res.json({
//       studentid: studentid,
//       examid: examid,
//       totalScore: totalScore,
//       passing_marks: passing_marks,
//       totalMarks:totalMarks,
//       status: status
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   } finally {
//     connection.release();
//   }
// });

app.post('/check-result', async (req, res) => {
  //const { examid } = req.body; // No longer using studentid in the request body since we fetch all students
  const connection = await pool.getConnection();
  //console.log("=====>", examid);
  const examid=1;

  try {
    // Query 1: Fetch passing marks and total marks for the exam
    const passQuery = 'SELECT passing_marks, total_marks FROM exam_master WHERE examID = ?';
    const [passResult] = await connection.query(passQuery, [examid]);

    if (!passResult.length) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const passingMarks = passResult[0].passing_marks;
    const totalMarks = passResult[0].total_marks;

    // Query 2: Fetch attempt and question data for all students who took this exam
    const fetchMarksQuery = `
      SELECT 
        a.applicationID,
        a.examID, 
        a.questionID, 
        a.selected_option, 
        q.answer_key, 
        q.question_marks
      FROM attempt_master a
      JOIN question_master q 
          ON a.examID = q.examID AND a.questionID = q.questionID
      WHERE a.examID = ?;`;

    const [attemptResults] = await connection.query(fetchMarksQuery, [examid]);

    if (attemptResults.length === 0) {
      return res.status(404).json({ message: 'No attempts found for this exam' });
    }

    console.log("Checking Results For Organizer");

    // Group student attempts by studentID
    const studentScores = {};

    attemptResults.forEach(row => {
      if (!studentScores[row.applicationID]) {
        studentScores[row.applicationID] = {
          applicationID: row.applicationID,
          totalScore: 0
        };
      }
      // Compare selected_option with answer_key and sum marks if correct
      if (row.selected_option === row.answer_key) {
        studentScores[row.applicationID].totalScore += row.question_marks;
      }
    });

    // Prepare results for all students
    const results = Object.keys(studentScores).map(applicationID => {
      const student = studentScores[applicationID];
      const status = student.totalScore >= passingMarks ? 'Passed' : 'Failed';

      return {
        applicationID: applicationID,
        examid: examid,
        totalScore: student.totalScore,
        passingMarks: passingMarks,
        totalMarks: totalMarks,
        status: status
      };
    });

    // Return the results for all students
    res.json(results);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
});




app.get('/getExamIds', async (req, res) => {
  const sql = "SELECT examID FROM exam_master";  // Fetch all examIDs from exam_master
  const connection = await pool.getConnection();

  try {
    const [exams] = await connection.query(sql);  // No need for req.session.myid here as we fetch all exams
    res.json(exams);  // Send the list of examIDs as a response
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
});


app.get('/getOrganizer', async (req, res) => {
  const organizationId = req.session.myid; // Assuming the username is stored in session

  if (!organizationId) {
    return res.status(401).json({ message: 'Unauthorized: Organization not logged in' });
  }

  const connection = await pool.getConnection();

  try {

    // Step 2: Fetch all organizers linked to this organizationID
    const sqlFetchOrganizers = `
      SELECT u.userID as organizerID, u.username as organizerName, u.email as organizerEmail, u.mobile as organizerPhone
      FROM user_master as u
      WHERE userID IN (SELECT organizerID FROM Organizer_Organization WHERE organizationID = ?);
;
    `;
    const [organizers] = await connection.query(sqlFetchOrganizers, [organizationId]);

    // Step 3: Send the list of organizers as a response
    res.json(organizers);
  } catch (error) {
    console.error('Error fetching organizers:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
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

app.post('/AdminLogin', async (req, res) => {
  const { username, password } = req.body;
  const connection = await pool.getConnection();
  try {
    const sql = 'SELECT * FROM superuser WHERE username = ?';
    const [result] = await connection.execute(sql, [username]);
    connection.release();

    if (result.length === 0) {
      return res.status(404).json({ message: 'No such username found.' });
    }

    const user = result[0];
    const passwordsql = user.password;

    if (!await bcrypt.compare(password, passwordsql)) {
      return res.status(401).json({ message: 'Incorrect password.' });
    } else {
      // If login is successful, send the admin HTML file
      const filePath = path.join(__dirname, '../Frontend/HTML/Index.html'); // Adjust the path as necessary
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(err.status || 500).send('Error sending file');
        } else {
          console.log('File sent:', filePath);
        }
      });
    }
  } catch (error) {
    console.error("Error For Admin Login:", error);
    res.status(500).json({ success: false, message: "Error during login." });
  }
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
