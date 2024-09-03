document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    const submitButton = document.getElementById('submit');

    if (!form) {
        console.error('Form element not found.');
        return;
    }

    form.addEventListener('submit', async (event) => {
        console.log('Form submit event triggered'); // Log when the event is triggered
        event.preventDefault(); // Prevent the default form submission

        // Extract form values into separate variables
        const firstName = document.querySelector('input[placeholder="Enter First Name"]').value;
        const lastName = document.getElementById('lastname').value;
        const email = document.querySelector('input[placeholder="Enter your email"]').value;
        const phoneNumber = document.querySelector('input[placeholder="Enter your number"]').value;
        const username = document.querySelector('input[placeholder="Enter your username"]').value;
        const password = document.querySelector('input[placeholder="Enter your password"]').value;
        const confirmPassword = document.querySelector('input[placeholder="Confirm your password"]').value;
        const userType = submitButton.value; // Get the value of the submit button
        
        let organId = "-1"; // Use `let` to allow reassignment
        let location="Pune"
        if (userType === "Organizer") {
        organId = document.querySelector('input[placeholder="Enter Code"]').value;
        }
        if(userType==="Organization"){
            location=document.querySelector('input[placeholder="Enter Location"]').value;
        }

        // Validate passwords match
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            console.log('Password mismatch detected.');
            return;
        }

        // Combine variables into a single object
        const formData = {
            fname: firstName,
            lname: lastName,
            email: email,
            mobileno: phoneNumber,
            username: username,
            pass: password,
            confirmPassword: confirmPassword,
            usertype: userType,
            organId: organId,
            location: location
        };

        try {
            console.log("Trryingg");
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                alert('Registration successful!');
                // Redirect or clear the form as needed
                window.top.location.href = data.redirectURL;
            } else {
                alert('Registration failed: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error submitting the form.');
        }
    });
});
