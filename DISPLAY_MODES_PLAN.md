# Display Modes — Implementation Plan

**Target repo:** `humanponcho/sergiogalaviz.com`
**Scope:** Add three display modes — **Plissken** (current), **Light** (e-ink paper), **Dark** (inverse of Light) — with a three-segment toggle in the cockpit UI.

---

## 0. Read Before You Start

- Open `CLAUDE.md` and read it in full. You must follow every rule there, especially:
  - **Rule 1 – Colour tokens only.** Never write a raw hex or RGB value outside `:root` / a `[data-theme]` block.
  - **Rule 8 – No frameworks.** Vanilla JS only.
- Open `css/tokens.css` and `css/main.css` so you understand what tokens exist before touching anything.

**Files you will edit:**

| File | What changes |
|---|---|
| `css/tokens.css` | Add `[data-theme="light"]` and `[data-theme="dark"]` override blocks |
| `css/main.css` | Add toggle widget styles + per-theme CRT adjustments |
| `index.html` | Add `data-theme` attribute to `<html>`; add toggle markup in `.top-bar` |
| `js/main.js` | Add mode init, `applyMode()`, and click handler |
| `CLAUDE.md` | Update the "Out of Scope" section |

No new files. No build step. No dependencies.

---

## Step 1 — Define the Three Colour Palettes

### Mode 1 — Plissken (current, no change needed)

The existing `:root` block in `tokens.css` *is* Plissken. Leave it alone.

| Token | Current value | Role |
|---|---|---|
| `--black` | `#020704` | Page background |
| `--deep` | `#050f08` | — |
| `--panel` | `#0a1a0f` | Widget backgrounds |
| `--glass` | `#0d2014` | — |
| `--g0` | `#001a05` | Bar track backgrounds |
| `--g1` | `#00ff6a` | Primary text / brightest green |
| `--g2` | `#00c952` | Secondary |
| `--g3` | `#00783a` | Muted text |
| `--g4` | `#004d26` | Very muted / labels |
| `--g5` | `#003018` | Borders / dividers |
| `--amber` | `#ffb700` | Secondary accent |
| `--red` | `#ff2244` | Error / alert |

### Mode 2 — Light (e-ink paper)

High-contrast black ink on warm off-white paper. E-ink displays do not emit light, so **all glows are removed** and CRT overlays are cleared.

| Token | Value | Notes |
|---|---|---|
| `--black` | `#f0efe8` | Warm paper background |
| `--deep` | `#e8e7e0` | — |
| `--panel` | `#e4e3dc` | Widget backgrounds |
| `--glass` | `#ece9e2` | — |
| `--g0` | `#cecdc6` | Bar track backgrounds |
| `--g1` | `#0d0d0a` | Primary ink (near-black) |
| `--g2` | `#1a1a16` | — |
| `--g3` | `#3a3a34` | — |
| `--g4` | `#606058` | — |
| `--g5` | `#aeada6` | Subtle borders |
| `--amber` | `#3a3a34` | No colour on e-ink — reuse dark gray |
| `--red` | `#0d0d0a` | Errors still use darkest ink |
| `--dim` | `rgba(0, 0, 0, 0.06)` | — |
| `--overlay-scanline` | `rgba(0, 0, 0, 0)` | Cleared — no lines on paper |
| `--overlay-vignette` | `rgba(0, 0, 0, 0)` | Cleared |
| `--glow-sm/md/lg` | `none` | No phosphor bloom on paper |
| `--glow-amber-sm/md/lg` | `none` | — |

### Mode 3 — Dark (inverse of Light)

Swap Light's ink and paper values. Background becomes near-black; text becomes warm white. Add very faint, colourless glows for subtle depth.

