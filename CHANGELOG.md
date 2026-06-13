# Changelog

## 2026-06-08 — Rediseño visual v2: Dashboard, Gastos y Patrimonio
**Tipo:** Feature
Las tres secciones principales de la app estrenan diseño v2: gráficos enriquecidos, comparativas por categoría respecto al mes anterior y media de 3 meses, y desglose patrimonial con variación mensual.

## 2026-06-08 — Fix de seguridad: actualización de xlsx a 0.20.3
**Tipo:** Fix
Actualizada la dependencia `xlsx` de 0.18.5 a 0.20.3 (CDN SheetJS) para resolver dos vulnerabilidades HIGH: Prototype Pollution (GHSA-4r6h-8v6p-xvw6) y ReDoS (GHSA-5pgg-2g8v-p4x9). Eliminado el stub de tipos `@types/xlsx` ya que la nueva versión incluye sus propios tipos.
