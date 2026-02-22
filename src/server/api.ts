import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import type { DebateResult } from "../orchestrator/index.js";
import { exportToMarkdown, consensusToSpec } from "../utils/export.js";
import type { WsServer } from "./ws.js";

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
};

function killPort(port: number): void {
  try {
    const pids = execSync(`lsof -ti:${port} 2>/dev/null`, { encoding: "utf-8" }).trim();
    if (pids) {
      for (const pid of pids.split("\n")) {
        try { process.kill(parseInt(pid, 10), "SIGKILL"); } catch {}
      }
      execSync("sleep 0.5");
    }
  } catch {}
}

export function createHttpServer(
  port: number,
  getResult: () => DebateResult | null,
  wsServer: WsServer,
): http.Server {
  killPort(port);

  // Resolve static dir: ../../web/out relative to this file
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const staticDir = path.resolve(thisDir, "../../web/out");

  const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // API routes
    if (req.url === "/export" && req.method === "GET") {
      const result = getResult();
      if (!result) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "No debate result available" }));
        return;
      }

      const markdown = exportToMarkdown(result);
      res.writeHead(200, {
        "Content-Type": "text/markdown",
        "Content-Disposition": "attachment; filename=twofer-spec.md",
      });
      res.end(markdown);
      return;
    }

    if (req.url === "/spec" && req.method === "GET") {
      const result = getResult();
      if (!result) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "No debate result available" }));
        return;
      }

      const spec = `# Technical Specification\n\n${consensusToSpec(result.consensus)}`;
      res.writeHead(200, {
        "Content-Type": "text/markdown",
        "Content-Disposition": "attachment; filename=twofer-spec.md",
      });
      res.end(spec);
      return;
    }

    if (req.url === "/result" && req.method === "GET") {
      const result = getResult();
      if (!result) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "No debate result available" }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    }

    // Static file serving from web/out/
    let urlPath = req.url?.split("?")[0] ?? "/";
    if (urlPath === "/") urlPath = "/index.html";
    // trailingSlash: /foo/ -> /foo/index.html
    if (urlPath.endsWith("/")) urlPath += "index.html";

    const filePath = path.join(staticDir, urlPath);

    // Prevent directory traversal
    if (!filePath.startsWith(staticDir)) {
      res.writeHead(403);
      res.end();
      return;
    }

    try {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const ext = path.extname(filePath);
        const contentType = MIME[ext] || "application/octet-stream";
        res.writeHead(200, { "Content-Type": contentType });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    } catch {
      // File not found — fall through to 404
    }

    // Try .html extension for extensionless paths
    try {
      const htmlPath = filePath + ".html";
      if (fs.statSync(htmlPath).isFile()) {
        res.writeHead(200, { "Content-Type": "text/html" });
        fs.createReadStream(htmlPath).pipe(res);
        return;
      }
    } catch {
      // Not found
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  // WebSocket upgrade: route /ws to wsServer
  server.on("upgrade", (req, socket, head) => {
    if (req.url === "/ws") {
      wsServer.wss.handleUpgrade(req, socket, head, (ws) => {
        wsServer.wss.emit("connection", ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  server.listen(port);
  return server;
}
