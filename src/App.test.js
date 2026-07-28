import { CATALOG } from './shelf/catalog';

// The experience mounts a WebGL canvas, which jsdom can't provide, so we unit-test
// the catalog data that drives the shelf instead of rendering the 3D component.

test('catalog holds nineteen books', () => {
  expect(CATALOG).toHaveLength(19);
});

test('every book has a unique id', () => {
  const ids = CATALOG.map((b) => b.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test('every book has valid palette and dimensions', () => {
  for (const b of CATALOG) {
    expect(b.cloth).toMatch(/^#[0-9a-f]{6}$/i);
    expect(b.foil).toMatch(/^#[0-9a-f]{6}$/i);
    expect(b.width).toBeGreaterThan(0);
    expect(b.height).toBeGreaterThan(0);
    expect(b.depth).toBeGreaterThan(0);
    expect(b.title.length).toBeGreaterThan(0);
    expect(b.author.length).toBeGreaterThan(0);
  }
});
