document.addEventListener('DOMContentLoaded', () => {
     const form = document.getElementById('loginForm');
     if (!form) {
         console.error('Form element not found.');
         return;
     }
 
     form.addEventListener('submit', async (event) => {
         console.log('Form submit event triggered'); // Log when the event is triggered
         event.preventDefault(); // Prevent the default form submission
 
         const username = document.getElementById("Username").value;
         const password = document.getElementById("Password").value;
         
         // Combine variables into a single object
         const formData = {
             username: username,
             password: password,
         };
 
         try {
             const response = await fetch('/login-packet', {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json'
                 },
                 body: JSON.stringify(formData)
             });
 
             const data = await response.json();
 
             if (response.ok) {
                 //alert('Login successful!');
                 // Redirect or clear the form as needed
                 window.top.location.href = data.redirectURL;
             } else {
                 alert('Login failed: ' + data.message);
             }
         } catch (error) {
             console.error('Error:', error);
             alert('Error submitting the form.');
         }
     });
 
     // Correctly select the anchor element by its ID
     const anchor = document.getElementById('myanchor');
     if (!anchor) {
         console.error('Anchor element not found.');
         return;
     }
 
     anchor.addEventListener('click', async (event) => {
         console.log('Anchor Tag event triggered'); // Log when the event is triggered
         event.preventDefault(); // Prevent the default anchor behavior
         window.location.href = '/t';
     });
 
     const forgotLink = document.getElementById("forgot-id");
     const popup = document.getElementById("sagar-class");
     const closePopup = document.getElementById("closePopup");
 
     const resetPopup = document.createElement("div");
     resetPopup.id = "reset-popup";
     resetPopup.className = "sagar-class";
     resetPopup.style.display = "none";
     resetPopup.innerHTML = `
         <div class="popup-content">
             <span id="closeResetPopup" class="close-btn">&times;</span>
             <h2>Reset Password</h2>
             <form id="reset-password-form">
                 <label for="token">Otp Received in mail</label><br>
                 <input type="text" id="token" name="token" required>
                 <br>
                 <label for="new-password">New Password</label><br>
                 <input type="password" id="new-password" name="new-password" required>
                 <br>
                 <label for="confirm-password">Confirm Password</label><br>
                 <input type="password" id="confirm-password" name="confirm-password" required>
                 <br>
                 <button type="submit">Reset Password</button>
             </form>
             <p id="reset-message"></p>
         </div>
     `;
     document.body.appendChild(resetPopup);
 
     document.getElementById('closeResetPopup').onclick = function (event){
         resetPopup.style.display = "none";
     }
     // Show the popup when "Forget Password" is clicked
     forgotLink.onclick = function (event) {
         event.preventDefault();
         popup.style.display = "flex"; // Make the popup visible
     };
 
     // Hide the popup when the close button is clicked
     closePopup.onclick = function () {
         popup.style.display = "none";
         resetPopup.style.display = "none";
     };
 
     // Hide the popup when clicking outside the content area
     window.onclick = function (event) {
         if (event.target === popup) {
             popup.style.display = "none";
             resetPopup.style.display = "none";
         }
     };
 
     // Handle the forgot-password-form submission
     const resetform = document.getElementById('forgot-password-form');
     resetform.addEventListener('submit', async (event) => {
         event.preventDefault(); // Prevents default form submission
 
         const email = document.getElementById('email').value;
 
         try {
             const response = await fetch('/forgot-password', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ email })
             });
 
             const result = await response.json();
             document.getElementById('message').textContent = result.message;
 
             if (response.ok) {
                 popup.style.display = "none"; // Hide Forgot Password popup
                 resetPopup.style.display = "flex"; // Show Reset Password popup
                 document.getElementById("email").value = email;
             }else {
                 document.getElementById("message").textContent = `Error: ${result.message}`;
             }
         } catch (error) {
             document.getElementById('message').textContent = `Error: ${error.message}`;
             console.error('Error:', error);
         }
     });
 
 
 
 
     const resetForm = document.getElementById("reset-password-form");
     resetForm.addEventListener("submit", async (event) => {
         event.preventDefault();
 
         const email = document.getElementById("email").value;
         const token = document.getElementById("token").value;
         const newPassword = document.getElementById("new-password").value;
         const confirmPassword = document.getElementById("confirm-password").value;
 
         // Check if passwords match
         if (newPassword !== confirmPassword) {
             document.getElementById("reset-message").textContent = "Passwords do not match.";
             return;
         }
 
         try {
             const response = await fetch("/reset-password", {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ email, token, newPassword }),
             });
 
             const result = await response.json();
 
             if (response.ok) {
                 document.getElementById("reset-message").textContent = result.message;
                 window.location.href = "/login.html"; // Redirect to login page
 
             } else {
                 document.getElementById("reset-message").textContent = `Error: ${result.message}`;
             }
         } catch (error) {
             document.getElementById("reset-message").textContent = `Error: ${error.message}`;
             console.error("Error:", error);
         }
     });
 
 });