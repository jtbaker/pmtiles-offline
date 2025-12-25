import { describe, test } from "node:test";
import "fake-indexeddb/auto";

import assert from "node:assert";
import { PMTiles } from "pmtiles";

import { IndexedDBSource } from "../src/index";

describe("offline pmtiles", () => {
	test("can load tile from IndexedDB", async () => {
		const tableName = "offline-pmtiles";
		const dbname = "offline-pmtiles";

		const db = await IndexedDBSource.openDb(dbname, tableName);

		const filename = "protomaps(vector)ODbL_firenze.pmtiles";

		const serverResponse = await fetch(
			"https://pmtiles.io/protomaps(vector)ODbL_firenze.pmtiles",
		);
		const buffer = await serverResponse.arrayBuffer();
		const blob = new Blob([buffer], {
			type: serverResponse.headers.get("Content-Type") as string,
		});
		const offlineSource = new IndexedDBSource(db, filename, tableName);

		// Wait for the source to be written to IndexedDB before using it
		await offlineSource.setSource({ filename, blob });

		const p = new PMTiles(offlineSource);

		const tile = await p.getZxy(0, 0, 0);

		assert.notEqual(tile, undefined);
	});
});
