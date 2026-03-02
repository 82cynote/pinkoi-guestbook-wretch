import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repoName = 'pinkoi-guestbook-wretch';

export default defineConfig(({ command }) => ({
  server: { port: 3000 },
  plugins: [react()],
  // GitHub Pages 專案頁：網址會是 https://<user>.github.io/<repoName>/
  // build 時套用 /<repoName>/，dev 時維持根路徑
  base: command === 'build' ? `/${repoName}/` : '/',
}));
