import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";

/** Max total characters for the context payload */
const MAX_CONTEXT_CHARS = 30_000;
/** Max characters per individual file */
const MAX_FILE_CHARS = 3_000;
/** Max depth for directory tree */
const MAX_TREE_DEPTH = 4;

const IGNORE_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", ".cache",
  "__pycache__", ".venv", "venv", ".tox", "coverage", ".nyc_output",
  ".turbo", ".vercel", ".output", "target", "vendor", ".svn",
]);

const IGNORE_FILES = new Set([
  "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb",
  ".DS_Store", "Thumbs.db",
]);

const KEY_FILES = [
  "package.json", "tsconfig.json", "pyproject.toml", "Cargo.toml",
  "go.mod", "Gemfile", "requirements.txt", "pom.xml", "build.gradle",
  "Makefile", "Dockerfile", "docker-compose.yml", "docker-compose.yaml",
  ".env.example", "README.md", "CLAUDE.md",
];

const KEY_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".rb",
  ".java", ".kt", ".swift", ".c", ".cpp", ".h", ".cs",
  ".vue", ".svelte", ".astro",
]);

interface ScanResult {
  cwd: string;
  tree: string;
  keyFiles: Array<{ path: string; content: string }>;
  summary: string;
}

export function scanCodebase(dir: string): ScanResult {
  console.log(chalk.dim("Scanning codebase..."));

  const tree = buildTree(dir, "", 0);
  const keyFiles: Array<{ path: string; content: string }> = [];
  let totalChars = tree.length;

  // 1. Read key config/manifest files first (highest priority)
  for (const name of KEY_FILES) {
    const fp = path.join(dir, name);
    if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
      const content = readFileTruncated(fp);
      if (totalChars + content.length < MAX_CONTEXT_CHARS) {
        keyFiles.push({ path: name, content });
        totalChars += content.length;
      }
    }
  }

  // 2. Find important source files (entry points, schemas, routes, configs)
  const sourceFiles = findSourceFiles(dir);
  // Sort by priority: shorter paths first (likely entry points), then alphabetical
  sourceFiles.sort((a, b) => {
    const depthA = a.split("/").length;
    const depthB = b.split("/").length;
    if (depthA !== depthB) return depthA - depthB;
    return a.localeCompare(b);
  });

  for (const relPath of sourceFiles) {
    if (keyFiles.some((f) => f.path === relPath)) continue; // already included
    if (totalChars >= MAX_CONTEXT_CHARS) break;

    const fp = path.join(dir, relPath);
    const content = readFileTruncated(fp);
    if (totalChars + content.length < MAX_CONTEXT_CHARS) {
      keyFiles.push({ path: relPath, content });
      totalChars += content.length;
    }
  }

  const fileCount = countFiles(dir);
  const summary = `Working directory: ${dir}\n${fileCount.total} files (${fileCount.source} source), ${keyFiles.length} key files scanned`;
  console.log(chalk.dim(`  ${fileCount.total} files found, ${keyFiles.length} included in context (${(totalChars / 1024).toFixed(1)}KB)`));

  return { cwd: dir, tree, keyFiles, summary };
}

export function formatContext(scan: ScanResult): string {
  const parts: string[] = [];

  parts.push(`=== EXISTING CODEBASE ===`);
  parts.push(scan.summary);
  parts.push("");
  parts.push("Directory structure:");
  parts.push(scan.tree);

  for (const file of scan.keyFiles) {
    parts.push(`\n--- ${file.path} ---`);
    parts.push(file.content);
  }

  parts.push("\n=== END CODEBASE CONTEXT ===");

  return parts.join("\n");
}

function buildTree(dir: string, prefix: string, depth: number): string {
  if (depth > MAX_TREE_DEPTH) return "";

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return "";
  }

  // Filter and sort
  entries = entries.filter((e) => {
    if (e.name.startsWith(".") && e.name !== ".env.example") return false;
    if (e.isDirectory() && IGNORE_DIRS.has(e.name)) return false;
    if (e.isFile() && IGNORE_FILES.has(e.name)) return false;
    return true;
  });
  entries.sort((a, b) => {
    // Directories first
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  const lines: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isLast = i === entries.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = isLast ? "    " : "│   ";

    if (entry.isDirectory()) {
      lines.push(`${prefix}${connector}${entry.name}/`);
      const subtree = buildTree(path.join(dir, entry.name), prefix + childPrefix, depth + 1);
      if (subtree) lines.push(subtree);
    } else {
      lines.push(`${prefix}${connector}${entry.name}`);
    }
  }

  return lines.join("\n");
}

function findSourceFiles(dir: string, relBase = ""): string[] {
  const results: string[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      const sub = findSourceFiles(path.join(dir, entry.name), path.join(relBase, entry.name));
      results.push(...sub);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (!KEY_EXTENSIONS.has(ext)) continue;

      const relPath = path.join(relBase, entry.name);
      // Prioritize files that look like entry points or important
      const name = entry.name.toLowerCase();
      const isHighPriority =
        name.includes("index") ||
        name.includes("main") ||
        name.includes("app") ||
        name.includes("route") ||
        name.includes("schema") ||
        name.includes("model") ||
        name.includes("config") ||
        name.includes("layout") ||
        name.includes("page") ||
        name.includes("middleware");

      if (isHighPriority) {
        results.unshift(relPath); // front of list
      } else {
        results.push(relPath);
      }
    }
  }

  return results;
}

function readFileTruncated(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    if (content.length <= MAX_FILE_CHARS) return content;
    return content.slice(0, MAX_FILE_CHARS) + "\n... (truncated)";
  } catch {
    return "(unreadable)";
  }
}

function countFiles(dir: string): { total: number; source: number } {
  let total = 0;
  let source = 0;

  function walk(d: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.name.startsWith(".")) continue;
      if (e.isDirectory()) {
        if (!IGNORE_DIRS.has(e.name)) walk(path.join(d, e.name));
      } else {
        total++;
        if (KEY_EXTENSIONS.has(path.extname(e.name))) source++;
      }
    }
  }

  walk(dir);
  return { total, source };
}
