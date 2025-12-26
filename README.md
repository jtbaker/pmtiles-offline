# pmtiles-offline

Enable offline usage of PMTiles in Progressive Web Apps and mapping applications by storing PMTiles archives in IndexedDB.

## About PMTiles

[PMTiles](https://docs.protomaps.com/pmtiles/) is a single-file archive format for pyramids of tiled map data. It enables efficient map distribution on storage platforms like S3 with minimal cost and maintenance. PMTiles uses HTTP Range Requests to fetch only the necessary tiles on-demand, and supports various data types including vector tiles, remote sensing data, and imagery.

This library provides an offline-capable source implementation that stores PMTiles files as Blobs in IndexedDB, enabling maps to work without network connectivity.

## Installation

```bash
npm install pmtiles-offline
```

## Usage

### Basic Usage

```typescript
import { PMTiles } from "pmtiles";
import { IndexedDBSource } from "pmtiles-offline";

// Open or create an IndexedDB database
const dbname = "offline-pmtiles";
const tablename = "offline-pmtiles";
const db = await IndexedDBSource.openDb(dbname, tablename);

// Fetch a PMTiles file from a server (one-time download)
const filename = "protomaps(vector)ODbL_firenze.pmtiles";
const response = await fetch("https://pmtiles.io/protomaps(vector)ODbL_firenze.pmtiles");
const buffer = await response.arrayBuffer();
const blob = new Blob([buffer], { type: "application/octet-stream" });

// Create the offline source and store the PMTiles file
const offlineSource = new IndexedDBSource(db, filename, tablename);
await offlineSource.setSource({ filename, blob });

// Use the offline source with PMTiles
const pmtiles = new PMTiles(offlineSource);
const tile = await pmtiles.getZxy(0, 0, 0);
```

### MapLibre GL Integration

```typescript
import { PMTiles, Protocol } from "pmtiles";
import { IndexedDBSource } from "pmtiles-offline";
import maplibregl from "maplibre-gl";

// Setup PMTiles protocol
const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

// Download and store PMTiles file (same as basic usage)
const dbname = "offline-pmtiles";
const tablename = "offline-pmtiles";
const filename = "protomaps(vector)ODbL_firenze.pmtiles";
const db = await IndexedDBSource.openDb(dbname, tablename);

const response = await fetch("https://pmtiles.io/protomaps(vector)ODbL_firenze.pmtiles");
const buffer = await response.arrayBuffer();
const blob = new Blob([buffer], { type: "application/octet-stream" });

const offlineSource = new IndexedDBSource(db, filename, tablename);
await offlineSource.setSource({ filename, blob });

// Register the PMTiles source with the protocol
const pmtiles = new PMTiles(offlineSource);
protocol.add(pmtiles);

// Create a map that uses the offline PMTiles source
const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {
      offline_map: {
        type: "vector",
        url: `pmtiles://${filename}`,
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      },
    },
    layers: [
      {
        id: "water",
        source: "offline_map",
        "source-layer": "water",
        type: "fill",
        paint: { "fill-color": "#80b1d3" },
      },
      {
        id: "buildings",
        source: "offline_map",
        "source-layer": "buildings",
        type: "fill",
        paint: { "fill-color": "#d9d9d9" },
      },
      {
        id: "roads",
        source: "offline_map",
        "source-layer": "roads",
        type: "line",
        paint: { "line-color": "#fc8d62" },
      },
    ],
  },
});
```

## API

### `IndexedDBSource`

Implements the PMTiles `Source` interface for offline storage in IndexedDB.

#### Constructor

```typescript
new IndexedDBSource(db: IDBDatabase, filename: string, tablename?: string)
```

- `db`: An opened IndexedDB database
- `filename`: The name/key for the PMTiles file
- `tablename`: The object store name (default: "offline-pmtiles")

#### Static Methods

##### `openDb(dbname: string, tablename: string): Promise<IDBDatabase>`

Opens or creates an IndexedDB database with the appropriate object store for storing PMTiles files.

- `dbname`: Name of the IndexedDB database
- `tablename`: Name of the object store to create

#### Instance Methods

##### `setSource(source: { filename: string; blob: Blob }): Promise<void>`

Stores a PMTiles file in IndexedDB.

- `source.filename`: The filename/key for the PMTiles archive
- `source.blob`: The PMTiles file as a Blob

##### `getBytes(offset: number, length: number, signal?: AbortSignal, etag?: string): Promise<RangeResponse>`

Retrieves a byte range from the stored PMTiles file. This method implements the PMTiles `Source` interface and is called automatically by the PMTiles library.

## Use Cases

- Progressive Web Apps that need offline map capabilities
- Mobile applications with limited connectivity
- Reducing server load by caching map tiles locally
- Field data collection apps that need to work offline

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Commit message conventions (for semantic versioning)
- Development setup
- Pull request process
- How automated releases work

## License

MIT
