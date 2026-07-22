// Vérification automatique de la session
(function checkAuth() {
    const userSession = localStorage.getItem('currentUser');

    if (!userSession) {
        // Redirection forcée si non connecté
        window.location.href = 'index.html';
    }
})();

// Fonction pour se déconnecter
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}