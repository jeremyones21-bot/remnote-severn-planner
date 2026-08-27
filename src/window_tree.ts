/**
 * Helpers for RemNote's pane layout.
 *
 * `getCurrentWindowTree()` returns a mosaic whose leaves are `{ remId, paneId }`.
 * A *widget* pane has no Rem behind it, so its `remId` is missing - which is why
 * identifying our pane by remId failed, and is very likely why RemNote logs
 * "cannot parse window string" when it serialises a layout containing one.
 *
 * So panes are identified by `paneId`. Closing still has to hand
 * `setRemWindowTree()` a tree of remId strings, but that's fine: we only ever
 * remove the widget leaf, and every surviving leaf is a real Rem pane.
 *
 * Kept outside `src/widgets/` so it doesn't become its own webpack entry.
 */

export const isLeafNode = (node: any): boolean => {
  if (typeof node === 'string') return true;
  if (!node || typeof node !== 'object') return false;
  return node.first === undefined && node.second === undefined;
};

/** Stable identity for a leaf: paneId when present, else remId, else the string itself. */
export const paneKey = (node: any): string | undefined => {
  if (typeof node === 'string') return node;
  if (!node) return undefined;
  return node.paneId ?? node.remId;
};

/** Every pane key in the tree, in order. */
export const collectPaneKeys = (node: any, out: string[] = []): string[] => {
  if (!node) return out;
  if (isLeafNode(node)) {
    const k = paneKey(node);
    if (k) out.push(k);
    return out;
  }
  collectPaneKeys(node.first, out);
  collectPaneKeys(node.second, out);
  return out;
};

/**
 * Rebuild the tree without the leaf whose pane key is `key`, collapsing any
 * parent left with one child. Leaves are returned untouched, so the result
 * still needs `toRemIdTree`. Returns undefined if the tree would be emptied.
 */
export const removePane = (node: any, key: string): any => {
  if (!node) return undefined;
  if (isLeafNode(node)) return paneKey(node) === key ? undefined : node;

  const first = removePane(node.first, key);
  const second = removePane(node.second, key);
  if (!first) return second;
  if (!second) return first;
  return { ...node, first, second };
};

/**
 * Convert a tree of `{ remId, paneId }` leaves into the remId-string tree
 * `setRemWindowTree` expects. Returns undefined if any leaf has no remId -
 * meaning another widget pane is open and the layout can't be expressed.
 */
export const toRemIdTree = (node: any): any => {
  if (!node) return undefined;
  if (isLeafNode(node)) {
    if (typeof node === 'string') return node;
    // Widget panes have NO remId in the tree - verified against RemNote's own
    // output. Falling back to paneId is destructive: RemNote reads it as a
    // RemId and replaces the widget with a pane pointing at a Rem that doesn't
    // exist. Refuse instead, so the caller skips the write.
    return typeof node.remId === 'string' && node.remId ? node.remId : undefined;
  }
  const first = toRemIdTree(node.first);
  const second = toRemIdTree(node.second);
  if (!first || !second) return undefined;
  return { ...node, first, second };
};

/**
 * Set the split ratio of whichever parent holds the pane keyed `key`.
 *
 * `otherPercent` is the share given to the *other* pane, so the caller doesn't
 * have to care which side the planner landed on. RemNote's window string ends
 * in this number - e.g. `(notes~)_(widget~ID)_53` - and `splitPercentage` is
 * always the first child's share.
 */
export const setSplitForPane = (node: any, key: string, otherPercent: number): any => {
  if (!node || isLeafNode(node)) return node;

  if (isLeafNode(node.first) && paneKey(node.first) === key) {
    return { ...node, splitPercentage: 100 - otherPercent };
  }
  if (isLeafNode(node.second) && paneKey(node.second) === key) {
    return { ...node, splitPercentage: otherPercent };
  }
  return {
    ...node,
    first: setSplitForPane(node.first, key, otherPercent),
    second: setSplitForPane(node.second, key, otherPercent),
  };
};

/**
 * Rewrite the split percentage in RemNote's window URL.
 *
 * `getURL()` returns e.g.
 *   /w/<kb>/(College-Essay-Ideas-ss8wgQBknVCx4Q2Te)_(widget~ezj6GaNbNgPH7BGWu)_50
 * which is the one place the widget pane's id is exposed - the pane tree has
 * only a paneId, and getOpenPaneRemId returns undefined for it. So the split is
 * set through the URL rather than setRemWindowTree, which cannot represent a
 * widget pane at all.
 *
 * `otherPercent` is the share for the non-planner pane. Returns undefined when
 * the URL isn't a two-pane layout containing the planner, so the caller can
 * leave the layout untouched.
 */
export const setSplitInWindowUrl = (url: string, otherPercent: number): string | undefined => {
  const trailing = url.match(/^(.*)_(\d+)$/);
  if (!trailing) return undefined;

  const panes = trailing[1];
  const sep = panes.lastIndexOf(')_(');
  if (sep === -1) return undefined;

  const first = panes.slice(0, sep + 1);
  const second = panes.slice(sep + 2);

  const plannerFirst = first.includes('widget~');
  const plannerSecond = second.includes('widget~');
  if (plannerFirst === plannerSecond) return undefined; // neither, or ambiguous

  const percent = plannerSecond ? otherPercent : 100 - otherPercent;
  if (percent < 1 || percent > 99) return undefined;

  return `${panes}_${percent}`;
};
