# Usar la imagen base de Bun
FROM oven/bun:latest
# Crear y configurar el directorio de trabajo
WORKDIR /app
# Copiar solo los archivos de configuración de dependencias primero (para aprovechar la caché)
COPY bun.lock ./
COPY package.json ./
# Instalar dependencias usando Bun
RUN bun install
# Copiar el resto de los archivos del proyecto (esto solo ocurrirá si hay cambios en los archivos del código)
COPY . .
# Instalar wait-for-it o dockerize (dependiendo de la herramienta que prefieras usar)
RUN apt-get update && apt-get install -y netcat-openbsd
# Exponer el puerto en el que estará corriendo el servidor
EXPOSE 3000
# Copiar el script de espera y el comando de inicio
COPY wait-for-db.sh /usr/local/bin/wait-for-db.sh
# Hacer el script ejecutable
RUN chmod +x /usr/local/bin/wait-for-db.sh
# Comando para iniciar el servidor y esperar la base de datos
CMD ["/usr/local/bin/wait-for-db.sh", "prototipo_ingesfot_mysql", "3306", "bun", "run", "dev"]
