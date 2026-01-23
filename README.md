# Prototipo Arquitectura

Este proyecto es un prototipo de arquitectura de software. Aquí te explicamos cómo instalarlo y levantarlo correctamente.

## Requisitos previos

* Tener instalado [Docker](https://www.docker.com/)
* Tener instalado [Visual Studio Code](https://code.visualstudio.com/)
* Tener instalado [Git](https://git-scm.com/)
* Tener instalado [Bun](https://bun.sh/)

  Puedes verificar si tienes `bun` instalado con:

  ```bash
  bun --version
   ```  
  Instalar la dependencia `hono` instalado con:

  ```bash
  bun add hono
  ```
## Pasos para la instalación

1.  **Clonar el repositorio:**

    ```bash
    git clone https://github.com/VladCan/PrototipoArquitectura.git
    ```

2.  **Abrir el proyecto:**
    Abre Visual Studio Code y selecciona la carpeta `PrototipoArquitectura`.

3.  **Configurar las variables de entorno:**
    Dentro de la carpeta `backend`, crea un archivo llamado `.env` con el siguiente contenido:

    ```env
    DATABASE_URL=tu_url_de_base_de_datos
    JWT_SECRET=tu_secreto_jwt
    ```

    **Nota:** Asegúrate de reemplazar `tu_url_de_base_de_datos` y `tu_secreto_jwt` con los valores correspondientes. Si no los tienes, solicítalos.

4.  **Levantar los servicios con Docker:**
    * Abre Docker Desktop y asegúrate de que esté corriendo.
    * En Visual Studio Code, ubícate en la raíz del proyecto (`PrototipoArquitectura`).
    * Haz clic derecho sobre el archivo `docker-compose.yml` y selecciona "**Compose Up**".
    * Esto levantará automáticamente la base de datos y el backend.

5.  **Verificar que todo funcione:**
    * Abre una terminal.
    * Navega a la carpeta `backend`:

        ```bash
        cd backend
        ```

    * Corre los tests:

        ```bash
        bun test
        ```

    **Importante:** Algunos tests pueden fallar si requieren autenticación. Esto es normal, ya que se implementó un sistema de autenticación que debe ser probado manualmente usando herramientas como Postman o similares.

## Observaciones

* Si quieres probar las rutas protegidas, deberás autenticarte manualmente enviando un token válido en tus peticiones.
* Para detener los servicios, puedes hacer clic derecho sobre el `docker-compose.yml` y seleccionar "**Compose Down**" o usar:

    ```bash
    docker-compose down
    ```
 ## Posibles errores y soluciones
### Error en el archivo `wait-for-db.sh` (usuarios de Windows)
Si estás en Windows, es posible que el script `wait-for-db.sh` no funcione correctamente debido a los fines de línea estilo Windows (`CRLF`), en lugar del formato Unix (`LF`).

Esto puede causar errores al intentar ejecutarlo en entornos Unix/Linux como Docker.

#### ✅ Solución:

1. Abre una terminal en la raíz del proyecto.
2. Ejecuta el siguiente comando para convertir los fines de línea a formato Unix:

   ```bash
   dos2unix backend/wait-for-db.sh
   
  3. Vuelve a ejecutar Docker Compose con "Compose Restart".

### Error con `bunx drizzle-kit push`

Si al intentar ejecutar `bunx drizzle-kit push` obtienes un error relacionado con dependencias faltantes, es posible que no se haya instalado correctamente el framework `hono`, requerido por el backend.

#### ✅ Solución:

1. Abre una terminal y navega a la carpeta `backend`:

   ```bash
   cd backend
   bun add hono
2. Vuelve a ejecutar Docker Compose con "Compose Restart".
   
### Error `ER_CON_COUNT_ERROR (Too many connections)`

#### ✅ Solución:

1. Aumentar el límite de conexiones permitidas en MySQL

   ```sql
    SET GLOBAL max_connections = 500;

#### Clonar base de datos,  solo los datos
mysqldump -h db-club-bedrock.cgtn0puuykev.us-east-1.rds.amazonaws.com -u ladmin -p --no-create-info Production > solo_datos.sql
