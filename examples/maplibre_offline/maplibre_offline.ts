import { PMTiles, Protocol } from "pmtiles";
import { IndexedDBSource } from "../../src/index";
import maplibregl from "maplibre-gl";
import { layers, namedTheme } from "protomaps-themes-base";

const protocol = new Protocol();

maplibregl.addProtocol("pmtiles", protocol.tile);

// const PMTILES_URL = "https://pmtiles.io/protomaps(vector)ODbL_firenze.pmtiles";
const filename = "travis-county.pmtiles";
const PMTILES_URL = `${window.location.origin}/${filename}`;

const load = async () => {
	try {
		console.log("Starting load...");
		const dbname = "offline-pmtiles";
		const tablename = "tiles";
		const filename = "travis-county.pmtiles";
		const db = await IndexedDBSource.openDb(dbname, tablename);
		console.log("Database opened");

		const offlineSource = new IndexedDBSource(db, filename, tablename);

		// Only fetch and store the file if it doesn't already exist in IndexedDB
		const sourceExists = await offlineSource.exists();
		if (!sourceExists) {
			console.log(`Fetching ${filename} from server...`);
			const serverResponse = await fetch(PMTILES_URL);
			const buffer = await serverResponse.arrayBuffer();
			const blob = new Blob([buffer], { type: "application/octet-stream" });

			// Wait for the source to be written to IndexedDB before using it
			await offlineSource.setSource({ filename, blob });
			console.log(`${filename} stored in IndexedDB`);
		} else {
			console.log(
				`${filename} already exists in IndexedDB, using cached version`,
			);
		}

		const p = new PMTiles(offlineSource);

		protocol.add(p);

		const tile1 = await p.getZxy(0, 0, 0);
		console.log({ tile1 });

		// Create the base style with protomaps layers
		const protomapsLayers = layers("protomaps", namedTheme("light"), {
			labelsOnly: false,
			lang: "en",
		});

		const map = new maplibregl.Map({
			container: "map",
			hash: true,
			style: {
				version: 8,
				sources: {
					protomaps: {
						type: "vector",
						url: `pmtiles://${filename}`,
						attribution:
							'© <a href="https://openstreetmap.org">OpenStreetMap</a>',
					},
				},
				layers: protomapsLayers,
				glyphs:
					"https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
			},
		});

		map.showTileBoundaries = true;
	} catch (error) {
		console.error("Error in load():", error);
	}
};

load();
