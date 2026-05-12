import { useEffect } from "react";

/**
 * Stack global de handlers de "voltar" (LIFO).
 * Páginas registram um handler quando há estado interno (modal, conversa
 * selecionada, etc.) que deve ser fechado antes de cair no histórico do browser.
 *
 * Usado pelo gesto de swipe-back e pode ser invocado por outros lugares.
 */
type BackHandler = () => boolean | void;

const stack: BackHandler[] = [];

export function runTopBackHandler(): boolean {
  const fn = stack[stack.length - 1];
  if (!fn) return false;
  const result = fn();
  return result !== false;
}

export function useBackHandler(handler: BackHandler, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    stack.push(handler);
    return () => {
      const idx = stack.lastIndexOf(handler);
      if (idx >= 0) stack.splice(idx, 1);
    };
  }, [enabled, handler]);
}
