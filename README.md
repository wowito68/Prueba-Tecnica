# Entre páginas

Aplicación web para administrar el catálogo de un club de lectura. Permite registrarse, iniciar sesión y crear, consultar, editar y eliminar libros desde tarjetas o una tabla administrativa. La interfaz editorial usa crema, blanco, verde oscuro y coral, con navegación adaptable a móviles.

## Stack y justificación

- **Next.js 15, App Router y React 19:** páginas, layouts compartidos y verificación de sesión desde el servidor.
- **TypeScript:** contratos explícitos y detección de errores en ambos servicios.
- **Node.js 22 y Express 5:** API independiente, con rutas y middleware sencillos.
- **PostgreSQL 17:** almacenamiento persistente y restricciones de integridad, incluido ISBN único.
- **Prisma 6:** acceso tipado a datos y migraciones versionadas.
- **JWT, bcrypt y cookies HttpOnly:** autenticación con contraseñas hasheadas y token fuera del acceso directo de JavaScript.
- **Zod:** validación de solicitudes y configuración en el backend.
- **Tailwind CSS 4 y CSS compartido:** estilos y componentes reutilizables sin una librería visual adicional. Las fuentes DM Sans y Lora se sirven localmente.
- **Docker y Docker Compose:** ejecución reproducible de frontend, backend y base de datos.

Las versiones exactas resueltas se conservan en los archivos `package-lock.json`; las imágenes usan Node.js 22 y PostgreSQL 17.

## Requisitos

Para ejecutar la aplicación necesitas Docker Engine o Docker Desktop con Docker Compose v2 y los puertos locales 3000, 4000 y 5433 disponibles. No necesitas instalar PostgreSQL ni Node.js en el host.

Para ejecutar las pruebas o desarrollar fuera de los contenedores necesitas además Node.js 22 y npm.

## Inicio con Docker

Desde la raíz del repositorio:

```bash
docker compose up --build
```

No requiere preparar la base de datos manualmente ni crear un archivo `.env` para la demostración local. Compose espera a PostgreSQL, el backend aplica las migraciones y ejecuta el seed, y el frontend arranca cuando el backend está saludable.

