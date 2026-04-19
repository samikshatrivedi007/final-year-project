# Graph Report - .  (2026-04-19)

## Corpus Check
- 65 files · ~51,152 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 15 nodes · 17 edges · 3 communities detected
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]

## God Nodes (most connected - your core abstractions)
1. `studentService` - 4 edges
2. `Backend Application (app.ts)` - 3 edges
3. `Opportunity Routes` - 3 edges
4. `getStudentAttendanceSummary()` - 3 edges
5. `getOpportunities()` - 3 edges
6. `StudentDashboardPage` - 3 edges
7. `Attendance Routes` - 2 edges
8. `applyOpportunity()` - 2 edges
9. `Opportunity Schema` - 2 edges
10. `Application Schema` - 2 edges

## Surprising Connections (you probably didn't know these)
- `getStudentAttendanceSummary()` --conceptually_related_to--> `studentService`  [INFERRED]
  server/src/controllers/attendance.controller.ts → client/src/services/services.ts
- `getOpportunities()` --conceptually_related_to--> `studentService`  [INFERRED]
  server/src/controllers/opportunity.controller.ts → client/src/services/services.ts
- `Opportunity Routes` --imported_by--> `Backend Application (app.ts)`  [EXTRACTED]
  server/src/routes/opportunity.routes.ts → server/src/app.ts
- `Opportunity Schema` --conceptually_related_to--> `Application Schema`  [INFERRED]
  server/src/models/Opportunity.ts → server/src/models/Application.ts
- `Attendance Routes` --imported_by--> `Backend Application (app.ts)`  [EXTRACTED]
  server/src/routes/attendance.routes.ts → server/src/app.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.4
Nodes (5): Backend Application (app.ts), getStudentAttendanceSummary(), AttendanceSummary Schema, Attendance Routes, Student Routes

### Community 1 - "Community 1"
Cohesion: 0.5
Nodes (5): applyOpportunity(), getOpportunities(), Application Schema, Opportunity Schema, Opportunity Routes

### Community 2 - "Community 2"
Cohesion: 0.5
Nodes (5): studentService, AttendancePage, PlacementPage, Sidebar (Navigation), StudentDashboardPage

## Knowledge Gaps
- **3 isolated node(s):** `Student Routes`, `AttendanceSummary Schema`, `Sidebar (Navigation)`
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `studentService` connect `Community 2` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.544) - this node is a cross-community bridge._
- **Why does `getOpportunities()` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.385) - this node is a cross-community bridge._
- **Why does `Opportunity Routes` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.264) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `studentService` (e.g. with `getStudentAttendanceSummary()` and `getOpportunities()`) actually correct?**
  _`studentService` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Student Routes`, `AttendanceSummary Schema`, `Sidebar (Navigation)` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._