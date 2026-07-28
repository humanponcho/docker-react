// The Complete Shelf — book catalog.
//
// An original, self-authored collection of nineteen clothbound volumes. Titles,
// authors and blurbs are invented for this experience; nothing here is branded.
//
// Each entry drives both layout (physical dimensions, in world units where the
// shelf interior height is ~2.0) and the procedural cover generator in covers.js
// (cloth/foil palette + a deterministic `seed` that fixes the abstract motif).
//
// A Mint artifact manifest may later override a book's cover art by `id`; see
// mintManifest.js. Keep `id` values stable so those overrides keep matching.

/**
 * @typedef {Object} Book
 * @property {string} id            Stable identifier (used for Mint overrides).
 * @property {string} title
 * @property {string} author
 * @property {string} blurb         Short editorial description for the inspect panel.
 * @property {number} seed          Deterministic seed for the procedural motif.
 * @property {string} cloth         Muted clothbound cover colour (hex).
 * @property {string} foil          Abstract foil-motif accent colour (hex).
 * @property {string} motif         Motif family — see covers.js MOTIFS.
 * @property {number} width         Spine thickness, world units (~0.12–0.26).
 * @property {number} height        Board height, world units (~1.5–1.95).
 * @property {number} depth         Board depth (front-to-back), world units (~1.0–1.35).
 */