- Aplicación: [http://localhost:3000](http://localhost:3000).
- Salud del backend: [http://localhost:4000/health](http://localhost:4000/health).
- PostgreSQL para herramientas del host: `localhost:5433`.

Utiliza `localhost` en el navegador: el origen permitido predeterminado es exactamente `http://localhost:3000`.

Para ejecutar en segundo plano, revisar el estado y consultar logs:

```bash
docker compose up --build -d --wait
docker compose ps
docker compose logs --tail=100 backend frontend postgres
```

Para detener los servicios sin borrar los libros:

```bash
docker compose down
```

El volumen `club-lectura_postgres_data` conserva los datos. `docker compose down -v` elimina ese volumen y sus datos; no lo uses si quieres conservarlos.

### Usuario de demostración

- Correo: `lector@example.com`
- Contraseña: `LecturaDemo123!`

El seed incluye tres libros. Usa upserts: repetirlo no cambia registros existentes, sus IDs ni sus contraseñas. Con `SEED_DEMO=true`, si eliminas un libro de demostración, el seed puede recrearlo al arrancar de nuevo. Las credenciales y secretos predeterminados son públicos y exclusivos de la demostración local.

## Variables de entorno

Para personalizar la configuración, copia `.env.example` a `.env` en la raíz y ajusta los valores. `.env` y sus variantes privadas están excluidos de Git.

**Base de datos y puertos:**

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: valores de demostración `club_demo`, `solo_demo_local` y `club_lectura`.
- `POSTGRES_PORT`: puerto del host, 5433 por defecto. Dentro de Docker PostgreSQL usa 5432.
- `FRONTEND_PORT` y `BACKEND_PORT`: puertos del host, 3000 y 4000.
- `DATABASE_URL`: conexión usada por scripts y pruebas del host. En Docker, Compose construye la conexión interna con el host `postgres`.
- `PORT`: puerto del backend fuera de Docker; dentro del contenedor se mantiene 4000.

**Comunicación:**

- `FRONTEND_ORIGIN`: origen autorizado para CORS y escrituras; por defecto `http://localhost:3000`.
- `NEXT_PUBLIC_API_URL`: dirección de Express accesible desde el navegador, por defecto `http://localhost:4000`. Es pública y se incorpora al compilar; cambiarla requiere reconstruir el frontend.
- `BACKEND_INTERNAL_URL`: dirección privada para las comprobaciones de sesión de Next.js. Compose la fija en `http://backend:4000`; fuera de Docker usa `http://localhost:4000`.

Si cambias los puertos públicos, ajusta también `FRONTEND_ORIGIN`, `NEXT_PUBLIC_API_URL` y, para pruebas, `DATABASE_URL` y `TEST_API_URL`. Los nombres `backend` y `postgres` solo resuelven dentro de la red de Compose.

**Sesión y seed:**

- `APP_ENV`: `development`, `test` o `production`. Es independiente de `NODE_ENV`, que las imágenes establecen en `production` para ejecutar el código compilado.
- `JWT_SECRET`: secreto de firma, de al menos 32 caracteres. El valor predeterminado es de demostración.
- `SESSION_TTL_SECONDS`: duración de sesión; 3600 por defecto, entre 60 y 86400.
- `COOKIE_SECURE`: `false` para HTTP local; `true` para HTTPS.
- `TRUST_PROXY_HOPS`: `0` por defecto; `1` solo detrás del único proxy Caddy con backend privado.
- `SEED_DEMO`: `true` activa el seed; `false` lo desactiva.
- `DEMO_USER_NAME`, `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD`: datos del usuario que el seed crea si todavía no existe. Cambiarlos no modifica una cuenta ya creada.
- El seed requiere una contraseña de demostración de al menos 12 caracteres y hasta 72 bytes UTF-8; el registro normal requiere al menos 8 caracteres y el mismo máximo en bytes.

Para producción se necesitan `APP_ENV=production`, un secreto JWT propio, `COOKIE_SECURE=true`, `SEED_DEMO=false`, HTTPS y credenciales privadas de base de datos. El backend rechaza la configuración de producción con el secreto demo o cookies inseguras. El Compose local conserva su configuración de desarrollo. El despliegue con HTTPS y respaldos se explica en la sección AWS.

## Endpoints

La API se publica directamente desde Express, sin prefijo `/api`:

- `GET /health`: salud y conexión a PostgreSQL; 200 o 503.
- `POST /auth/register`: registra con `nombre`, `email` y `password`; devuelve 201 e inicia sesión.
- `POST /auth/login`: autentica con `email` y `password`; devuelve 200.
- `POST /auth/logout`: elimina la cookie del navegador; devuelve 204.
- `GET /auth/me`: usuario autenticado, limitado a `id`, `nombre` y `email`.
- `GET /books`: catálogo protegido con búsqueda, filtro por género y paginación; devuelve `{ books, pagination, genres }`.
- `GET /books/:id`: detalle en `{ book: ... }`.
- `POST /books`: crea un libro; devuelve 201 y el encabezado Location.
- `PUT /books/:id`: reemplaza los campos editables de un libro; devuelve 200.
- `DELETE /books/:id`: elimina un libro; devuelve 204.

`/auth/me` y todos los endpoints de libros requieren una cookie `club_session` válida. Las escrituras exigen `Origin` igual a `FRONTEND_ORIGIN`, incluso al probar con curl. El navegador lo envía automáticamente; un cliente CLI debe añadirlo y conservar las cookies.

El cuerpo de creación y edición contiene:

```json
{
  "isbn": "ISBN-DEMO-001",
  "titulo": "Una nueva lectura",
  "autor": "Autora del club",
  "genero": "Novela",
  "anio_publicacion": 2024,
  "paginas": 240,
  "sinopsis": "Una historia para compartir."
}
```

La sinopsis es opcional; ausente, vacía o null se guarda como null. ID UUID y fechas se generan automáticamente. El ISBN es texto obligatorio y único, sin validación de formato oficial. El año debe ser entero y no superar el actual; las páginas son enteros positivos dentro del rango de PostgreSQL. Límites de texto: ISBN 80, título 200, autor 160, género 80 y sinopsis 5000 caracteres.

Los errores usan `{ message, errors? }`, donde `errors` asocia campos con mensajes:

- **400:** datos o ID inválidos, o JSON mal formado.
- **401:** credenciales incorrectas o sesión ausente, manipulada o expirada.
- **403:** origen de escritura no permitido.
- **404:** ruta o libro inexistente.
- **409:** correo o ISBN duplicado.
- **413:** cuerpo superior a 100 KB.
- **429:** límite de intentos de registro/login.
- **500:** error inesperado, con mensaje público genérico.

## Búsqueda, géneros y paginación

El catálogo permite buscar coincidencias parciales por título o autor y combinar la búsqueda con un género exacto, sin distinguir mayúsculas. Se recortan los espacios exteriores; los interiores se conservan. Los caracteres `%`, `_` y `\` se interpretan como texto, no como comodines SQL. No se normalizan acentos: `garcia` y `García` pueden producir resultados diferentes.

La barra de herramientas conserva las vistas de tarjetas y tabla. El buscador espera 300 ms tras la escritura y permite limpiar el texto. Géneros y búsqueda reinician la página a 1; cambiar de vista conserva los filtros y la página. La URL guarda `search`, `genero`, `page` y, opcionalmente, `view=table`, permitiendo recargar, compartir y navegar hacia atrás o adelante. La interfaz muestra 12 libros por página.

`GET /books` acepta parámetros opcionales:

- `search`: texto de hasta 200 caracteres, buscado en título o autor.
- `genero`: texto de hasta 80 caracteres, coincidencia completa sin distinguir mayúsculas.
- `page`: entero positivo, predeterminado 1.
- `limit`: entero entre 1 y 50, predeterminado 12.

Los valores numéricos vacíos, repetidos, no enteros, negativos o fuera de rango devuelven 400. También se rechaza un desplazamiento `(page - 1) * limit` superior a 2147483647. La sesión sigue siendo obligatoria: una petición sin autenticación devuelve 401 antes de validar parámetros. Los parámetros desconocidos se ignoran.

Ejemplo de consulta local, usando un archivo de cookies de una sesión ya iniciada:

```bash
curl --get http://localhost:4000/books --cookie cookies.txt \
  --data-urlencode 'search=garcía' \
  --data-urlencode 'genero=Novela' \
  --data-urlencode 'page=1' \
  --data-urlencode 'limit=12'
```

Formato de respuesta (datos ilustrativos):

```json
{
  "books": [],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "genres": ["Ensayo", "Novela"]
}
```

`books` conserva los campos de libro del contrato anterior. `total` cuenta todas las coincidencias; `totalPages` es cero si no hay resultados. `genres` contiene los géneros del catálogo completo, agrupados sin distinguir mayúsculas y ordenados alfabéticamente en español, incluso si la búsqueda no devuelve libros. Se conserva una representación del texto registrado en cada grupo.

La consulta usa Prisma con `skip`/`take`, filtros en PostgreSQL y una transacción Repeatable Read para mantener coherentes el listado, el total y los géneros de cada respuesta. No se cambió el esquema Prisma. Una página posterior al final devuelve `books: []` y mantiene la página solicitada; el frontend corrige la URL a la última página disponible. Al eliminar vuelve a consultar los metadatos y retrocede si la página quedó vacía.

El catálogo distingue biblioteca vacía, búsqueda sin resultados, carga y error con reintento. Cancela las peticiones reemplazadas y descarta respuestas antiguas. Durante la carga no muestra rangos de resultados desactualizados.

La implementación conserva el contrato de autenticación, el Compose local y las rutas del proxy de AWS. Caddy ya reenvía los parámetros de consulta. **Estos cambios no se despliegan automáticamente:** producción conserva la versión anterior hasta revisar el código y realizar la actualización descrita en la guía AWS, reconstruyendo el frontend con su URL pública.

Verificaciones y archivos modificados: [docs/catalogo-busqueda-paginacion.md](docs/catalogo-busqueda-paginacion.md).

## Organización y arquitectura

```text
backend/
  prisma/          Modelos, migraciones SQL y seed
  src/
    config/        Validación de variables
    routes/        Métodos y rutas HTTP
    controllers/   Validación de entrada y respuestas
    services/      Reglas de negocio y errores esperados
    repositories/  Consultas Prisma
    middleware/    Sesión, origen y manejo de errores
    lib/           Cliente Prisma, cookies y errores compartidos
  tests/           Integración con API y PostgreSQL reales
frontend/
  src/app/         App Router; grupos de autenticación y páginas protegidas
  src/components/  UI, layouts, autenticación y libros
  src/hooks/       Carga de libros y manejo de sesión expirada
  src/lib/         Cliente HTTP, tipos y validación del formulario
  public/          Recursos públicos
  Dockerfile
docs/              Arquitectura, verificaciones y revisión de dependencias
docker-compose.yml
.env.example
```

El navegador consulta Express con `credentials: include`. Para validar páginas protegidas, Next.js consulta `/auth/me` desde el servidor y redirige al login si la sesión no es válida. Express aplica su propia verificación en cada endpoint protegido. Prisma es el único acceso a PostgreSQL desde el código de aplicación.

Consulta [docs/arquitectura.md](docs/arquitectura.md) para el recorrido de login y creación de un libro.

## Autenticación y seguridad

Las contraseñas se guardan con bcrypt, coste 12; se aceptan desde 8 caracteres y hasta 72 bytes UTF-8. El correo se normaliza a minúsculas. El JWT usa HS256, sujeto UUID, expiración, issuer y audience verificados. La respuesta de autenticación nunca devuelve el hash ni el token en JSON.

La cookie usa HttpOnly, SameSite=Lax y Path=/; Secure depende del entorno. El token no se almacena en localStorage. CORS autoriza un origen explícito con credenciales y las escrituras comprueban Origin. Esto funciona con frontend y backend en el mismo sitio, incluido localhost en distintos puertos; despliegues en sitios distintos requieren revisar cookies y protección CSRF.

Las respuestas de autenticación y libros usan `no-store`. El límite de registro/login es de 30 peticiones por IP cada 15 minutos, en memoria del backend. Los contenedores de aplicación se ejecutan como usuario no root y sus puertos se publican en loopback.

## Decisiones y alternativas

- API Express independiente para separar frontend y backend, frente a concentrar todo en Route Handlers de Next.js.
- Rutas, controladores, servicios y repositorios para separar HTTP, reglas y persistencia, sin contenedores de inyección ni abstracciones adicionales.
- Cookies HttpOnly frente a localStorage para reducir la exposición directa del token a JavaScript.
- JWT de una hora sin refresh tokens ni tabla de sesiones para mantener el alcance sencillo. El logout elimina la cookie; un token copiado previamente sigue siendo válido hasta expirar.
- Validación en frontend para guiar al usuario, en backend como autoridad y restricciones SQL para integridad y concurrencia.
- Formularios compartidos y portadas CSS para evitar duplicación, APIs externas y campos de imagen innecesarios.
- Arranque con migración y seed automático por simplicidad de evaluación; en producción convendría separar las migraciones como tarea de despliegue.

## Pruebas y desarrollo

Con Docker activo:

```bash
cd backend
npm ci
npm run db:generate
npm test
npm run typecheck
npm run build
```

Las pruebas usan Node Test Runner, HTTP real y Prisma contra PostgreSQL. Crean cuentas y libros aleatorios y los eliminan al finalizar. Cubren autenticación, cookies, CORS, rutas protegidas, CRUD, validaciones, ISBN duplicados concurrentes y errores 400/401/403/404/409.

Si personalizaste conexiones, copia `.env.example` a `.env`; los scripts del backend leen ese archivo. `TEST_API_URL` permite cambiar la dirección de API usada por las pruebas. No apuntes las pruebas a producción.

Desde `frontend/`:

```bash
npm ci
npm run typecheck
npm run build
```

Para desarrollo local, inicia PostgreSQL con `docker compose up -d postgres`, prepara `.env`, ejecuta migración y seed desde `backend/` con `npm run db:deploy` y `npm run db:seed`, y usa `npm run dev` en cada servicio. Detén los contenedores frontend/backend si ocupan los mismos puertos. Next.js usa sus valores locales predeterminados; si los personalizas, pasa `NEXT_PUBLIC_API_URL` y `BACKEND_INTERNAL_URL` al proceso frontend.

Los resultados finales y el checklist están en [docs/verificacion-final.md](docs/verificacion-final.md). Los informes anteriores describen el estado de cada fase y pueden contener pendientes que ya se verificaron después.

## Limitaciones y pendientes

- Permanece un aviso moderado de Next.js 15.5.26, agrupando dos vulnerabilidades de caché. El parche compatible 15.5.27 no está disponible en el registro consultado. La aplicación usa App Router dinámico, sin catch-all raíz; esto limita las condiciones descritas, pero no sustituye el parche. Véase [el análisis de seguridad](docs/security/npm-audit.md).
- No hay revocación central de JWT, refresh tokens, recuperación de contraseña ni roles. Todas las cuentas autenticadas administran el mismo catálogo.
- La paginación usa offset; se ordena por fecha de creación descendente e ID ascendente. Grandes volúmenes pueden requerir índices de búsqueda específicos o paginación por cursor.
- El limitador de intentos es local al proceso y se reinicia con el backend; escalar requiere almacenamiento compartido y configurar proxies de confianza.
- La revisión responsive y de accesibilidad es básica. No equivale a certificación WCAG ni a una matriz completa de navegadores.
- Para operar fuera de esta demostración: reevaluar el aviso de Next.js, conservar respaldos privados fuera de EC2 y revisar las reglas de acceso. El alcance y las verificaciones del despliegue AWS se detallan en su informe.

## Despliegue en AWS EC2

La configuración de producción está separada en `docker-compose.prod.yml`, con Caddy como única entrada pública en 80/443 y certificados HTTPS automáticos. Next.js, Express y PostgreSQL permanecen en la red Docker; el Compose local conserva su comportamiento.

El dominio es `tractoandespruebatecnica.duckdns.org`. El cliente se compila con su URL HTTPS y la comprobación de sesión de Next.js usa `http://backend:4000` internamente. `/auth/*`, `/books`, `/books/*` y `/health` conservan sus paths al pasar por el proxy.

En EC2 se crea `.env.prod` con `python3 scripts/create-production-env.py`, secretos aleatorios y permisos 0600. La configuración fuerza cookies Secure, `APP_ENV=production` y `SEED_DEMO=false`. No hay usuario demo precargado: el evaluador se registra. Todas las cuentas comparten permisos sobre el catálogo; usa únicamente datos ficticios.

Se recomienda construir las imágenes fuera de la instancia de 2 GB y transferirlas por SSH. Para iniciar, consultar logs o reiniciar, desde el directorio del proyecto en EC2:

```bash
sudo docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --no-build --wait
sudo docker compose --env-file .env.prod -f docker-compose.prod.yml logs --tail=100
sudo docker compose --env-file .env.prod -f docker-compose.prod.yml restart backend frontend
```

No combines los archivos Compose local y de producción ni elimines volúmenes. La guía [docs/despliegue-aws.md](docs/despliegue-aws.md) incluye requisitos de EC2, instalación de Docker, DNS y Elastic IP, reglas AWS, HTTPS, variables, construcción, transferencia, backups, actualización y rollback. El estado comprobado se registra en [docs/despliegue-aws-resultados.md](docs/despliegue-aws-resultados.md).