| Token | Value | Notes |
|---|---|---|
| `--black` | `#0d0d0a` | Near-black background |
| `--deep` | `#171714` | — |
| `--panel` | `#1b1b18` | Widget backgrounds |
| `--glass` | `#131310` | — |
| `--g0` | `#2e2e2a` | Bar tracks |
| `--g1` | `#f0efe8` | Primary text (warm white) |
| `--g2` | `#d8d7d0` | — |
| `--g3` | `#b8b7b0` | — |
| `--g4` | `#888880` | — |
| `--g5` | `#3a3a34` | Subtle borders |
| `--amber` | `#c8c7c0` | Repurposed to light gray |
| `--red` | `#f0efe8` | Errors in warm white |
| `--dim` | `rgba(255, 255, 255, 0.06)` | — |
| `--overlay-scanline` | `rgba(255, 255, 255, 0.03)` | Very faint structure |
| `--overlay-vignette` | `rgba(0, 0, 0, 0.4)` | Kept |
| `--glow-sm` | `0 0 4px rgba(240, 239, 232, 0.3)` | Faint white bloom |
| `--glow-md` | `0 0 8px rgba(240, 239, 232, 0.3), 0 0 2px rgba(240, 239, 232, 0.5)` | — |
| `--glow-lg` | `0 0 16px rgba(240, 239, 232, 0.3), 0 0 4px rgba(240, 239, 232, 0.5)` | — |
| `--glow-amber-sm` | `0 0 4px rgba(240, 239, 232, 0.3)` | — |
| `--glow-amber-md` | `0 0 8px rgba(240, 239, 232, 0.3)` | — |
| `--glow-amber-lg` | `0 0 16px rgba(240, 239, 232, 0.3)` | — |

---

## Step 2 — Add Override Blocks to `css/tokens.css`

The existing `:root` block is Plissken — **do not touch it**. Append two new blocks at the very bottom of `tokens.css`:

```css
/* ── LIGHT MODE (e-ink paper) ─────────────────────────────── */
[data-theme="light"] {
  /* Backgrounds */
  --black:  #f0efe8;
  --deep:   #e8e7e0;
  --panel:  #e4e3dc;
  --glass:  #ece9e2;
  --g0:     #cecdc6;

  /* Ink scale */
  --g1:  #0d0d0a;
  --g2:  #1a1a16;
  --g3:  #3a3a34;
  --g4:  #606058;
  --g5:  #aeada6;

  /* Accents — neutralised for e-ink */
  --amber: #3a3a34;
  --red:   #0d0d0a;
  --dim:   rgba(0, 0, 0, 0.06);

  /* Overlays — no CRT effects on paper */
  --overlay-scanline: rgba(0, 0, 0, 0);
  --overlay-vignette: rgba(0, 0, 0, 0);

  /* Glows — e-ink does not emit light */
  --glow-sm:        none;
  --glow-md:        none;
  --glow-lg:        none;
  --glow-amber-sm:  none;
  --glow-amber-md:  none;
  --glow-amber-lg:  none;
}

/* ── DARK MODE (inverse of light) ────────────────────────── */
[data-theme="dark"] {
  /* Backgrounds */
  --black:  #0d0d0a;
  --deep:   #171714;
  --panel:  #1b1b18;
  --glass:  #131310;
  --g0:     #2e2e2a;

  /* Text scale */
  --g1:  #f0efe8;
  --g2:  #d8d7d0;
  --g3:  #b8b7b0;
  --g4:  #888880;
  --g5:  #3a3a34;

  /* Accents */
  --amber: #c8c7c0;
  --red:   #f0efe8;
  --dim:   rgba(255, 255, 255, 0.06);

  /* Overlays */
  --overlay-scanline: rgba(255, 255, 255, 0.03);
  --overlay-vignette: rgba(0, 0, 0, 0.4);

  /* Glows — minimal colourless bloom */
  --glow-sm:        0 0 4px rgba(240, 239, 232, 0.3);
  --glow-md:        0 0 8px rgba(240, 239, 232, 0.3), 0 0 2px rgba(240, 239, 232, 0.5);
  --glow-lg:        0 0 16px rgba(240, 239, 232, 0.3), 0 0 4px rgba(240, 239, 232, 0.5);
  --glow-amber-sm:  0 0 4px rgba(240, 239, 232, 0.3);
  --glow-amber-md:  0 0 8px rgba(240, 239, 232, 0.3);
  --glow-amber-lg:  0 0 16px rgba(240, 239, 232, 0.3);
}
```

> **Why no Plissken block?** The existing `:root` *is* Plissken. When `data-theme` is absent or `"plissken"`, the browser uses the `:root` values. No extra block needed.

---

## Step 3 — Add Theme-Specific CRT Adjustments to `css/main.css`

The `scanline` and `vignette` pseudo-elements already read from `--overlay-scanline` / `--overlay-vignette`, so those self-correct via the token overrides. The `.noise` div and some `box-shadow` calls need explicit overrides.

Add this block to `main.css` **immediately after the `.noise` rule**:

