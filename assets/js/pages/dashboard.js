import { canAccessModule, getCurrentUser, loadModule, loadModuleIndex } from "../services/lms-api.js";
import { applyStoredTheme, getAllProgress, getModulePercent, getProgress, setTheme, getTheme } from "../services/progress-store.js";
import { formatDate, icon, moduleCard, progressBar } from "../components/ui.js";

applyStoredTheme();

const user = getCurrentUser();
const elements = {
    welcome: document.querySelector("#welcomeUser"),
    matricule: document.querySelector("#matriculeUser"),
    catalog: document.querySelector("#modulesCatalog"),
    started: document.querySelector("#startedModules"),
    stats: document.querySelector("#dashboardStats"),
    history: document.querySelector("#quizHistory"),
    themeToggle: document.querySelector("#themeToggle"),
};

if (user) {
    elements.welcome.textContent = `${user.prenom} ${user.nom}`;
    elements.matricule.textContent = `ID : ${user.id} | ${user.promotion}`;
}

elements.themeToggle?.addEventListener("click", () => {
    const nextTheme = getTheme() === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    elements.themeToggle.innerHTML = nextTheme === "dark" ? `${icon("sun")} Mode clair` : `${icon("moon-stars")} Mode sombre`;
});

async function initDashboard() {
    const indexModules = await loadModuleIndex();
    const modules = await Promise.all(indexModules.map((module) => loadModule(module.slug)));
    const accessibleModules = modules.filter((module) => canAccessModule(user, module.id));
    const allProgress = getAllProgress();

    elements.catalog.innerHTML = modules.map((module) => {
        const percent = getModulePercent(module, getProgress(module.slug));
        return `<div class="col-md-6 col-xl-3">${moduleCard(module, percent, !canAccessModule(user, module.id))}</div>`;
    }).join("");

    renderStats(accessibleModules);
    renderStartedModules(accessibleModules);
    renderQuizHistory(allProgress);

    window.addEventListener("load", hideLoader);
    hideLoader();
}

function renderStats(modules) {
    const started = modules.filter((module) => getProgress(module.slug).completedChapters.length > 0);
    const finished = modules.filter((module) => getModulePercent(module) === 100);
    const globalPercent = modules.length
        ? Math.round(modules.reduce((sum, module) => sum + getModulePercent(module), 0) / modules.length)
        : 0;

    elements.stats.innerHTML = `
        <div class="dashboard-stat">${icon("collection-play")}<span>Disponibles</span><strong>${modules.length}</strong></div>
        <div class="dashboard-stat">${icon("play-circle")}<span>Commencés</span><strong>${started.length}</strong></div>
        <div class="dashboard-stat">${icon("check2-circle")}<span>Terminés</span><strong>${finished.length}</strong></div>
        <div class="dashboard-stat">${icon("graph-up")}<span>Progression</span><strong>${globalPercent}%</strong></div>
    `;
}

function renderStartedModules(modules) {
    const started = modules.filter((module) => getProgress(module.slug).lastActivity);

    if (!started.length) {
        elements.started.innerHTML = `<div class="empty-state">${icon("journal-bookmark")} Aucun module commencé pour le moment.</div>`;
        return;
    }

    elements.started.innerHTML = started.map((module) => {
        const progress = getProgress(module.slug);
        const percent = getModulePercent(module, progress);
        return `
            <article class="started-row">
                <div>
                    <strong>${module.title}</strong>
                    <span>${formatDate(progress.lastActivity)}</span>
                </div>
                <div>${progressBar(percent, "Avancement")}</div>
                <a href="cours.html?slug=${module.slug}&chapter=${progress.currentChapter || 0}" class="btn btn-outline-brand btn-sm">${icon("arrow-right")} Reprendre</a>
            </article>
        `;
    }).join("");
}

function renderQuizHistory(allProgress) {
    const results = Object.entries(allProgress).flatMap(([slug, progress]) => (
        progress.quizResults || []
    ).map((result) => ({ ...result, slug }))).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!results.length) {
        elements.history.innerHTML = `<div class="empty-state">${icon("clipboard-check")} Aucun quiz validé.</div>`;
        return;
    }

    elements.history.innerHTML = results.map((result) => `
        <article class="history-row">
            <div>
                <strong>${result.chapterTitle}</strong>
                <span>${formatDate(result.date)}</span>
            </div>
            <div class="history-score">${result.percent}% <small>${result.scoreOnTwenty}/20</small></div>
        </article>
    `).join("");
}

function hideLoader() {
    document.querySelector("#pageLoader")?.classList.add("is-hidden");
}

initDashboard().catch((error) => {
    elements.catalog.innerHTML = `<div class="col-12"><div class="alert alert-danger">${error.message}</div></div>`;
    hideLoader();
});
