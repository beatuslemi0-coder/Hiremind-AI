const API_URL = "http://127.0.0.1:8000";

const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    console.log("Sending registration data:", {
        full_name: fullName,
        email: email
    });

    message.textContent = "Creating account...";

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                full_name: fullName,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        console.log("Register response:", response.status, data);

        if (!response.ok) {
            message.textContent = data.detail || "Registration failed";
            return;
        }

        message.textContent =
            "Account created successfully! Redirecting to login...";

        registerForm.reset();

        setTimeout(() => {
            window.location.href = "index.html";
        }, 2000);

    } catch (error) {
        console.error("Registration error:", error);
        message.textContent = "Unable to connect to server.";
    }
});