```css
/* ── THEME ADJUSTMENTS ─────────────────────────────────────── */

/* Light: hide noise and strip bloom from interactive elements */
[data-theme="light"] .noise              { display: none; }
[data-theme="light"] .bar-fill           { box-shadow: none; }
[data-theme="light"] .status-dot::before { box-shadow: none; }
[data-theme="light"] .widget::before     { opacity: 0.3; }

/* Dark: dim noise very slightly */
[data-theme="dark"] .noise { opacity: 0.02; }
```

---

## Step 4 — Add `data-theme` to `<html>` in `index.html`

Open `index.html`. Find the opening `<html>` tag and add the attribute:

```html
<html lang="en" data-theme="plissken">
```

This ensures the page always boots into Plissken mode before JS runs (no flash of wrong theme). JS will overwrite it from localStorage if the user had previously chosen a different mode.

---

## Step 5 — Add Toggle Markup to `.top-bar` in `index.html`

Find the `.top-bar` `<div>` in `index.html`. Add the toggle as the **last child** inside it, right before the closing `</div>`:

```html
<div class="mode-toggle" id="modeToggle" role="group" aria-label="Display mode">
  <button class="mode-btn" data-mode="plissken" aria-pressed="true">PLK</button>
  <button class="mode-btn" data-mode="light"    aria-pressed="false">LGT</button>
  <button class="mode-btn" data-mode="dark"     aria-pressed="false">DRK</button>
</div>
```

Label conventions: `PLK`, `LGT`, `DRK` — terse, all-caps, consistent with the instrument-panel voice (`ONLINE`, `MEX CITY`, etc.). The `aria-pressed` attribute tracks which segment is active; JS will keep it in sync.

---

## Step 6 — Style the Toggle in `css/main.css`

Add the following block to `main.css` **after the `.status-dot.amber::before` rule** (i.e., at the end of the top-bar section):

```css
/* ── MODE TOGGLE ───────────────────────────────────────────── */
.mode-toggle {
  display: flex;
  gap: 0;
  border: 1px solid var(--g4);
}

.mode-btn {
  background: transparent;
  border: none;
  border-right: 1px solid var(--g4);
  color: var(--g3);
  font-family: 'Share Tech Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.15em;
  padding: 3px 8px;
  cursor: pointer;
  text-transform: uppercase;
  transition: background 0.15s, color 0.15s;
}

.mode-btn:last-child {
  border-right: none;
}

.mode-btn[aria-pressed="true"] {
  background: var(--g4);
  color: var(--black);
}

.mode-btn:hover:not([aria-pressed="true"]) {
  color: var(--g1);
}
```

This creates a flat three-segment selector: the active segment is filled (`--g4` background, `--black` text), inactive segments are transparent. The border and font exactly match the existing `.status-dot` row.

---

## Step 7 — Add Theme Logic to `js/main.js`

Append the following block at the **very end** of `main.js`:

```js
// ── DISPLAY MODES ──────────────────────────────────────────

const MODES = ['plissken', 'light', 'dark'];
const STORAGE_KEY = 'sg-display-mode';

function applyMode(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.setAttribute('aria-pressed', btn.dataset.mode === mode ? 'true' : 'false');
  });
}

function initMode() {
  const saved = localStorage.getItem(STORAGE_KEY);
  applyMode(MODES.includes(saved) ? saved : 'plissken');
}

document.getElementById('modeToggle').addEventListener('click', e => {
  const btn = e.target.closest('.mode-btn');
  if (!btn) return;
  const mode = btn.dataset.mode;
  localStorage.setItem(STORAGE_KEY, mode);
  applyMode(mode);
});

initMode();
```

How it works:
- `applyMode(mode)` — sets `data-theme` on `<html>` and updates all `aria-pressed` attributes to match.
- `initMode()` — reads from `localStorage` on page load; falls back to `'plissken'` if nothing is stored or the stored value is unrecognised.
- The `click` listener uses **event delegation** on the container — one listener handles all three buttons.
- `MODES.includes(saved)` guards against corrupted localStorage values.

---

## Step 8 — Update `CLAUDE.md`

The "Out of Scope" section currently forbids a theme toggle. This is now implemented and in scope. Find this line in `CLAUDE.md`:

```
- A dark/light mode toggle (the page is always dark — that's the aesthetic)
```

Replace it with:

```
- ~~A dark/light mode toggle~~ — superseded. Three display modes are now implemented: **Plissken** (CRT phosphor), **Light** (e-ink paper), **Dark** (inverse of Light). See `DISPLAY_MODES_PLAN.md` for full implementation notes.
```

