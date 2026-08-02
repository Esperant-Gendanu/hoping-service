const MODULES_INDEX_URL = "data/modules.json";
const MODULE_URL = (slug) => `data/modules/${slug}.json`;

export async function loadModuleIndex() {
    const response = await fetch(MODULES_INDEX_URL, { cache: "no-store" });
    if (!response.ok) {
        throw new Error("Impossible de charger le catalogue des modules.");
    }

    return response.json();
}

export async function loadModule(slug) {
    const response = await fetch(MODULE_URL(slug), { cache: "no-store" });
    if (!response.ok) {
        throw new Error("Impossible de charger ce module.");
    }

    return response.json();
}

export function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("currentUser"));
    } catch (error) {
        return null;
    }
}

export function canAccessModule(user, moduleId) {
    return !user?.modules || user.modules.includes(moduleId);
}