/** @type {Book[]} */
export const CATALOG = [
  {
    id: 'tidal-arithmetic',
    title: 'Tidal Arithmetic',
    author: 'E. M. Verhoeven',
    blurb:
      'Essays on the mathematics hidden in coastlines, from the rhythm of the neap tide to the fractal edge of a receding wave.',
    seed: 1207,
    cloth: '#3f5a54',
    foil: '#d8b46a',
    motif: 'arcs',
    width: 0.2,
    height: 1.86,
    depth: 1.24,
  },
  {
    id: 'the-quiet-machine',
    title: 'The Quiet Machine',
    author: 'Aldous Ferrant',
    blurb:
      'A cultural history of silence in engineering — the pursuit of the motor you cannot hear and the room that refuses to echo.',
    seed: 8842,
    cloth: '#7a3b32',
    foil: '#e7c98a',
    motif: 'grid',
    width: 0.24,
    height: 1.78,
    depth: 1.18,
  },
  {
    id: 'letters-to-a-cartographer',
    title: 'Letters to a Cartographer',
    author: 'Ines Okonkwo',
    blurb:
      'Correspondence with a mapmaker who never left home, drawing coastlines from the descriptions of returning sailors.',
    seed: 3319,
    cloth: '#2f4858',
    foil: '#c9a24b',
    motif: 'lines',
    width: 0.16,
    height: 1.7,
    depth: 1.1,
  },
  {
    id: 'orchard-of-glass',
    title: 'Orchard of Glass',
    author: 'Bruno Salk',
    blurb:
      'Poems written inside a botanical greenhouse across a single winter, condensation and frost as recurring refrains.',
    seed: 5501,
    cloth: '#4a5d3a',
    foil: '#dcc06e',
    motif: 'seed',
    width: 0.14,
    height: 1.62,
    depth: 1.04,
  },
  {
    id: 'the-weight-of-color',
    title: 'The Weight of Colour',
    author: 'Marguerite Dol',
    blurb:
      'How pigments were mined, ground and fought over — a material history of blue, from lapis to the first synthetic skies.',
    seed: 9174,
    cloth: '#334e68',
    foil: '#e0b563',
    motif: 'circles',
    width: 0.22,
    height: 1.9,
    depth: 1.3,
  },
  {
    id: 'nightshift-almanac',
    title: 'Nightshift Almanac',
    author: 'Teodor Vasquez',
    blurb:
      'A field guide to the working dark: bakers, printers and lighthouse keepers, and the small economies that never sleep.',
    seed: 6620,
    cloth: '#553c55',
    foil: '#d6b26c',
    motif: 'grid',
    width: 0.18,
    height: 1.74,
    depth: 1.14,
  },
  {
    id: 'salt-and-cedar',
    title: 'Salt & Cedar',
    author: 'Halldora Reyes',
    blurb:
      'A memoir of a coastal joinery, told in the grain of the wood and the tide-lines left on the workshop floor.',
    seed: 2048,
    cloth: '#6b4a2e',
    foil: '#e3c884',
    motif: 'lines',
    width: 0.2,
    height: 1.68,
    depth: 1.2,
  },
  {
    id: 'a-theory-of-doorways',
    title: 'A Theory of Doorways',
    author: 'Kwame Adeyemi',
    blurb:
      'On thresholds in architecture and in life — the deliberate design of the pause between one room and the next.',
    seed: 7735,
    cloth: '#3a4a3f',
    foil: '#cbb06a',
    motif: 'arcs',
    width: 0.17,
    height: 1.82,
    depth: 1.12,
  },
  {
    id: 'the-paper-observatory',
    title: 'The Paper Observatory',
    author: 'Liesel Braun',
    blurb:
      'Star charts drawn before the telescope — the astronomers who mapped the sky with thread, brass and patience.',
    seed: 4410,
    cloth: '#26384a',
    foil: '#d9bd72',
    motif: 'circles',
    width: 0.23,
    height: 1.94,
    depth: 1.32,
  },
  {
    id: 'unhurried',
    title: 'Unhurried',
    author: 'Priya Nair',
    blurb:
      'A slim manifesto for slowness — reclaiming attention one deliberate, undivided hour at a time.',
    seed: 1560,
    cloth: '#8a5a3c',
    foil: '#ecd39a',
    motif: 'seed',
    width: 0.12,
    height: 1.54,
    depth: 1.0,
  },
  {
    id: 'the-ferryman-ledger',
    title: "The Ferryman's Ledger",
    author: 'Osborne Vane',
    blurb:
      'A novel kept as an account book — every crossing, every fare, every passenger who never made the return trip.',
    seed: 3082,
    cloth: '#4c4038',
    foil: '#d4b26a',
    motif: 'lines',
    width: 0.21,
    height: 1.8,
    depth: 1.22,
  },
  {
    id: 'grammar-of-rivers',
    title: 'Grammar of Rivers',
    author: 'Constance Ilo',
    blurb:
      'Reading watersheds as sentences — how a river branches, subordinates and finally arrives at the sea.',
    seed: 8901,
    cloth: '#2d5040',
    foil: '#cfb163',
    motif: 'arcs',
    width: 0.19,
    height: 1.76,
    depth: 1.16,
  },
  {
    id: 'the-hour-of-lamps',
    title: 'The Hour of Lamps',
    author: 'Rafael Sund',
    blurb:
      'Stories set in the blue minute before the streetlights wake — a city caught between two kinds of light.',
    seed: 5237,
    cloth: '#3d3a5c',
    foil: '#dcc079',
    motif: 'circles',
    width: 0.16,
    height: 1.66,
    depth: 1.08,
  },
  {
    id: 'kiln',
    title: 'Kiln',
    author: 'Marta Bexcell',
    blurb:
      'A single word, a single obsession: heat, and everything it transforms — clay, glass, iron and resolve.',
    seed: 9963,
    cloth: '#8c4a34',
    foil: '#e8c887',
    motif: 'seed',
    width: 0.15,
    height: 1.72,
    depth: 1.26,
  },
  {
    id: 'field-notes-on-forgetting',
    title: 'Field Notes on Forgetting',
    author: 'Yusuf Demir',
    blurb:
      'A naturalist turns inward, cataloguing memory as if it were a species in gentle, documented decline.',
    seed: 2775,
    cloth: '#455a4a',
    foil: '#d3b76e',
    motif: 'grid',
    width: 0.18,
    height: 1.84,
    depth: 1.15,
  },
  {
    id: 'the-cartwright-variations',
    title: 'The Cartwright Variations',
    author: 'Eleanor Voss',
    blurb:
      'A composer rebuilds a lost concerto from a single surviving phrase, one careful variation after another.',
    seed: 6104,
    cloth: '#5a4632',
    foil: '#e0c47c',
    motif: 'lines',
    width: 0.22,
    height: 1.88,
    depth: 1.28,
  },
  {
    id: 'low-country',
    title: 'Low Country',
    author: 'Amara Cole',
    blurb:
      'A saga of reclaimed marshland and the families who dug the dikes, held against three generations of water.',
    seed: 4488,
    cloth: '#356054',
    foil: '#cdb066',
    motif: 'arcs',
    width: 0.25,
    height: 1.92,
    depth: 1.34,
  },
  {
    id: 'the-instrument-maker',
    title: 'The Instrument Maker',
    author: 'Gideon Roth',
    blurb:
      'Inside a workshop of impossible precision, where a life is measured in microns and the tuning never ends.',
    seed: 7350,
    cloth: '#2c4652',
    foil: '#d8bd74',
    motif: 'grid',
    width: 0.19,
    height: 1.79,
    depth: 1.19,
  },
  {
    id: 'afterglow',
    title: 'Afterglow',
    author: 'Senna Larkin',
    blurb:
      'A closing meditation on endings that keep giving light — the warmth a room holds long after the fire is out.',
    seed: 1893,
    cloth: '#6e3b3a',
    foil: '#edd39c',
    motif: 'circles',
    width: 0.14,
    height: 1.6,
    depth: 1.06,
  },
];

export default CATALOG;
