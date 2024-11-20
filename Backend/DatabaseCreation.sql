DROP DATABASE IF EXISTS Questify;
CREATE DATABASE IF NOT EXISTS Questify;
USE Questify;

-- Table for registering table numbers and names
CREATE TABLE IF NOT EXISTS Table_Registry (
    tableID INT NOT NULL AUTO_INCREMENT,
    table_name VARCHAR(50) NOT NULL,
    table_number INT NOT NULL UNIQUE,
    PRIMARY KEY (tableID)
);

-- SuperUser table
CREATE TABLE IF NOT EXISTS SuperUser(
    username VARCHAR(20) NOT NULL,
    password VARCHAR(300) NOT NULL
);
INSERT INTO Table_Registry (table_name, table_number) VALUES ('SuperUser', 1);

-- User_Master table
CREATE TABLE IF NOT EXISTS User_Master(
    userID INT NOT NULL UNIQUE AUTO_INCREMENT,
    username VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(300) NOT NULL,
    firstname VARCHAR(10) NOT NULL,
    lastname VARCHAR(10),
    usertype ENUM('Applicant','Organization','Organizer') NOT NULL,
    Department ENUM('Computer-Science','Computer-Applications','Data-Science','IMCA','N/A') DEFAULT 'N/A',
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    status ENUM('Pending','Active','Inactive') DEFAULT 'Pending',
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userID)
);
INSERT INTO Table_Registry (table_name, table_number) VALUES ('User_Master', 2);

-- Organization table
CREATE TABLE IF NOT EXISTS Organization(
    organizationID INT NOT NULL UNIQUE,
    name VARCHAR(10) NOT NULL,
    location VARCHAR(15) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizationID) REFERENCES User_Master (userID)
);
INSERT INTO Table_Registry (table_name, table_number) VALUES ('Organization', 3);

-- Application_Master table
CREATE TABLE IF NOT EXISTS Application_Master(
    PersonalID INT NOT NULL UNIQUE AUTO_INCREMENT,
    applicationID INT NOT NULL,
    examID INT NOT NULL,
    adhaarcard VARCHAR(14) NOT NULL,
    feesstatus ENUM('Paid','Pending') NOT NULL DEFAULT 'Pending',
    tokenid VARCHAR(30),
    appstatus ENUM('Pending','Active','Inactive') NOT NULL DEFAULT 'Pending',
    attendance ENUM('Pending','Present','Absent') NOT NULL DEFAULT 'Pending',
    marks INT NOT NULL DEFAULT 0,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicationID) REFERENCES User_Master (userID),
    PRIMARY KEY (examID, applicationID)
);
INSERT INTO Table_Registry (table_name, table_number) VALUES ('Application_Master', 4);

-- Organizer_Organization table
CREATE TABLE IF NOT EXISTS Organizer_Organization(
    organizerID INT NOT NULL UNIQUE,
    organizationID INT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizerID) REFERENCES User_Master (userID),
    FOREIGN KEY (organizationID) REFERENCES Organization(organizationID),
    PRIMARY KEY (organizerID, organizationID)
);
INSERT INTO Table_Registry (table_name, table_number) VALUES ('Organizer_Organization', 5);

-- Exam_Master table
CREATE TABLE IF NOT EXISTS Exam_Master(
    examID INT NOT NULL UNIQUE AUTO_INCREMENT,
    organizerID INT NOT NULL,
    Department ENUM('Computer-Science','Computer-Applications','Data-Science','IMCA','N/A') DEFAULT 'N/A',
    name VARCHAR(15) NOT NULL,
    app_start_date DATE NOT NULL,
    app_end_date DATE NOT NULL,
    exam_start_time TIME NOT NULL,
    exam_start_date DATE NOT NULL,
    exam_end_date DATE NOT NULL,
    exam_end_time TIME NOT NULL,
    total_marks INT NOT NULL,
    passing_marks INT NOT NULL,
    status ENUM('Pending','Stopped','Completed') NOT NULL,
    fees INT NOT NULL,
    syllabus VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (examID),
    FOREIGN KEY (organizerID) REFERENCES Organizer_Organization (organizerID)
);
INSERT INTO Table_Registry (table_name, table_number) VALUES ('Exam_Master', 6);

