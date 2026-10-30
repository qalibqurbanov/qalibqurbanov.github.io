import { useEffect, useState } from "react";

import { STYLES } from "@/themes";
import { useStyle } from "@/themes/shared/style/context";

import { SceneHost } from "./SceneHost";
import type { SceneFactory } from "./types";

/** The active style's living background, if it has one. Its code is fetched only when the style is
 * chosen, and the scene is torn down when another style takes over. */
export function ThemeScene() {
  const { style } = useStyle();
  const [loaded, setLoaded] = useState<{ id: string; factory: SceneFactory } | null>(null);

  useEffect(() => {
    let alive = true;
    const load = STYLES.find((item) => item.id === style)?.scene;
    if (!load) return;
    void load().then((module) => {
      if (alive) setLoaded({ id: style, factory: module.createScene });
    });
    return () => {
      alive = false;
    };
  }, [style]);

  if (!loaded || loaded.id !== style) return null;
  return <SceneHost key={style} factory={loaded.factory} />;
}
