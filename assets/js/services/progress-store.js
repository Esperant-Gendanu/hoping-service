const STORAGE_KEY = "hopingLmsProgress";
const THEME_KEY = "hopingLmsTheme";

export function getCurrentUserId() {
    try {
        const user = JSON.parse(localStorage.getItem("currentUser"));
        return user?.id || "anonymous";
    } catch (error) {
        return "anonymous";
    }
}

function readStore() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        return {};
    }
}

function writeStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function readUserStore() {
    const store = readStore();
    const userId = getCurrentUserId();

    return store[userId] || {};
}

function writeUserStore(userStore) {
    const store = readStore();
    store[getCurrentUserId()] = userStore;
    writeStore(store);
}

export function getProgress(slug) {
    const store = readUserStore();
    return store[slug] || {
        completedChapters: [],
        currentChapter: 0,
        quizResults: [],
        lastActivity: null,
    };
}

export function saveProgress(slug, nextProgress) {
    const store = readUserStore();
    store[slug] = {
        ...getProgress(slug),
        ...nextProgress,
        lastActivity: new Date().toISOString(),
    };
    writeUserStore(store);
    return store[slug];
}

export function markChapterCompleted(slug, chapterId, chapterIndex) {
    const progress = getProgress(slug);
    const completedChapters = Array.from(new Set([...progress.completedChapters, chapterId]));
    return saveProgress(slug, { completedChapters, currentChapter: chapterIndex });
}

export function saveQuizResult(slug, result) {
    const progress = getProgress(slug);
    const quizResults = [
        ...progress.quizResults.filter((item) => item.chapterId !== result.chapterId),
        { ...result, date: new Date().toISOString() },
    ];

    return saveProgress(slug, { quizResults });
}

export function getAllProgress() {
    return readUserStore();
}

export function getModulePercent(module, progress = getProgress(module.slug)) {
    if (!module.chapters?.length) return 0;
    return Math.round((progress.completedChapters.length / module.chapters.length) * 100);
}

export function getTheme() {
    return localStorage.getItem(THEME_KEY) || "light";
}

export function setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.dataset.theme = theme;
}

export function applyStoredTheme() {
    document.documentElement.dataset.theme = getTheme();
}
