import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import { env } from "./env.js";
import { getDb } from "./db/connection.js";
import { catalogRouter } from "./routes/catalog.js";
import { libraryRouter } from "./routes/library.js";
import { chatRouter } from "./routes/chat.js";
import { miscRouter } from "./routes/misc.js";
import { TmdbError } from "./tmdb/client.js";
import { LlmError } from "./llm/openrouter.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "4mb" }));

app.use("/api", catalogRouter);
app.use("/api", libraryRouter);
app.use("/api", chatRouter);
app.use("/api", miscRouter);

// Production: serve the built client and fall back to index.html.
const clientDist = path.join(env.repoRoot, "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Error handler — keep messages human.
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const status =
      err instanceof TmdbError || err instanceof LlmError
        ? err.statusCode
        : ((err as { statusCode?: number }).statusCode ?? 500);
    if (status >= 500) console.error("[lumina]", err);
    res.status(status).json({ error: err.message || "Something went wrong" });
  },
);

getDb(); // open + migrate on boot

// ── Safety net: daily JSON snapshot of everything (library, ratings,
// notes, tags, episodes, conversations) into data/backups, keep 10.
// The SQLite db itself is gitignored by design — this guards against
// corruption/mistakes without putting private data in the repo.
try {
  const backupDir = path.join(path.dirname(env.dbPath), "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const target = path.join(backupDir, `lumina-${today}.json`);
  if (!fs.existsSync(target)) {
    const { exportAll } = await import("./services/exportService.js");
    fs.writeFileSync(target, JSON.stringify(exportAll(getDb())));
    const old = fs
      .readdirSync(backupDir)
      .filter((f) => f.startsWith("lumina-") && f.endsWith(".json"))
      .sort()
      .slice(0, -10);
    for (const f of old) fs.unlinkSync(path.join(backupDir, f));
    console.log(`  ✦ Backup written: data/backups/lumina-${today}.json`);
  }
} catch (err) {
  console.warn("[lumina] backup skipped:", (err as Error).message);
}

// Bound anchor_usage growth on the hottest path (every companion message
// reads it). Fire-and-forget: a prune failure must never block boot.
try {
  const { pruneAnchorUsage } = await import("./services/anchorService.js");
  pruneAnchorUsage(getDb());
} catch (err) {
  console.warn("[lumina] anchor_usage prune skipped:", (err as Error).message);
}

app.listen(env.port, env.host, () => {
  console.log(`
  ✦ Lumina API listening on http://${env.host}:${env.port}
    TMDB:       ${env.tmdbAccessToken ? "configured" : "MISSING — set TMDB_ACCESS_TOKEN in .env"}
    OpenRouter: ${env.openRouterApiKey ? "configured" : "MISSING — set OPENROUTER_API_KEY in .env"}
    Database:   ${env.dbPath}
  `);
});
