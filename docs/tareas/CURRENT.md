# Tarea en curso

**Título:** Bug — Dashboard HTTP 500 en preview de Vercel
**Tipo:** Bug
**Estado:** Diagnóstico completado
**Iniciada:** 2026-06-08

## Contexto

La ruta `/dashboard` devuelve HTTP 500 en la preview `finanti-pitroqnxk-santiagojv00.vercel.app` (deployment `dpl_Dmxau7oTWgDeQ8qYBqwtGt9Yfs37`, branch `feature/rediseno-v2`). El resto de rutas devuelven 200.

## Decisión técnica / Diagnóstico

## [Fix] Dashboard HTTP 500 en preview — columna `contributions` probablemente no migrada a Supabase, o error en query `getMonthlyContributions`

**Origen:** Debugger (fix simple, sin análisis de arquitectura)

**Causa raíz más probable:**
La query `getMonthlyContributions()` — añadida en esta rama — es la única diferencia funcional entre `/dashboard` y el resto de rutas (que devuelven 200). La evidencia clave: el deployment devuelve 200 durante los warm-up requests de Vercel a las 21:17 (cuando la BD preview puede estar vacía o con datos mínimos) y empieza a devolver 500 en los requests reales del usuario desde las 21:18.

Dos hipótesis ordenadas por probabilidad:

**Hipótesis 1 (más probable):** La columna `contributions` en `monthly_snapshots` existe en el schema Drizzle pero **no fue migrada a la BD de Supabase** de la preview (no se ejecutó `pnpm db:push` después de añadir la columna). Con la BD vacía los INNER JOIN devuelven 0 filas y PostgreSQL no evalúa las columnas; con datos reales falla con `column "contributions" does not exist`. Esto afecta tanto a `getMonthlyContributions()` como al cálculo de `currentMonthContributions` en `getDashboardRaw()` (línea 89: `s.contributions`).

**Hipótesis 2:** La query `getMonthlyContributions` genera un error de runtime con datos reales que no se manifiesta con BD vacía. El SQL usa `TO_CHAR` en SELECT pero `groupBy(monthlySnapshots.month)` por el timestamp completo — si los timestamps del mismo mes-calendario tienen horas distintas (distintos registros creados en horas distintas), no causa error pero sí produce resultados duplicados. Sin embargo, esto no provoca un 500.

**Los logs de Vercel no exponen el stack trace** (el error boundary de Next.js lo captura antes). No fue posible confirmar la causa exacta sin acceso directo a la BD.

**Solución a implementar:**

1. **Verificar primero** si la columna `contributions` existe en la BD de Supabase preview ejecutando en Supabase Studio o SQL Editor:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'monthly_snapshots' AND column_name = 'contributions';
   ```

2. **Si la columna no existe:** ejecutar `pnpm db:push` desde la branch `feature/rediseno-v2` contra la BD de preview para sincronizar el schema. La columna está declarada en `src/db/schema.ts` línea 154 con `NOT NULL DEFAULT '0'`.

3. **Si la columna existe:** añadir un `try/catch` o log explícito en `getMonthlyContributions()` para capturar el error real, o revisar si la query Drizzle genera SQL inválido con los datos actuales de la BD.

**Archivos:**
- `src/features/dashboard/queries.ts:197-213` — función `getMonthlyContributions()` nueva
- `src/db/schema.ts:154` — declaración de la columna `contributions`
- `src/app/dashboard/page.tsx:27` — llamada a `getMonthlyContributions()`

## Estado de implementación

**Commit de debug pusheado:** `8fa7cc35` — `debug: add try/catch in dashboard page to expose 500 stack trace in Vercel logs`

**Deployment listo:** `dpl_AKHpozrx8AsL6as3vzFE9eXAVZ9m`
URL: `finanti-git-feature-rediseno-v2-santiagojv00.vercel.app`

**Análisis estático realizado:**
- La columna `contributions` existe en el schema desde el commit inicial (`b89675c`), no es nueva en esta branch. No hay diferencias de schema entre `main` y `feature/rediseno-v2`.
- La query `getMonthlyContributions` tiene el mismo patrón SQL (TO_CHAR en SELECT + groupBy columna raw) que `getMonthlyPnlData` (gainRows), que funciona.
- El build compila sin errores. Las funciones de dominio son puras y no pueden lanzar excepciones con datos reales.
- Los logs del billing tier no exponen el stack trace.

**Acción requerida del usuario:** visitar `/dashboard` en el deployment nuevo para que el `console.error` capture el error real. Después leer los logs en Vercel para identificar exactamente cuál de las 4 queries falla y con qué mensaje.

**Quality gates:**
- typecheck: PASS
- lint: PASS (0 errores, 7 warnings preexistentes)
- tests: 151 passing, 2 failing preexistentes (archivo Excel faltante)
