# Graph Report - AI Automation  (2026-07-25)

## Corpus Check
- 81 files · ~37,674 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 335 nodes · 384 edges · 33 communities (27 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `332d6cd6`
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
- route.ts
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
- RequestComment.ts
- duplicate-detection-agent.ts
- document-analysis-agent.ts

## God Nodes (most connected - your core abstractions)
1. `callLlm()` - 15 edges
2. `parseJsonSafe()` - 14 edges
3. `scripts` - 6 edges
4. `runDocumentAnalysisAgent()` - 5 edges
5. `writeAuditLog()` - 5 edges
6. `chunkText()` - 4 edges
7. `selectRelevantChunks()` - 4 edges
8. `runIntakeAgent()` - 4 edges
9. `generateStageOpener()` - 4 edges
10. `llmExecutionNode()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `writeAuditLog()`  [EXTRACTED]
  frontend/app/api/admin/settings/priority-weights/route.ts → frontend/lib/audit.ts
- `POST()` --calls--> `writeAuditLog()`  [EXTRACTED]
  frontend/app/api/admin/settings/system/route.ts → frontend/lib/audit.ts
- `POST()` --calls--> `runDuplicateDetectionAgent()`  [EXTRACTED]
  frontend/app/api/intake/submit/route.ts → frontend/lib/agents/duplicate-detection-agent.ts
- `POST()` --calls--> `runDocumentAnalysisAgent()`  [EXTRACTED]
  frontend/app/api/intake/upload/route.ts → frontend/lib/agents/document-analysis-agent.ts
- `runDocumentAnalysisAgent()` --calls--> `chunkText()`  [EXTRACTED]
  frontend/lib/agents/document-analysis-agent.ts → frontend/lib/rag/document-chunker.ts

## Import Cycles
- None detected.

## Communities (33 total, 6 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.06
Nodes (33): @anthropic-ai/sdk, @auth/mongodb-adapter, bcryptjs, clsx, dependencies, @anthropic-ai/sdk, @auth/mongodb-adapter, bcryptjs (+25 more)

### Community 1 - "devDependencies"
Cohesion: 0.09
Nodes (23): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tsx (+15 more)

### Community 2 - "intake-agent.ts"
Cohesion: 0.14
Nodes (15): POST(), generateStageOpener(), runIntakeAgent(), ConversationMessage, createChatModel(), DepartmentQuestionSet, generateStageOpenerWithLangGraph(), getGroqKeys() (+7 more)

### Community 3 - "package.json"
Cohesion: 0.16
Nodes (13): ignoreScripts, name, private, scripts, build, dev, lint, start (+5 more)

### Community 4 - "page.tsx"
Cohesion: 0.13
Nodes (4): ChatMessage, RequestInfo, ReviewData, FileUploadProps

### Community 5 - "User.ts"
Cohesion: 0.33
Nodes (3): IUser, UserSchema, envPath

### Community 6 - "page.tsx"
Cohesion: 0.33
Nodes (4): ConversationTurn, DEPARTMENT_ICONS, RequestDetail, STATUS_BADGES

### Community 7 - "page.tsx"
Cohesion: 0.20
Nodes (6): AdminRequestItem, BULK_STATUSES, DEPARTMENT_ICONS, STATUS_BADGES, CandidateData, DuplicateComparisonModalProps

### Community 8 - "page.tsx"
Cohesion: 0.40
Nodes (3): DEPARTMENT_ICONS, RequestItem, STATUS_BADGES

### Community 12 - "route.ts"
Cohesion: 0.29
Nodes (4): { auth }, ADMIN_ONLY_PATHS, config, PUBLIC_PATHS

### Community 13 - "proxy.ts"
Cohesion: 0.29
Nodes (3): geistMono, geistSans, metadata

### Community 14 - "route.ts"
Cohesion: 0.14
Nodes (22): AUTOMATION_TYPES, CategorizationResult, runCategorizationAgent(), EffortConfidence, EffortEstimationResult, EffortSize, runEffortEstimationAgent(), ExtractionResult (+14 more)

### Community 15 - "calculations.ts"
Cohesion: 0.17
Nodes (12): GET(), LEDGER_STATUSES, calculatePriorityScore(), EFFORT_COST_MAP, getPriorityTier(), normalise1to5(), normaliseRoi(), PriorityFactors (+4 more)

### Community 16 - "page.tsx"
Cohesion: 0.13
Nodes (12): Comment, CONFIDENCE_COLORS, DEPT_ICONS, Engineer, EngineeringReviewPage(), Estimate, PriorityInputs, REASON_REQUIRED (+4 more)

### Community 17 - "page.tsx"
Cohesion: 0.15
Nodes (7): DEPARTMENT_ICONS, LEDGER_STATUSES, LedgerRequest, Pagination, STATUS_COLORS, TIER_COLORS, TIER_DOTS

### Community 18 - "route.ts"
Cohesion: 0.13
Nodes (10): GET(), PATCH(), requireAdmin(), GET(), PATCH(), requireAdmin(), canViewRequest(), GET() (+2 more)

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

### Community 31 - "duplicate-detection-agent.ts"
Cohesion: 0.12
Nodes (16): GET(), PATCH(), requireAdmin(), POST(), CandidateResult, DuplicateDetectionOutput, runDuplicateDetectionAgent(), DuplicateCandidateSchema (+8 more)

### Community 32 - "document-analysis-agent.ts"
Cohesion: 0.16
Nodes (12): ALLOWED_MIME_TYPES, POST(), DocumentAnalysisInput, DocumentAnalysisResult, runDocumentAnalysisAgent(), STAGE_QUERIES, ChunkingOptions, chunkText() (+4 more)

## Knowledge Gaps
- **133 isolated node(s):** `Engineer`, `Comment`, `PriorityInputs`, `Estimate`, `Summary` (+128 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `Engineer`, `Comment`, `PriorityInputs` to the rest of the system?**
  _133 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `intake-agent.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1422924901185771 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._