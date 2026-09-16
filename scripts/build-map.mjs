import fs from "node:fs/promises";
import { geoMercator, geoPath, geoCentroid, geoArea } from "d3-geo";
const data = JSON.parse(
  await fs.readFile("work/vietnam-source.geojson", "utf8"),
);
for (const f of data.features) {
  if (geoArea(f) > 2 * Math.PI) {
    if (f.geometry.type === "Polygon")
      f.geometry.coordinates = f.geometry.coordinates.map((r) => r.reverse());
    else
      f.geometry.coordinates = f.geometry.coordinates.map((p) =>
        p.map((r) => r.reverse()),
      );
  }
}
const projection = geoMercator().fitExtent(
  [
    [75, 25],
    [455, 590],
  ],
  data,
);
const draw = geoPath(projection);
const cities = {
  "Hà Nội": [105.8542, 21.0285],
  "Đà Nẵng": [108.2022, 16.0544],
  "Ho Chi Minh": [106.6297, 10.8231],
};
const out = {
  width: 540,
  height: 620,
  source:
    "geoBoundaries VNM ADM1 63759600, Public Domain; coastline geometry only, not current provincial boundaries",
  paths: data.features.map((f) => draw(f)),
  locations: data.features.map((f) => {
    const name = f.properties.shapeName.trim();
    const coordinates = cities[name] || geoCentroid(f);
    const [x, y] = projection(coordinates);
    return { name, longitude: coordinates[0], latitude: coordinates[1], x, y };
  }),
};
await fs.writeFile("src/data/vietnam-map.json", JSON.stringify(out));
console.log(
  "Projected map built: " +
    out.paths.length +
    " shapes; " +
    out.locations.length +
    " location anchors",
);
