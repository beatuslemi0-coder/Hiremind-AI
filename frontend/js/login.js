const API_URL = "http://127.0.0.1:8000";

const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (event) => {
event.preventDefault();


const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

message.textContent = "Logging in...";

try {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    const data = await response.json();

    if (!response.ok) {
        message.textContent =
            data.detail || "Login failed";
        return;
    }

    // Save JWT token
    localStorage.setItem(
        "access_token",
        data.access_token
    );

    // Redirect to dashboard
    window.location.href = "dashboard.html";

} catch (error) {
    console.error(error);
    message.textContent =
        "Unable to connect to server";
}


});
