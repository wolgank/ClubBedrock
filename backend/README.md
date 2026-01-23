
# 🐳 Backend - Inicialización con Docker, Drizzle y MySQL

Este backend usa **Bun**, **Drizzle ORM**, y una base de datos MySQL. El entorno está preparado para:

- Ejecutar migraciones automáticamente (`drizzle-kit push`)
- Crear el esquema si no existe
- Sembrar la base de datos con datos iniciales (`seed.sql`)
- Ejecutar cualquier otro SQL adicional (vistas, triggers, funciones, etc.)

## 📁 Estructura de archivos clave

```txt
/backend
├── Dockerfile.bun.db-init         # Imagen Docker personalizada con soporte para Bun y MySQL
├── docker-compose-v2.yml          # Orquestador de servicios
├── entrypoint-init.sh             # Script de arranque e inicialización de base de datos
├── .env                           # Variables de entorno
├── seed.sql                       # Script SQL con datos iniciales
├── views.sql                      # (Opcional) Script para vistas
├── triggers.sql                   # (Opcional) Script para triggers
└── src/
```

## 📦 `.env`

```env
DB_HOST=db-club-bedrock.cgtn0puuykev.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=ladmin
DB_PASSWORD=contraseña
DB_NAME=Nuevo

# 🔒 Solo usar una de las dos formas: esta es ignorada si se usa la concatenación
# DATABASE_URL=mysql://ladmin:contraseña@db-club-bedrock.cgtn0puuykev.us-east-1.rds.amazonaws.com:3306/Production
```
> ⚠️ **Se recomienda dejar de usar directamente **`DATABASE_URL`** en el **`.env`**.**\
> Para tener un mejor manejo, se deben usar las variables individuales (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`)\
> y construir la URL dinámicamente en el código, como se muestra en `drizzle.config.ts` y `client.ts`.
>

## 🐋 `docker-compose-v2.yml`

```yaml
version: "3.9"

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.bun.db-init
    container_name: prototipo_ingesfot_backend
    env_file:
      - ./backend/.env
    ports:
      - "3000:3000"
    volumes:
      - ./upload:/upload
    entrypoint: ["/usr/local/bin/entrypoint-init.sh"]
    command: ["bun", "run", "--hot", "src/index.ts"]
```

> ⚠️ **Advertencia:**  
> Si continúas usando `docker-compose.yml` antiguo (sin usar `entrypoint-init.sh` como entrypoint), **todo funcionara como antes**.
> 
> Solo ten en cuenta que `DB_NAME` tenga el nombre del `SCHEMA` que vas a usar recomendacio `Tests`.
>
## 🛠️ `Dockerfile.bun.db-init`

```Dockerfile
FROM oven/bun:latest

WORKDIR /app

COPY bun.lock ./  
COPY package.json ./
RUN bun install

COPY . .
COPY ./seed.sql /app/seed.sql

RUN apt-get update && apt-get install -y netcat-openbsd default-mysql-client

COPY entrypoint-init.sh /usr/local/bin/entrypoint-init.sh
RUN chmod +x /usr/local/bin/entrypoint-init.sh

EXPOSE 3000
```

## 🧠 Script de inicialización: `entrypoint-init.sh`

```bash
#!/bin/bash

if [ -f .env ]; then
  echo "📥 Cargando variables desde .env"
  set -o allexport
  source .env
  set +o allexport
fi

SEED_FILE="/app/seed.sql"

echo "⏳ Esperando a que la base de datos esté lista en $DB_HOST:$DB_PORT..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  echo "⏳ Esperando conexión..."
  sleep 2
done

echo "✅ Conexión al puerto MySQL establecida"

echo "🛠️ Verificando o creando esquema '$DB_NAME'..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`;"
echo "✅ Esquema '$DB_NAME' verificado o creado"

echo "🚀 Ejecutando migraciones con drizzle-kit..."
bunx drizzle-kit push --strict --verbose --force

echo "🔍 Verificando si existen datos en 'auth'"
EXISTS=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" -sse "SELECT COUNT(*) FROM auth WHERE id = 1;")

if [ "$EXISTS" -eq 0 ]; then
  echo "📦 Insertando datos desde seed.sql..."
  mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" < "$SEED_FILE"
  echo "✅ Datos insertados"
else
  echo "⚠️  Datos ya existen, omitiendo seed.sql"
fi

# Puedes ejecutar más archivos SQL como vistas y triggers
# mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" < /app/views.sql
# mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" < /app/triggers.sql

echo "✅ Migraciones y seed completados"
echo "🔧 Ejecutando comando del backend con base de datos '$DB_NAME'"
exec bun run dev
```
> ⚠️ **Nota adicional:**  
> Este script no solo puede ejecutar `seed.sql`, sino también otros scripts `.sql` que incluyan:
> **Vistas**,**Procedimientos almacenados**,**Triggers**.
> Solo necesitas copiar los archivos SQL adicionales y modificarlos para que se ejecuten dentro del `entrypoint-init.sh` en el orden deseado.
>

## 🧩 Configuración de Drizzle: `drizzle.config.ts`

```ts
import { defineConfig } from 'drizzle-kit';

const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME
} = process.env;

if (!DB_USER || !DB_PASSWORD || !DB_HOST || !DB_PORT || !DB_NAME) {
  throw new Error("❌ Faltan variables de entorno para construir DATABASE_URL");
}

const DATABASE_URL = `mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema',
  dialect: 'mysql',
  dbCredentials: {
    url: DATABASE_URL,
  },
});

```
> ⚠️ **Nota adicional:**  
> Este script no solo puede ejecutar `seed.sql`, sino también otros scripts `.sql` que incluyan:
> **Vistas**,**Procedimientos almacenados**,**Triggers**.
> Solo necesitas copiar los archivos SQL adicionales y modificarlos para que se ejecuten dentro del `entrypoint-init.sh` en el orden deseado.
>

## 🧩 Configuración de Drizzle: `drizzle.config.ts`

```ts
import { defineConfig } from 'drizzle-kit';

const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME
} = process.env;

if (!DB_USER || !DB_PASSWORD || !DB_HOST || !DB_PORT || !DB_NAME) {
  throw new Error("❌ Faltan variables de entorno para construir DATABASE_URL");
}

const DATABASE_URL = `mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema',
  dialect: 'mysql',
  dbCredentials: {
    url: DATABASE_URL,
  },
});
```

## 💾 Conexión Drizzle ORM (`src/db/client.ts`)

```ts
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME,
} = process.env;

if (!DB_USER || !DB_PASSWORD || !DB_HOST || !DB_PORT || !DB_NAME) {
  throw new Error("❌ Faltan variables de entorno para construir DATABASE_URL");
}

const DATABASE_URL = `mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;


export const db = drizzle(DATABASE_URL);
```

## 💾 Conexión Drizzle ORM (`src/db/client.ts`)

```ts
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME,
} = process.env;

if (!DB_USER || !DB_PASSWORD || !DB_HOST || !DB_PORT || !DB_NAME) {
  throw new Error("❌ Faltan variables de entorno para construir DATABASE_URL");
}

const DATABASE_URL = `mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

export const db = drizzle(DATABASE_URL);
```