Also add a note to the **Design Rules** section under Rule 1:

```
  Theme overrides live in `[data-theme="light"]` and `[data-theme="dark"]` selector blocks at the bottom of `tokens.css`. The `:root` block remains the Plissken default.
```

---

## Step 9 — Test Checklist

Work through every item before pushing.

### Functional

- [ ] Page loads in Plissken mode (green-on-black CRT aesthetic)
- [ ] Clicking `LGT` — page background switches to warm paper white, text becomes dark ink
- [ ] Clicking `DRK` — background becomes near-black, text becomes warm white
- [ ] Clicking `PLK` — Plissken is fully restored
- [ ] Active segment button is visually filled; the other two are transparent
- [ ] Reload the page — the last-selected mode is remembered
- [ ] Open DevTools → Application → Local Storage → confirm `sg-display-mode` is set

### Visual — Plissken

- [ ] Scanlines visible (faint horizontal lines across the screen)
- [ ] Vignette visible (edges slightly darker)
- [ ] Noise overlay visible (very faint grain)
- [ ] Green glow on `.widget-value` and bar fills
- [ ] Status dots pulse with green glow; amber dot pulses with amber glow

### Visual — Light

- [ ] Background is warm off-white, not pure white and not grey
- [ ] All text is dark ink — no green anywhere
- [ ] No scanlines, no vignette, no noise overlay
- [ ] No glow on text or bars (crisp, clean edges)
- [ ] Widget borders are visible as subtle gray lines

### Visual — Dark

- [ ] Background is near-black (not the same deep green-black as Plissken)
- [ ] Text is warm white, not stark pure white
- [ ] Very faint vignette present
- [ ] Very subtle white bloom on `.widget-value` — no colour cast
- [ ] No green anywhere

### Token hygiene

- [ ] Open DevTools → Elements panel → inspect `<html>` — `data-theme` attribute is present
- [ ] Inspect any coloured element → in Computed styles, **all** `color`, `background`, `box-shadow` values that you changed trace back to `var(--)` tokens — no raw hex values appear in your added CSS

### Layout

- [ ] Toggle fits inside `.top-bar` without pushing anything off screen on desktop (1280px)
- [ ] Check at tablet width (768px) — toggle is still visible and usable
- [ ] Check at mobile width (375px) — if toggle causes overflow, add `display: none` to the `≤599px` media query block in `main.css`

---

## Step 10 — Mobile Breakpoint (if needed)

After mobile testing, if `.mode-toggle` overflows `.top-bar` at narrow widths, find the `@media (max-width: 599px)` block in `main.css` and add:

```css
.mode-toggle { display: none; }
```

The site already hides the third status indicator on mobile, so hiding the toggle is consistent.

---

## Gotchas and Common Mistakes

1. **`text-shadow: none` vs `box-shadow: none`** — The `--glow-*` tokens are used for both `text-shadow` and `box-shadow` across the codebase. Setting them to `none` in Light mode works for both.

2. **`transition` on `:root`** — If you add a CSS transition to smooth theme changes, apply it to `html` only: `html { transition: background 0.2s, color 0.2s; }`. Do not add blanket `* { transition }` — it will cause layout jank on load.

3. **The gauge SVG** — The SVG in the right panel uses an inline `style` attribute that references `@keyframes gaugeIn` defined in `main.css`. The stroke colour of the gauge arc is set with a CSS variable. Make sure `--g1` or whichever token the SVG uses resolves correctly in all three modes. Check it visually.

4. **Plissken default race condition** — Setting `data-theme="plissken"` in the HTML attribute means the correct theme is applied before any CSS or JS loads, preventing a flash of the wrong style. `initMode()` in JS reads localStorage and overrides this immediately. This is intentional.

5. **Testing with DevTools** — You can manually test all modes in DevTools without clicking the toggle: select the `<html>` element, double-click the `data-theme` attribute, and type `light`, `dark`, or `plissken`.

---

## Summary

5 files touched, ~60 lines of new CSS, ~25 lines of new JS, zero new dependencies.

The full change set:
- `css/tokens.css` +50 lines (two `[data-theme]` blocks)
- `css/main.css` +35 lines (toggle styles + CRT adjustments)
- `index.html` +6 lines (`data-theme` attribute + toggle markup)
- `js/main.js` +25 lines (mode logic)
- `CLAUDE.md` ~3 lines updated
