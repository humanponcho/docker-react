// useShelf — bridges the imperative ShelfEngine to React.
//
// Owns the engine's lifecycle (create on mount, dispose on unmount), mirrors its
// state into React state for the overlay UI, and exposes stable callbacks.

import { useEffect, useRef, useState, useCallback } from 'react';
import ShelfEngine from './ShelfEngine';

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export default function useShelf() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [state, setState] = useState({
    mode: 'browse',
    selectedIndex: 0,
    book: null,
    count: 0,
  });

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    const engine = new ShelfEngine(canvasRef.current, {
      onChange: setState,
      reducedMotion: prefersReducedMotion(),
    });
    engineRef.current = engine;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMq = () => engine.setReducedMotion(mq.matches);
    mq.addEventListener?.('change', onMq);

    return () => {
      mq.removeEventListener?.('change', onMq);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const api = {
    next: useCallback(() => engineRef.current?.next(), []),
    prev: useCallback(() => engineRef.current?.prev(), []),
    select: useCallback((i) => engineRef.current?.selectIndex(i), []),
    inspect: useCallback(() => engineRef.current?.inspect(), []),
    close: useCallback(() => engineRef.current?.closeInspect(), []),
    zoomIn: useCallback(() => engineRef.current?.zoom(0.8), []),
    zoomOut: useCallback(() => engineRef.current?.zoom(-0.8), []),
    resetView: useCallback(() => engineRef.current?.resetView(), []),
  };

  return { canvasRef, state, api };
}
