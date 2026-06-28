# Graph Report - AI Automation  (2026-07-24)

## Corpus Check
- 41 files · ~13,361 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 113 nodes · 112 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0f5366ec`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- dependencies
- devDependencies
- intake-agent.ts
- package.json
- page.tsx
- User.ts
- page.tsx
- page.tsx
- page.tsx
- page.tsx
- proxy.ts

## God Nodes (most connected - your core abstractions)
1. `callLlm()` - 5 edges
2. `runIntakeAgent()` - 5 edges
3. `scripts` - 5 edges
4. `generateStageOpener()` - 4 edges
5. `POST()` - 3 edges
6. `ignoreScripts` - 3 edges
7. `trustedDependencies` - 3 edges
8. `getGroqKeys()` - 2 edges
9. `getNextGroqKey()` - 2 edges
10. `extractJson()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `generateStageOpener()`  [EXTRACTED]
  frontend/app/api/intake/chat/route.ts → frontend/lib/agents/intake-agent.ts
- `POST()` --calls--> `runIntakeAgent()`  [EXTRACTED]
  frontend/app/api/intake/chat/route.ts → frontend/lib/agents/intake-agent.ts

## Import Cycles
- None detected.

## Communities (14 total, 2 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.10
Nodes (21): @anthropic-ai/sdk, bcryptjs, clsx, dependencies, @anthropic-ai/sdk, bcryptjs, clsx, lucide-react (+13 more)

### Community 1 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tsx (+13 more)

### Community 2 - "intake-agent.ts"
Cohesion: 0.27
Nodes (10): POST(), callLlm(), ConversationMessage, DepartmentQuestionSet, extractJson(), generateStageOpener(), getGroqKeys(), getNextGroqKey() (+2 more)

### Community 3 - "package.json"
Cohesion: 0.18
Nodes (12): ignoreScripts, name, private, scripts, build, dev, lint, start (+4 more)

### Community 4 - "page.tsx"
Cohesion: 0.22
Nodes (3): ChatMessage, TODO: Task 2.12 — submission flow, RequestInfo

### Community 5 - "User.ts"
Cohesion: 0.25
Nodes (3): IUser, UserSchema, envPath

### Community 6 - "page.tsx"
Cohesion: 0.33
Nodes (4): ConversationTurn, DEPARTMENT_ICONS, RequestDetail, STATUS_BADGES

### Community 7 - "page.tsx"
Cohesion: 0.40
Nodes (3): AdminRequestItem, DEPARTMENT_ICONS, STATUS_BADGES

### Community 8 - "page.tsx"
Cohesion: 0.40
Nodes (3): DEPARTMENT_ICONS, RequestItem, STATUS_BADGES

## Knowledge Gaps
- **48 isolated node(s):** `AdminRequestItem`, `STATUS_BADGES`, `DEPARTMENT_ICONS`, `ChatMessage`, `RequestInfo` (+43 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **What connects `AdminRequestItem`, `STATUS_BADGES`, `DEPARTMENT_ICONS` to the rest of the system?**
  _49 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._