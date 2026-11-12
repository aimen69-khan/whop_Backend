const fs = require("fs/promises");
const path = require("path");

async function ensureStore(file) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, "[]\n", "utf8");
  }
}

async function readAll(file) {
  await ensureStore(file);
  const raw = await fs.readFile(file, "utf8");
  if (!raw.trim()) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    throw new Error("Lead storage file contains invalid JSON.");
  }
}

async function writeAll(file, records) {
  await ensureStore(file);
  const temp = `${file}.tmp`;
  await fs.writeFile(temp, JSON.stringify(records, null, 2), "utf8");
  await fs.rename(temp, file);
}

async function add(file, record) {
  const records = await readAll(file);
  records.unshift(record);
  await writeAll(file, records);
  return record;
}

module.exports = { ensureStore, readAll, writeAll, add };