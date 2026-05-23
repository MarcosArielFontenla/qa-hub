# QA Test Case Hub MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable MVP for QA Test Case Hub for Jira with a modular monolith backend and modular React frontend.

**Architecture:** The backend is a .NET 10 modular monolith under `backend/`, with thin API controllers and business logic in modules. The frontend is a React TypeScript Vite app under `frontend/`, organized by features and shared UI primitives.

**Tech Stack:** ASP.NET Core 10, EF Core, PostgreSQL, Npgsql, xUnit, React, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS.

---

### Task 1: Repository Baseline

**Files:**
- Create: `.gitignore`
- Create: `docker-compose.yml`
- Create: `README.md`
- Create: `docs/architecture.md`
- Create: `docs/api.md`
- Create: `docs/jira-mapping.md`

- [ ] Create root metadata, Docker Compose PostgreSQL service, and documentation shell.
- [ ] Document local run commands, environment variables, mock mode, Railway database configuration, migrations, and tests.

### Task 2: Backend Scaffold

**Files:**
- Create: `backend/QaTestCaseHub.sln`
- Create: `backend/src/API/QaTestCaseHub.API.csproj`
- Create: `backend/src/Shared/*`
- Create: `backend/src/Modules/TestCases/*`
- Create: `backend/src/Modules/Imports/*`
- Create: `backend/src/Modules/Executions/*`
- Create: `backend/src/Modules/Dashboard/*`
- Create: `backend/tests/QaTestCaseHub.Tests/QaTestCaseHub.Tests.csproj`

- [ ] Generate projects using the modular monolith template with `RootFolder=backend`, `SolutionName=QaTestCaseHub`, `SolutionFormat=sln`.
- [ ] Add project references according to the template dependency rules.
- [ ] Add package references for EF Core, Npgsql, Swagger/OpenAPI, FluentValidation, and tests.
- [ ] Build the empty scaffold.

### Task 3: Backend Shared Foundation

**Files:**
- Create shared contracts for test cases, executions, imports, dashboard, Jira, Gherkin, and errors.
- Create shared abstractions for clock, Jira client, Gherkin parser, exporters, and unit-of-work style persistence.
- Create shared infrastructure helpers for `DATABASE_URL`, environment options, CORS, error middleware, and mock data.

- [ ] Write failing tests for database URL parsing and error envelope behavior where practical.
- [ ] Implement minimal shared helpers.
- [ ] Run backend tests.

### Task 4: Gherkin Parser

**Files:**
- Create parser implementation in module/application or shared infrastructure depending on dependency direction.
- Create backend tests for English parser, Spanish parser, tags, scenario outline without examples, missing `Then`, duplicate steps, and large content warnings.

- [ ] Write failing parser tests first.
- [ ] Implement parser and validation messages.
- [ ] Run parser tests and keep output clean.

### Task 5: Test Cases Module

**Files:**
- Create domain entity and enums.
- Create application DTOs, filter query, create/update commands, automation status command, and service interfaces.
- Create infrastructure EF mappings, repository, mock seed, Jira sync service, export service, and DI registration.
- Create API controllers for `/api/test-cases`, `/api/jira/sync`, `/api/gherkin/parse`, and `/api/exports/*`.

- [ ] Write failing tests for filtering, upsert by Jira key, CSV export, `.feature` export, and automation status updates.
- [ ] Implement module logic.
- [ ] Run backend tests and build.

### Task 6: Imports Module

**Files:**
- Create import batch domain models.
- Create preview and bulk create DTOs/services.
- Create infrastructure persistence and Jira bulk create orchestration with chunks of 50.
- Create API controller for `/api/imports/*`.

- [ ] Write failing tests for 50-item chunking and per-item error handling.
- [ ] Implement preview and bulk create flow.
- [ ] Run backend tests and build.

### Task 7: Executions Module

**Files:**
- Create execution domain model and result enum.
- Create execution DTOs and service.
- Create persistence repository and bug creation integration.
- Create API endpoints for `/api/test-cases/{id}/executions`.

- [ ] Write failing tests for failed execution with bug creation and last-result update.
- [ ] Implement execution flow.
- [ ] Run backend tests and build.

### Task 8: Dashboard Module

**Files:**
- Create dashboard summary DTO and service.
- Create dashboard endpoint `/api/dashboard/summary`.

- [ ] Write failing tests for pass rate and automation coverage calculations.
- [ ] Implement aggregate summary.
- [ ] Run backend tests and build.

### Task 9: Frontend Scaffold

**Files:**
- Create `frontend/package.json`
- Create `frontend/vite.config.ts`
- Create `frontend/tsconfig.json`
- Create `frontend/index.html`
- Create `frontend/src/**`

- [ ] Scaffold React TypeScript Vite app under `frontend/`.
- [ ] Configure Tailwind CSS, React Router, TanStack Query, Axios, React Hook Form, Zod, and Vitest.
- [ ] Create modular folder structure and shared UI components.

### Task 10: Frontend Features

**Files:**
- Create dashboard, test cases, imports, executions, and settings feature modules.
- Create API clients and shared types matching backend contracts.

- [ ] Write failing frontend tests for test case table filtering and import preview UI.
- [ ] Implement Spanish UI with sidebar layout, dashboard cards, test case table, filters, detail drawer, sync form, exports, imports preview, execution form, and settings health status.
- [ ] Run frontend tests and build.

### Task 11: Verification

**Files:**
- Update docs and README with final commands and limitations.

- [ ] Run `dotnet test backend/QaTestCaseHub.sln`.
- [ ] Run `dotnet build backend/QaTestCaseHub.sln`.
- [ ] Run `npm install` from `frontend/` if dependencies are not installed.
- [ ] Run `npm run test` and `npm run build` from `frontend/`.
- [ ] Start backend and frontend locally if feasible, then smoke test health, dashboard, test cases, import preview, execution, and exports.
