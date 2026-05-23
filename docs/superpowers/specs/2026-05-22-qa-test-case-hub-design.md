# QA Test Case Hub MVP Design

**Goal:** Build an internal QA Test Case Hub for Jira that centralizes Gherkin test cases, supports Jira sync, mock demo mode, imports, manual executions, bug creation, exports, and dashboard metrics.

**User Decisions Applied:**
- Code, folders, variables, DTOs, and implementation names use English naming conventions.
- Frontend lives entirely under `frontend/`, including `package.json`, Vite config, `src/`, and supporting files.
- Backend lives under `backend/` and follows a modular monolith structure based on `MODULAR_MONOLITH_TEMPLATE.md`.
- UI copy is Spanish.

## Architecture

The backend is one deployable ASP.NET Core 10 application with module projects for business capabilities and thin API controllers. The API project owns HTTP routing, OpenAPI, CORS, health checks, and dependency injection composition. Domain logic stays in modules; external adapters and persistence live in infrastructure projects.

The frontend is a React TypeScript Vite application with route-level feature modules. TanStack Query owns server state, React Hook Form and Zod own form validation, and Tailwind CSS owns styling. Components are separated into layout, shared UI, feature pages, API clients, hooks, types, and utility libraries.

## Backend Modules

- `TestCases`: test case entity, filtering, Jira sync upsert, automation status update, CSV and feature export.
- `Imports`: Gherkin preview, import batch persistence, bulk create/update orchestration.
- `Executions`: manual execution history, last result update, failed-case bug creation flow.
- `Dashboard`: aggregate metrics for test cases, executions, and automation coverage.

Shared projects contain only cross-cutting abstractions, contracts, error handling, clocks, Jira client abstractions, Gherkin contracts, and shared infrastructure helpers.

## Persistence

PostgreSQL is the target database. The MVP uses EF Core with snake_case table names. It supports Railway-style `DATABASE_URL` and local connection strings. Mock mode works without Jira credentials and seeds at least 25 realistic test cases when local data is empty.

## Jira Integration

Jira credentials remain backend-only. The backend uses `HttpClientFactory`, Basic Auth for Jira Cloud API token auth, Jira Cloud REST API v3 endpoints, and a mock implementation when `JIRA_MOCK_MODE=true` or Jira credentials are missing.

## Gherkin

The backend parser supports English and Spanish keywords, extracts feature names, scenarios, scenario outlines, steps, tags, raw scenario text, errors, and warnings. Equivalent TypeScript types exist in the frontend.

## MVP Scope

Phase 1 is implemented as the strongest path: mock/real Jira sync, centralized table, filters, details, readable Gherkin, dashboard, settings, and CSV export.

Phase 2 is implemented with parser preview, import batches, bulk create in Jira with 50-item chunking, and local persistence. Advanced editor behavior stays textarea-based.

Phase 3 is implemented with manual executions, optional bug creation when failed, dashboard metrics, and `.feature` export. Future Cucumber/JUnit result import is exposed as a documented scaffold endpoint.

## Error Handling

The backend returns a consistent error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed.",
    "details": {}
  }
}
```

## Testing

Backend tests cover Gherkin parsing, validation, Jira bulk chunking, and ADF conversion. Frontend tests cover table rendering, tag filtering, and import preview when the local package setup allows it.
