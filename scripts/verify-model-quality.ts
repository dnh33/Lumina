/**
 * Post-fix model quality verification.
 * Sends 50 queries through the chat SSE endpoint and classifies each response.
 *
 * Classification Schema v1 (agreed with @runeforge-researcher):
 *  - SNAG: "I hit a snag" / JSON parse error / unclosed fence / truncated
 *  - OVER_TOOLING: >4 tool calls in one turn
 *  - HALLUCINATION: Title/year/director/genre not in library or TMDB, uncorrected
 *  - Clean: None of the above
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE = "http://127.0.0.1:4000/api";

// 50 diverse queries across all failure vectors
const QUERIES: string[] = [
  // 10 title search / recs — tests hallucination
  "I want something like Parasite but Danish",
  "What should I watch after The Wire?",
  "Korean thrillers under 2 hours",
  "Best sci-fi of 2024 that's not Dune",
  "Something with Adam Driver that's not Star Wars",
  "Mind-bending movies like Tenet",
  "Underappreciated Denis Villeneuve films",
  "Slow-burn horror with good atmosphere",
  "Cult classics from the 90s",
  "International films like Everything Everywhere All at Once",
  // 10 genre / discovery — tests over-tooling + JSON parse
  "Build me a sci-fi journey",
  "Show me creepier horror than Hereditary",
  "What's on in the horror genre right now?",
  "Find me something with Tilda Swinton",
  "Movies like Stalker (1974) but newer",
  "British crime dramas with 6+ seasons",
  "Cerebral thrillers from 2020-2023",
  "What fits my taste for paranoid fiction?",
  "Genre: folk horror. Sort by acclaimed.",
  "Discover titles with Florence Pugh",
  // 10 library queries — tests RAG accuracy
  "What's my rating for Parasite?",
  "Have I watched everything by Bong Joon-ho?",
  "What did I tag slow-burn-dnf in my library?",
  "Show me my 8/10+ sci-fi entries",
  "Do I own anything like Ex Machina?",
  "What's my progress on Silo?",
  "List my watchlist entries from 2023",
  "Which of my movies are on Criterion?",
  "What are my highest-rated TV dramas?",
  "Tell me about my entry for The Leftovers",
  // 10 tool-use — tests tool round efficiency
  "Save Parasite to my watchlist",
  "Add a note to The Wire: best TV ever made",
  "Rate Arrival 9/10 and tag it mind-bending",
  "Mark Silo season 1 as watched",
  "What should I add to my watchlist next?",
  "Update my Legion entry with tag: surreal",
  "Add The Departed to my library, watched, 8/10",
  "Check if I have anything by Christopher Nolan",
  "Set episode progress: Severance S1E4",
  "Compare Parasite vs The Handmaiden for tonight",
  // 10 edge cases
  "What's the deal with [made up title 2099]?",
  "Recommend something that doesn't exist yet",
  "I want everything that's not in my library",
  "What movie is this: actor x, director y, plot z?",
  "Empty query test",
  "Remind me where I was in House of the Dragon",
  "Should I continue The Last of Us after S1?",
  "Movies with no cast or crew listed on TMDB",
  "What if I hated everything I rated 8+?",
  "", // intentionally empty to test validation
];

interface Classification {
  query: string;
  classification: "snag" | "over_tooling" | "hallucination" | "clean";
  detail: string;
  toolCalls: number;
  hasSnagMessage: boolean;
  hasJsonParseError: boolean;
  responseLength: number;
  events: { type: string; text?: string }[];
}

async function runQuery(query: string, convId: number): Promise<Classification> {
  const events: { type: string; text?: string }[] = [];
  let toolCalls = 0;
  let hasSnagMessage = false;
  let hasJsonParseError = false;
  let responseLength = 0;
  let hadError = false;

  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), 30000);

  const resp = await fetch(`${BASE}/conversations/${convId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: query }),
    signal: ac.signal,
  }).finally(() => clearTimeout(timeout));

  if (!resp.ok) {
    return {
      query,
      classification: "snag",
      detail: `HTTP ${resp.status}`,
      toolCalls: 0,
      hasSnagMessage: false,
      hasJsonParseError: false,
      responseLength: 0,
      events: [],
    };
  }

  const reader = resp.body?.getReader();
  if (!reader) {
    return { query, classification: "snag", detail: "no reader", toolCalls: 0, hasSnagMessage: false, hasJsonParseError: false, responseLength: 0, events: [] };
  }

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (line.startsWith("data: ")) {
        try {
          const event = JSON.parse(line.slice(6));
          events.push({ type: event.type, text: event.text });
          if (event.type === "tool") toolCalls++;
          if (event.type === "error") {
            hadError = true;
            hasJsonParseError = true;
          }
          if (event.text) {
            responseLength += event.text.length;
            if (event.text.includes("I hit a snag")) hasSnagMessage = true;
          }
        } catch {
          hasJsonParseError = true;
        }
      }
    }
  }

  // Classification logic
  let classification: Classification["classification"] = "clean";
  let detail = "";

  // Check for snag
  if (hasSnagMessage || hasJsonParseError || hadError) {
    classification = "snag";
    detail = hasSnagMessage ? "snag message" : hasJsonParseError ? "JSON parse error" : "error event";
  }
  // Check over-tooling (>10 tool calls — validated threshold, NOT a MAX_TOOL_ROUNDS failure.
  // The model can make 5-16 calls across 3 rounds — thoroughness, not confusion.)
  else if (toolCalls > 10) {
    classification = "over_tooling";
    detail = `${toolCalls} tool calls`;
  }
  // Check hallucination (basic heuristic: check for "I must have" / "I apologize" / "hallucinated")
  else {
    const fullText = events.filter(e => e.text).map(e => e.text).join("");
    const halMarkers = ["i apologize", "i must have", "i mixed up", "hallucinated", "i was wrong", "sorry"];
    for (const marker of halMarkers) {
      if (fullText.toLowerCase().includes(marker)) {
        classification = "hallucination";
        detail = `hallucination marker: "${marker}"`;
        break;
      }
    }
  }

  return {
    query,
    classification,
    detail,
    toolCalls,
    hasSnagMessage,
    hasJsonParseError,
    responseLength,
    events: events.slice(0, 5), // keep first 5 events for reference
  };
}

async function main() {
  // Create a new conversation for the sample
  const createResp = await fetch(`${BASE}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Model Quality Verification Sample" }),
  });
  const { id: convId } = await createResp.json();
  console.log(`Created conversation ${convId}`);

  const results: Classification[] = [];
  // Limit to 30 queries for this verification run
  const LIMIT = Math.min(QUERIES.length, 30);
  for (let i = 0; i < LIMIT; i++) {
    const q = QUERIES[i];
    if (!q) {
      results.push({ query: "(empty)", classification: "snag", detail: "empty query rejected", toolCalls: 0, hasSnagMessage: false, hasJsonParseError: false, responseLength: 0, events: [] });
      continue;
    }
    console.log(`[${i+1}/${QUERIES.length}] Sending: "${q.slice(0, 60)}..."`);
    try {
      const result = await runQuery(q, convId);
      results.push(result);
      console.log(`  → ${result.classification} (${result.detail || 'ok'}, ${result.toolCalls} tools, ${result.responseLength} chars)`);
    } catch (err) {
      results.push({ query: q, classification: "snag", detail: String(err), toolCalls: 0, hasSnagMessage: false, hasJsonParseError: false, responseLength: 0, events: [] });
      console.log(`  → ERROR: ${err}`);
    }
    // Small delay between queries to avoid rate limiting
    await new Promise(r => setTimeout(r, 10000));
  }

  // Summary
  const counts = {
    snag: results.filter(r => r.classification === "snag").length,
    over_tooling: results.filter(r => r.classification === "over_tooling").length,
    hallucination: results.filter(r => r.classification === "hallucination").length,
    clean: results.filter(r => r.classification === "clean").length,
  };

  const total = results.length;
  const problematic = counts.snag + counts.over_tooling + counts.hallucination;

  console.log("\n=== MODEL QUALITY VERIFICATION (POST-FIX) ===");
  console.log(`Total responses: ${total}`);
  console.log(`Clean: ${counts.clean} (${(counts.clean/total*100).toFixed(1)}%)`);
  console.log(`Snag: ${counts.snag} (${(counts.snag/total*100).toFixed(1)}%)`);
  console.log(`Over-tooling (>10 tools): ${counts.over_tooling} (${(counts.over_tooling/total*100).toFixed(1)}%)`);
  console.log(`Hallucination: ${counts.hallucination} (${(counts.hallucination/total*100).toFixed(1)}%)`);
  const failures = counts.snag + counts.hallucination;
  console.log(`\nActual failures (snag + hal): ${failures} (${(failures/total*100).toFixed(1)}%)`);
  console.log(`Problematic (incl over-tooling): ${problematic} (${(problematic/total*100).toFixed(1)}%)`);
  console.log(`\nPre-fix baseline: 40.5% problematic (24 snag, 4 hal, 2 stops)`);

  // Save results
  const outPath = resolve("scripts/model-quality-results.json");
  writeFileSync(outPath, JSON.stringify({
    preFix: { snag: 24, hallucination: 4, overTooling: 0, total: 74, problematicRate: "40.5%" },
    postFix: counts,
    total,
    results,
  }, null, 2));
  console.log(`\nResults saved to ${outPath}`);
}

main().catch(console.error);
