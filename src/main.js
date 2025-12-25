import { createApp } from 'vue';
import 'ant-design-vue/dist/reset.css';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './assets/index.less';
import './assets/cesium/index.less';
import App from './App.vue';
import { setupStore } from './store';
import { router, setupRouter } from './router';
import { setupRouterGuard } from './router/routes/guard';
import { setupGlobDirectives } from './directives';
async function bootstrap() {
  const app = createApp(App);

  // Configure store
  // 配置 store
  setupStore(app);

  // Configure routing
  // 配置路由
  setupRouter(app);

  setupRouterGuard(router);

  setupGlobDirectives(app);

  app.mount('#app');
}

bootstrap();
