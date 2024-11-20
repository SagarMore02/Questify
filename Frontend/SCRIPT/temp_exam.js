// State to track the current question index and store the fetched questions
console.log("Hello Worlds");
let currentQuestionIndex = 0;
let questions = [];
let userAnswers = [];

// DOM elements
const questionId = document.getElementById("question-id");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const saveButton = document.getElementById("save-button");
const submitButton = document.getElementById("submit-button");

// Progress bar elements
const timerDisplay = document.getElementById("time-left");
const progressBar = document.getElementById("timer-bar");

// Fetch questions and exam end time from backend
async function fetchQuestions() {
    //const examId = 1; // Replace this with dynamic examId if needed

    try {
        const response = await fetch(`http://localhost:3000/get-questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        questions = data.questions;

        // Initialize userAnswers array with null values
        userAnswers = new Array(questions.length).fill(null);

        // Display the first question
        displayQuestion(currentQuestionIndex);
        // Start the timer using the exam end time
        startTimerWithEndTime(data.exam_end_time);

    } catch (error) {
        console.error('Error fetching questions:', error);
    }
}

// Function to start the timer and update the progress bar
function startTimerWithEndTime(examEndTime) {
    const [hours, minutes, seconds] = examEndTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(hours, minutes, seconds, 0);
    console.log("Exam end time :", endTime);
    
    const startTime = Date.now(); // Use the current time as start time
    const duration = (endTime - startTime) / 1000; // Total exam duration in seconds

    let timeLeft = duration;

    const timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.textContent = "Time's up!";
            //progressBar.style.width = "100%";
            progressBar.style.transform = "scaleX(0)";
            // Auto-submit the exam when time is up
            submitExam();
        } else {    
            timeLeft--;

            // Calculate hours, minutes, and seconds
            const hoursLeft = Math.floor(timeLeft / 3600);
            const totalMinutes = Math.floor((timeLeft % 3600) / 60);
            const totalSeconds = Math.floor(timeLeft % 60);

            // Format the display to include leading zeros
            timerDisplay.textContent = `${hoursLeft}:${totalMinutes < 10 ? '0' : ''}${totalMinutes}:${totalSeconds < 10 ? '0' : ''}${totalSeconds}`;

            // Update progress bar
            // const progressPercentage = ((duration - timeLeft) / duration) * 100;
            // progressBar.style.width = `${progressPercentage}%`;

            const progressPercentage = timeLeft / duration; // Calculate the remaining time percentage
            progressBar.style.transform = `scaleX(${progressPercentage})`;
        }
    }, 1000); // Update every second
}


// Function to submit the exam automatically when time is up
function submitExam() {

    fetch('/submitTest', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        //body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error submitting attempt. Please try again.');
    });

    alert("Exam Submitted. Time's up!");
    saveAnswer();
    window.close();
    
    document.getElementById("quiz").style.display = "none"; // Hide the quiz
    document.getElementById("result").style.display = "block"; // Show the result page
}

// Function to display a question and its options
function displayQuestion(index) {
    const currentQuestion = questions[index];
    questionId.textContent = currentQuestion.id;
    questionText.textContent = currentQuestion.question;

    // Clear previous options
    optionsContainer.innerHTML = '';

    // Generate options
    currentQuestion.options.forEach((option, i) => {
        const optionLabel = document.createElement("label");
        const optionInput = document.createElement("input");
        optionInput.type = "radio";
        optionInput.name = "option";
        optionInput.value = option;
        
        // Map index to letters (A, B, C, D)
        const optionLetter = String.fromCharCode(65 + i); // Converts 0 -> A, 1 -> B, 2 -> C, 3 -> D
        optionInput.setAttribute("data-option-letter", optionLetter); // Set the option letter as a data attribute
    
        // Check if the user has already selected an option for this question
        if (userAnswers[index] === option) {
            optionInput.checked = true;
        }
    
        optionLabel.appendChild(optionInput);
        optionLabel.appendChild(document.createTextNode(`${optionLetter}: ${option}`));
        optionsContainer.appendChild(optionLabel);
        optionsContainer.appendChild(document.createElement("br"));
    });
    

    // Disable the previous button if it's the first question
    prevButton.disabled = index === 0;

    // Show the submit button if it's the last question, otherwise show the next button
    if (index === questions.length - 1) {
        nextButton.style.display = "none";
        submitButton.style.display = "inline-block";
    } else {
        nextButton.style.display = "inline-block";
        submitButton.style.display = "none";
    }
}

// Save the selected answer for the current question
function saveAnswer() {
    const selectedOption = document.querySelector('input[name="option"]:checked');
    
    if (selectedOption) {
        userAnswers[currentQuestionIndex] = selectedOption.value;

        const selectedOptionLetter = selectedOption.getAttribute("data-option-letter");
        const questionId = questions[currentQuestionIndex].id;

        const sel_answer = "option" + selectedOptionLetter;
        console.log(`Question ID: ${questionId}, Selected Option: ${sel_answer}`);

        const data = {
            questionId: questionId,
            sel_answer: sel_answer
        };

        fetch('/InsertAttempt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(response);
            }
            return response.json();
        })
        .then(data => {
            if (data.amessage) {
                // Display attendance value in an alert
                alert(`Error: ${data.amessage}`);
            } 
            console.log('Success:', data);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error submitting attempt. Please try again.');
        });

    } else {
        userAnswers[currentQuestionIndex] = null;
        alert(`No option selected for Question ID: ${questions[currentQuestionIndex].id}`);
    }
}

// Event listeners for navigation buttons
prevButton.addEventListener("click", (e) => {
    e.preventDefault();
    saveAnswer();
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion(currentQuestionIndex);
    }
});

nextButton.addEventListener("click", (e) => {
    e.preventDefault();
    saveAnswer();
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
    }
});

saveButton.addEventListener("click", (e) => {
    e.preventDefault();
    saveAnswer();
    console.log(userAnswers);
});

submitButton.addEventListener("click", (e) => {
    e.preventDefault();
    submitExam();
});


// Listen for messages from the parent window
window.addEventListener('message', function(event) {
    // Ensure the message comes from the expected origin (security check)
    if (event.origin !== window.location.origin) {
        console.log("Received message from an unknown origin");
        return;
    }

    const { type, message } = event.data;

    // Display the warning if the message type is 'warning'
    if (type === 'warning') {
        const warningBanner = document.getElementById('warning-banner');
        if (warningBanner) {
            warningBanner.textContent = message;
            warningBanner.style.display = 'block'; // Show the warning
        }

        // Show the modal as part of the warning
        showModal(message);
    }

    // Terminate the exam if the message type is 'terminate'
    if (type === 'terminate') {
        alert(message); // Show the termination message
        submitExam(); // Submit the exam automatically
    }
});

// Function to show the modal with a message
function showModal(message) {
    const modal = document.getElementById('focusModal');
    const modalMessage = document.getElementById('modalMessage');
    modal.style.display = "block"; // Display the modal

    if (modalMessage) {
        modalMessage.textContent = message; // Set the message inside the modal
    }
}

// Close the modal when the OK button is clicked
function closeModal() {
    const modal = document.getElementById('focusModal');
    modal.style.display = "none";
}

// Show the modal when the page gains focus
window.addEventListener('focus', function() {
    console.log("Inside this");
    showModal("You have returned to the exam tab. Please focus on completing the exam.");
});
window.addEventListener('blur', function() {
    console.log("Inside blur");
    showModal("You have returned to the exam tab. Please focus on completing the exam.");
});



// Fetch questions when the page loads
window.onload = fetchQuestions;