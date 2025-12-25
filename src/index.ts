import type { Source, RangeResponse } from "pmtiles";
/**
 * Implements offline source for PMTiles, to enable usage in PWAs
 * by saving PMTiles files as Blobs in IndexedDB
 */

export interface OfflineSource extends Source {
	setSource(source: PMTilesIndexedDBRow): Promise<void>;
}

export interface PMTilesIndexedDBRow {
	filename: string;
	blob: Blob;
}

export class IndexedDBSource implements OfflineSource {
	public db: IDBDatabase;
	public filename: string;
	public tablename: string;
	constructor(
		db: IDBDatabase,
		filename: string,
		tablename = "offline-pmtiles",
	) {
		this.filename = filename;
		this.db = db;
		this.tablename = tablename;
	}

	public static openDb(
		dbname: string,
		tablename: string,
	): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(dbname, 1);

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				// Create object store with keyPath "filename" if it doesn't exist
				if (!db.objectStoreNames.contains(tablename)) {
					db.createObjectStore(tablename, { keyPath: "filename" });
				}
			};

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onerror = () => {
				reject(request.error);
			};
		});
	}

	public getFromStore<T>(
		store: IDBObjectStore,
		key: IDBValidKey,
	): Promise<T | undefined> {
		return new Promise((resolve, reject) => {
			const request = store.get(key);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => {
				console.info(
					`error retrieving ${key} from ${this.tablename} in IndexedDB.`,
					request.error,
				);
				resolve(undefined);
			};
		});
	}

	async getAndSliceBlob(start: number, end: number): Promise<Blob | undefined> {
		const tx = this.db.transaction(this.tablename, "readonly");
		const store = tx.objectStore(this.tablename);

		return new Promise<Blob | undefined>((resolve, reject) => {
			const request = store.get(this.filename);

			request.onsuccess = () => {
				const res = request.result as PMTilesIndexedDBRow | undefined;
				if (res?.blob) {
					resolve(res.blob.slice(start, end));
				} else {
					resolve(undefined);
				}
			};

			request.onerror = () => {
				console.error("Error getting blob from IndexedDB:", request.error);
				resolve(undefined);
			};

			tx.onerror = () => {
				console.error("Transaction error:", tx.error);
				reject(tx.error);
			};
		});
	}

	async setSource(source: PMTilesIndexedDBRow): Promise<void> {
		const tx = this.db.transaction(this.tablename, "readwrite");
		const store = tx.objectStore(this.tablename);
		return await new Promise((resolve, reject) => {
			const request = store.put(source);
			request.onerror = () => reject(request.error);
			// Wait for the transaction to complete, not just the request
			tx.oncomplete = () => resolve(undefined);
			tx.onerror = () => reject(tx.error);
		});
	}

	async getBytes(
		offset: number,
		length: number,
		signal?: AbortSignal,
		etag?: string,
	): Promise<RangeResponse> {
		const sliced = await this.getAndSliceBlob(offset, offset + length);
		const buffer = await sliced?.arrayBuffer();
		if (buffer !== undefined) {
			return {
				data: buffer,
			};
		}

		return { data: new ArrayBuffer() };
	}

	getKey(): string {
		return `${this.filename}`;
	}
}
