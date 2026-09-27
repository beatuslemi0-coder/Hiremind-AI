const API_URL = "http://127.0.0.1:8000";

// Check if user is logged in
const token = localStorage.getItem("access_token");

if (!token) {
window.location.href = "index.html";
}

// Logout
document.getElementById("logoutBtn").addEventListener(
"click",
() => {
localStorage.removeItem("access_token");


    window.location.href = "index.html";
}


);
async function loadDashboardStats() {

    try {

        const response = await fetch(
            `${API_URL}/students/`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load students");
        }

        const students = await response.json();

        document.getElementById("studentsCount").textContent =
            students.length;
        
const subjectsResponse = await fetch(
    `${API_URL}/subjects/`,
    {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }
);

if (!subjectsResponse.ok) {
    throw new Error("Failed to load subjects");
}

const subjects = await subjectsResponse.json();

document.getElementById("subjectsCount").textContent =
    subjects.length;

// RESULTS
const resultsResponse = await fetch(
    `${API_URL}/results/`,
    {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }
);

if (!resultsResponse.ok) {
    throw new Error("Failed to load results");
}

const results = await resultsResponse.json();

document.getElementById("resultsCount").textContent =
    results.length;

    } catch (error) {

        console.error("Dashboard error:", error);


    }
}

loadDashboardStats();
