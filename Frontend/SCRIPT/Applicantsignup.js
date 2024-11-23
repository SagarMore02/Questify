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
        const email = document.querySelector('input[placeholder="Enter your email"]').value.trim();
        const phoneNumber = document.querySelector('input[placeholder="Enter your number"]').value.trim();
        const username = document.querySelector('input[placeholder="Enter your username"]').value;
        const password = document.querySelector('input[placeholder="Enter your password"]').value;
        const confirmPassword = document.querySelector('input[placeholder="Confirm your password"]').value;
        const userType = submitButton.value; // Get the value of the submit button

        let dept = '';
        let organId = '-1'; // Default value
        let location = 'Pune';

        if (userType === 'Organizer') {
            const dropdown = document.getElementById('organization-dropdown');
            organId = dropdown.value;
            console.log(organId);
        } else if (userType === 'Organization') {
            location = document.querySelector('input[placeholder="Enter Location"]').value;
        } else {
            const departmentField = document.getElementById('department');
            if (departmentField) {
                dept = departmentField.value || '';
                if (dept === 'N/A') {
                    alert('Please select a valid department.');
                    return; // Prevent form submission
                }
            }
        }

        // Validate passwords match
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            console.log('Password mismatch detected.');
            return;
        }
        // Email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // Phone number validation regex (for 10-digit numbers, e.g., 1234567890)
        var phoneNum = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/; 

        if (!email) {
            console.log("Email is required.");
        } else if (!emailRegex.test(email)) {
            alert("Invalid email format.");
            return;
        } else {
            console.log("Email is valid.");
        }
        console.log("==========>", phoneNumber);
        if (!phoneNumber) {
            console.log("Phone number is required.");
        } else if (!phoneNum.test(phoneNumber)) {
            alert("Invalid phone number. It must be a 10-digit number.");
            return;
        } else {
            console.log("Phone number is valid.");
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
            location: location,
            dept: dept
        };

        console.log('Form Data:', formData);

        // Show the modal immediately
        showModal();

        try {
            console.log('Submitting form...');
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Registration successful');
            } else {
                alert(data.message);
                document.getElementById('cancelButton').click();
                hideModal(); // Hide modal if registration fails
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error submitting the form.');
            hideModal(); // Hide modal if an error occurs
        }
    });
});

function showModal() {
    const modal = document.getElementById('confirmationModal');
    const modalText = document.getElementById('modalText');
    modalText.textContent = `For 2-factor authentication`;
    document.getElementById('otpInput').innerHTML=" ";

    modal.style.display = 'flex';

    document.getElementById('confirmButton').onclick = () => {
        //modal.style.display = 'none';
        //window.location.href = '/verify-otp.html'; // Correct usage of window.location.href
        //document.getElementById('otpInput').innerHTML=" ";
    };

    document.getElementById('cancelButton').onclick = () => {
        modal.style.display = 'none';
        document.getElementById('otpInput').innerHTML=" ";
        //window.location.reload(); // Reload the page
    };
}

function hideModal() {
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'none';
}



document.getElementById("otpForm").addEventListener("submit", async function (event) {
    event.preventDefault();
  
    const otp = document.getElementById("otpInput").value;
    const email = localStorage.getItem("email"); // Assuming email is stored in localStorage
  
    try {
      const response = await fetch('/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
  
      if (response.ok) {
        alert("OTP verified successfully. Registration complete!");
        
        window.location.href = "/login.html"; // Redirect to login or any other page
      } else {
        alert(data.message || "OTP verification failed. Please try again.");
        document.getElementById('cancelButton').click();
        hideModal();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("error");
    }
  });
  