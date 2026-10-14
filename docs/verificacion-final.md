# Verificación final y checklist

Revisión local del 14 de octubre de 2026, rama `chore/qa-documentacion`. No se realizaron operaciones de escritura en Git.

## Resultados ejecutados

- `docker compose up --build -d --wait --wait-timeout 180`: construcción correcta y tres servicios saludables. Esta modalidad ejecuta el mismo build y arranque que `docker compose up --build`, en segundo plano y esperando salud.
- Backend: `npm run typecheck` y `npm run build`, código de salida 0.
- Frontend: `npm run build` y `npm run typecheck`, código de salida 0.
- Backend: `npm test`, 24 resultados correctos, cero fallos. Conserva las pruebas de autenticación y CRUD; añade casos de longitud máxima y verificación de no-store en respuestas 401 de libros.
- Base PostgreSQL nueva en el proyecto aislado `club-lectura-qa-final`: una migración terminada, un usuario y tres libros tras el primer arranque, sin preparación manual de tablas.
- Seed repetido: no cambia libros existentes ni la cuenta ya creada. Se verificó correo con espacios y mayúsculas, contraseña de 36 letras á (72 bytes) y rechazo de 37 letras á (74 bytes).
- Configuración de producción: rechazo del secreto demo y de cookies inseguras; aceptación con secreto propio y Secure; seed desactivado mediante `SEED_DEMO=false`. No equivale a una prueba de HTTPS real.
- Catálogo vacío: eliminación autenticada de los libros de la base QA y respuesta real `{ books: [] }`; pantalla vacía observada en escritorio y móvil. Se creó y editó un libro desde esa pantalla.
- Persistencia: comparación exacta del JSON del libro de QA antes y después de recrear los contenedores conservando su volumen. Se mantuvieron ID, campos y fechas. La sesión sobrevivió a la recarga y al reinicio.
- Interfaz: login, registro, sidebar, catálogo, detalle, creación, edición, tabla, confirmación y cancelación de eliminación revisados. Operaciones hechas contra Express real, sin mocks.
- Móvil a 390 × 844: formularios en una columna, navegación plegable y tabla con desplazamiento interno; documento sin desbordamiento horizontal.
- Accesibilidad básica: etiquetas y descripciones de campos, avisos de error/éxito, foco visible, foco inicial en Cancelar, restauración del foco al cancelar y semántica de diálogo, tabla y navegación revisados.
- Logs de los tres servicios QA: sin errores inesperados en el arranque y recorrido final. El mensaje sobre `.env` ausente es esperado en la demo; el host también avisa de buildx ausente, pero la construcción termina correctamente con el builder disponible.
- Bundles públicos de Next.js revisados: sin secreto JWT demo, URL PostgreSQL, passwordHash ni contraseña demo. No se hallaron archivos `.env` privados ni claves PEM/KEY versionados; `.env` y variantes privadas se ignoran.

La base habitual permaneció detenida mientras QA usaba los puertos locales, con un volumen independiente. La pila QA y su volumen temporal se retiraron al finalizar. Se volvió a levantar la pila habitual y se comparó su volcado de usuarios y libros con el anterior para comprobar que los datos originales se conservaron.

## Checklist de requisitos obligatorios

### Estructura e infraestructura — cumplido

- [x] Next.js con App Router, React y TypeScript; Express con TypeScript como servicio independiente.
- [x] Frontend y backend separados en directorios y contenedores propios.
- [x] PostgreSQL y Prisma; modelos Usuario y Libro con los campos solicitados.
- [x] Usuario con email único y passwordHash; libro con UUID, ISBN único y fechas automáticas.
- [x] Migración SQL versionada aplicada automáticamente en una base nueva.
- [x] Seed idempotente con un usuario de prueba y varios libros.
- [x] Dockerfiles y Compose para tres servicios, con checks de salud y dependencias de arranque.
- [x] Volumen persistente, comprobado al recrear contenedores.
- [x] `.env.example`, archivos privados excluidos y valores demo identificados.
- [x] Endpoint de salud y página inicial accesible, que redirige a login o catálogo según sesión.
- [x] Scripts de desarrollo, generación Prisma, migración, seed, build, tipos y pruebas.

### Autenticación — cumplido

