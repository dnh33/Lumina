import type { GenreWorld } from "../../lib/genreWorld.js";
import { TimelineScrubber } from "./TimelineScrubber.js";
import type { CatalogItem } from "../../lib/types.js";

interface Props {
  modules: GenreWorld["modules"];
  items: CatalogItem[];
}

/**
 * Single parameterized module host. Renders the genre's enabled modules
 * (per genreWorld.modules) over the experience's items. One component,
 * N configs — NOT N page variants (design §13.8).
 */
export function GenreModules({ modules, items }: Props) {
  return (
    <>
      {modules.includes("timeline") && <TimelineScrubber items={items} />}
    </>
  );
}
