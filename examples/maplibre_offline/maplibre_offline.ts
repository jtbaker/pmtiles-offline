import { PMTiles, Protocol } from "pmtiles";
import { IndexedDBSource } from "../../src/index";
import maplibregl from "maplibre-gl";

const protocol = new Protocol();

maplibregl.addProtocol("pmtiles", protocol.tile);

const PMTILES_URL = "https://pmtiles.io/protomaps(vector)ODbL_firenze.pmtiles";

const load = async () => {
	const serverResponse = await fetch(PMTILES_URL);
	const buffer = await serverResponse.arrayBuffer();
	const blob = new Blob([buffer], { type: "application/octet-stream" });
	const dbname = "offline-pmtiles";
	const tablename = "offline-pmtiles";
	const filename = "protomaps(vector)ODbL_firenze.pmtiles";
	const db = await IndexedDBSource.openDb(dbname, tablename);

	const offlineSource = new IndexedDBSource(db, filename, tablename);

	// Wait for the source to be written to IndexedDB before using it
	await offlineSource.setSource({ filename, blob });

	const p = new PMTiles(offlineSource);

	protocol.add(p);

	const tile1 = await p.getZxy(0, 0, 0);
	console.log({ tile1 });

	const map = new maplibregl.Map({
		container: "map",
		hash: true,
		style: {
			version: 8,
			sources: {
				example_source: {
					type: "vector",
					url: `pmtiles://${filename}`,
					attribution:
						'© <a href="https://openstreetmap.org">OpenStreetMap</a>',
				},
			},
			layers: [
				{
					id: "water",
					source: "example_source",
					"source-layer": "water",
					filter: ["==", ["geometry-type"], "Polygon"],
					type: "fill",
					paint: {
						"fill-color": "#80b1d3",
					},
				},
				{
					id: "buildings",
					source: "example_source",
					"source-layer": "buildings",
					type: "fill",
					paint: {
						"fill-color": "#d9d9d9",
					},
				},
				{
					id: "roads",
					source: "example_source",
					"source-layer": "roads",
					type: "line",
					paint: {
						"line-color": "#fc8d62",
					},
				},
				{
					id: "pois",
					source: "example_source",
					"source-layer": "pois",
					type: "circle",
					paint: {
						"circle-color": "#ffffb3",
					},
				},
			],
		},
	});

	map.showTileBoundaries = true;
};

load();
