document.addEventListener("DOMContentLoaded", function () {
    // Get the form and input elements
    const form = document.querySelector("form");
    const fname = document.getElementById("fname");
    const lname = document.getElementById("lname");
    const email = document.getElementById("mail");
    const mobileNo = document.getElementById("mobileno");
    const username = document.getElementById("username");
    const password = document.getElementById("pass");
    const confirmPassword = document.getElementById("pass1");
    const popupContainer = document.getElementById("popupContainer");
    const closePopup = document.getElementById("closePopup");

    // Close popup function
    closePopup.addEventListener("click", function () {
        popupContainer.style.display = "none";
    });

    // Form submission handler
    form.onsubmit = function () {
        // Basic validation
        if (!validateInputs()) {
            return false; // Prevent form submission if validation fails
        }

        // Example check: Username exists (this is just an example; in a real-world scenario, you'd check this via a backend)
        if (usernameExists(username.value)) {
            popupContainer.style.display = "block";
            return false; // Prevent form submission
        }

        // If all checks pass, allow form submission
        return true;
    };

    function validateInputs() {
        // Ensure passwords match
        if (password.value !== confirmPassword.value) {
            alert("Passwords do not match.");
            return false;
        }

        // Additional validation can be added here (e.g., email format, mobile number format, etc.)

        return true;
    }

    function usernameExists(username) {
        // Example check: This would typically involve a server-side check
        // For demonstration, we'll assume a username "testuser" already exists
        const existingUsernames = ["testuser", "admin", "guest"];
        return existingUsernames.includes(username.toLowerCase());
    }
});
