document.querySelector('form').addEventListener('submit', async function(event) {
    event.preventDefault();  // Prevent default form submission

    const username = document.getElementById("username").value;
    const password = document.getElementById('password').value;

    try {
        // Send a POST request to the /AdminLogin route
        const response = await fetch('/AdminLogin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password }) // Send username and password in the body
        });

        if (response.ok) {
            // If login is successful, replace the current document content
            const adminPageHTML = await response.text(); // Get the admin page content directly from response
            document.open(); // Clear the document
            document.write(adminPageHTML); // Write the new HTML to the document
            document.close(); // Close the document
        } else {
            const data = await response.json();
            if (response.status === 404) {
                alert(data.message); // No username found
            } else if (response.status === 401) {
                alert(data.message); // Incorrect password
            } else {
                alert('An error occurred: ' + data.message); // Handle other errors
            }
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred. Please try again later.');
    }
});
