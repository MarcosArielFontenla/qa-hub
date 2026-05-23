# Railway PostgreSQL Integration Notes

## Datos que necesito cuando el servicio esté creado

1. `DATABASE_URL` completo del servicio PostgreSQL. Ya está configurado localmente en `backend/src/API/.env`.
   - Para correr el backend local contra Railway, usar el `DATABASE_URL` público.
   - Para backend desplegado dentro de Railway, usar la variable inyectada por Railway en el mismo environment.
2. Confirmar si vamos a arrancar en demo o real Jira:
   - Demo: `JIRA_MOCK_MODE=true`.
   - Real Jira: `JIRA_MOCK_MODE=false` y credenciales Jira completas.
3. `FRONTEND_ORIGIN`.
   - Local: `http://localhost:5173` o `http://127.0.0.1:5173`.
   - Producción: URL final del frontend.
4. Nombre del environment Railway donde vamos a configurar variables: `production`, `staging` u otro.

## Variables mínimas backend

```env
ASPNETCORE_ENVIRONMENT=Production
DATABASE_URL=postgresql://user:password@host:port/database
FRONTEND_ORIGIN=http://localhost:5173
JIRA_MOCK_MODE=true
```

Para Jira real:

```env
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=qa@example.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=QA
JIRA_TEST_CASE_ISSUE_TYPE=Sub-task
JIRA_BUG_ISSUE_TYPE=Bug
JIRA_GHERKIN_FIELD=description
JIRA_PARENT_FIELD=parent
JIRA_LABELS_FIELD=labels
JIRA_MOCK_MODE=false
```

## Qué hace el backend al conectarse

- Carga `backend/src/API/.env` al correr localmente.
- Lee `DATABASE_URL` y lo convierte a connection string Npgsql.
- Usa `SSL Mode=Require` para hosts remotos como Railway.
- Usa `SSL Mode=Disable` para `localhost`, `127.0.0.1` o `::1`.
- Ejecuta `Database.MigrateAsync()` al iniciar si el provider es relacional.
- Solo crea mock data si `JIRA_MOCK_MODE=true` explícitamente o si corre con base InMemory local.

## Validación rápida

Con backend corriendo contra Railway:

```bash
Invoke-RestMethod -Uri "http://localhost:5000/api/health"
Invoke-RestMethod -Uri "http://localhost:5000/api/test-cases?pageSize=3"
```

Resultado esperado en demo:

```json
{
  "status": "ok",
  "database": "ok",
  "jiraMode": "mock"
}
```

## Checklist para integrar

- [ ] Pegar `DATABASE_URL` en el entorno del backend.
- [ ] Configurar `FRONTEND_ORIGIN`.
- [ ] Decidir `JIRA_MOCK_MODE`.
- [ ] Iniciar backend y confirmar `/api/health`.
- [ ] Revisar que se creen tablas en PostgreSQL.
- [ ] Confirmar si queremos conservar o limpiar mock data antes de Jira real.

## Estado actual local

- Railway PostgreSQL conecta correctamente desde local.
- La migración inicial se aplicó y creó las tablas.
- `GET /api/health` responde `database=ok`.
- `GET /api/test-cases?pageSize=3` responde `total=0`, sin datos demo sembrados en Railway.
- Jira todavía queda en modo mock si las credenciales son placeholders o faltan.
