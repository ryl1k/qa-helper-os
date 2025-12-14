import fs from "fs";

const INPUT = "ans.txt";
const OUTPUT = "qa-map.js";

/** Така ж нормалізація, як у розширенні */
function normalize(s) {
    return s
        .toLowerCase()
        .replace(/[?.,!]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

const raw = fs.readFileSync(INPUT, "utf8");

// беремо тільки рядки де є " - "
const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => l.includes(" - "));

// парсимо в map
const map = {};
for (const line of lines) {
    const idx = line.lastIndexOf(" - ");
    const q = line.slice(0, idx).trim();
    const a = line.slice(idx + 3).trim();
    if (!q || !a) continue;

    const key = normalize(q);

    // якщо дублікати — лишаємо перший (або можеш замінити на останній)
    if (!(key in map)) map[key] = a;
}

const out =
    `// Auto-generated from ${INPUT}\n` +
    `export const QA_MAP = ${JSON.stringify(map, null, 2)};\n`;

fs.writeFileSync(OUTPUT, out, "utf8");

console.log(`Generated ${OUTPUT}`);
console.log(`Entries: ${Object.keys(map).length}`);
