FROM oven/bun:1

WORKDIR /app

COPY ./dist ./dist

RUN bun add serve

EXPOSE 5173

CMD ["serve", "-l", "5173", "-s", "./dist"]
