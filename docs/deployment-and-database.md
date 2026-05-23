# Despliegue y base de datos

Guía para que un dev del equipo adapte QA Test Case Hub a su entorno: correrlo local, conectar su
propia base de datos, hostearlo, o migrar a otro motor de base de datos. La app está pensada para ser
**self-hosted**: ustedes la corren donde quieran, con sus credenciales.

> Las variables de entorno completas están en el README (sección *Variables de entorno*) y en
> `backend/src/API/.env.example`.

---

## 1. Correr local (cada dev en su máquina)

**Sin base de datos — modo demo (lo más rápido):** si no se define `DATABASE_URL`, el backend usa una
base **InMemory** y siembra ~25 casos demo. Ideal para evaluar la app sin infraestructura.

```bash
dotnet run --project backend/src/API/QaTestCaseHub.API.csproj   # http://localhost:5000
cd frontend && npm install && npm run dev                       # http://localhost:5173
```

**Con PostgreSQL local (datos persistentes):** levantá Postgres con el `docker-compose.yml` incluido y
apuntá `DATABASE_URL` ahí:

```bash
docker compose up -d
# en backend/src/API/.env:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qa_test_case_hub
```

---

## 2. Conectar su propia PostgreSQL (camino recomendado para compartir)

Para una instancia compartida por el equipo, lo más simple es apuntar a **cualquier PostgreSQL propio**
(Railway, Supabase, Neon, AWS RDS, Azure Database, on-prem, etc.). Solo cambian `DATABASE_URL`:

```env
DATABASE_URL=postgresql://usuario:password@host:puerto/basededatos
```

- **SSL automático**: `DatabaseUrlParser` aplica `SSL Mode=Require` para hosts remotos y `Disable` para
  `localhost`/`127.0.0.1` (`backend/src/Shared/QaTestCaseHub.Shared.Infrastructure/Configuration/DatabaseUrlParser.cs`).
- **Alternativa**: en vez de `DATABASE_URL` (formato URL), pueden usar un connection string Npgsql
  tradicional en `ConnectionStrings:DefaultConnection` (appsettings o env).
- **Migraciones**: al arrancar, el backend ejecuta `Database.MigrateAsync()` y crea las tablas
  (`test_cases`, `test_executions`) automáticamente si el provider es relacional. No hay paso manual.

No requiere tocar código: PostgreSQL en cualquier host funciona igual.

---

## 3. Hostear la app

Es una app **ASP.NET Core 10** (backend) + **build estático de Vite** (frontend). Se puede hostear en
cualquier lado.

**Backend**
- Publicar: `dotnet publish backend/src/API/QaTestCaseHub.API.csproj -c Release`.
- Correr en: Azure App Service, Railway, una VM con Docker, IIS, contenedor propio, etc.
- Configurar las env vars del entorno: `DATABASE_URL`, las `JIRA_*` (o `JIRA_MOCK_MODE=true`), y
  `FRONTEND_ORIGIN` con la URL pública del frontend.

**Frontend**
- Build: `cd frontend && npm run build` → genera estáticos en `frontend/dist`.
- Servir esos estáticos desde cualquier static host / CDN / nginx.
- Definir `VITE_API_BASE_URL` (en build time) apuntando a la URL pública del backend
  (ver `frontend/.env.example`).

**CORS**: el backend solo permite el origen de `FRONTEND_ORIGIN`. En producción, setealo a la URL real
del frontend o el navegador bloqueará las llamadas.

---

## 4. Migrar a otro motor de base de datos (SQL Server, MySQL, etc.)

**Es posible, pero NO es un cambio de configuración — requiere trabajo de dev** (estimado: medio día a
un día). El modelo usa features específicas de PostgreSQL. Pasos:

1. **Provider EF Core**: agregar el paquete del motor (p. ej. `Microsoft.EntityFrameworkCore.SqlServer`)
   y cambiar `UseNpgsql(...)` por `UseSqlServer(...)` en
   `backend/src/Shared/QaTestCaseHub.Shared.Infrastructure/DependencyInjection/SharedInfrastructureServiceCollectionExtensions.cs`.

2. **Columnas array (el punto principal)**: `tags` y `labels` se guardan como **arrays nativos de
   Postgres** (`text[]`). SQL Server / MySQL no tienen tipo array. Hay que remapearlos — lo más limpio
   es una conversión a **JSON** (o string delimitado, o tablas hijas) en
   `backend/src/Shared/QaTestCaseHub.Shared.Infrastructure/Persistence/QaHubDbContext.cs`
   (entidad en `Records.cs`), por ejemplo con `HasConversion` / `ToJson`.

3. **Migraciones**: las migraciones actuales en
   `backend/src/Shared/QaTestCaseHub.Shared.Infrastructure/Persistence/Migrations/` son
   Postgres-específicas (usan `text[]`). Hay que **regenerarlas** para el provider nuevo:
   borrar las existentes y `dotnet ef migrations add InitialCreate ...` contra el nuevo motor.

4. **Connection string**: `DatabaseUrlParser` asume formato/SSL de PostgreSQL. Para SQL Server, usar
   directamente un connection string nativo (vía `ConnectionStrings:DefaultConnection`) o adaptar el
   parser.

Nada de esto afecta al frontend ni a la lógica de negocio — es solo la capa de persistencia.

---

## 5. Validación rápida

Con el backend corriendo:

```bash
curl http://localhost:5000/api/health
# { "status": "ok", "database": "ok", "jiraMode": "mock" }
```

Además, al arrancar, el backend loguea una línea con el provider de base de datos detectado
(PostgreSQL / InMemory) y el modo Jira (REAL / MOCK), útil para diagnosticar la conexión.

---

## Archivos clave (para el dev que adapte el repo)

| Qué | Dónde |
|---|---|
| Selección de provider + connection (Npgsql / InMemory) | `…/Shared.Infrastructure/DependencyInjection/SharedInfrastructureServiceCollectionExtensions.cs` |
| Parser de `DATABASE_URL` (formato URL → Npgsql, SSL) | `…/Shared.Infrastructure/Configuration/DatabaseUrlParser.cs` |
| Mapeo entidad ↔ columnas (incl. `tags`/`labels`) | `…/Shared.Infrastructure/Persistence/QaHubDbContext.cs` y `Records.cs` |
| Migraciones EF Core | `…/Shared.Infrastructure/Persistence/Migrations/` |
| Carga de `.env` local | `…/Shared.Infrastructure/Configuration/DotEnvLoader.cs` |
