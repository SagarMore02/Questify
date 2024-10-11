const questions = [
    { question: 'What is the time complexity of binary search?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'] },
    { question: 'Which data structure uses LIFO (Last In First Out) principle?', options: ['Queue', 'Stack', 'Array', 'Linked List'] },
    { question: 'What is the output of `console.log(2 + \'2\')` in JavaScript?', options: ['4', '22', 'undefined', 'NaN'] },
    { question: 'Which sorting algorithm has the best average time complexity?', options: ['Bubble Sort', 'Merge Sort', 'Insertion Sort', 'Quick Sort'] },
    { question: 'What is the purpose of a hash table?', options: ['Store elements in a sorted order', 'Allow for constant time lookups', 'Implement a stack', 'Perform binary search'] },
    { question: 'What is the output of `console.log(2 + \'2\')` in JavaScript?', options: ['4', '22', 'undefined', 'NaN'] },
    { question: 'Which sorting algorithm has the best average time complexity?', options: ['Bubble Sort', 'Merge Sort', 'Insertion Sort', 'Quick Sort'] },
    { question: 'What is the output of `console.log(2 + \'2\')` in JavaScript?', options: ['4', '22', 'undefined', 'NaN'] },
    { question: 'Which sorting algorithm has the best average time complexity?', options: ['Bubble Sort', 'Merge Sort', 'Insertion Sort', 'Quick Sort'] },
    { question: 'What is the output of `console.log(2 + \'2\')` in JavaScript?', options: ['4', '22', 'undefined', 'NaN'] },
    { question: 'Which sorting algorithm has the best average time complexity?', options: ['Bubble Sort', 'Merge Sort', 'Insertion Sort', 'Quick Sort'] },
    { question: 'What is the output of `console.log(2 + \'2\')` in JavaScript?', options: ['4', '22', 'undefined', 'NaN'] },
    { question: 'Which sorting algorithm has the best average time complexity?', options: ['Bubble Sort', 'Merge Sort', 'Insertion Sort', 'Quick Sort'] },
];

let currentQuestionIndex = 0;
const answers = new Array(questions.length).fill(null);

function createProgressCircles() {
    const progressContainer = document.getElementById('progress-container');
    progressContainer.innerHTML = ''; // Clear existing circles

    // Create a circle for each question
    questions.forEach((_, index) => {
        const circle = document.createElement('div');
        circle.className = 'progress-circle';
        circle.textContent = index + 1; // Display question number
        circle.addEventListener('click', () => {
            // Jump to the clicked question when a circle is clicked
            currentQuestionIndex = index;
            showQuestion(currentQuestionIndex);
        });
        progressContainer.appendChild(circle);
    });
}

function updateProgressCircles() {
    const circles = document.querySelectorAll('.progress-circle');
    circles.forEach((circle, index) => {
        if (answers[index] !== null) {
            circle.classList.add('filled'); // Mark as filled when answered
        } else {
            circle.classList.remove('filled');
        }
    });
}


function showQuestion(index) {
    const question = questions[index];
    document.getElementById('question-text').textContent = `Question ${index + 1}: ${question.question}`;
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = ''; // Clear existing options

    // Create radio button options
    question.options.forEach((option, optionIndex) => {
        const optionId = `option-${index}-${optionIndex}`; // Unique ID for each option

        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';

        // Use radio buttons for single selection with proper labels
        optionDiv.innerHTML = `
            <label for="${optionId}">
                <input type="radio" id="${optionId}" name="option" value="${option}" ${answers[index] === option ? 'checked' : ''}>
                ${option}
            </label>
        `;

        // Add click event to handle selection by radio button
        const radioButton = optionDiv.querySelector('input[type="radio"]');
        radioButton.addEventListener('click', () => selectOption(option));

        optionsDiv.appendChild(optionDiv);
    });

    // Update button states
    document.getElementById('prev-button').disabled = index === 0;
    document.getElementById('next-button').disabled = index === questions.length - 1;
    //document.getElementById('submit-button').disabled = answers.includes(null); // Disable submit if any answer is missing

    updateProgressCircles(); // Update progress circles on question change
}

function selectOption(selectedOption) {
    answers[currentQuestionIndex] = selectedOption;

    //document.getElementById('submit-button').disabled = answers.includes(null); // Enable submit when all answers are filled
    updateProgressCircles(); // Update progress circles on option selection
}

document.getElementById('next-button').addEventListener('click', () => {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        showQuestion(currentQuestionIndex);
    }
});

document.getElementById('prev-button').addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion(currentQuestionIndex);
    }
});

document.getElementById('quiz-form').addEventListener('submit', (event) => {
    event.preventDefault();

    fetch('/save-answers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Your answers have been submitted successfully!', data);
            showResult();
        })
        .catch(error => {
            console.error('Error:', error);
            console.log('There was a problem submitting your answers. Please try again.');
        });
});


// Timer setup
function startTimer(duration, display, progressBar) {
    let startTime = Date.now();
    let timeInterval = setInterval(function () {
        let elapsed = Math.floor((Date.now() - startTime) / 1000); // Time in seconds
        let timeLeft = duration - elapsed;

        // Convert timeLeft to minutes and seconds
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;

        // Format time with leading zero if needed
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        // Update the display
        display.textContent = minutes + ":" + seconds;

        // Calculate and update progress bar width
        let percentage = (timeLeft / duration) * 100;
        progressBar.style.width = percentage + "%";

        // Stop the timer when time runs out
        if (timeLeft <= 0) {
            clearInterval(timeInterval);
            display.textContent = "Time's up!";
            progressBar.style.width = "0%";
            // Auto-submit the form when time's up
            document.getElementById('quiz-form').submit();
        }
    }, 1000); // Updates every second
}

// Initialize the timer
window.onload = function () {
    let totalDuration = 2 * 60; // 1 minute in seconds
    let display = document.getElementById('time-left');
    let progressBar = document.getElementById('timer-bar');
    startTimer(totalDuration, display, progressBar);
};



function showResult() {
    document.getElementById('quiz').style.display = 'none';
    document.getElementById('result').style.display = 'block';
}

document.getElementById('home-button').addEventListener('click', () => {
    // Navigate to the home page
    window.location.href = '/'; // Replace with your actual home URL
});

document.addEventListener('DOMContentLoaded', () => {
    createProgressCircles(); // Create progress circles when page loads
    showQuestion(currentQuestionIndex);
});