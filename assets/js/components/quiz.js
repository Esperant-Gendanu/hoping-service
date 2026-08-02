import { saveQuizResult } from "../services/progress-store.js";
import { icon } from "./ui.js";

export function mountQuiz(container, moduleSlug, chapter) {
    const answers = new Map();

    container.innerHTML = `
        <section class="quiz-panel" aria-labelledby="quizTitle">
            <div class="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
                <div>
                    <span class="section-kicker">${icon("patch-question")} Quiz</span>
                    <h2 id="quizTitle" class="h4 fw-bold mt-3 mb-1">${chapter.title}</h2>
                    <p class="text-muted mb-0">Correction immédiate et explication après chaque réponse.</p>
                </div>
                <div class="quiz-score" id="quizScore">0%</div>
            </div>
            <div class="quiz-questions">
                ${chapter.quiz.map((question, questionIndex) => renderQuestion(question, questionIndex)).join("")}
            </div>
            <div class="quiz-summary" id="quizSummary" aria-live="polite"></div>
        </section>
    `;

    container.querySelectorAll("[data-choice]").forEach((button) => {
        button.addEventListener("click", () => {
            const questionIndex = Number(button.dataset.question);
            const choiceIndex = Number(button.dataset.choice);
            if (answers.has(questionIndex)) return;

            answers.set(questionIndex, choiceIndex);
            revealAnswer(container, chapter.quiz[questionIndex], questionIndex, choiceIndex);
            updateScore(container, moduleSlug, chapter, answers);
        });
    });
}

function renderQuestion(question, questionIndex) {
    return `
        <article class="quiz-question">
            <h3>${questionIndex + 1}. ${question.question}</h3>
            <div class="quiz-options">
                ${question.choices.map((choice, choiceIndex) => `
                    <button type="button" class="quiz-option" data-question="${questionIndex}" data-choice="${choiceIndex}">
                        <span>${String.fromCharCode(65 + choiceIndex)}</span>
                        ${choice}
                    </button>
                `).join("")}
            </div>
            <p class="quiz-explanation" data-explanation="${questionIndex}" hidden></p>
        </article>
    `;
}

function revealAnswer(container, question, questionIndex, choiceIndex) {
    const buttons = container.querySelectorAll(`[data-question="${questionIndex}"]`);
    buttons.forEach((button) => {
        const currentChoice = Number(button.dataset.choice);
        button.disabled = true;
        if (currentChoice === question.answer) button.classList.add("is-correct");
        if (currentChoice === choiceIndex && currentChoice !== question.answer) button.classList.add("is-wrong");
    });

    const explanation = container.querySelector(`[data-explanation="${questionIndex}"]`);
    explanation.hidden = false;
    explanation.innerHTML = `${choiceIndex === question.answer ? icon("check-circle") : icon("x-circle")} ${question.explanation}`;
}

function updateScore(container, moduleSlug, chapter, answers) {
    const total = chapter.quiz.length;
    const correct = chapter.quiz.filter((question, index) => answers.get(index) === question.answer).length;
    const percent = Math.round((correct / total) * 100);
    const scoreOnTwenty = Math.round((percent / 5) * 10) / 10;

    container.querySelector("#quizScore").textContent = `${percent}%`;

    if (answers.size === total) {
        const result = {
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            correct,
            total,
            percent,
            scoreOnTwenty,
            answers: chapter.quiz.map((question, index) => ({
                question: question.question,
                selected: question.choices[answers.get(index)],
                correct: question.choices[question.answer],
                isCorrect: answers.get(index) === question.answer,
            })),
        };

        saveQuizResult(moduleSlug, result);
        container.querySelector("#quizSummary").innerHTML = `
            <h3>${icon("award")} Résultat du quiz</h3>
            <p class="mb-2"><strong>${correct}/${total}</strong> bonnes réponses, soit <strong>${percent}%</strong> et <strong>${scoreOnTwenty}/20</strong>.</p>
            <div class="quiz-review">
                ${result.answers.map((answer) => `
                    <div class="${answer.isCorrect ? "is-correct" : "is-wrong"}">
                        <strong>${answer.isCorrect ? icon("check2") : icon("x")} ${answer.question}</strong>
                        <span>Votre réponse: ${answer.selected}</span>
                        ${answer.isCorrect ? "" : `<span>Réponse attendue: ${answer.correct}</span>`}
                    </div>
                `).join("")}
            </div>
        `;
    }
}
