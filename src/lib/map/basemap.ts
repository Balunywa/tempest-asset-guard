import type { StyleSpecification } from "maplibre-gl";

/**
 * Basemap adapter.
 *
 * The operational map renders on a real tiled basemap (true coastlines,
 * country/state borders, cities). The tile provider is swappable: when an
 * Azure Maps key is present we use Azure Maps render tiles, otherwise we fall
 * back to the keyless CARTO dark basemap so the console works out of the box.
 */
export type BasemapId = "dark" | "satellite";

const AZURE_KEY = import.meta.env["VITE_AZURE_MAPS_KEY"] as string | undefined;

const ATTRIB_CARTO = '&copy; OpenStreetMap contributors &copy; CARTO';
const ATTRIB_ESRI = "Imagery &copy; Esri, Maxar, Earthstar Geographics";
const ATTRIB_AZURE = "&copy; Microsoft, &copy; TomTom";

function rasterStyle(tiles: string[], attribution: string, background: string): StyleSpecification {
  return {
    version: 8,
    glyphs: "https://basemaps.cartocdn.com/gl/fonts/{fontstack}/{range}.pbf",
    sources: {
      basemap: {
        type: "raster",
        tiles,
        tileSize: 256,
        maxzoom: 19,
        attribution,
      },
    },
    layers: [
      { id: "bg", type: "background", paint: { "background-color": background } },
      { id: "basemap", type: "raster", source: "basemap", paint: { "raster-opacity": 1 } },
    ],
  };
}

export function basemapStyle(id: BasemapId): StyleSpecification {
  if (id === "satellite") {
    return rasterStyle(
      [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      ATTRIB_ESRI,
      "#0a1622",
    );
  }

  if (AZURE_KEY) {
    return rasterStyle(
      [
        `https://atlas.microsoft.com/map/tile?api-version=2024-04-01&tilesetId=microsoft.base.darkgrey&zoom={z}&x={x}&y={y}&tileSize=256&subscription-key=${AZURE_KEY}`,
      ],
      ATTRIB_AZURE,
      "#08111c",
    );
  }

  return rasterStyle(
    [
      "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
    ],
    ATTRIB_CARTO,
    "#08111c",
  );
}

export const basemapProviderLabel = AZURE_KEY ? "Azure Maps" : "CARTO / OpenStreetMap";
