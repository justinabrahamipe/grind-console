const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// react-native-android-widget draws the widget to a PNG and shows it in an ImageView
// with scaleType="matrix" — the bitmap is blitted 1:1 at the top-left and is never
// scaled. Its size comes from the launcher's reported cell size at the time of the
// last render, so while a resize drag is in flight (and on launchers that under-report
// the cell size) the bitmap is smaller than the view, and the root FrameLayout that
// shows through is transparent — the card looks like it only fills part of the frame.
//
// App-module resources win over library-module resources of the same name, so these
// files replace the library's rn_widget.xml with an identical layout that paints the
// root in the widget's own card colour. Any uncovered area then reads as the card
// instead of a hole. Keep the ids in sync with the library layout — RNWidget.java
// looks them up by name.
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
        android:scaleType="matrix"
        android:visibility="${night ? "gone" : "visible"}" />

    <ImageView
        android:id="@+id/rn_widget_image_dark"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="@android:color/transparent"
        android:scaleType="matrix"
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
