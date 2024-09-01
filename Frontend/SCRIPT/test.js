document.getElementById('setTestForm').addEventListener('submit', function(event) {
    event.preventDefault();

    // Gather form data
    const testName = document.getElementById('testName').value;
    const testDate = document.getElementById('testDate').value;
    const testTime = document.getElementById('testTime').value;
    const duration = document.getElementById('duration').value;
    const numQuestions = document.getElementById('numQuestions').value;
    const passingScore = document.getElementById('passingScore').value;
    const testDescription = document.getElementById('testDescription').value;

    // You can now send this data to a server or process it as needed
    console.log({
        testName,
        testDate,
        testTime,
        duration,
        numQuestions,
        passingScore,
        testDescription
    });

    // Example: Showing an alert or redirecting after submission
    alert('Test has been created successfully!');
    // window.location.href = 'dashboard.html'; // Redirect to another page if needed
});