- [x] Registro con nombre, correo y contraseña; inicio y cierre de sesión.
- [x] Contraseñas bcrypt; hash y token excluidos del JSON público de autenticación.
- [x] JWT firmado con expiración y cookie HttpOnly.
- [x] Middleware de sesión y consulta del usuario autenticado.
- [x] Validación Zod y errores consistentes.
- [x] CORS con origen explícito, credenciales y cookies entre servicios.
- [x] Protección del catálogo en Next.js y de sus endpoints en Express.
- [x] Sesiones ausentes, manipuladas y expiradas rechazadas con 401.
- [x] Logout elimina la cookie; redirección al login sin sesión válida.
- [x] Flujo con Docker y persistencia de sesión comprobados.

### Catálogo y CRUD — cumplido

- [x] Listar, consultar por ID, crear, actualizar y eliminar contra PostgreSQL real.
- [x] Rutas, controladores, servicios y repositorios separados.
- [x] Todos los endpoints de libros requieren autenticación.
- [x] ISBN obligatorio y único; título, autor y género obligatorios.
- [x] Año entero no futuro; páginas enteras positivas; sinopsis opcional.
- [x] Unicidad en SQL verificada también con creaciones simultáneas.
- [x] Códigos 400, 401, 404 y 409 y mensajes sin detalles internos.
- [x] Tarjetas, tabla con las columnas requeridas y acciones de consulta, edición y eliminación.
- [x] Detalle con todos los campos y regreso al catálogo.
- [x] Formulario compartido de creación/edición con validación previa y errores del backend.
- [x] Bloqueo de envíos repetidos, carga, cancelación y actualización tras guardar.
- [x] Confirmación que identifica el libro antes de eliminar y mensaje posterior.
- [x] Estados vacío, carga, éxito y error; el pendiente del estado vacío de la fase 3 queda cerrado.
- [x] Diseño editorial coherente, responsive, y componentes de la fase 2 reutilizados.
- [x] Portadas CSS sin APIs externas ni cambios innecesarios del modelo.

### Calidad y entrega — cumplido, con pendiente de dependencia explícito

- [x] Builds, TypeScript y pruebas existentes pasan; no se eliminaron pruebas.
- [x] Migraciones, seed y persistencia revisados sin pérdida de los datos originales.
- [x] Comunicación navegador–Next.js–Express–PostgreSQL verificada.
- [x] Variables, límites y configuración demo/producción documentados.
- [x] Estilos del catálogo provisional sin referencias retirados.
- [x] README con descripción, stack y justificación, requisitos, arranque, variables, credenciales, endpoints, arquitectura, seguridad, decisiones, pruebas y limitaciones.
- [x] Documento `docs/arquitectura.md` con el recorrido de login a creación de libro y alternativas.
- [x] Revisión npm audit actualizada y riesgo pendiente documentado.
- [x] Rama conservada; sin add, commit, push, merges ni Pull Requests.

## Correcciones de esta fase

1. El correo de demostración no se normalizaba igual que en el login: ahora se recorta y convierte a minúsculas antes de validar/insertar.
2. El seed limitaba las contraseñas por caracteres: ahora aplica el máximo de 72 bytes UTF-8 de bcrypt, igual que la autenticación. Se verificaron ambos extremos.
3. Las respuestas 401 de libros salían antes de establecer Cache-Control: ahora `no-store` se aplica antes del middleware de sesión. Se añadió una aserción de integración.
4. Se eliminaron selectores CSS que solo pertenecían al catálogo provisional ya sustituido. No se rediseñaron las pantallas funcionales.

## Pendiente y no verificado

**Pendiente:** Next.js 15.5.26 mantiene un paquete con severidad moderada que agrupa dos avisos de caché. No hay avisos altos ni críticos; backend sin vulnerabilidades según npm audit. La consulta de 15.5.27 devuelve E404 en el registro usado, y la alternativa que propone audit cambia de versión mayor. No se aplicó una actualización masiva. Véanse `security/npm-audit.md` y los JSON de fase 4.

**No verificado:** despliegue público con TLS, recuperación real de backups, escalado con varias réplicas, todos los navegadores y certificación formal WCAG. No forman parte del flujo local obligatorio de la prueba; requieren validación antes de un despliegue de producción.

Las comprobaciones funcionales obligatorias del entorno local quedaron ejecutadas. La aplicación no se presenta como libre de vulnerabilidades ni como un despliegue de producción validado.
