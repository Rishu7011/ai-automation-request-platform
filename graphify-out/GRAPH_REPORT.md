# Graph Report - AI Automation  (2026-07-27)

## Corpus Check
- 105 files · ~46,613 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 487 nodes · 585 edges · 48 communities (36 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8e33214b`
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
- calculations.test.ts
- duplicate-detection-agent.ts
- document-analysis-agent.ts
- DuplicateComparisonModal.tsx
- page.tsx
- page.tsx
- middleware.ts
- Navbar.tsx
- RequestAttachment.ts
- RequestEstimate.ts
- route.ts
- auth.config.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 43 edges
2. `callLlm()` - 15 edges
3. `parseJsonSafe()` - 14 edges
4. `calculatePriorityScore()` - 6 edges
5. `useSidebar()` - 6 edges
6. `scripts` - 6 edges
7. `react` - 6 edges
8. `PATCH()` - 5 edges
9. `writeAuditLog()` - 5 edges
10. `calculateROI()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `SidebarMenuSkeleton()` --references--> `react`  [EXTRACTED]
  frontend/components/ui/sidebar.tsx → frontend/package.json
- `useIsMobile()` --references--> `react`  [EXTRACTED]
  frontend/hooks/use-mobile.ts → frontend/package.json
- `Avatar()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/ui/avatar.tsx → frontend/lib/utils.ts
- `AvatarImage()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/ui/avatar.tsx → frontend/lib/utils.ts
- `AvatarFallback()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/ui/avatar.tsx → frontend/lib/utils.ts

## Import Cycles
- None detected.

## Communities (48 total, 12 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.04
Nodes (45): @anthropic-ai/sdk, @auth/mongodb-adapter, @base-ui/react, bcryptjs, class-variance-authority, clsx, dependencies, @anthropic-ai/sdk (+37 more)

### Community 1 - "devDependencies"
Cohesion: 0.09
Nodes (23): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tsx (+15 more)

### Community 2 - "intake-agent.ts"
Cohesion: 0.15
Nodes (14): generateStageOpener(), runIntakeAgent(), ConversationMessage, createChatModel(), DepartmentQuestionSet, generateStageOpenerWithLangGraph(), getGroqKeys(), getNextGroqKey() (+6 more)

### Community 3 - "package.json"
Cohesion: 0.16
Nodes (13): ignoreScripts, name, private, scripts, build, dev, lint, start (+5 more)

### Community 4 - "page.tsx"
Cohesion: 0.20
Nodes (4): Attachment(), AttachmentMedia(), attachmentMediaVariants, attachmentVariants

### Community 6 - "page.tsx"
Cohesion: 0.33
Nodes (4): ConversationTurn, DEPARTMENT_ICONS, RequestDetail, STATUS_BADGES

### Community 7 - "page.tsx"
Cohesion: 0.33
Nodes (4): AdminRequestItem, BULK_STATUSES, DEPARTMENT_ICONS, STATUS_BADGES

### Community 8 - "page.tsx"
Cohesion: 0.40
Nodes (3): DEPARTMENT_ICONS, RequestItem, STATUS_BADGES

### Community 12 - "route.ts"
Cohesion: 0.06
Nodes (35): Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage(), Breadcrumb(), BreadcrumbEllipsis() (+27 more)

### Community 13 - "proxy.ts"
Cohesion: 0.13
Nodes (6): ChatMessage, RequestInfo, ReviewData, FileUpload(), FileUploadProps, UploadedFile

### Community 14 - "route.ts"
Cohesion: 0.14
Nodes (22): AUTOMATION_TYPES, CategorizationResult, runCategorizationAgent(), EffortConfidence, EffortEstimationResult, EffortSize, runEffortEstimationAgent(), ExtractionResult (+14 more)

### Community 15 - "calculations.ts"
Cohesion: 0.17
Nodes (17): GET(), PATCH(), requireAdmin(), GET(), LEDGER_STATUSES, calculatePriorityScore(), calculateROI(), EFFORT_COST_MAP (+9 more)

### Community 16 - "page.tsx"
Cohesion: 0.13
Nodes (12): Comment, CONFIDENCE_COLORS, DEPT_ICONS, Engineer, EngineeringReviewPage(), Estimate, PriorityInputs, REASON_REQUIRED (+4 more)

### Community 17 - "page.tsx"
Cohesion: 0.17
Nodes (7): DEPARTMENT_ICONS, LEDGER_STATUSES, LedgerRequest, Pagination, STATUS_COLORS, TIER_COLORS, TIER_DOTS

### Community 18 - "route.ts"
Cohesion: 0.19
Nodes (7): GET(), PATCH(), requireAdmin(), canViewRequest(), GET(), POST(), { handlers, auth, signIn, signOut }

### Community 19 - "writeAuditLog"
Cohesion: 0.33
Nodes (4): POST(), POST(), AuditLogPayload, writeAuditLog()

### Community 20 - "page.tsx"
Cohesion: 0.29
Nodes (5): DEFAULT_RANGES, EffortRange, EffortRangesState, SETTINGS_TABS, SIZE_META

### Community 21 - "route.ts"
Cohesion: 0.50
Nodes (4): PATCH(), REASON_REQUIRED, requireAdmin(), VALID_TRANSITIONS

### Community 22 - "page.tsx"
Cohesion: 0.40
Nodes (3): DEFAULT_RATES, DEPARTMENT_ICONS, SETTINGS_TABS

### Community 23 - "route.ts"
Cohesion: 0.67
Nodes (3): PATCH(), REASON_REQUIRED, requireAdmin()

### Community 29 - "calculations.test.ts"
Cohesion: 0.25
Nodes (7): buildCommand, devCommand, framework, headers, installCommand, outputDirectory, $schema

### Community 31 - "duplicate-detection-agent.ts"
Cohesion: 0.16
Nodes (10): GET(), PATCH(), requireAdmin(), CandidateResult, DuplicateDetectionOutput, DuplicateCandidateSchema, DuplicateResolution, IDuplicateCandidate (+2 more)

### Community 32 - "document-analysis-agent.ts"
Cohesion: 0.29
Nodes (8): DocumentAnalysisInput, DocumentAnalysisResult, runDocumentAnalysisAgent(), STAGE_QUERIES, ChunkingOptions, chunkText(), DocumentChunk, selectRelevantChunks()

### Community 35 - "page.tsx"
Cohesion: 0.05
Nodes (24): geist, metadata, Providers(), AppSidebar(), employeeItems, engineeringItems, isActive(), NavigationItem() (+16 more)

### Community 36 - "middleware.ts"
Cohesion: 0.40
Nodes (4): ADMIN_PATHS, config, PUBLIC_PATHS, SYS_ADMIN_ONLY_PATHS

### Community 40 - "RequestEstimate.ts"
Cohesion: 0.40
Nodes (4): IPriorityInputs, IRequestEstimate, PriorityInputsSchema, RequestEstimateSchema

## Knowledge Gaps
- **157 isolated node(s):** `Engineer`, `Comment`, `PriorityInputs`, `Estimate`, `Summary` (+152 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `page.tsx`, `package.json`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `react` connect `page.tsx` to `dependencies`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `Engineer`, `Comment`, `PriorityInputs` to the rest of the system?**
  _157 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06170598911070781 - nodes in this community are weakly interconnected._