#!/bin/bash

# Cargar variables del entorno si existe .env
if [ -f .env ]; then
  echo "📥 Cargando variables desde .env"
  set -o allexport
  source .env
  set +o allexport
fi

SEED_FILE="/app/seed.sql"
EVENT_FILE="/app/eventosProgramados.sql"

echo "⏳ Esperando a que la base de datos esté lista en $DB_HOST:$DB_PORT..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  echo "⏳ Esperando conexión..."
  sleep 2
done

echo "✅ Conexión al puerto MySQL establecida"

# Crear esquema si no existe
echo "🛠️ Verificando o creando esquema '$DB_NAME'..."
mysql --default-character-set=utf8mb4 -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e \
"CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
echo "✅ Esquema '$DB_NAME' verificado o creado"

# Ejecutar migraciones con drizzle-kit
echo "🚀 Ejecutando migraciones con drizzle-kit..."
bunx drizzle-kit push --strict --verbose --force

# Verificar si ya existen datos en 'auth'
echo "🔍 Verificando si existen datos en 'auth'"
EXISTS=$(mysql --default-character-set=utf8mb4 -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" -sse \
"SELECT COUNT(*) FROM auth WHERE id = 1;" || echo 0)

if [ "$EXISTS" -eq 0 ]; then
  echo "📦 Insertando datos desde seed.sql..."
  mysql --default-character-set=utf8mb4 -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" < "$SEED_FILE"
  echo "✅ Datos insertados"
else
  echo "⚠️  Datos ya existen, omitiendo seed.sql"
fi

# Ejecutar eventos programados si el archivo existe
if [ -f "$EVENT_FILE" ]; then
  echo "📆 Ejecutando eventosProgramados.sql..."
  mysql --default-character-set=utf8mb4 -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" < "$EVENT_FILE"
  echo "✅ Eventos ejecutados correctamente"
else
  echo "⚠️  Archivo eventosProgramados.sql no encontrado, omitiendo..."
fi

echo "✅ Migraciones, seed y eventos completados"

# Ejecutar la aplicación backend
echo "🔧 Ejecutando comando del backend con base de datos '$DB_NAME'"
exec bun run dev
