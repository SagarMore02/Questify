// State to track the current question index and store the fetched questions
let currentQuestionIndex = 0;
let questions = [];
let userAnswers = [];
let examId;

// DOM elements
const questionId = document.getElementById("question-id");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const saveButton = document.getElementById("save-button");
const submitButton = document.getElementById("submit-button");
const progressContainer = document.getElementById("progress-container"); // Updated to the correct ID

// Progress bar elements
const timerDisplay = document.getElementById("time-left");
const progressBar = document.getElementById("timer-bar");

// Fetch questions and exam end time from backend
async function fetchQuestions() {
    try {
        const response = await fetch(`http://localhost:3000/get-questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            console.error(`Fetch error: ${response.status} ${response.statusText}`); // Log the error
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data);
        examId = data.examId;
        questions = data.questions;
        console.log("===TEtetetetete=======>", questions)

        // Initialize userAnswers array with null values
        userAnswers = new Array(questions.length).fill(null);

        // Display the first question
        displayQuestion(currentQuestionIndex);
        // Start the timer using the exam end time
        startTimerWithEndTime(data.exam_end_time);

        // Generate progress buttons for question navigation
        generateProgressButtons();

    } catch (error) {
        console.error('Error fetching questions:', error);
    }
}


function generateProgressButtons() {
    progressContainer.innerHTML = ''; // Clear the container

    questions.forEach((_, index) => {
        const button = document.createElement('button');
        button.textContent = index + 1; // Button will show the question number
        button.classList.add('progress-btn');
        
        // Add click event listener to navigate to the clicked question
        button.addEventListener('click', () => {
            saveAnswer(); // Save the current answer before switching question
            currentQuestionIndex = index; // Update current index
            displayQuestion(currentQuestionIndex); // Display the selected question
            updateActiveButton(); // Update the active button styling
        });

        progressContainer.appendChild(button); // Append button to the progress container
    });

    updateActiveButton(); // Mark the first question button as active
}

// Function to highlight the active button
function updateActiveButton() {
    const buttons = progressContainer.querySelectorAll('.progress-container'); // Select all buttons within the progress container
    buttons.forEach((button, index) => {
        button.classList.remove('active'); // Remove active class from all buttons
        if (index === currentQuestionIndex) {
            button.classList.add('active'); // Add active class to the current button
        }
        
        // Mark completed questions
        if (userAnswers[index] !== null) {
            button.classList.add('completed'); // Add completed class for answered questions
        } else {
            button.classList.remove('completed'); // Remove completed class if not answered
        }
    });
}

// Function to start the timer and update the progress bar
function startTimerWithEndTime(examEndTime) {
    const [hours, minutes, seconds] = examEndTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(hours, minutes, seconds, 0);
    
    const startTime = Date.now(); // Use the current time as start time
    const duration = (endTime - startTime) / 1000; // Total exam duration in seconds

    let timeLeft = duration;

    const timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.textContent = "Time's up!";
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
            const progressPercentage = timeLeft / duration; // Calculate the remaining time percentage
            progressBar.style.transform = `scaleX(${progressPercentage})`;
        }
    }, 1000); // Update every second
}
let sc=0;
// Function to submit the exam automatically when time is up
async function submitExam() {
    console.log("Calling Submit ",sc++);
    await fetch('/submitTest', {
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
        //alert('Error submitting attempt. Please try again.');
        //alert('Error:', error);
    });

    //alert("Exam Submitted. Time's up!****");
    saveAnswer();
    document.getElementById("quiz").style.display = "none"; // Hide the quiz
    document.getElementById("result").style.display = "block"; // Show the result page
    window.opener.location.reload();
    window.close();
}

// Function to display a question and its options
function displayQuestion(index) {
    const currentQuestion = questions[index];
    questionId.textContent = currentQuestion.id;
    questionText.textContent = currentQuestion.question;

    // Clear previous options
    optionsContainer.innerHTML = '';
    console.log("************************************* ");
    // Generate options
    currentQuestion.options.forEach((option, i) => {
        console.log("Logging I",i);
        console.log("Logging option",option);
        if (option === null || option === "NULL") return;
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

    // Update the active question in the progress list
    updateActiveButton();
}

// Update the progress bar whenever the user saves an answer
function updateProgress() {
    questions.forEach((_, index) => {
        const progressItem = document.getElementById(`progress-container`);
        if (userAnswers[index] !== null) {
            progressItem.classList.add('completed');
        } else {
            progressItem.classList.remove('completed');
        }
    });
}

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

        updateProgress();

    } else {
        userAnswers[currentQuestionIndex] = null;
        //alert(`No option selected for Question ID: ${questions[currentQuestionIndex].id}`);
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
document.getElementById("home-button").addEventListener("click", function() {
    window.location.href = "applicantDash.html"; // Change "index.html" to your actual home page URL
  });
window.addEventListener("beforeunload", async (event) => {
    // Your function or logic here
    console.log("Tab or window is being closed!");
    if(submitprocess) await submitExam();
    submitprocess=false;
    //navigator.sendBeacon("/applicantDash", JSON.stringify({ message: "User left the page silently." }));
});

let count=0;
let submitprocess=true;
window.addEventListener("blur", (event) => {
           count++;
});
window.addEventListener("focus", async(event) => {
    if(count==4){
        await submitExam();
        submitprocess=false;
        window.close();
    }
});


fetchQuestions(); // Initial fetch