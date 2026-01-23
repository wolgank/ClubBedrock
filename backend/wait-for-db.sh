#!/bin/bash

#echo "Esperando a que la base de datos esté lista en $1:$2..."
#until nc -z "$1" "$2"; do
#  echo "Esperando a que la base de datos esté disponible en $1:$2..."
#  sleep 2
#done

#echo "✅ Base de datos lista"

# LOG de prueba
#echo "🚀 Ejecutando: bunx drizzle-kit generate"
#bunx drizzle-kit generate
#echo "🚀 Ejecutando: bunx drizzle-kit migrate"
#bunx drizzle-kit migrate
echo "🚀 Ejecutando: bunx drizzle-kit push"
##bunx drizzle-kit push  --strict --verbose --force


echo "✅ Migraciones completadas"

echo "🔧 Ejecutando comando del backend: ${@:3}"
exec "${@:3}"
