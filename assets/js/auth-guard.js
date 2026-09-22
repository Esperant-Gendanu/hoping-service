// Verification automatique de la session contre data/students.json.
(async function checkAuth() {
    const userSession = localStorage.getItem("currentUser");

    if (!userSession) {
        window.location.href = "index.html";
        return;
    }

    try {
        const currentUser = JSON.parse(userSession);
        const response = await fetch("data/students.json", { cache: "no-store" });
        if (!response.ok) throw new Error("students.json inaccessible");

        const students = await response.json();
        const verifiedUser = Array.isArray(students)
            ? students.find((student) => student.id === currentUser?.id)
            : null;

        if (!verifiedUser) {
            localStorage.removeItem("currentUser");
            window.location.href = "index.html";
            return;
        }

        localStorage.setItem("currentUser", JSON.stringify(verifiedUser));
        window.dispatchEvent(new CustomEvent("student:verified", { detail: verifiedUser }));
    } catch (error) {
        localStorage.removeItem("currentUser");
        window.location.href = "index.html";
    }
})();

function logout() {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
}
