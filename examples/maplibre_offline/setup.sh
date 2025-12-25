#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PMTILES_FILE="$SCRIPT_DIR/travis-county.pmtiles"

# Check if travis-county.pmtiles exists
if [ ! -f "$PMTILES_FILE" ]; then
  echo "travis-county.pmtiles not found. Setting up..."

  # Check if pmtiles CLI is installed
  if ! command -v pmtiles &> /dev/null; then
    echo "Installing pmtiles CLI..."
    go install github.com/protomaps/go-pmtiles/cmd/pmtiles@latest
  fi

  # Calculate yesterday's date in YYYYMMDD format
  # macOS and Linux have different date command syntax
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    YESTERDAY=$(date -v-1d +%Y%m%d)
  else
    # Linux
    YESTERDAY=$(date -d "yesterday" +%Y%m%d)
  fi

  echo "Extracting Travis County from protomaps build $YESTERDAY..."
  cd "$SCRIPT_DIR"
  pmtiles extract "https://build.protomaps.com/$YESTERDAY.pmtiles" travis-county.pmtiles \
    --bbox=-98.0,29.9,-97.5,30.6 \
    --maxzoom=14 \
    --download-threads=8

  echo "Setup complete! travis-county.pmtiles created."
else
  echo "travis-county.pmtiles already exists, skipping setup."
fi
