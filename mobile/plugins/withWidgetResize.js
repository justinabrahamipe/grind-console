const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// react-native-android-widget's own config plugin (node_modules/react-native-android-widget/app.plugin.js)
// writes android:minWidth/minHeight into each widget's appwidget-provider XML but has
// no option to set android:minResizeWidth/minResizeHeight. Android then defaults an
// unset minResizeWidth to minWidth itself, so the resize handles can never drag the
// widget smaller than the size it was first placed at. This runs after that plugin
// (must be listed after "react-native-android-widget" in app.json) and patches the
// generated XML to allow shrinking down to ~2 grid cells (cell size ~= 70dp*n - 30dp).
const MIN_RESIZE_WIDTH_DP = {
  taskwidget: 110,
  logwidget: 110,
};

module.exports = function withWidgetResize(config) {
  return withDangerousMod(config, [
    "android",
    (dangerousConfig) => {
      const xmlDir = path.join(dangerousConfig.modRequest.platformProjectRoot, "app/src/main/res/xml");
      for (const [name, width] of Object.entries(MIN_RESIZE_WIDTH_DP)) {
        const xmlPath = path.join(xmlDir, `widgetprovider_${name}.xml`);
        if (!fs.existsSync(xmlPath)) continue;
        const contents = fs.readFileSync(xmlPath, "utf8");
        if (contents.includes("minResizeWidth")) continue;
        const patched = contents.replace(
          /(android:minHeight="[^"]*")/,
          `$1\n    android:minResizeWidth="${width}dp"`
        );
        fs.writeFileSync(xmlPath, patched);
      }
      return dangerousConfig;
    },
  ]);
};
