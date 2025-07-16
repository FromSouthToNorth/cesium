import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';

export default defineConfig({
  plugins: [cesium()],
  server: {
    fs: {
      allow: ['.', './node_modules/cesium/Build/Cesium']
    }
  }
});
