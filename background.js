import { QA_MAP } from "./qa-map.js";

function normalize(text) {
    return text
        .toLowerCase()
        .replace(/[?.,!]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

async function ensureContentScript(tabId) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ["content.js"],
        });
    } catch (e) {
        // На chrome://, webstore, newtab — не інжектиться. Це ок.
        console.warn("Cannot inject content.js on this page:", e);
    }
}

async function copyToClipboard(tabId, text) {
    // Пишемо у clipboard з контексту сторінки
    await chrome.scripting.executeScript({
        target: { tabId },
        func: async (t) => {
            try {
                await navigator.clipboard.writeText(t);
                return true;
            } catch (e) {
                // Fallback (старий метод)
                const ta = document.createElement("textarea");
                ta.value = t;
                ta.style.position = "fixed";
                ta.style.left = "-9999px";
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                const ok = document.execCommand("copy");
                document.body.removeChild(ta);
                return ok;
            }
        },
        args: [text],
    });
}

chrome.commands.onCommand.addListener(async (command) => {
    if (command !== "find_answer") return;

    const tab = await getActiveTab();
    if (!tab?.id) return;

    await ensureContentScript(tab.id);

    chrome.tabs.sendMessage(tab.id, { type: "GET_SELECTION" }, async (res) => {
        const selected = (res?.text || "").trim();
        if (!selected) return;

        const key = normalize(selected);
        const answer = QA_MAP[key];

        if (!answer) {
            console.warn("No answer found for:", key, "selected:", selected);
            return;
        }

        await copyToClipboard(tab.id, answer);
    });
});
