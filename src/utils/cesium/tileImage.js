import {
  UrlTemplateImageryProvider,
  WebMercatorTilingScheme,
  Credit,
  CesiumTerrainProvider,
  Camera,
  Rectangle
} from 'cesium'

const token = '21cb7300e83d3e5640326c7ccf25226e';
const tdtUrl = 'https://t{s}.tianditu.gov.cn/';
const subdomains = ['0', '1', '2', '3', '4', '5', '6', '7'];

// 创建天地图图层的工厂函数
function createTiandituImageryProvider(layer, style = 'default', customOptions = {}) {
  return new UrlTemplateImageryProvider({
    url: `${tdtUrl}${layer}_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=${style}&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${token}`,
    subdomains,
    tilingScheme: new WebMercatorTilingScheme(),
    credit: new Credit(customOptions.creditText || '天地图'),
    ...customOptions
  });
}

// 创建地形服务URL数组
function createTerrainUrls() {
  return subdomains.map(subdomain =>
    `${tdtUrl.replace('{s}', subdomain)}mapservice/swdx?T=elv_c&tk=${token}`
  );
}

export function setUrlTemplateImageryProvider(viewer) {
  // 添加天地图影像图层
  const imageryLayers = [
    createTiandituImageryProvider('img', 'default', { maximumLevel: 18 }),
    createTiandituImageryProvider('cia'),
    createTiandituImageryProvider('ibo', 'default', { creditText: '天地图 国界' })
  ];

  imageryLayers.forEach(layer => {
    viewer.imageryLayers.addImageryProvider(layer);
  });

  // 设置地形提供者
  const terrainUrls = createTerrainUrls();
  viewer.terrainProvider = CesiumTerrainProvider.fromUrl({ url: terrainUrls });
  flyToCine(viewer)
}

export function flyToCine(viewer, destination) {
  viewer.camera.flyTo({
    destination,
    duration: 3.0,               // 飞行时间（秒），可选，越大越慢
    maximumHeight: 8000000,      // 可选：飞行过程中最高高度（米），防止飞太高
    pitchAdjustHeight: 2000000,  // 可选：接近终点时调整俯仰高度
    complete: function () {
      console.log('已定位到中国');
    }
  });
}
