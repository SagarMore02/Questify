// State to track the current question index and store the fetched questions
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

// Fetch questions from backend
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
    } catch (error) {
        console.error('Error fetching questions:', error);
    }
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
// Save the selected answer for the current question
function saveAnswer() {
    // Get the selected option
    const selectedOption = document.querySelector('input[name="option"]:checked');
    
    if (selectedOption) {
        // Save the selected option for the current question
        userAnswers[currentQuestionIndex] = selectedOption.value;
        
        // Get the option letter from the data attribute
        const selectedOptionLetter = selectedOption.getAttribute("data-option-letter");

        // Get the question ID from the questions array
        const questionId = questions[currentQuestionIndex].id;

        // Show the alert with question ID and selected option letter
        const sel_answer ="option"+selectedOptionLetter;
        console.log(`Question ID: ${questionId}, Selected Option: ${sel_answer}`);
        const data = {
            questionId: questionId,  // Pass the question ID
            sel_answer: sel_answer  // Pass the selected answer
          };
        
          // Make the POST request using fetch
          fetch('/InsertAttempt', {
            method: 'POST',  // HTTP method
            headers: {
              'Content-Type': 'application/json'  // Set the content type to JSON
            },
            body: JSON.stringify(data)  // Convert JavaScript object to JSON string
          })
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();  // Parse the JSON response
          })
          .then(data => {
            console.log('Success:', data);
            // Handle the success response (display message, update UI, etc.)
            console.log(data.message);
          })
          .catch((error) => {
            console.error('Error:', error);
            // Handle the error response
            alert('Error submitting attempt. Please try again.');
          });

    } else {
        userAnswers[currentQuestionIndex] = null; // If no option is selected
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

    // Save the answer and show the alert
    saveAnswer();

    console.log(userAnswers); // This logs the user's answers
});

// Submit button event
submitButton.addEventListener("click", (e) => {
    e.preventDefault();
    saveAnswer();
    alert("Exam Submitted. Thank you!");
    console.log(userAnswers); // This will log the user's answers, replace with actual submission logic
    document.getElementById("quiz").style.display = "none"; // Hide the quiz
    document.getElementById("result").style.display = "block"; // Show the result page
});

// Fetch questions when the page loads
window.onload = fetchQuestions;
