import type { Source, RangeResponse } from "pmtiles";
/**
 * Implements offline source for PMTiles, to enable usage in PWAs
 * by saving PMTiles files as Blobs in IndexedDB
 */

export interface OfflineSource extends Source {
	setSource(source: PMTilesBlob): Promise<void>;
	exists(): Promise<boolean>;
}

export interface PMTilesBlob {
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
		const startTime = performance.now();
		const byteRange = end - start;
		console.debug(
			`[IndexedDB] Starting retrieval: range=${start}-${end} (${byteRange} bytes)`,
		);

		const tx = this.db.transaction(this.tablename, "readonly");
		const store = tx.objectStore(this.tablename);

		return new Promise<Blob | undefined>((resolve, reject) => {
			const request = store.get(this.filename);

			request.onsuccess = () => {
				const res = request.result as PMTilesBlob | undefined;
				if (res?.blob) {
					const slicedBlob = res.blob.slice(start, end);
					const elapsed = performance.now() - startTime;
					console.debug(
						`[IndexedDB] Retrieved and sliced blob: range=${start}-${end} (${byteRange} bytes) in ${elapsed.toFixed(2)}ms`,
					);
					resolve(slicedBlob);
				} else {
					const elapsed = performance.now() - startTime;
					console.debug(
						`[IndexedDB] No blob found: range=${start}-${end} in ${elapsed.toFixed(2)}ms`,
					);
					resolve(undefined);
				}
			};

			request.onerror = () => {
				const elapsed = performance.now() - startTime;
				console.error(
					`[IndexedDB] Error getting blob from IndexedDB after ${elapsed.toFixed(2)}ms:`,
					request.error,
				);
				resolve(undefined);
			};

			tx.onerror = () => {
				const elapsed = performance.now() - startTime;
				console.error(
					`[IndexedDB] Transaction error after ${elapsed.toFixed(2)}ms:`,
					tx.error,
				);
				reject(tx.error);
			};
		});
	}

	async exists(): Promise<boolean> {
		const tx = this.db.transaction(this.tablename, "readonly");
		const store = tx.objectStore(this.tablename);
		return new Promise((resolve, reject) => {
			const request = store.get(this.filename);
			request.onsuccess = () => {
				const res = request.result as PMTilesBlob | undefined;
				resolve(res?.blob !== undefined);
			};
			request.onerror = () => {
				console.error(
					`Error checking if ${this.filename} exists in IndexedDB:`,
					request.error,
				);
				resolve(false);
			};
		});
	}

	async setSource(source: PMTilesBlob): Promise<void> {
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
		signal?.throwIfAborted();
		const sliced = await this.getAndSliceBlob(offset, offset + length);
		return { data: (await sliced?.arrayBuffer()) ?? new ArrayBuffer() };
	}

	async deleteFile(): Promise<void> {
		const tx = this.db.transaction(this.tablename, "readwrite");
		const store = tx.objectStore(this.tablename);
		return new Promise((resolve, reject) => {
			const request = store.delete(this.filename);
			request.onerror = () => reject(request.error);
			tx.oncomplete = () => resolve(undefined);
			tx.onerror = () => reject(tx.error);
		});
	}

	async deleteDatabase(): Promise<void> {
		const dbname = this.db.name;
		return new Promise((resolve, reject) => {
			const request = indexedDB.deleteDatabase(dbname);
			request.onsuccess = () => resolve(undefined);
			request.onerror = () => reject(request.error);
			request.onblocked = () => {
				console.warn(
					`Deletion of database ${dbname} is blocked. Close all connections to proceed.`,
				);
			};
		});
	}

	getKey(): string {
		return `${this.filename}`;
	}
}
