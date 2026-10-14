# Revisión de dependencias — revisión final

Revisión realizada el 14 de octubre de 2026, conservando Next.js 15 y Prisma 6.

## Correcciones aplicadas

- PostCSS actualizado a 8.5.30 mediante `overrides`, tanto en Next.js como en Tailwind.
- `source-map-js` actualizado a 1.2.2 mediante `overrides`.
- Se conserva el override de `sharp` 0.35.5 de la fase 1.
- Los archivos de bloqueo se actualizaron y las imágenes Docker se construyeron con `npm ci`.

El frontend pasó de cinco paquetes señalados (cuatro altos y uno moderado) a un paquete con severidad moderada. El backend reporta cero vulnerabilidades.

## Pendiente

Next.js 15.5.26 conserva dos avisos moderados, agrupados por `npm audit` como un solo paquete vulnerable:

- [GHSA-4jqv-mc3x-m676](https://github.com/advisories/GHSA-4jqv-mc3x-m676): afecta aplicaciones alojadas fuera de Vercel con Pages Router y páginas SSG/ISR.
- [GHSA-mcj8-r9mp-w47p](https://github.com/advisories/GHSA-mcj8-r9mp-w47p): requiere una ruta catch-all raíz junto con páginas estáticas o ISR.

Los avisos indican como parche Next.js 15.5.27. Al consultar el registro configurado, `npm view next@15.5.27 version` devolvió E404. No se ejecutó `npm audit fix --force`, pues propone cambiar a Next.js 16.3.6 y no es una actualización compatible dentro de la versión mayor actual.

La aplicación usa App Router, no tiene rutas catch-all y las páginas de sesión y catálogo se renderizan dinámicamente. La verificación de sesión y las respuestas de autenticación usan `no-store`. Esto limita las condiciones de exposición descritas, pero no elimina el aviso ni sustituye el parche. Se debe instalar la versión corregida cuando esté disponible, repetir la compilación y las pruebas, y revisar nuevamente antes de publicar en producción.

## Evidencia y reproducción

Los resultados completos están en `frontend-audit.json` y `backend-audit.json` en este directorio. Son capturas de esta revisión, no un monitoreo continuo.

Desde cada servicio:

```bash
npm audit --json
```

El frontend devuelve código 1 por el pendiente moderado; el backend devuelve código 0.

## Revalidación en fase 4

Se repitió `npm audit --json`: backend con cero vulnerabilidades; frontend con un paquete moderado, sin avisos altos ni críticos. Los informes vigentes están en `backend-audit-fase-4.json` y `frontend-audit-fase-4.json`; las capturas de fases anteriores se conservan como historial.

Se consultaron otra vez las versiones de Next.js 15 y `npm view next@15.5.27 version`. El registro devuelve E404 para el parche y 15.5.26 como última versión disponible de esa rama en la consulta. Los dos avisos enlazados siguen indicando 15.5.27 o 16.3.8 como versiones corregidas. Esto se documenta como una diferencia entre la publicación descrita en los avisos y la disponibilidad observada en el registro; no se declara resuelto el riesgo.

Se conserva la versión probada, sin cambios de dependencias. Antes de publicar se debe repetir la consulta, instalar un parche disponible, ejecutar build, tipos y pruebas, y reevaluar el riesgo si todavía no está disponible.
