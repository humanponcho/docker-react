// Procedural clothbound covers.
//
// Every book gets three deterministic canvas textures — front cover, spine, and a
// shared "boards" texture for back/edges — generated from its palette + seed. No
// binary art is shipped; the look is warm editorial cloth with an embossed serif
// title and an abstract, foil-stamped motif.
//
// Determinism matters: the same seed always yields the same motif, so a book looks
// identical across reloads. A Mint artifact manifest can later replace the front
// cover with a real image (see mintManifest.js) — the geometry never changes.

import * as THREE from 'three';

// ---- deterministic PRNG (mulberry32) -------------------------------------------------

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- small colour helpers ------------------------------------------------------------

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function shade(hex, amount) {
  // amount in [-1, 1]; negative darkens, positive lightens.
  const { r, g, b } = hexToRgb(hex);
  const mix = (c) =>
    Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---- cloth weave background ----------------------------------------------------------

function paintCloth(ctx, w, h, cloth, rng) {
  ctx.fillStyle = cloth;
  ctx.fillRect(0, 0, w, h);

  // Subtle vertical + horizontal weave, plus flecks, for a bookcloth texture.
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = shade(cloth, -0.5);
  ctx.lineWidth = 1;
  const step = Math.max(3, Math.round(w / 220));
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.strokeStyle = shade(cloth, 0.35);
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < (w * h) / 900; i++) {
    ctx.fillStyle = rng() > 0.5 ? shade(cloth, 0.4) : shade(cloth, -0.4);
    ctx.fillRect(rng() * w, rng() * h, 1.5, 1.5);
  }
  ctx.globalAlpha = 1;

  // Gentle vignette toward the boards' edges.
  const grad = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.2,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.72,
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// ---- abstract foil motifs ------------------------------------------------------------
// Each motif paints inside the panel rect [x, y, w, h] using the foil colour.

const MOTIFS = {
  arcs(ctx, r, foil, rng) {
    const cx = r.x + r.w / 2;
    const rings = 3 + Math.floor(rng() * 3);
    ctx.lineWidth = Math.max(2, r.w * 0.012);
    for (let i = 0; i < rings; i++) {
      const rad = (r.w * 0.5) * ((i + 1) / rings) * (0.85 + rng() * 0.2);
      const start = rng() * Math.PI;
      ctx.strokeStyle = rgba(foil, 0.85 - i * 0.12);
      ctx.beginPath();
      ctx.arc(cx, r.y + r.h * 0.62, rad, start, start + Math.PI * (0.9 + rng() * 0.8));
      ctx.stroke();
    }
  },
  grid(ctx, r, foil, rng) {
    const cols = 3 + Math.floor(rng() * 3);
    const rows = 3 + Math.floor(rng() * 3);
    const gw = r.w / cols;
    const gh = r.h / rows;
    ctx.fillStyle = rgba(foil, 0.9);
    for (let c = 0; c < cols; c++) {
      for (let rr = 0; rr < rows; rr++) {
        if (rng() > 0.45) continue;
        const pad = gw * 0.22;
        ctx.fillRect(r.x + c * gw + pad, r.y + rr * gh + pad, gw - pad * 2, gh - pad * 2);
      }
    }
  },
  lines(ctx, r, foil, rng) {
    const n = 4 + Math.floor(rng() * 5);
    ctx.strokeStyle = rgba(foil, 0.85);
    for (let i = 0; i < n; i++) {
      ctx.lineWidth = Math.max(1.5, r.w * (0.006 + rng() * 0.02));
      const y = r.y + (r.h * (i + 0.5)) / n;
      ctx.beginPath();
      ctx.moveTo(r.x + r.w * (rng() * 0.15), y);
      ctx.lineTo(r.x + r.w * (0.85 + rng() * 0.15), y);
      ctx.stroke();
    }
  },
  circles(ctx, r, foil, rng) {
    const n = 3 + Math.floor(rng() * 4);
    for (let i = 0; i < n; i++) {
      const rad = r.w * (0.06 + rng() * 0.16);
      const cx = r.x + rad + rng() * (r.w - rad * 2);
      const cy = r.y + rad + rng() * (r.h - rad * 2);
      ctx.strokeStyle = rgba(foil, 0.85);
      ctx.lineWidth = Math.max(1.5, r.w * 0.01);
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.stroke();
      if (rng() > 0.6) {
        ctx.fillStyle = rgba(foil, 0.5);
        ctx.beginPath();
        ctx.arc(cx, cy, rad * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
  seed(ctx, r, foil, rng) {
    // A scattered constellation joined by faint threads.
    const pts = [];
    const n = 5 + Math.floor(rng() * 5);
    for (let i = 0; i < n; i++) {
      pts.push({ x: r.x + rng() * r.w, y: r.y + rng() * r.h });
    }
    ctx.strokeStyle = rgba(foil, 0.4);
    ctx.lineWidth = Math.max(1, r.w * 0.006);
    for (let i = 1; i < pts.length; i++) {
      ctx.beginPath();
      ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
      ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(foil, 0.9);
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(2, r.w * 0.012), 0, Math.PI * 2);
      ctx.fill();
    }
  },
};

// ---- typography ----------------------------------------------------------------------

const SERIF = 'Georgia, "Iowan Old Style", "Times New Roman", serif';

function drawEmbossedText(ctx, text, x, y, size, color, maxWidth, align = 'center') {
  ctx.font = `${size}px ${SERIF}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  // Emboss: dark below, light above, foil fill.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillText(text, x, y + Math.max(1, size * 0.03), maxWidth);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillText(text, x, y - Math.max(1, size * 0.03), maxWidth);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y, maxWidth);
}

// Word-wrap a title into up to `maxLines` lines that fit `maxWidth`.
function wrapTitle(ctx, title, size, maxWidth, maxLines) {
  ctx.font = `${size}px ${SERIF}`;
  const words = title.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

// ---- texture builders ----------------------------------------------------------------

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function toTexture(canvas, renderer) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Build the front-cover texture for a book.
 * @param {import('./catalog').Book} book
 */
export function makeFrontCover(book, renderer) {
  const W = 512;
  const H = Math.round(W * (book.height / book.depth));
  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const rng = mulberry32(book.seed);

  paintCloth(ctx, W, H, book.cloth, rng);

  // Foil border frame.
  const inset = W * 0.08;
  ctx.strokeStyle = rgba(book.foil, 0.8);
  ctx.lineWidth = Math.max(2, W * 0.006);
  ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);

  // Motif panel occupies the lower two-thirds.
  const panel = { x: inset * 1.6, y: H * 0.42, w: W - inset * 3.2, h: H * 0.44 };
  (MOTIFS[book.motif] || MOTIFS.lines)(ctx, panel, book.foil, mulberry32(book.seed ^ 0x9e37));

  // Title, wrapped, in the upper third.
  const titleSize = Math.round(W * 0.088);
  const lines = wrapTitle(ctx, book.title, titleSize, W - inset * 2.4, 3);
  const startY = H * 0.2 - ((lines.length - 1) * titleSize * 1.15) / 2;
  lines.forEach((ln, i) => {
    drawEmbossedText(ctx, ln, W / 2, startY + i * titleSize * 1.15, titleSize, book.foil, W - inset * 2);
  });

  // Author, small, beneath the frame.
  drawEmbossedText(
    ctx,
    book.author.toUpperCase(),
    W / 2,
    H - inset * 1.5,
    Math.round(W * 0.03),
    rgba(book.foil, 0.85),
    W - inset * 2,
  );

  return toTexture(canvas, renderer);
}

/**
 * Build the spine texture (title runs vertically).
 * @param {import('./catalog').Book} book
 */
export function makeSpine(book, renderer) {
  // Spine is tall and thin; render upright then the material maps it onto the edge.
  const H = 512;
  const W = Math.max(64, Math.round(H * (book.width / book.height)));
  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const rng = mulberry32(book.seed ^ 0x5151);

  paintCloth(ctx, W, H, book.cloth, rng);

  // Foil bands top and bottom (like raised cords on a bound spine).
  ctx.fillStyle = rgba(book.foil, 0.75);
  const band = H * 0.02;
  ctx.fillRect(0, H * 0.12, W, band);
  ctx.fillRect(0, H * 0.14 + band, W, band * 0.5);
  ctx.fillRect(0, H * 0.86, W, band);

  // Vertical title.
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 2);
  const size = Math.min(Math.round(W * 0.5), Math.round(H * 0.05));
  drawEmbossedText(ctx, book.title, 0, 0, size, book.foil, H * 0.6);
  ctx.restore();

  return toTexture(canvas, renderer);
}

/**
 * Build a plain boards texture for back cover / fore-edges (cloth only).
 * @param {import('./catalog').Book} book
 */
export function makeBoards(book, renderer) {
  const canvas = makeCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  paintCloth(ctx, 256, 256, book.cloth, mulberry32(book.seed ^ 0x2222));
  return toTexture(canvas, renderer);
}

/**
 * Build a paper texture for the page block (top / fore-edge / bottom).
 */
export function makePages(renderer) {
  const canvas = makeCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#efe7d6';
  ctx.fillRect(0, 0, 256, 256);
  // Fine page lines to read as a stack of leaves.
  ctx.strokeStyle = 'rgba(120,100,70,0.25)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 256; x += 2) {
    ctx.globalAlpha = 0.3 + Math.random() * 0.4;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return toTexture(canvas, renderer);
}

export { MOTIFS };