-- Question_Master table
CREATE TABLE IF NOT EXISTS Question_Master(
    questionID INT NOT NULL UNIQUE AUTO_INCREMENT,
    examID INT NOT NULL,
    questiontype VARCHAR(20) NULL,
    question VARCHAR(70) NOT NULL,
    optionA VARCHAR(40) NULL,
    optionB VARCHAR(40) NULL,
    optionC VARCHAR(40) NULL,
    optionD VARCHAR(40) NULL,
    optionE VARCHAR(40) NULL,
    optionF VARCHAR(40) NULL,
    answer_key ENUM('optionA','optionB','optionC','optionD','optionE','optionF','UnSelected') NOT NULL,
    question_marks INT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (questionID, examID),
    FOREIGN KEY (examID) REFERENCES Exam_Master (examID)
);
INSERT INTO Table_Registry (table_name, table_number) VALUES ('Question_Master', 7);

-- Attempt_Master table
CREATE TABLE IF NOT EXISTS Attempt_Master (
    attemptID INT UNIQUE NOT NULL AUTO_INCREMENT,
    examID INT NOT NULL,
    questionID INT NOT NULL,
    applicationID INT NOT NULL,
    selected_option ENUM('optionA', 'optionB', 'optionC', 'optionD','optionE','optionF') NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (examID, questionID, applicationID),
    FOREIGN KEY (examID, applicationID) REFERENCES Application_Master (examID, applicationID),
    FOREIGN KEY (questionID) REFERENCES Question_Master (questionID)
);
INSERT INTO Table_Registry (table_name, table_number) VALUES ('Attempt_Master', 8);

-- Transaction_Master table
CREATE TABLE IF NOT EXISTS Transaction_Master(
    trans_id INT NOT NULL UNIQUE,
    exam_id INT NOT NULL UNIQUE,
    paidfees INT NOT NULL,
    upi_token VARCHAR(40) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (trans_id),
    FOREIGN KEY (exam_id) REFERENCES Exam_Master (examID)
);
INSERT INTO Table_Registry (table_name, table_number) VALUES ('Transaction_Master', 9);

-- Log table to track changes
CREATE TABLE IF NOT EXISTS Change_Log (
    logID INT NOT NULL AUTO_INCREMENT,
    table_number INT NOT NULL,
    changed_by VARCHAR(20) NOT NULL,
    change_type ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    change_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (logID),
    FOREIGN KEY (table_number) REFERENCES Table_Registry (table_number)
);
INSERT INTO Table_Registry (table_name, table_number) VALUES ('Change_Log', 10);
INSERT INTO superuser (username, password)VALUES ('PranavG','$2a$10$gMfp1O9EtcY3cs2T3eDKdO/vTBalC.Yv2L/MpQF3rtICYoGje9JF.');
INSERT INTO superuser (username, password)VALUES ('PranavT','$2a$10$jc3Y76ezMnSgaitsfsrHUuTAzmPLJXwnh/rqyzRu9/4uaK8QWIY36');
INSERT INTO superuser (username, password)VALUES ('YashK','$2a$10$1i.jk33wWtrbVHC0BTkyP.2bRjf5aAYmrrc/7EW0utLojTqWTacpu');
INSERT INTO superuser (username, password)VALUES ('AdityaT','$2a$10$jc3Y76ezMnSgaitsfsrHUuTAzmPLJXwnh/rqyzRu9/4uaK8QWIY36');
INSERT INTO superuser (username, password)VALUES ('SagarM','$2a$10$57BRif12uAt5ndBlv8bljeEuWiz7LMaieOrVshujlixvJrg1lfU.G');
-- Display all tables
SHOW TABLES;
