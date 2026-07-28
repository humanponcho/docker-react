// Mint artifact manifest seam.
//
// This project ships fully procedural covers (see covers.js) and needs no external
// assets to run. But it is designed so a Mint asset pack — generated out-of-band via
// the Mint MCP server (mcp.mint.gg) in an authorized, interactive session — can drop
// in later and override individual book covers with real foil-stamped artwork.
//
// IMPORTANT: we never call the Mint MCP from browser code. The MCP is used offline to
// author assets; its output is committed as a *static* manifest + image files under
// public/assets/mint/. This loader only fetches that static JSON at runtime.
//
// Manifest contract (public/assets/mint/manifest.json):
//   {
//     "version": 1,
//     "books": {
//       "<catalog book id>": {
//         "front": "books/tidal-arithmetic-front.png",   // path relative to /assets/mint/
//         "spine": "books/tidal-arithmetic-spine.png",    // optional
//         "cloth": "#3f5a54",                              // optional palette override
//         "foil":  "#d8b46a"                               // optional palette override
//       }
//     }
//   }
//
// Any book id absent from the manifest simply keeps its procedural cover.

import * as THREE from 'three';

const MANIFEST_URL = `${process.env.PUBLIC_URL || ''}/assets/mint/manifest.json`;
const ASSET_BASE = `${process.env.PUBLIC_URL || ''}/assets/mint/`;

/**
 * Attempt to load the optional Mint manifest. Resolves to a normalized map keyed by
 * book id, or an empty object when no manifest is present. Never rejects — a missing
 * manifest is the expected default.
 *
 * @returns {Promise<Record<string, {front?: string, spine?: string, cloth?: string, foil?: string}>>}
 */
export async function loadMintManifest() {
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
    if (!res.ok) return {};
    const data = await res.json();
    if (!data || typeof data !== 'object' || !data.books) return {};
    return data.books;
  } catch (err) {
    // Absent or malformed manifest: fall back to procedural covers silently.
    return {};
  }
}

/**
 * Load an image asset into a THREE.Texture. Rejects if the image fails to load so the
 * caller can fall back to the procedural cover for that book.
 */
export function loadTexture(loader, relativePath, renderer) {
  return new Promise((resolve, reject) => {
    loader.load(
      ASSET_BASE + relativePath,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        if (renderer) tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        resolve(tex);
      },
      undefined,
      reject,
    );
  });
}

export default loadMintManifest;
