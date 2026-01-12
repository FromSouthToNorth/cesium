import {
  PinBuilder,
  Color as CesiumColor,
  VerticalOrigin,
  defined,
} from 'cesium';

const CLUSTER_CONFIG = {
  PIXEL_RANGE: 15,
  MINIMUM_CLUSTER_SIZE: 3,
  ENABLED: true,
  COUNT_THRESHOLDS: [
    { threshold: 100, color: CesiumColor.RED },
    { threshold: 60, color: CesiumColor.YELLOW },
    { threshold: 0, color: CesiumColor.GREEN }
  ]
}

const PIN_SIZES = [48, 32];

function getClusterImage(pinBuilder, count) {
  for (const config of CLUSTER_CONFIG.COUNT_THRESHOLDS) {
    if (count >= config.threshold) {
      return pinBuilder.fromText(count, config.color, PIN_SIZES[1]).toDataURL();
    }
  }
  return pinBuilder.fromText(count, CesiumColor.GREEN, PIN_SIZES[1]).toDataURL();
}

export function setupClustering(e) {
  const pinBuilder = new PinBuilder();
  e.clustering.enabled = CLUSTER_CONFIG.ENABLED;
  e.clustering.pixelRange = CLUSTER_CONFIG.PIXEL_RANGE;
  e.clustering.minimumClusterSize = CLUSTER_CONFIG.MINIMUM_CLUSTER_SIZE;

  let removeListener;
  const singleDigitPins = new Array(8);
  for (let i = 0; i < singleDigitPins.length; ++i) {
    singleDigitPins[i] = pinBuilder
      .fromText(`${i + 2} `, CesiumColor.VIOLET, PIN_SIZES[0])
      .toDataURL();
  }

  function customStyle() {
    if (defined(removeListener)) {
      removeListener();
      removeListener = undefined;
    } else {
      removeListener = e.clustering.clusterEvent.addEventListener(
        function (clusteredEntities, cluster) {
          if (!cluster || !clusteredEntities) return;

          cluster.label.show = false;
          cluster.billboard.show = true;
          cluster.billboard.id = cluster.label.id;
          cluster.billboard.verticalOrigin = VerticalOrigin.BOTTOM;

          const count = clusteredEntities.length;
          const image = getClusterImage(pinBuilder, count);
          cluster.billboard.image = image;
        },
      );
    }

    // force a re-cluster with the new styling
    const pixelRange = e.clustering.pixelRange;
    e.clustering.pixelRange = 0;
    e.clustering.pixelRange = pixelRange;
  }

  // start with custom style
  customStyle();
}
