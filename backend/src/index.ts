import app from "./app";
import { config } from "dotenv";
config();
Bun.serve({
  idleTimeout: 30, //para que aguante peticiones laaargas
    port: 3000, // defaults to $BUN_PORT, $PORT, $NODE_PORT otherwise 3000
    hostname: "0.0.0.0", // defaults to "0.0.0.0"
    fetch: app.fetch
  });
//console.log("Server running");
////console.log("Token length:", process.env.AWS_SESSION_TOKEN?.length);