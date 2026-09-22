import { saveQuizResult } from "../services/progress-store.js";
import { icon } from "./ui.js";

export function mountQuiz(container, moduleSlug, chapter) {
    const answers = new Map();
    const questions = chapter.quiz.map((question, questionIndex) => ({
        ...question,
        originalIndex: questionIndex,
        shuffledChoices: shuffleChoices(question.choices, question.answer),
    }));

    container.innerHTML = `
        <section class="quiz-panel" aria-labelledby="quizTitle">
            <div class="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
                <div>
                    <span class="section-kicker">${icon("patch-question")} Quiz</span>
                    <h2 id="quizTitle" class="h4 fw-bold mt-3 mb-1">${chapter.title}</h2>
                    <p class="text-muted mb-0">Repondez a toutes les questions, puis validez pour obtenir une correction complete et une note sur 20.</p>
                </div>
                <div class="quiz-score" id="quizScore">0/${questions.length}</div>
            </div>
            <div class="quiz-progress mb-3">
                <span id="quizProgressText">0 question traitee</span>
                <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="0">
                    <div class="progress-bar" id="quizProgressBar" style="width: 0%"></div>
                </div>
            </div>
            <div class="quiz-questions">
                ${questions.map((question, questionIndex) => renderQuestion(question, questionIndex)).join("")}
            </div>
            <div class="quiz-toolbar">
                <button type="button" class="btn btn-outline-brand" id="resetQuiz">${icon("arrow-counterclockwise")} Recommencer</button>
                <button type="button" class="btn btn-brand" id="submitQuiz" disabled>${icon("send-check")} Valider le quiz</button>
            </div>
            <div class="quiz-summary" id="quizSummary" aria-live="polite"></div>
        </section>
    `;

    container.querySelectorAll("[data-choice]").forEach((button) => {
        button.addEventListener("click", () => {
            const questionIndex = Number(button.dataset.question);
            const choiceIndex = Number(button.dataset.choice);
            answers.set(questionIndex, choiceIndex);
            markSelected(container, questionIndex, choiceIndex);
            updateProgress(container, questions, answers);
        });
    });

    container.querySelector("#submitQuiz").addEventListener("click", () => {
        revealResults(container, moduleSlug, chapter, questions, answers);
    });

    container.querySelector("#resetQuiz").addEventListener("click", () => mountQuiz(container, moduleSlug, chapter));
}

function renderQuestion(question, questionIndex) {
    return `
        <article class="quiz-question">
            <h3>${questionIndex + 1}. ${question.question}</h3>
            <div class="quiz-options">
                ${question.shuffledChoices.map((choice, choiceIndex) => `
                    <button type="button" class="quiz-option" data-question="${questionIndex}" data-choice="${choiceIndex}">
                        <span>${String.fromCharCode(65 + choiceIndex)}</span>
                        ${choice.text}
                    </button>
                `).join("")}
            </div>
            <p class="quiz-explanation" data-explanation="${questionIndex}" hidden></p>
        </article>
    `;
}

function markSelected(container, questionIndex, choiceIndex) {
    const buttons = container.querySelectorAll(`[data-question="${questionIndex}"]`);
    buttons.forEach((button) => {
        button.classList.toggle("is-selected", Number(button.dataset.choice) === choiceIndex);
    });
}

function updateProgress(container, questions, answers) {
    const answered = answers.size;
    const total = questions.length;
    const percent = total ? Math.round((answered / total) * 100) : 0;

    container.querySelector("#quizScore").textContent = `${answered}/${total}`;
    container.querySelector("#quizProgressText").textContent = `${answered} question${answered > 1 ? "s" : ""} traitee${answered > 1 ? "s" : ""}`;
    container.querySelector("#quizProgressBar").style.width = `${percent}%`;
    container.querySelector(".quiz-progress .progress").setAttribute("aria-valuenow", answered);
    container.querySelector("#submitQuiz").disabled = answered !== total;
}

function revealResults(container, moduleSlug, chapter, questions, answers) {
    const total = questions.length;
    const correct = questions.filter((question, index) => question.shuffledChoices[answers.get(index)]?.isCorrect).length;
    const percent = Math.round((correct / total) * 100);
    const scoreOnTwenty = Math.round((percent / 5) * 10) / 10;

    container.querySelector("#quizScore").textContent = `${percent}%`;
    container.querySelector("#submitQuiz").disabled = true;

    questions.forEach((question, questionIndex) => {
        const selectedChoice = answers.get(questionIndex);
        const buttons = container.querySelectorAll(`[data-question="${questionIndex}"]`);
        buttons.forEach((button) => {
            const choice = question.shuffledChoices[Number(button.dataset.choice)];
            button.disabled = true;
            button.classList.toggle("is-correct", choice.isCorrect);
            button.classList.toggle("is-wrong", Number(button.dataset.choice) === selectedChoice && !choice.isCorrect);
        });

        const explanation = container.querySelector(`[data-explanation="${questionIndex}"]`);
        explanation.hidden = false;
        explanation.innerHTML = `${question.shuffledChoices[selectedChoice]?.isCorrect ? icon("check-circle") : icon("x-circle")} ${question.explanation}`;
    });

    const result = {
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        correct,
        total,
        percent,
        scoreOnTwenty,
        mastery: percent >= 80 ? "Acquis" : percent >= 50 ? "A consolider" : "A reprendre",
        answers: questions.map((question, index) => {
            const selected = question.shuffledChoices[answers.get(index)];
            const expected = question.shuffledChoices.find((choice) => choice.isCorrect);
            return {
                question: question.question,
                selected: selected?.text || "Aucune reponse",
                correct: expected?.text || "",
                isCorrect: Boolean(selected?.isCorrect),
            };
        }),
    };

    saveQuizResult(moduleSlug, result);
    container.querySelector("#quizSummary").innerHTML = `
        <h3>${icon("award")} Resultat du quiz</h3>
        <p class="mb-2"><strong>${correct}/${total}</strong> bonnes reponses, soit <strong>${percent}%</strong> et <strong>${scoreOnTwenty}/20</strong>.</p>
        <p class="quiz-mastery">${icon("graph-up-arrow")} Niveau: <strong>${result.mastery}</strong></p>
        <div class="quiz-review">
            ${result.answers.map((answer) => `
                <div class="${answer.isCorrect ? "is-correct" : "is-wrong"}">
                    <strong>${answer.isCorrect ? icon("check2") : icon("x")} ${answer.question}</strong>
                    <span>Votre reponse: ${answer.selected}</span>
                    ${answer.isCorrect ? "" : `<span>Reponse attendue: ${answer.correct}</span>`}
                </div>
            `).join("")}
        </div>
    `;
}

function shuffleChoices(choices, answerIndex) {
    return choices
        .map((text, index) => ({ text, isCorrect: index === answerIndex }))
        .sort((a, b) => stableChoiceWeight(a.text) - stableChoiceWeight(b.text));
}

function stableChoiceWeight(text) {
    return Array.from(text).reduce((sum, character, index) => sum + character.charCodeAt(0) * (index + 1), 0) % 997;
}
