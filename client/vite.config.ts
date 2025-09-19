import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// We no longer need to import tailwindcss here

export default defineConfig({
  plugins: [react()],
})