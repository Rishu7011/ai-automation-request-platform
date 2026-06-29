# Graph Report - AI Automation  (2026-07-25)

## Corpus Check
- 71 files · ~32,559 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 276 nodes · 338 edges · 28 communities (24 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `28bd4641`
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
- route.ts
- calculations.ts
- page.tsx
- page.tsx
- route.ts
- writeAuditLog
- page.tsx
- route.ts
- page.tsx
- route.ts
- route.ts
- page.tsx
- page.tsx

## God Nodes (most connected - your core abstractions)
1. `callLlm()` - 15 edges
2. `parseJsonSafe()` - 14 edges
3. `POST()` - 9 edges
4. `calculatePriorityScore()` - 7 edges
5. `scripts` - 5 edges
6. `runCategorizationAgent()` - 5 edges
7. `runEffortEstimationAgent()` - 5 edges
8. `runExtractionAgent()` - 5 edges
9. `runPriorityRecommendationAgent()` - 5 edges
10. `runROIExtractionAgent()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `writeAuditLog()`  [EXTRACTED]
  frontend/app/api/admin/settings/priority-weights/route.ts → frontend/lib/audit.ts
- `POST()` --calls--> `writeAuditLog()`  [EXTRACTED]
  frontend/app/api/admin/settings/system/route.ts → frontend/lib/audit.ts
- `POST()` --calls--> `calculatePriorityScore()`  [EXTRACTED]
  frontend/app/api/intake/submit/route.ts → frontend/lib/calculations.ts
- `POST()` --calls--> `calculateROI()`  [EXTRACTED]
  frontend/app/api/intake/submit/route.ts → frontend/lib/calculations.ts
- `POST()` --calls--> `runIntakeAgent()`  [EXTRACTED]
  frontend/app/api/intake/chat/route.ts → frontend/lib/agents/intake-agent.ts

## Import Cycles
- None detected.

## Communities (28 total, 4 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.06
Nodes (33): @anthropic-ai/sdk, @auth/mongodb-adapter, bcryptjs, clsx, dependencies, @anthropic-ai/sdk, @auth/mongodb-adapter, bcryptjs (+25 more)

### Community 1 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tsx (+13 more)

### Community 2 - "intake-agent.ts"
Cohesion: 0.11
Nodes (17): POST(), { handlers, auth, signIn, signOut }, generateStageOpener(), runIntakeAgent(), ConversationMessage, createChatModel(), DepartmentQuestionSet, generateStageOpenerWithLangGraph() (+9 more)

### Community 3 - "package.json"
Cohesion: 0.18
Nodes (12): ignoreScripts, name, private, scripts, build, dev, lint, start (+4 more)

### Community 4 - "page.tsx"
Cohesion: 0.17
Nodes (3): ChatMessage, RequestInfo, ReviewData

### Community 5 - "User.ts"
Cohesion: 0.25
Nodes (3): IUser, UserSchema, envPath

### Community 6 - "page.tsx"
Cohesion: 0.33
Nodes (4): ConversationTurn, DEPARTMENT_ICONS, RequestDetail, STATUS_BADGES

### Community 7 - "page.tsx"
Cohesion: 0.33
Nodes (4): AdminRequestItem, BULK_STATUSES, DEPARTMENT_ICONS, STATUS_BADGES

### Community 8 - "page.tsx"
Cohesion: 0.40
Nodes (3): DEPARTMENT_ICONS, RequestItem, STATUS_BADGES

### Community 13 - "proxy.ts"
Cohesion: 0.29
Nodes (3): geistMono, geistSans, metadata

### Community 14 - "route.ts"
Cohesion: 0.17
Nodes (23): POST(), AUTOMATION_TYPES, CategorizationResult, runCategorizationAgent(), EffortConfidence, EffortEstimationResult, EffortSize, runEffortEstimationAgent() (+15 more)

### Community 15 - "calculations.ts"
Cohesion: 0.16
Nodes (16): GET(), PATCH(), requireAdmin(), GET(), LEDGER_STATUSES, calculatePriorityScore(), calculateROI(), EFFORT_COST_MAP (+8 more)

### Community 16 - "page.tsx"
Cohesion: 0.12
Nodes (11): Comment, CONFIDENCE_COLORS, DEPT_ICONS, Engineer, Estimate, PriorityInputs, REASON_REQUIRED, RequestDetail (+3 more)

### Community 17 - "page.tsx"
Cohesion: 0.15
Nodes (7): DEPARTMENT_ICONS, LEDGER_STATUSES, LedgerRequest, Pagination, STATUS_COLORS, TIER_COLORS, TIER_DOTS

### Community 18 - "route.ts"
Cohesion: 0.24
Nodes (5): canViewRequest(), GET(), POST(), IRequestComment, RequestCommentSchema

### Community 19 - "writeAuditLog"
Cohesion: 0.33
Nodes (4): POST(), POST(), AuditLogPayload, writeAuditLog()

### Community 20 - "page.tsx"
Cohesion: 0.40
Nodes (3): DEFAULT_RANGES, EffortRange, EffortRangesState

### Community 21 - "route.ts"
Cohesion: 0.50
Nodes (4): PATCH(), REASON_REQUIRED, requireAdmin(), VALID_TRANSITIONS

### Community 23 - "route.ts"
Cohesion: 0.67
Nodes (3): PATCH(), REASON_REQUIRED, requireAdmin()

### Community 24 - "route.ts"
Cohesion: 0.83
Nodes (3): GET(), PATCH(), requireAdmin()

## Knowledge Gaps
- **108 isolated node(s):** `geistSans`, `geistMono`, `metadata`, `{ handlers, auth, signIn, signOut }`, `IntakeGraphState` (+103 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `geistSans`, `geistMono`, `metadata` to the rest of the system?**
  _108 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `intake-agent.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11396011396011396 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._