/**
 * Helpers for RemNote's pane layout.
 *
 * `getCurrentWindowTree()` returns a mosaic of `{ remId, paneId }` leaves, while
 * `setRemWindowTree()` expects the same mosaic with plain remId strings as
 * leaves - so closing a pane means rebuilding the tree without that leaf.
 *
 * Kept outside `src/widgets/` so it doesn't become its own webpack entry.
 */

type MosaicParent = { direction: string; first: any; second: any; splitPercentage?: number };

const isLeaf = (node: any) => typeof node === 'string' || (node && typeof node.remId === 'string');

const leafId = (node: any): string => (typeof node === 'string' ? node : node.remId);

/** Every remId in the tree, in order. */
export const collectRemIds = (node: any, out: string[] = []): string[] => {
  if (!node) return out;
  if (isLeaf(node)) {
    out.push(leafId(node));
    return out;
  }
  collectRemIds(node.first, out);
  collectRemIds(node.second, out);
  return out;
};

/**
 * Rebuild the tree without `id`, collapsing any parent left with a single
 * child. Returns undefined if removing `id` would empty the tree, which the
 * caller must treat as "refuse to close" - RemNote needs at least one pane.
 */
export const removeRemId = (node: any, id: string): any => {
  if (!node) return undefined;
  if (isLeaf(node)) return leafId(node) === id ? undefined : leafId(node);

  const first = removeRemId(node.first, id);
  const second = removeRemId(node.second, id);
  if (!first) return second;
  if (!second) return first;
  return { ...(node as MosaicParent), first, second };
};
