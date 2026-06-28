# Graph Report - .  (2026-07-24)

## Corpus Check
- Corpus is ~6,731 words - fits in a single context window. You may not need a graph.

## Summary
- 38 nodes · 59 edges · 7 communities
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Role-Based Access Control (RBAC)
- AI Intake Agent
- Data Model (Core Entities)
- Engineering Dashboard
- Confidence Scoring System
- Deterministic Calculation Engine
- Priority Framework (Multi-Factor Score)

## God Nodes (most connected - your core abstractions)
1. `AI Intake Agent` - 9 edges
2. `Role-Based Access Control (RBAC)` - 7 edges
3. `Deterministic Calculation Engine` - 6 edges
4. `Priority Framework (Multi-Factor Score)` - 6 edges
5. `AI Automation Intake Application` - 5 edges
6. `ROI Extraction Agent` - 5 edges
7. `AI-Guided Staged Intake Flow` - 5 edges
8. `Data Model (Core Entities)` - 5 edges
9. `Engineering Dashboard` - 5 edges
10. `MVP Scope (3 Phases)` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Technical Stack (Next.js, Postgres, Claude API)` --conceptually_related_to--> `Data Model (Core Entities)`  [INFERRED]
  /Users/rishu/Desktop/AI Automation/idea.md → /Users/rishu/Desktop/AI Automation/idea.md  _Bridges community 2 → community 0_
- `Engineering Dashboard` --conceptually_related_to--> `Company-Wide Request Ledger`  [INFERRED]
  /Users/rishu/Desktop/AI Automation/idea.md → /Users/rishu/Desktop/AI Automation/idea.md  _Bridges community 0 → community 3_
- `AI Automation Intake Application` --conceptually_related_to--> `AI-Guided Staged Intake Flow`  [EXTRACTED]
  /Users/rishu/Desktop/AI Automation/idea.md → /Users/rishu/Desktop/AI Automation/idea.md  _Bridges community 0 → community 1_
- `AI Intake Agent` --references--> `Duplicate Detection Agent`  [EXTRACTED]
  /Users/rishu/Desktop/AI Automation/idea.md → /Users/rishu/Desktop/AI Automation/idea.md  _Bridges community 1 → community 4_
- `AI Intake Agent` --references--> `Priority Recommendation Agent`  [EXTRACTED]
  /Users/rishu/Desktop/AI Automation/idea.md → /Users/rishu/Desktop/AI Automation/idea.md  _Bridges community 1 → community 6_

## Hyperedges (group relationships)
- **Core AI Agent Processing Pipeline** — idea_ai_intake_agent, idea_information_extraction_agent, idea_roi_extraction_agent, idea_engineering_effort_estimation_agent, idea_duplicate_detection_agent, idea_categorization_agent, idea_priority_recommendation_agent, idea_summary_generation_agent [EXTRACTED 1.00]
- **Core Data Model Entities Anchored to Request** — idea_request_entity, idea_request_summary_entity, idea_request_estimate_entity, idea_audit_log_entity [EXTRACTED 1.00]
- **Priority Score Contributing Factors** — idea_roi_extraction_agent, idea_engineering_effort_estimation_agent, idea_priority_recommendation_agent, idea_confidence_scoring, idea_priority_framework [EXTRACTED 1.00]

## Communities (7 total, 0 thin omitted)

### Community 0 - "Role-Based Access Control (RBAC)"
Cohesion: 0.28
Nodes (9): AI Agent Orchestration Pipeline, AI Automation Intake Application, Company-Wide Request Ledger, Open Questions (For Boss), Role-Based Access Control (RBAC), Engineering Admin Role, Requester Role (Employee), System Admin Role (+1 more)

### Community 1 - "AI Intake Agent"
Cohesion: 0.33
Nodes (9): AI Intake Agent, Categorization Agent, Department-Aware Question Templates, Document & Media Upload Support, Information Extraction Agent, IntakeTemplateConfig (Editable via Config), Process Analysis Agent, ROI Extraction Agent (+1 more)

### Community 2 - "Data Model (Core Entities)"
Cohesion: 0.47
Nodes (6): AuditLog Entity, Data Model (Core Entities), Request Entity, RequestEstimate Entity, RequestSummary Entity, Request Status Lifecycle

### Community 3 - "Engineering Dashboard"
Cohesion: 0.67
Nodes (4): Analytics Dashboard, Engineering Dashboard, Future Integrations (Jira, Slack, SSO, etc.), MVP Scope (3 Phases)

### Community 4 - "Confidence Scoring System"
Cohesion: 0.50
Nodes (4): Confidence Scoring System, Duplicate Detection Agent, Engineering Effort Estimation Agent, Missing Features & Weak Areas

### Community 5 - "Deterministic Calculation Engine"
Cohesion: 0.67
Nodes (3): Deterministic Calculation Engine, ROI Calculation Architecture, Summary Generation Agent

### Community 6 - "Priority Framework (Multi-Factor Score)"
Cohesion: 0.67
Nodes (3): Priority Framework (Multi-Factor Score), Priority Recommendation Agent, PriorityWeightsConfig (Configurable Weights)

## Knowledge Gaps
- **9 isolated node(s):** `Categorization Agent`, `Summary Generation Agent`, `Request Status Lifecycle`, `Future Integrations (Jira, Slack, SSO, etc.)`, `Requester Role (Employee)` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AI Intake Agent` connect `AI Intake Agent` to `Role-Based Access Control (RBAC)`, `Confidence Scoring System`, `Priority Framework (Multi-Factor Score)`?**
  _High betweenness centrality (0.250) - this node is a cross-community bridge._
- **Why does `Deterministic Calculation Engine` connect `Deterministic Calculation Engine` to `AI Intake Agent`, `Data Model (Core Entities)`, `Priority Framework (Multi-Factor Score)`?**
  _High betweenness centrality (0.234) - this node is a cross-community bridge._
- **Why does `Role-Based Access Control (RBAC)` connect `Role-Based Access Control (RBAC)` to `Data Model (Core Entities)`?**
  _High betweenness centrality (0.221) - this node is a cross-community bridge._
- **What connects `Categorization Agent`, `Summary Generation Agent`, `ROI Calculation Architecture` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._