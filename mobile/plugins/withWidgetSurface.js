const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// react-native-android-widget draws the widget to a PNG in a hidden JS surface and
// shows it in a plain ImageView — there's no live native layout the OS can reflow as
// you drag. The bitmap reflects the launcher's cell size as of the last completed
// render, so while a resize is in flight the frame has already grown but the bitmap
// hasn't been redrawn yet.
//
// The library's default scaleType="matrix" blits that stale bitmap 1:1 at the
// top-left, so the uncovered remainder of the frame shows the root FrameLayout's own
// background with no widget content in it at all. We use scaleType="fitXY" instead,
// which stretches the same stale bitmap to fill the whole frame — a blurry-but-complete
// preview instead of a content-free gap. Once the fresh, correctly-sized bitmap lands
// the view size matches the bitmap size again, so fitXY and matrix render identically —
// this only changes what's visible during the brief window mid-resize.
//
// The background colour below is the fallback for the sliver of time before the very
// first bitmap has rendered at all (e.g. right after the widget is added).
//
// App-module resources win over library-module resources of the same name, so these
// files replace the library's rn_widget.xml with an identical layout plus the surface
// colour and scaleType change. Keep the ids in sync with the library layout —
// RNWidget.java looks them up by name.
const SURFACE = { light: "#F8F6F1", dark: "#1E1B17" }; // theme.card, mobile/src/theme.ts
const CORNER_RADIUS_DP = 20; // matches the root FlexWidget borderRadius in the widgets

const surfaceDrawable = (color) => `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="${color}" />
    <corners android:radius="${CORNER_RADIUS_DP}dp" />
</shape>
`;

const widgetLayout = (night) => `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@android:id/background"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/rn_widget_surface">

    <ImageView
        android:id="@+id/rn_widget_image_light"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="@android:color/transparent"
        android:scaleType="fitXY"
        android:visibility="${night ? "gone" : "visible"}" />

    <ImageView
        android:id="@+id/rn_widget_image_dark"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="@android:color/transparent"
        android:scaleType="fitXY"
        android:visibility="${night ? "visible" : "gone"}" />

    <FrameLayout
        android:id="@+id/rn_widget_clickable_container"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

    <FrameLayout
        android:id="@+id/rn_widget_collection_container"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</FrameLayout>
`;

function write(resDir, dir, name, contents) {
  const target = path.join(resDir, dir);
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(path.join(target, name), contents);
}

module.exports = function withWidgetSurface(config) {
  return withDangerousMod(config, [
    "android",
    (dangerousConfig) => {
      const resDir = path.join(
        dangerousConfig.modRequest.platformProjectRoot,
        "app/src/main/res"
      );
      write(resDir, "drawable", "rn_widget_surface.xml", surfaceDrawable(SURFACE.light));
      write(resDir, "drawable-night", "rn_widget_surface.xml", surfaceDrawable(SURFACE.dark));
      write(resDir, "layout", "rn_widget.xml", widgetLayout(false));
      write(resDir, "layout-night", "rn_widget.xml", widgetLayout(true));
      return dangerousConfig;
    },
  ]);
};
