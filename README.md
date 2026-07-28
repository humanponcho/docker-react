# The Complete Shelf

A warm editorial 3D library, built with [Three.js](https://threejs.org/) inside a
React app. Browse a continuous shelf of clothbound hardcovers and pull one forward
into a detailed inspection view.

This is an original, self-authored experience — its own catalog, code, and covers —
inspired by the idea of a "complete shelf." It is not a fork of any existing project.

## Experience

- **Browse the shelf** by dragging, using the mouse wheel / trackpad, the ← → arrow
  keys, the on-screen prev/next buttons, or the position markers.
- **Inspect a book** by clicking the centred volume (or pressing Enter). It eases
  forward and turns to face you, with **orbit** (drag), **pan** (shift-drag or
  right-drag), **zoom** (wheel), and **reset** controls. Press Esc or "Back to shelf"
  to return it.
- **Look & feel:** cream paper, walnut shelving, serif typography, and muted
  clothbound covers with foil-stamped motifs.
- Honours `prefers-reduced-motion` and is keyboard navigable.

## How it's built

| Path | Role |
| --- | --- |
| `src/shelf/catalog.js` | The 19 books — titles, authors, palettes, proportions. |
| `src/shelf/covers.js` | Deterministic procedural cover / spine / motif textures. |
| `src/shelf/ShelfEngine.js` | Three.js scene, layout, browse + inspection controls. |
| `src/shelf/useShelf.js` | React hook wrapping the engine lifecycle. |
| `src/components/Shelf.jsx` + `Shelf.css` | The editorial UI overlay. |
| `src/shelf/mintManifest.js` | Optional drop-in for real Mint cover artwork. |

### Covers

Covers are generated procedurally from each book's palette and a deterministic seed —
no binary art is shipped. Real artwork produced by the
[Mint](https://mint.gg) asset pipeline can be dropped in later without touching the
engine: commit images under `public/assets/mint/` and map them in
`public/assets/mint/manifest.json`. See `public/assets/mint/README.md` for the format.
The app never calls the Mint MCP from browser code — it only reads that static manifest.

## Scripts

```bash
npm install          # (this repo pins some legacy peers; use --legacy-peer-deps if needed)
npm start            # dev server at http://localhost:3000
npm run build        # production build into build/
npm test             # unit tests
```

---

<details>
<summary>Create React App notes</summary>

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
Run `npm start` for development, `npm run build` for a production bundle, and
`npm test` for the test runner. See the
[CRA documentation](https://facebook.github.io/create-react-app/docs/getting-started)
for more.

</details>
