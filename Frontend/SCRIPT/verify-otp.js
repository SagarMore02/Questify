// /js/VerifyOtp.js

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
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  });
  