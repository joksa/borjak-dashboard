import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const yyyymmdd = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
const hhmm = `${pad(now.getHours())}${pad(now.getMinutes())}`;
const version = `1.${yyyymmdd}-${hhmm}`;

const outPath = join(__dirname, "../public/version.json");
writeFileSync(outPath, JSON.stringify({ version }, null, 2));
console.log(`Version: ${version}`);
