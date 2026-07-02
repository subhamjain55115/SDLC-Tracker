export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
}

export interface QuickStage {
  name: string;
  intro: string;
  artifact: string;
  items: ChecklistItem[];
}

export const QUICK_BUILD_STORAGE_KEY = "sdlc-tracker-quick-build";

export const QUICK_STAGES: QuickStage[] = [
  {
    name: "1. Brainstorm",
    intro:
      "You brainstorm with Claude in your other window. Tick each item here once you have conveyed it and Claude has confirmed understanding. No skipping — a shallow brainstorm produces a generic plan.",
    artifact:
      "When all 12 are ticked, ask Claude to write the project's CLAUDE.md from this brainstorm.",
    items: [
      {
        id: "b1",
        label: "Product name & tagline",
        description:
          "Tell Claude the product's name and one sentence that captures what it does and why it matters. This becomes the identity of the whole project — every later document opens with it.",
      },
      {
        id: "b2",
        label: "The problem",
        description:
          "Describe the specific pain you are solving. Name the exact situation where it hurts — not a vague category like 'productivity', but 'I lose track of which roadmap step I was on while coding in another window'.",
      },
      {
        id: "b3",
        label: "Pain intensity",
        description:
          "Tell Claude how bad the problem is on a 1–10 scale, and what actually goes wrong if nobody solves it — time lost, money lost, health harmed, trust broken. This decides how aggressively V1 must attack the pain.",
      },
      {
        id: "b4",
        label: "The evidence",
        description:
          "Explain how you know this problem is real: your own repeated experience, people you have watched struggle, communities complaining about it, or a gap in an existing product. Claims without evidence produce products without users.",
      },
      {
        id: "b5",
        label: "The user",
        description:
          "Describe one specific person who will use this: their technical level, the device in their hand, and the exact moment they reach for the product. Not 'developers' or 'consumers' — one person, one moment.",
      },
      {
        id: "b6",
        label: "What they do today",
        description:
          "Walk Claude through how that person handles the problem right now without your product — workarounds, spreadsheets, memory, or simply suffering. Your product must clearly beat this baseline or it will not be adopted.",
      },
      {
        id: "b7",
        label: "The core insight",
        description:
          "State the single observation that makes this product possible or different. If everything else about the brainstorm is forgotten, this is the one sentence that must survive — the 'aha' the whole product is built on.",
      },
      {
        id: "b8",
        label: "The core loop",
        description:
          "Describe the repeating cycle: user does X → product does Y → user gets Z and comes back. If there is no loop and it is a one-shot tool, say that explicitly — it changes how success is measured.",
      },
      {
        id: "b9",
        label: "V1 feature list",
        description:
          "List the 6–8 features that make version 1, each in one line. Every feature must serve the core loop — anything that does not serve the loop belongs in the V2 backlog, not in V1.",
      },
      {
        id: "b10",
        label: "What this is NOT",
        description:
          "Say out loud what the product deliberately excludes: features it will not have, users it will not serve, platforms it will not target in V1. This is your scope armour — it is what protects the timeline from feature creep.",
      },
      {
        id: "b11",
        label: "The non-negotiable rule",
        description:
          "Give Claude the one principle that governs every product decision — like ProductAnalyser's 'LEGAL ≠ HEALTHY'. Whenever a tradeoff appears anywhere in development, this rule wins automatically.",
      },
      {
        id: "b12",
        label: "Success metric",
        description:
          "Define one verifiable statement that means V1 is done — a test you can physically run, like 'I scan a barcode and see the speedometer in Hindi in under 5 seconds'. If you cannot run the test, it is not a metric.",
      },
    ],
  },
  {
    name: "2. Plan",
    intro:
      "Still in conversation with Claude — now move from what to how. Ask Claude to propose each of these, push back until you agree, then tick.",
    artifact: "When all four are agreed, ask Claude to write plan.md from this discussion.",
    items: [
      {
        id: "p1",
        label: "Tech stack",
        description:
          "Ask Claude to propose the full stack layer by layer — frontend, backend, database, hosting, key packages — with a one-line WHY for every choice. Challenge anything that feels heavier than the problem deserves.",
      },
      {
        id: "p2",
        label: "V1 scope boundary",
        description:
          "Agree with Claude on exactly what is inside V1 and what is deferred. Every deferred item must be written into the v2-backlog by name — deferred means recorded, never silently dropped.",
      },
      {
        id: "p3",
        label: "Architecture overview",
        description:
          "Have Claude describe how data flows through the system end to end — from user action, through each layer, to storage and back — as a diagram or numbered steps. You should be able to repeat it back from memory.",
      },
      {
        id: "p4",
        label: "Key constraints",
        description:
          "Confirm the non-obvious rules that must never be violated: where API keys live (never in the client), cost ceilings, offline requirements, performance floors, privacy rules. These go into CLAUDE.md so every future session obeys them.",
      },
    ],
  },
  {
    name: "3. Roadmap",
    intro:
      "The roadmap is not written by hand. Claude generates it from three files — CLAUDE.md (from your brainstorm), plan.md (from your planning), and the global SDLC.md, which defines how phases, tasks, CE drivers, context skills, and plugins are segregated for each project.",
    artifact:
      "When the JSON is uploaded, Quick Build is complete — everything else happens in Track Mode.",
    items: [
      {
        id: "r1",
        label: "Input files ready",
        description:
          "Confirm CLAUDE.md and plan.md exist in the project folder and the global SDLC.md is in ~/.claude. These three files are the complete input — if the roadmap comes out wrong, one of these files is missing something.",
      },
      {
        id: "r2",
        label: "Roadmap generated by Claude",
        description:
          "Ask Claude: 'Generate the development roadmap from CLAUDE.md + plan.md + SDLC.md.' SDLC.md tells it how to break the work into phases and which CE driver, context skills, and plugins each task gets — these vary per project.",
      },
      {
        id: "r3",
        label: "Roadmap reviewed",
        description:
          "Read what Claude produced before accepting it. Check that phases are in dependency order, every phase has a done criterion you can verify, and every task carries its driver, skills, and plugins. Fix gaps now — they are ten times costlier mid-build.",
      },
      {
        id: "r4",
        label: "JSON exported by Claude",
        description:
          "Ask Claude to export the roadmap as <ProjectName>-roadmap.json in the SDLC Tracker schema. The filename becomes the project name in the tracker.",
      },
      {
        id: "r5",
        label: "Uploaded to Track Mode",
        description:
          "Upload the JSON on the Projects page. From here on you tick sub-steps in Track Mode while Claude builds — phase gates keep the sequence honest.",
      },
    ],
  },
];
