import { canAccessModule, getCurrentUser, loadModule } from "../services/lms-api.js";
import { applyStoredTheme, getCurrentUserId, getModulePercent, getProgress } from "../services/progress-store.js";
import { formatDate, icon, progressBar } from "../components/ui.js";

applyStoredTheme();

const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");
const user = getCurrentUser();
const root = document.querySelector("#moduleDetail");

async function initModuleDetail() {
    if (!slug) throw new Error("Module introuvable.");
    const module = await loadModule(slug);
    const progress = getProgress(module.slug);
    const percent = getModulePercent(module, progress);
    const locked = !canAccessModule(user, module.id);

    document.title = `${module.title} | Hoping_Service`;
    root.innerHTML = `
        <section class="module-hero" style="--module-cover: url('${module.cover}')">
            <div class="module-hero-overlay">
                <div class="container">
                    <a href="dashboard.html" class="back-link">${icon("arrow-left")} Tableau de bord</a>
                    <div class="module-hero-content">
                        <span class="section-kicker">${module.id} · ${module.level}</span>
                        <h1>${module.title}</h1>
                        <p>${module.subtitle || module.description}</p>
                        <div class="module-hero-actions">
                            <a href="${locked ? "#" : `cours.html?slug=${module.slug}`}" class="btn btn-glow btn-lg ${locked ? "disabled" : ""}">
                                ${icon(locked ? "lock" : "play-circle")} ${locked ? "Non inscrit" : "Commencer le module"}
                            </a>
                            <span>${icon("clock-history")} ${module.duration}</span>
                            <span>${icon("layers")} ${module.chapters.length} leçons</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <main class="container py-4 py-lg-5">
            <div class="row g-4">
                <aside class="col-lg-4">
                    <div class="lms-card p-4 sticky-panel">
                        ${progressBar(percent, "Progression du module")}
                        ${renderPersonalSummary(module, progress, percent)}
                        ${renderModuleFacts(module)}
                    </div>
                </aside>
                <section class="col-lg-8">
                    ${renderPresentation(module)}
                    ${renderListSection("2. Objectifs pédagogiques", "bullseye", module.objectives)}
                    ${renderListSection("3. Compétences acquises", "stars", module.skills)}
                    ${renderInfoSection("4. Durée estimée", "clock-history", module.duration)}
                    ${renderInfoSection("5. Niveau", "bar-chart", module.level)}
                    ${renderListSection("6. Prérequis", "check2-square", module.prerequisites)}
                    ${renderPdfSection(module)}
                    ${renderLessonsSection(module)}
                    ${renderFinalQuizSection(module)}
                    ${renderResultSection(module, progress)}
                    ${renderValidationSection(module, percent)}
                </section>
            </div>
        </main>
    `;
}

function renderPersonalSummary(module, progress, percent) {
    const chapterCount = module.chapters.length;
    const completedCount = progress.completedChapters.length;
    const currentChapter = module.chapters[progress.currentChapter || 0]?.title || module.chapters[0]?.title || "Premier chapitre";

    return `
        <div class="personal-module-summary">
            <strong>${icon("person-badge")} Parcours personnel</strong>
            <span>ID apprenant: ${getCurrentUserId()}</span>
            <span>Avancement unique: ${percent}%</span>
            <span>Lecons validees: ${completedCount}/${chapterCount}</span>
            <small>Reprise conseillee: ${currentChapter}</small>
        </div>
    `;
}

function renderPresentation(module) {
    const paragraphs = module.introduction?.length ? module.introduction : [module.description];

    return `
        <article class="lms-card p-4 p-lg-5 mb-4">
            <span class="section-kicker">${icon("body-text")} 1. Présentation du module</span>
            <h2 class="mt-3">${module.subtitle || module.title}</h2>
            <div class="module-introduction">
                ${paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
            </div>
            ${module.learning?.length ? `
                <div class="learning-box">
                    <h3>${icon("mortarboard")} Ce que vous allez apprendre</h3>
                    <ul>${module.learning.map((item) => `<li>${item}</li>`).join("")}</ul>
                </div>
            ` : ""}
            ${module.importance ? `
                <div class="importance-box">
                    <strong>${icon("lightbulb")} Pourquoi ce module est important</strong>
                    <p>${module.importance}</p>
                </div>
            ` : ""}
        </article>
    `;
}

function renderListSection(title, iconName, items) {
    return `
        <article class="lms-card p-4 p-lg-5 mb-4">
            <span class="section-kicker">${icon(iconName)} ${title}</span>
            <ul class="feature-list mt-4">
                ${items.map((item) => `<li>${icon("check-circle")} ${item}</li>`).join("")}
            </ul>
        </article>
    `;
}

function renderInfoSection(title, iconName, value) {
    return `
        <article class="lms-card p-4 p-lg-5 mb-4">
            <span class="section-kicker">${icon(iconName)} ${title}</span>
            <p class="module-info-value mt-3 mb-0">${value}</p>
        </article>
    `;
}

