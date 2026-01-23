import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import dotenv from 'dotenv';
dotenv.config();
//console.log('Backend URL:', process.env.VITE_BACKEND_URL); // para verificar
export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true, routesDirectory: './src/shared/routes' }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@server': path.resolve(__dirname, '../backend'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL, // El backend debe estar corriendo en este puerto
        changeOrigin: true, // Cambiar la dirección de origen de las solicitudes
        secure: false, // Si estás usando HTTP en lugar de HTTPS, puedes configurarlo a 'false'
        //rewrite: (path) => path.replace(/^\/api/, ''), // Opcional: puedes reescribir la ruta si es necesario
      },
    },
  },
});