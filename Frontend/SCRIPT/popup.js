// Show the popup when the page gains focus
let warning=0;
const warn=document.querySelector("#focus-popup h2");
window.addEventListener('focus', function () {
    warning++;
    warn.innerHTML="Warning "+warning+" !!";
    if(warning>1){
        document.getElementById("milo").innerHTML="If you switch again exam will be auto submitted!!!!";
    }
    //alert("Hello");
    showPopup();
});

// Function to show the popup
function showPopup() {
    var popup = document.getElementById('focus-popup');
    popup.style.display = 'flex';
}

// Function to close the popup
function closePopup() {
    console.log("Close Popup Called");
    var popup = document.getElementById('focus-popup');
    popup.style.display = 'none';
}

const cl = document.getElementById("close");
cl.addEventListener("click", (e) => {
    e.preventDefault();
    closePopup();
});