import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 生产构建时的公共基础路径，部署在根路径时使用 '/'
  base: '/',
  server: {
    port: 3200,
    proxy: {
      '/api': {
        // 避免 Windows 下 localhost 双栈解析触发 Vite 代理 ENOBUFS
        target: 'http://[::1]:3201',
        changeOrigin: true,
      },
    },
  },
  // 生产构建优化
  build: {
    // 输出目录
    outDir: 'dist',
    // 开启 CSS 代码分割
    cssCodeSplit: true,
    // 减小打包体积
    target: 'es2020',
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // 手动分包，将大型库独立打包
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          echarts: ['echarts'],
        },
      },
    },
  },
});
