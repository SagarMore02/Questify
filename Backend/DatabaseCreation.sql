CREATE DATABASE IF NOT EXISTS `Questify`;
    USE `Questify`;

    CREATE TABLE if not exists `SuperUser`(
        `username` varchar(20) NOT NULL,
        `password` varchar(20) NOT NULL
    );

    CREATE TABLE if not exists `User_Master`(
        `userID` int NOT NULL,
        `username` varchar(20) NOT NULL,
        `password` varchar(20) NOT NULL,
        `firstname` varchar(10) NOT NULL,
        `lastname` varchar(10),
        `usertype` enum('Applicant','Organization','Organizer') NOT NULL,
        `mobile` varchar(15) NOT NULL,
        `email` varchar(25) NOT NULL,
        `status` enum('Pending','Active','Inactive') DEFAULT 'Pending',
        `timestamp` timestamp NOT NULL,
        PRIMARY KEY (`userID`)
    );

    CREATE TABLE if not exists `Organization`(
        `organizationID` int NOT NULL,
        `name` varchar(10) NOT NULL,
        `location` varchar(15) NOT NULL,
        `timestamp` timestamp NOT NULL,
        FOREIGN KEY (`organizationID`) REFERENCES `User_Master` (`userID`)
    );

    CREATE TABLE if not exists `Exam_Organizer`(
        `examorganID` int NOT NULL,
        `organizationID` int NOT NULL,
        `timestamp` timestamp NOT NULL,
        FOREIGN KEY (`examorganID`) REFERENCES `User_Master` (`userID`),
        FOREIGN KEY (`organizationID`) REFERENCES `Organization` (`organizationID`)
    );

    /*Complete Your Profile To Register For A Test And Approval Of Fees*/
    CREATE TABLE if not exists `Application_Master`(
        `applicationID` int NOT NULL,
        `examID` int NOT NULL,
        `adhaarcard` varchar(14) NOT NULL,
        `feesstatus` enum('Paid','Pending') NOT NULL,
        `tokenid` varchar(30) NOT NULL,
        `appstatus` enum('Pending','Active','Inactive') NOT NULL,
        `attendance` enum('Pending','Present','Absent') NOT NULL,
        `marks` int NOT NULL,
        `timestamp` timestamp NOT NULL,
        FOREIGN KEY (`applicationID`) REFERENCES `User_Master` (`userID`),
        PRIMARY KEY (`examID`, `applicationID`)
        
    );

    CREATE TABLE if not exists `Exam_Master`(
        `examID` int NOT NULL,
        `organizerID` int NOT NULL,
        `name` varchar(15) NOT NULL,
        `app_start_date` date NOT NULL,
        `app_end_date` date NOT NULL,
        `exam_start_time` time NOT NULL,
        `exam_end_date` date NOT NULL,
        `exam_end_time` time NOT NULL,
        `total_marks` int NOT NULL,
        `passing_marks` int NOT NULL,
        `status` enum('Pending','Completed') NOT NULL,
        `fees` int NOT NULL,
        `syllabus` varchar(100) NOT NULL,
        `timestamp` timestamp NOT NULL,
        PRIMARY KEY (`examID`,`organizerID`),
        FOREIGN KEY (`organizerID`) REFERENCES `Exam_Organizer` (`examorganID`)
    );

    CREATE TABLE if not exists `Question_Master`(
        `questionID` int NOT NULL,
        `examID` int NOT NULL,
        `questiontype` varchar(20) NOT NULL,
        `question` varchar(70) NOT NULL,
        `optionA` varchar(40) NOT NULL,
        `optionB` varchar(40) NOT NULL,
        `optionC` varchar(40) NOT NULL,
        `optionD` varchar(40) NOT NULL,
        `answer_key` enum('optionA','optionB','optionC','optionD') NOT NULL,
        `question_marks` int NOT NULL,
        `timestamp` timestamp NOT NULL,
        PRIMARY KEY (`questionID`, `examID`),
        FOREIGN KEY (`examID`) REFERENCES `Exam_Master` (`examID`)
    );

    CREATE TABLE if not exists `Attempt_Master`(
        `attemptID` int UNIQUE NOT NULL,
        `examID` int NOT NULL,
        `questionID` int NOT NULL,
        `applicationID` int NOT NULL,
        `selected_option` enum('optionA','optionB','optionC','optionD') NOT NULL,
        `correct_option` enum('optionA','optionB','optionC','optionD') NOT NULL,
        `marks_obt` int NOT NULL,
        `timestamp` timestamp NOT NULL,
        PRIMARY KEY (`examID`, `questionID`, `applicationID`),
        FOREIGN KEY (`examID`) REFERENCES `Application_Master` (`examID`),
        FOREIGN KEY (`questionID`) REFERENCES `Question_Master` (`questionID`),
        FOREIGN KEY (`applicationID`) REFERENCES `Application_Master` (`applicationID`)
    );

    CREATE TABLE if not exists `Transaction_Master`(
        `trans_id` int NOT NULL,
        `exam_id` int NOT NULL,
        `paidfees` int NOT NULL,
        `upi_token` varchar(40) NOT NULL,
        `timestamp` timestamp NOT NULL,
        PRIMARY KEY (`trans_id`),
        FOREIGN KEY (`exam_id`) REFERENCES `Exam_Master` (`examID`)
    );
