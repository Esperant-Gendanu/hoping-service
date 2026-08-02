import { canAccessModule, getCurrentUser, loadModule } from "../services/lms-api.js";
import { applyStoredTheme, getCurrentUserId, getModulePercent, getProgress, markChapterCompleted, saveProgress } from "../services/progress-store.js";
import { mountQuiz } from "../components/quiz.js";
import { icon, progressBar, renderContentBlock } from "../components/ui.js";

applyStoredTheme();

const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");
let chapterIndex = Number(params.get("chapter") || 0);
const user = getCurrentUser();
const root = document.querySelector("#courseReader");

async function initReader() {
    if (!slug) throw new Error("Module introuvable.");
    const module = await loadModule(slug);
    if (!canAccessModule(user, module.id)) throw new Error("Vous n'êtes pas inscrit à ce module.");

    chapterIndex = Math.min(Math.max(chapterIndex, 0), module.chapters.length - 1);
    saveProgress(module.slug, { currentChapter: chapterIndex });
    renderReader(module);
}

function renderReader(module) {
    const chapter = module.chapters[chapterIndex];
    const progress = getProgress(module.slug);
    const percent = getModulePercent(module, progress);

    document.title = `${chapter.title} | ${module.title}`;
    root.innerHTML = `
        <main class="course-layout">
            <aside class="course-sidebar">
                <a href="module.html?slug=${module.slug}" class="back-link">${icon("arrow-left")} Présentation</a>
                <h1>${module.title}</h1>
                ${progressBar(percent, "Module")}
                <nav class="chapter-nav" aria-label="Sommaire du cours">
                    ${module.chapters.map((item, index) => `
                        <button type="button" class="${index === chapterIndex ? "is-active" : ""}" data-chapter="${index}">
                            <span>${progress.completedChapters.includes(item.id) ? icon("check2-circle") : index + 1}</span>
                            <strong>${item.title}</strong>
                            <small>${item.duration}</small>
                        </button>
                    `).join("")}
                </nav>
            </aside>
            <section class="course-main">
                <header class="course-topbar">
                    <a href="dashboard.html" class="btn btn-outline-brand btn-sm">${icon("grid")} Dashboard</a>
                    <span>${icon("person-badge")} Parcours ID ${getCurrentUserId()}</span>
                    <span>${icon("clock-history")} ${chapter.duration}</span>
                </header>
                ${renderPersonalEvolution(module, chapter, progress, percent)}
                <article class="course-content lms-card">
                    <span class="section-kicker">${icon("book")} Chapitre ${chapterIndex + 1}</span>
                    <h2>${chapter.title}</h2>
                    ${chapter.content.map(renderContentBlock).join("")}
                    <div class="course-actions">
                        <button class="btn btn-outline-brand" id="prevChapter" ${chapterIndex === 0 ? "disabled" : ""}>${icon("arrow-left")} Précédent</button>
                        <button class="btn btn-brand" id="completeChapter">${icon("check2-circle")} Marquer terminé</button>
                        <button class="btn btn-outline-brand" id="nextChapter" ${chapterIndex === module.chapters.length - 1 ? "disabled" : ""}>Suivant ${icon("arrow-right")}</button>
                    </div>
                </article>
                <div id="chapterQuiz"></div>
            </section>
        </main>
    `;

    mountQuiz(document.querySelector("#chapterQuiz"), module.slug, chapter);
    bindReaderEvents(module);
}

function renderPersonalEvolution(module, chapter, progress, percent) {
    const completedCount = progress.completedChapters.length;
    const totalCount = module.chapters.length;
    const remainingCount = Math.max(totalCount - completedCount, 0);
    const isChapterDone = progress.completedChapters.includes(chapter.id);
    const nextAction = isChapterDone
        ? "Continuez vers le chapitre suivant ou refaites le quiz pour consolider."
        : "Lisez le chapitre, faites l'exercice d'application, puis marquez la lecon terminee.";

    return `
        <section class="personal-evolution lms-card" aria-label="Evolution personnelle">
            <div>
                <span class="section-kicker">${icon("graph-up-arrow")} Evolution personnelle</span>
                <h2>Parcours unique de ${user?.prenom || "l'apprenant"} - ID ${getCurrentUserId()}</h2>
                <p>Cette progression est enregistree uniquement pour cet identifiant. Deux personnes inscrites au meme module peuvent donc avancer a des rythmes differents, reprendre des chapitres differents et garder des resultats de quiz separes.</p>
            </div>
            <div class="personal-evolution-grid">
                <div><span>Module</span><strong>${percent}%</strong></div>
                <div><span>Lecons validees</span><strong>${completedCount}/${totalCount}</strong></div>
                <div><span>Restantes</span><strong>${remainingCount}</strong></div>
            </div>
            <div class="personal-next-step">
                ${icon("signpost-split")} <strong>Prochaine etape conseillee:</strong> ${nextAction}
            </div>
        </section>
    `;
}

function bindReaderEvents(module) {
    document.querySelectorAll("[data-chapter]").forEach((button) => {
        button.addEventListener("click", () => navigateTo(module, Number(button.dataset.chapter)));
    });

    document.querySelector("#prevChapter")?.addEventListener("click", () => navigateTo(module, chapterIndex - 1));
    document.querySelector("#nextChapter")?.addEventListener("click", () => navigateTo(module, chapterIndex + 1));
    document.querySelector("#completeChapter")?.addEventListener("click", () => {
        markChapterCompleted(module.slug, module.chapters[chapterIndex].id, chapterIndex);
        renderReader(module);
    });
}

function navigateTo(module, nextIndex) {
    chapterIndex = Math.min(Math.max(nextIndex, 0), module.chapters.length - 1);
    saveProgress(module.slug, { currentChapter: chapterIndex });
    history.replaceState(null, "", `cours.html?slug=${module.slug}&chapter=${chapterIndex}`);
    renderReader(module);
    window.scrollTo({ top: 0, behavior: "smooth" });
}

initReader().catch((error) => {
    root.innerHTML = `<main class="container py-5"><div class="alert alert-danger">${error.message}</div></main>`;
});
