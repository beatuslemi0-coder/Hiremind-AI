const API_URL = "http://127.0.0.1:8000";

const token = localStorage.getItem("access_token");
let editingStudentId = null;

// Protect page
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

// Load students
async function loadStudents() {


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

    const table = document.getElementById("studentsTable");

    table.innerHTML = "";

    students.forEach(student => {

        table.innerHTML += `
            <tr>
                <td>${student.id}</td>
                <td>${student.full_name}</td>
                <td>${student.class_name}</td>
                <td>
                    <button
                        class="edit-btn"
                        onclick="editStudent(${student.id}, '${student.full_name}', '${student.class_name}')">
                        Edit
                    </button>
                    <button
                        class"delete-btn"
                        onclick="deleteStudent(${student.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;

    });

} catch (error) {

    console.error(error);

    document.getElementById("studentMessage").textContent =
        "Unable to load students.";

}


}

// Load students when page opens
loadStudents();
async function deleteStudent(studentId) {

    const confirmed = confirm(
        "Are you sure you want to delete this student?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/students/${studentId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Failed to delete student");
            return;
        }

        alert("Student deleted successfully!");

        loadStudents();

    } catch (error) {

        console.error(error);

        alert("Unable to connect to server.");
    }
}

const studentForm = document.getElementById("studentForm");
const studentMessage = document.getElementById("studentMessage");

studentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value;
    const className = document.getElementById("className").value;

    studentMessage.textContent = "Adding student...";

    try {
        const response = await fetch(`${API_URL}/students/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                full_name: fullName,
                class_name: className
            })
        });

        const data = await response.json();

        if (!response.ok) {
            studentMessage.textContent =
                data.detail || "Failed to add student";
            return;
        }

        studentMessage.textContent =
            "Student added successfully!";

        // Clear form
        studentForm.reset();

        // Reload students table
        loadStudents();

    } catch (error) {

        console.error(error);

        studentMessage.textContent =
            "Unable to connect to server.";
    }
});
function editStudent(id, fullName, className) {

    editingStudentId = id;

    document.getElementById("editFullName").value = fullName;
    document.getElementById("editClassName").value = className;

    document.getElementById("editStudentSection").style.display = "block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}
const editStudentForm = document.getElementById("editStudentForm");

editStudentForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const fullName =
        document.getElementById("editFullName").value;

    const className =
        document.getElementById("editClassName").value;

    try {

        const response = await fetch(
            `${API_URL}/students/${editingStudentId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    full_name: fullName,
                    class_name: className
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.detail || "Failed to update student");
            return;
        }

        alert("Student updated successfully!");

        // Hide edit form
        document.getElementById(
            "editStudentSection"
        ).style.display = "none";

        // Reload student list
        loadStudents();

    } catch (error) {

        console.error(error);

        alert("Unable to connect to server.");
    }
});
document.getElementById("cancelEditBtn").addEventListener(
    "click",
    () => {
        document.getElementById(
            "editStudentSection"
        ).style.display = "none";

        editingStudentId = null;
    }
);