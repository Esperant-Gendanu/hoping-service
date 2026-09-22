async function loadStudents() {
    const response = await fetch("data/students.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Impossible de charger les donnees.");

    const students = await response.json();
    if (!Array.isArray(students)) throw new Error("Format students.json invalide.");

    return students;
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
            localStorage.removeItem("currentUser");
            errorDiv.textContent = "Identifiant incorrect. Veuillez verifier aupres de votre formateur.";
            errorDiv.classList.remove("d-none");
        }
    } catch (err) {
        errorDiv.textContent = "Erreur technique lors de la verification.";
        errorDiv.classList.remove("d-none");
    }
});