function renderModuleFacts(module) {
    return `
        <div class="module-facts mt-4">
            <div>${icon("bar-chart")} <strong>Niveau</strong><span>${module.level}</span></div>
            <div>${icon("clock")} <strong>Durée estimée</strong><span>${module.duration}</span></div>
            <div>${icon("journal-text")} <strong>Leçons</strong><span>${module.chapters.length}</span></div>
            <div>${icon("patch-question")} <strong>Quiz</strong><span>${module.chapters.reduce((sum, chapter) => sum + chapter.quiz.length, 0)}</span></div>
            <div>${icon("file-earmark-pdf")} <strong>Supports PDF</strong><span>${module.pdfSupports?.length || 1}</span></div>
        </div>
    `;
}

function renderPdfSection(module) {
    const supports = module.pdfSupports?.length ? module.pdfSupports : [{
        title: `Support - ${module.title}`,
        description: "Emplacement reserve au support PDF du module.",
        url: "",
        filename: `${module.slug}.pdf`,
        available: false,
    }];

    return `
        <article class="lms-card p-4 p-lg-5 mb-4">
            <span class="section-kicker">${icon("file-earmark-pdf")} 7. Support de cours (PDF)</span>
            <div class="pdf-support-grid mt-4">
                ${supports.map((support) => `
                    <div class="pdf-support-card ${support.available ? "" : "is-placeholder"}">
                        <span class="pdf-icon">${icon("file-earmark-pdf")}</span>
                        <div>
                            <h3>${support.title}</h3>
                            <p>${support.description || "Support PDF du module."}</p>
                            <small>${support.filename || "document-a-ajouter.pdf"}</small>
                        </div>
                        <div class="pdf-actions">
                            <a class="btn btn-outline-brand btn-sm ${support.available ? "" : "disabled"}" href="${support.url || "#"}">${icon("box-arrow-up-right")} Ouvrir le PDF</a>
                            <a class="btn btn-brand btn-sm ${support.available ? "" : "disabled"}" href="${support.url || "#"}" download>${icon("download")} Télécharger</a>
                        </div>
                    </div>
                `).join("")}
            </div>
        </article>
    `;
}

function renderLessonsSection(module) {
    return `
        <article class="lms-card p-4 p-lg-5 mb-4">
            <span class="section-kicker">${icon("list-ol")} 8. Leçons</span>
            <div class="chapter-preview-list mt-4">
                ${module.chapters.map((chapter, index) => `
                    <a href="cours.html?slug=${module.slug}&chapter=${index}" class="chapter-preview">
                        <span>${index + 1}</span>
                        <div><strong>${chapter.title}</strong><small>${chapter.duration} · ${chapter.quiz.length} quiz</small></div>
                        ${icon("arrow-right")}
                    </a>
                `).join("")}
            </div>
        </article>
    `;
}

function renderFinalQuizSection(module) {
    const quizCount = module.chapters.reduce((sum, chapter) => sum + chapter.quiz.length, 0);
    return `
        <article class="lms-card p-4 p-lg-5 mb-4">
            <span class="section-kicker">${icon("patch-question")} 9. Quiz de fin de module</span>
            <p class="text-muted mt-3 mb-0">Le module contient ${quizCount} question${quizCount > 1 ? "s" : ""} répartie${quizCount > 1 ? "s" : ""} dans les leçons. Chaque quiz donne une correction immédiate et contribue au résultat final affiché ci-dessous.</p>
        </article>
    `;
}

function renderResultSection(module, progress) {
    const results = progress.quizResults || [];
    const totalQuestions = module.chapters.reduce((sum, chapter) => sum + chapter.quiz.length, 0);
    const correctAnswers = results.reduce((sum, result) => sum + result.correct, 0);
    const answeredQuestions = results.reduce((sum, result) => sum + result.total, 0);
    const percent = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const scoreOnTwenty = Math.round((percent / 5) * 10) / 10;
    const sortedResults = [...results].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastResult = sortedResults[0];

    return `
        <article class="lms-card p-4 p-lg-5 mb-4">
            <span class="section-kicker">${icon("award")} 10. Résultat avec note finale</span>
            <div class="final-result mt-4">
                <div><span>Questions traitées</span><strong>${answeredQuestions}/${totalQuestions}</strong></div>
                <div><span>Note finale</span><strong>${percent}%</strong></div>
                <div><span>Sur 20</span><strong>${scoreOnTwenty}/20</strong></div>
            </div>
            <p class="text-muted mt-3 mb-0">Dernier quiz: ${lastResult ? `${lastResult.chapterTitle} · ${formatDate(lastResult.date)}` : "aucun quiz terminé pour le moment"}.</p>
        </article>
    `;
}

function renderValidationSection(module, percent) {
    const isValidated = percent === 100;

    return `
        <article class="lms-card p-4 p-lg-5">
            <span class="section-kicker">${icon(isValidated ? "check2-circle" : "flag")} 11. Validation du module</span>
            <div class="validation-box ${isValidated ? "is-valid" : ""} mt-4">
                <strong>${isValidated ? "Module validé" : "Module en cours"}</strong>
                <p>${isValidated ? "Toutes les leçons sont terminées. Vous pouvez consulter vos résultats et continuer votre parcours." : "Terminez les leçons et répondez aux quiz pour valider complètement ce module."}</p>
                <a href="cours.html?slug=${module.slug}" class="btn btn-brand">${icon("play-circle")} Commencer le module</a>
            </div>
        </article>
    `;
}

initModuleDetail().catch((error) => {
    root.innerHTML = `<main class="container py-5"><div class="alert alert-danger">${error.message}</div></main>`;
});
