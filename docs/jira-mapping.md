# Jira Mapping

## Test Case

Un test case local se mapea a un issue Jira:

- `jira_issue_id` -> `id`
- `jira_issue_key` -> `key`
- `summary` -> `fields.summary`
- `jira_status` -> `fields.status.name`
- `priority` -> `fields.priority.name`
- `labels` -> `fields.labels`
- `assignee_display_name` -> `fields.assignee.displayName`
- `parent_issue_key` -> `fields.parent.key`

## Gherkin

Si `JIRA_GHERKIN_FIELD=description`, el backend envía Atlassian Document Format como `codeBlock` con lenguaje `gherkin`.

Si `JIRA_GHERKIN_FIELD` apunta a un custom field simple, el backend envía texto plano. Campos custom más complejos pueden requerir adaptar el payload según el schema Jira de la instancia.

## Bugs

Si una ejecución falla y `createBug=true`, el backend crea un issue con `JIRA_BUG_ISSUE_TYPE`,
enviando la descripción como ADF (`codeBlock`), y guarda `jira_bug_key` en la ejecución.

Tras crear el bug, el backend intenta linkearlo al test case con un link tipo `Relates`
(`POST /rest/api/3/issueLink`). Si el tipo de link no existe en la instancia (404) o el link
falla por otro motivo, el bug igual queda creado y la respuesta incluye un `warning` (no un error).

## Errores de Jira

- `401/403` -> `JIRA_AUTH_FAILED`
- `429` -> `JIRA_RATE_LIMITED` (incluye `retryAfter` si Jira lo envía)
- `404` -> `NOT_FOUND` (issue o campo no encontrado)

## Limitaciones

- Jira Cloud custom fields pueden variar por tenant; validar `JIRA_GHERKIN_FIELD`, `JIRA_PARENT_FIELD` y `JIRA_LABELS_FIELD`.
- Este MVP solo lee casos desde Jira (sync) y crea bugs; no crea ni edita test cases en Jira.
