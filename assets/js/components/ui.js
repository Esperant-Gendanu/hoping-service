export function icon(name) {
    return `<i class="bi bi-${name}" aria-hidden="true"></i>`;
}

export function progressBar(percent, label = "Progression") {
    return `
        <div class="lms-progress" aria-label="${label}">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="small fw-bold">${label}</span>
                <span class="small text-muted">${percent}%</span>
            </div>
            <div class="progress" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar" style="width: ${percent}%"></div>
            </div>
        </div>
    `;
}

export function moduleCard(module, percent = 0, locked = false) {
    const href = locked ? "#" : `module.html?slug=${module.slug}`;
    const buttonLabel = locked ? "Non inscrit" : percent > 0 ? "Continuer le module" : "Commencer le module";
    const buttonIcon = locked ? "lock" : "play-circle";
    const pdfCount = module.pdfSupports?.length || 1;

    return `
        <article class="lms-card module-catalog-card ${locked ? "is-locked" : ""}">
            <img src="${module.cover}" alt="" class="module-cover" loading="lazy">
            <div class="module-card-body">
                <div class="d-flex justify-content-between gap-2 align-items-start mb-3">
                    <span class="module-card-icon">${icon(module.icon || "journal-bookmark")}</span>
                    <span class="module-code">${module.id}</span>
                </div>
                <h3>${module.title}</h3>
                <p>${module.description}</p>
                <div class="module-meta">
                    <span>${icon("bar-chart")} ${module.level}</span>
                    <span>${icon("clock")} ${module.duration}</span>
                    <span>${icon("layers")} ${module.chaptersCount} chapitres</span>
                    <span>${icon("patch-question")} ${module.quizCount} quiz</span>
                </div>
                <div class="module-pdf-mini">
                    <span>${icon("file-earmark-pdf")} Support PDF</span>
                    <small>${pdfCount} emplacement${pdfCount > 1 ? "s" : ""} prévu${pdfCount > 1 ? "s" : ""}</small>
                </div>
                ${progressBar(percent)}
                <a class="btn btn-brand w-100 ${locked ? "disabled" : ""}" href="${href}" aria-disabled="${locked}">
                    ${icon(buttonIcon)} ${buttonLabel}
                </a>
            </div>
        </article>
    `;
}

export function renderContentBlock(block) {
    if (block.type === "heading") return `<h2 class="course-heading">${block.text}</h2>`;
    if (block.type === "paragraph") return `<p class="course-paragraph">${block.text}</p>`;
    if (block.type === "list") {
        return `<ul class="course-list">${block.items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
    }
    if (block.type === "image") {
        return `
            <figure class="course-figure">
                <img src="${block.src}" alt="${block.alt || ""}" loading="lazy">
                ${block.caption ? `<figcaption>${block.caption}</figcaption>` : ""}
            </figure>
        `;
    }
    if (block.type === "table") {
        return `
            <div class="table-responsive course-table">
                <table class="table align-middle">
                    <thead><tr>${block.headers.map((header) => `<th scope="col">${header}</th>`).join("")}</tr></thead>
                    <tbody>${block.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
                </table>
            </div>
        `;
    }
    if (block.type === "info") {
        const variant = block.variant === "alert" ? "alert" : "note";
        const blockIcon = variant === "alert" ? "exclamation-triangle" : "info-circle";
        return `
            <aside class="course-callout ${variant}">
                <strong>${icon(blockIcon)} ${block.title || "Information"}</strong>
                <p>${block.text}</p>
            </aside>
        `;
    }
    if (block.type === "video") {
        return `
            <div class="course-video">
                <iframe src="${block.src}" title="${block.title || "Vidéo de cours"}" allowfullscreen loading="lazy"></iframe>
            </div>
        `;
    }

    return "";
}

export function formatDate(isoDate) {
    if (!isoDate) return "Aucune activité";
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(isoDate));
}
