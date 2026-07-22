const LOCAL_STUDENTS_KEY = "hopingStudentsData";

async function loadStudents() {
    const localStudents = localStorage.getItem(LOCAL_STUDENTS_KEY);

    if (localStudents) {
        try {
            const parsedStudents = JSON.parse(localStudents);
            if (Array.isArray(parsedStudents)) {
                return parsedStudents;
            }
        } catch (error) {
            localStorage.removeItem(LOCAL_STUDENTS_KEY);
        }
    }

    const response = await fetch("data/students.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Impossible de charger les données.");

    return response.json();
}

document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const inputId = document.getElementById("studentId").value.trim();
    const errorDiv = document.getElementById("errorMessage");
    errorDiv.classList.add("d-none");

    try {
        const students = await loadStudents();
        const student = students.find((s) => s.id === inputId);

        if (student) {
            localStorage.setItem("currentUser", JSON.stringify(student));
            window.location.href = "dashboard.html";
        } else {
            errorDiv.textContent = "Identifiant incorrect. Veuillez vérifier auprès de votre formateur.";
            errorDiv.classList.remove("d-none");
        }
    } catch (err) {
        errorDiv.textContent = "Erreur technique lors de la vérification.";
        errorDiv.classList.remove("d-none");
    }
});
