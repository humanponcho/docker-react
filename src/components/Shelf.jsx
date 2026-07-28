// Shelf — the full-screen experience: a Three.js canvas with a warm editorial UI
// overlay for browsing and inspecting the library.

import React from 'react';
import useShelf from '../shelf/useShelf';
import { CATALOG } from '../shelf/catalog';
import './Shelf.css';

export default function Shelf() {
  const { canvasRef, state, api } = useShelf();
  const { mode, selectedIndex, book, count } = state;
  const inspecting = mode === 'inspect';

  return (
    <div className={`shelf-root ${inspecting ? 'is-inspecting' : ''}`}>
      <canvas ref={canvasRef} className="shelf-canvas" aria-label="3D bookshelf" />

      {/* Masthead */}
      <header className="shelf-masthead">
        <p className="shelf-kicker">A reading room in three dimensions</p>
        <h1 className="shelf-title">The Complete Shelf</h1>
      </header>

      {/* Selected book caption (browse) */}
      {!inspecting && book && (
        <div className="shelf-caption" key={book.id}>
          <p className="shelf-caption__index">
            {String(selectedIndex + 1).padStart(2, '0')} <span>/ {String(count).padStart(2, '0')}</span>
          </p>
          <h2 className="shelf-caption__title">{book.title}</h2>
          <p className="shelf-caption__author">{book.author}</p>
          <button className="shelf-open" onClick={api.inspect}>
            Pull forward to inspect →
          </button>
        </div>
      )}

      {/* Inspect panel */}
      {inspecting && book && (
        <aside className="shelf-inspect" key={`inspect-${book.id}`}>
          <p className="shelf-inspect__label">Now inspecting</p>
          <h2 className="shelf-inspect__title">{book.title}</h2>
          <p className="shelf-inspect__author">{book.author}</p>
          <p className="shelf-inspect__blurb">{book.blurb}</p>
          <dl className="shelf-inspect__meta">
            <div>
              <dt>Binding</dt>
              <dd>Clothbound hardcover</dd>
            </div>
            <div>
              <dt>Motif</dt>
              <dd>Foil-stamped {book.motif}</dd>
            </div>
          </dl>
        </aside>
      )}

      {/* Browse controls */}
      {!inspecting && (
        <nav className="shelf-controls" aria-label="Browse the shelf">
          <button className="shelf-btn" onClick={api.prev} aria-label="Previous book">
            ‹
          </button>
          <div className="shelf-ticks" role="listbox" aria-label="Book position markers">
            {CATALOG.map((b, i) => (
              <button
                key={b.id}
                className={`shelf-tick ${i === selectedIndex ? 'is-active' : ''}`}
                onClick={() => api.select(i)}
                role="option"
                aria-selected={i === selectedIndex}
                aria-label={`${b.title} by ${b.author}`}
                title={b.title}
              />
            ))}
          </div>
          <button className="shelf-btn" onClick={api.next} aria-label="Next book">
            ›
          </button>
        </nav>
      )}

      {/* Inspect controls */}
      {inspecting && (
        <nav className="shelf-inspect-controls" aria-label="Inspection controls">
          <button className="shelf-btn shelf-btn--wide" onClick={api.close}>
            ‹ Back to shelf
          </button>
          <div className="shelf-inspect-controls__zoom">
            <button className="shelf-btn" onClick={api.zoomOut} aria-label="Zoom out">
              −
            </button>
            <button className="shelf-btn" onClick={api.zoomIn} aria-label="Zoom in">
              +
            </button>
            <button className="shelf-btn shelf-btn--wide" onClick={api.resetView}>
              Reset view
            </button>
          </div>
        </nav>
      )}

      {/* Hint line */}
      <p className="shelf-hint">
        {inspecting
          ? 'Drag to orbit · Shift-drag to pan · Scroll to zoom · Esc to close'
          : 'Drag, scroll, arrow keys, or a marker to browse · Click a book to open it'}
      </p>
    </div>
  );
}
