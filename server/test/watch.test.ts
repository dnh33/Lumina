import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createWatchRouter } from "../src/routes/watch.js";

const SOURCES = {
  sources: [
    {
      name: "My Server",
      type: "webdav",
      template: "https://your-server.example/media/{id}?s={s}&e={e}",
      trusted: true,
    },
  ],
};

function listen(app: express.Express): Promise<{ base: string; close: () => void }> {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({ base: `http://127.0.0.1:${port}`, close: () => server.close() });
    });
  });
}

describe("watch routes", () => {
  let dir: string;
  let withFile: { base: string; close: () => void };
  let withoutFile: { base: string; close: () => void };

  beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "lumina-watch-"));
    const file = path.join(dir, "sources.local.json");
    fs.writeFileSync(file, JSON.stringify(SOURCES));

    const appA = express();
    appA.use("/api", createWatchRouter(file));
    withFile = await listen(appA);

    const appB = express();
    appB.use("/api", createWatchRouter(path.join(dir, "missing.json")));
    withoutFile = await listen(appB);
  });

  afterAll(() => {
    withFile.close();
    withoutFile.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("GET /api/sources returns [] when no local file exists", async () => {
    const res = await fetch(`${withoutFile.base}/api/sources`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("GET /api/sources returns names only — never templates", async () => {
    const res = await fetch(`${withFile.base}/api/sources`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown[];
    expect(body).toEqual([{ name: "My Server", type: "webdav", trusted: true }]);
    expect(JSON.stringify(body)).not.toContain("your-server.example");
  });

  it("GET /api/watch/resolve builds the url for a known source", async () => {
    const res = await fetch(
      `${withFile.base}/api/watch/resolve?source=${encodeURIComponent("My Server")}&tmdbId=1399&type=tv&season=2&episode=7`,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      url: "https://your-server.example/media/1399?s=2&e=7",
      trusted: true,
    });
  });

  it("404s for an unknown source", async () => {
    const res = await fetch(
      `${withFile.base}/api/watch/resolve?source=nope&tmdbId=1399&type=tv&season=1&episode=1`,
    );
    expect(res.status).toBe(404);
  });

  it("400s on a bad tmdbId", async () => {
    const res = await fetch(
      `${withFile.base}/api/watch/resolve?source=${encodeURIComponent("My Server")}&tmdbId=abc&type=tv&season=1&episode=1`,
    );
    expect(res.status).toBe(400);
  });

  it("400s on a bad media type", async () => {
    const res = await fetch(
      `${withFile.base}/api/watch/resolve?source=${encodeURIComponent("My Server")}&tmdbId=1399&type=vhs&season=1&episode=1`,
    );
    expect(res.status).toBe(400);
  });

  it("400s when the template needs season/episode but none were given", async () => {
    const res = await fetch(
      `${withFile.base}/api/watch/resolve?source=${encodeURIComponent("My Server")}&tmdbId=1399&type=movie`,
    );
    expect(res.status).toBe(400);
  });
});
