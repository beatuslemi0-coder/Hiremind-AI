let allResults = [];

const API_URL = "http://127.0.0.1:8000";

const token = localStorage.getItem("access_token");

// Protect page
if (!token) {
window.location.href = "index.html";
}

// =========================
// LOGOUT
// =========================

document.getElementById("logoutBtn").addEventListener(
"click",
() => {


    localStorage.removeItem("access_token");

    window.location.href = "index.html";
}


);

// =========================
// LOAD STUDENTS
// =========================

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

    const studentSelect =
        document.getElementById("studentSelect");

    students.forEach(student => {

        const option = document.createElement("option");

        option.value = student.id;

        option.textContent =
            `${student.full_name} - ${student.class_name}`;

        studentSelect.appendChild(option);

    });

} catch (error) {

    console.error("Students error:", error);

}


}

// =========================
// LOAD SUBJECTS
// =========================

async function loadSubjects() {


try {

    const response = await fetch(
        `${API_URL}/subjects/`,
        {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }
    );

    if (!response.ok) {
        throw new Error("Failed to load subjects");
    }

    const subjects = await response.json();

    const subjectSelect =
        document.getElementById("subjectSelect");

    subjects.forEach(subject => {

        const option = document.createElement("option");

        option.value = subject.id;

        option.textContent = subject.name;

        subjectSelect.appendChild(option);

    });

} catch (error) {

    console.error("Subjects error:", error);

}


}

// =========================
// LOAD RESULTS
// =========================

async function loadResults() {


try {

    const response = await fetch(
        `${API_URL}/results/`,
        {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }
    );

    if (!response.ok) {
        throw new Error("Failed to load results");
    }

    const results = await response.json();
    console.log("Results loaded:", results);

    const table =
        document.getElementById("resultsTable");

    table.innerHTML = "";

    results.forEach(result => {

        table.innerHTML += `
            <tr>

                <td>${result.id}</td>

                <td>
                    ${result.student}
                </td>

                <td>
                    ${result.subject}
                </td>

                <td>
                    ${result.marks}
                </td>
                <td class="action-buttons">
                    <button
                        class="edit-btn"
                        onclick="editResult(${result.id}, '${result.student}', '${result.subject}', ${result.marks})"
                        >
                            Edit
                        </button>


                        <button
                            class="delete-btn"
                            onclick="deleteResult(${result.id})"
                            >
                                Delete
                        </button>
                </td>


            </tr>
        `;

    });
    allResults = await response.json();

    displayResults(allResults);
} catch (error) {

    console.error("Results error:", error);

}
}

// Function ya kuonyesha results kwenye table
function displayResults(results) {
    const table = document.getElementById("resultsTable");

    table.innerHTML = "";

    results.forEach(result => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${result.id}</td>
            <td>${result.student}</td>
            <td>${result.subject}</td>
            <td>${result.marks}</td>

            <td class="actions">
                <button
                    class="edit-btn"
                    onclick="editResult(
                        ${result.id},
                        '${result.student}',
                        '${result.subject}',
                        ${result.marks}
                    )"
                >
                    Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteResult(${result.id})"
                >
                    Delete
                </button>
            </td>
        `;

        table.appendChild(row);
    });
}

// =========================
// CREATE RESULT
// =========================

const resultForm =
document.getElementById("resultForm");

resultForm.addEventListener(
"submit",
async (event) => {


    event.preventDefault();

    const studentId =
        document.getElementById("studentSelect").value;

    const subjectId =
        document.getElementById("subjectSelect").value;

    const marks =
        document.getElementById("marks").value;


    const resultMessage =
        document.getElementById("resultMessage");


    try {

        const response = await fetch(
            `${API_URL}/results/`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",

                    "Authorization":
                        `Bearer ${token}`
                },

                body: JSON.stringify({

                    student_id: Number(studentId),

                    subject_id: Number(subjectId),

                    marks: Number(marks)

                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            resultMessage.textContent =
                data.detail || "Failed to save result";

            return;
        }


        resultMessage.textContent =
            "Result saved successfully!";


        // Clear form

        resultForm.reset();


        // Reload table

        loadResults();

    } catch (error) {

        console.error("Create result error:", error);

        resultMessage.textContent =
            "Unable to connect to server.";

    }

}


);

// =========================
// INITIAL LOAD
// =========================

loadStudents();

loadSubjects();

loadResults();

async function deleteResult(resultId) {

    const confirmed = confirm(
        "Are you sure you want to delete this result?"
    );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/results/${resultId}`,
            {
                method: "DELETE",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        const data = await response.json();


        if (!response.ok) {

            alert(
                data.detail ||
                "Failed to delete result"
            );

            return;
        }


        alert(
            "Result deleted successfully!"
        );


        loadResults();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to server."
        );

    }

}
let editingResultId = null;


function editResult(
    id,
    student,
    subject,
    marks
) {

    editingResultId = id;


    document.getElementById(
        "editStudent"
    ).value = student;


    document.getElementById(
        "editSubject"
    ).value = subject;


    document.getElementById(
        "editMarks"
    ).value = marks;


    document.getElementById(
        "editResultSection"
    ).style.display = "block";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}
document.getElementById(
    "editResultForm"
).addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const marks = Number(
            document.getElementById(
                "editMarks"
            ).value
        );


        try {

            const response = await fetch(
                `${API_URL}/results/${editingResultId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        marks: marks
                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                alert(
                    data.detail ||
                    "Failed to update result"
                );

                return;
            }


            alert(
                "Result updated successfully!"
            );


            document.getElementById(
                "editResultSection"
            ).style.display = "none";


            editingResultId = null;


            loadResults();

        } catch (error) {

            console.error(error);

            alert(
                "Unable to connect to server."
            );

        }

    }
);
document.getElementById(
    "cancelEditResult"
).addEventListener(
    "click",
    () => {

        document.getElementById(
            "editResultSection"
        ).style.display = "none";


        editingResultId = null;

    }
);

// Search inafanya kazi kila user anapoandika
document.getElementById("searchResult").addEventListener("input", function () {

    // Tunapata maandishi ambayo user ameandika
    const searchValue = this.value.toLowerCase().trim();

    // Tunachuja results kulingana na student, subject au marks
    const filteredResults = allResults.filter(result =>
        result.student.toLowerCase().includes(searchValue) ||
        result.subject.toLowerCase().includes(searchValue) ||
        String(result.marks).includes(searchValue)
    );

    // Tunaonyesha results zilizochujwa
    displayResults(filteredResults);
});
