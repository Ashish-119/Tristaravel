/**
 * No-op stub for the Create/Anything platform's in-browser visual design editor.
 *
 * The original `shared/design-mode` module ships with the hosted platform and
 * powers the click-to-select / edit-styles overlay used inside the builder's
 * iframe. It is irrelevant to running the actual deployed app, so this stub
 * satisfies the import and lets the app render normally.
 *
 * Vendored into apps/web (was ../../../../shared/design-mode) so this folder is
 * self-contained and can be deployed on its own.
 */

export type ResolvedElement = {
  element: Element;
};

export type StyleInfo = {
  className: string;
  styles: Record<string, string> | null;
};

export type GetStyleInfo = (resolved: ResolvedElement) => StyleInfo;

/**
 * Initializes design mode. The real implementation wires up DOM selection and
 * postMessage communication with the parent editor and returns a `reselect`
 * function. Here it's a no-op that returns a no-op reselect callback.
 */
export function initDesignMode(_getStyleInfo: GetStyleInfo): () => void {
  return () => {};
}
