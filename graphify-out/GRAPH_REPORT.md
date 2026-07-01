# Graph Report - AI Automation  (2026-07-26)

## Corpus Check
- 104 files · ~45,813 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 464 nodes · 643 edges · 43 communities (35 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4116c1e3`
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
- DuplicateComparisonModal.tsx
- page.tsx
- page.tsx
- FileUpload.tsx
- sidebar.tsx
- page.tsx
- SidebarProvider

## God Nodes (most connected - your core abstractions)
1. `cn()` - 69 edges
2. `callLlm()` - 15 edges
3. `parseJsonSafe()` - 14 edges
4. `useSidebar()` - 9 edges
5. `SidebarProvider()` - 6 edges
6. `SidebarTrigger()` - 6 edges
7. `scripts` - 6 edges
8. `react` - 6 edges
9. `Button()` - 5 edges
10. `SidebarMenuButton()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `RootLayout()` --calls--> `cn()`  [EXTRACTED]
  frontend/app/layout.tsx → frontend/lib/utils.ts
- `BreadcrumbEllipsis()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/ui/breadcrumb.tsx → frontend/lib/utils.ts
- `AppSidebar()` --calls--> `useSidebar()`  [EXTRACTED]
  frontend/components/app-sidebar.tsx → frontend/components/ui/sidebar.tsx
- `Avatar()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/ui/avatar.tsx → frontend/lib/utils.ts
- `AvatarImage()` --calls--> `cn()`  [EXTRACTED]
  frontend/components/ui/avatar.tsx → frontend/lib/utils.ts

## Import Cycles
- None detected.

## Communities (43 total, 8 thin omitted)

### Community 0 - "dependencies"
Cohesion: 0.05
Nodes (43): @anthropic-ai/sdk, @auth/mongodb-adapter, @base-ui/react, bcryptjs, class-variance-authority, clsx, dependencies, @anthropic-ai/sdk (+35 more)

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
Cohesion: 0.17
Nodes (3): ChatMessage, RequestInfo, ReviewData

### Community 5 - "User.ts"
Cohesion: 0.33
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

### Community 12 - "route.ts"
Cohesion: 0.09
Nodes (26): Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage(), DropdownMenuCheckboxItem(), DropdownMenuContent() (+18 more)

### Community 13 - "proxy.ts"
Cohesion: 0.22
Nodes (8): geist, metadata, RootLayout(), AppSidebar(), Tooltip(), TooltipContent(), TooltipProvider(), TooltipTrigger()

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
Cohesion: 0.17
Nodes (7): DEPARTMENT_ICONS, LEDGER_STATUSES, LedgerRequest, Pagination, STATUS_COLORS, TIER_COLORS, TIER_DOTS

### Community 18 - "route.ts"
Cohesion: 0.09
Nodes (14): GET(), PATCH(), requireAdmin(), GET(), PATCH(), requireAdmin(), canViewRequest(), GET() (+6 more)

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

### Community 31 - "duplicate-detection-agent.ts"
Cohesion: 0.12
Nodes (16): GET(), PATCH(), requireAdmin(), POST(), CandidateResult, DuplicateDetectionOutput, runDuplicateDetectionAgent(), DuplicateCandidateSchema (+8 more)

### Community 32 - "document-analysis-agent.ts"
Cohesion: 0.16
Nodes (12): ALLOWED_MIME_TYPES, POST(), DocumentAnalysisInput, DocumentAnalysisResult, runDocumentAnalysisAgent(), STAGE_QUERIES, ChunkingOptions, chunkText() (+4 more)

### Community 35 - "page.tsx"
Cohesion: 0.10
Nodes (21): employeeItems, engineeringItems, isActive(), NavigationItem(), NavItem, systemItems, NotificationItem, Sidebar() (+13 more)

### Community 39 - "sidebar.tsx"
Cohesion: 0.18
Nodes (11): Button(), buttonVariants, Input(), Sheet(), SheetContent(), SheetDescription(), SheetHeader(), SheetTitle() (+3 more)

### Community 40 - "page.tsx"
Cohesion: 0.24
Nodes (9): Breadcrumb(), BreadcrumbEllipsis(), BreadcrumbItem(), BreadcrumbLink(), BreadcrumbList(), BreadcrumbPage(), BreadcrumbSeparator(), Separator() (+1 more)

### Community 41 - "SidebarProvider"
Cohesion: 0.40
Nodes (5): SidebarMenuSkeleton(), SidebarProvider(), useIsMobile(), react, react

## Knowledge Gaps
- **150 isolated node(s):** `geist`, `metadata`, `RequestItem`, `STATUS_BADGES`, `DEPARTMENT_ICONS` (+145 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `SidebarProvider`, `package.json`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `react` connect `SidebarProvider` to `dependencies`, `page.tsx`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `cn()` connect `route.ts` to `page.tsx`, `sidebar.tsx`, `page.tsx`, `SidebarProvider`, `proxy.ts`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **What connects `geist`, `metadata`, `RequestItem` to the rest of the system?**
  _150 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `intake-agent.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1422924901185771 - nodes in this community are weakly interconnected._