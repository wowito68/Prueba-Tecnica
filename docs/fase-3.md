# CRUD de libros — fase 3

## Ejecución y pruebas

```bash
docker compose up --build -d --wait
cd backend
npm test
```

Las pruebas de integración requieren los servicios activos y PostgreSQL en `localhost:5433`, o la configuración equivalente en `.env` (`DATABASE_URL`, `TEST_API_URL` y `FRONTEND_ORIGIN`). Crean cuentas y libros temporales con identificadores aleatorios y los eliminan al finalizar. Conservan los libros del seed.

También se pueden ejecutar `npm run build` y `npm run typecheck` desde cada servicio. El comando `npm test` ejecuta tanto las pruebas de autenticación como las de libros.

## Endpoints reales

Todos requieren la cookie de sesión `club_session`. Las escrituras también requieren `Origin` igual a `FRONTEND_ORIGIN`, que el navegador envía automáticamente.

- `GET /books`: devuelve `{ books: [...] }` ordenados por fecha de creación descendente.
- `GET /books/:id`: devuelve `{ book: ... }`.
- `POST /books`: crea un libro y devuelve HTTP 201, `{ book: ... }` y el encabezado Location.
- `PUT /books/:id`: reemplaza los datos editables y devuelve `{ book: ... }`.
- `DELETE /books/:id`: elimina el libro y devuelve HTTP 204 sin contenido.

El cuerpo de creación y actualización contiene `isbn`, `titulo`, `autor`, `genero`, `anio_publicacion`, `paginas` y, opcionalmente, `sinopsis`. Los números se envían como números JSON. El ID y las fechas los genera el sistema y no se aceptan en el cuerpo.

Los errores conservan el formato `{ message, errors? }`: HTTP 400 para validación o ID inválido, 401 para sesión ausente o inválida, 404 para UUID válido inexistente y 409 para ISBN duplicado. Las escrituras desde un origen no permitido devuelven 403.

Los campos de texto obligatorios se recortan y rechazan si quedan vacíos. Los límites son: ISBN 80, título 200, autor 160, género 80 y sinopsis 5000 caracteres. La sinopsis ausente, vacía o null se guarda como null. No se valida un formato oficial de ISBN.

Los años deben ser enteros no mayores al actual. Las páginas son enteros positivos dentro del rango de PostgreSQL. Se conservan las restricciones SQL existentes; el índice único de ISBN evita duplicados incluso con peticiones concurrentes.

## Interfaz y arquitectura

El catálogo en `/catalogo` permite alternar entre tarjetas y tabla. Usa `/catalogo/nuevo` para crear, `/catalogo/:id` para consultar y `/catalogo/:id/editar` para editar. La tabla y el detalle permiten eliminar con un diálogo que identifica el libro y exige confirmación.

Se reutilizan la sesión, el layout protegido, el sidebar, los botones, los campos y los mensajes de la fase 2. Las portadas tipográficas se generan con CSS a partir de los datos del libro; no requieren imágenes externas, APIs ni cambios del esquema.

El formulario de creación y edición es el mismo componente. Incluye validaciones por campo, errores del backend, bloqueo de envíos repetidos, cancelación y estados de guardado. Las vistas incluyen carga, catálogo vacío, errores con reintento y confirmaciones de éxito. Una respuesta 401 redirige al login.

El backend separa rutas, controladores, servicios y repositorio Prisma. No se modificaron los modelos, las migraciones ni el seed. Las operaciones se conectan a Express y PostgreSQL reales.

## Comprobación manual

1. Inicia sesión con `lector@example.com` y `LecturaDemo123!`.
2. Revisa las tarjetas, cambia a tabla y abre un detalle.
3. Agrega un libro con ISBN único, consulta todos sus datos y recarga la página.
4. Edita el libro y comprueba la confirmación y los datos guardados.
5. Intenta registrar el mismo ISBN: debe aparecer un error bajo ese campo.
6. Prueba páginas cero, un año futuro y campos vacíos: deben señalarse antes de enviar.
7. Abre el diálogo de eliminación, cancela y verifica que el libro sigue presente. Confirma después y comprueba que desaparece.
8. Repite el flujo con una pantalla móvil. La tabla mantiene desplazamiento horizontal dentro de su contenedor.
9. Cierra sesión e intenta entrar a las rutas del catálogo: deben redirigir a `/login`.

Para comprobar persistencia se puede recrear los contenedores con `docker compose down` y `docker compose up -d --wait`, sin eliminar el volumen. No uses `down -v` si deseas conservar los datos.

## Dependencias

No se añadieron dependencias para el CRUD. Los resultados de esta revisión se conservan en `security/backend-audit-fase-3.json` y `security/frontend-audit-fase-3.json`. El backend reporta cero vulnerabilidades y el frontend mantiene un aviso moderado en Next.js, sin avisos nuevos respecto a la fase 2. Su análisis y el parche pendiente están documentados en `security/npm-audit.md`.

## Resultados de verificación

- Compilación y TypeScript correctos en frontend y backend.
- `npm test`: 24 pruebas correctas, sin fallos, entre autenticación y CRUD.
- Docker Compose inicia los tres servicios saludables.
- Navegador: creación, detalle, edición, recarga, cancelación de formularios, cancelación y confirmación de eliminación, error de ISBN duplicado y validaciones por campo comprobados con datos reales.
- Persistencia: un libro creado y editado conservó exactamente su contenido y fechas después de eliminar y recrear los contenedores manteniendo el volumen.
- Escritorio y móvil: tarjetas, tabla, formulario, detalle y diálogo revisados. La tabla se desplaza dentro de su contenedor, sin desbordar la página.
- Autenticación: registro y sesión cubiertos por las pruebas existentes; login, logout y redirección tras logout comprobados en navegador después del CRUD.
- Se eliminaron los registros temporales de verificación. Se conservaron el usuario de demostración y los tres libros del seed.
- El estado vacío está implementado, pero no se reprodujo manualmente vaciando el catálogo existente. Los estados de carga y de error, incluido libro inexistente, sí se observaron en navegador.
- README, modelos, migraciones, seed y Compose permanecen sin cambios. No se realizaron escrituras en Git.
