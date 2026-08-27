import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import {
  DEFAULT_PLANNER_URL,
  OPEN_IN_FLOATING,
  OPEN_IN_PANE,
  OPEN_IN_SETTING,
  PANE_WIDGET,
  DEFAULT_SPLIT,
  SPLIT_SETTING,
  PLANNER_URL_SETTING,
  TAB_ICON,
} from '../constants';
import { collectPaneKeys, removePane, setSplitForPane, toRemIdTree } from '../window_tree';

const describe = (e: unknown) =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e);

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.settings.registerStringSetting({
    id: PLANNER_URL_SETTING,
    title: 'Assignments URL',
    description: 'The site loaded inside the Assignments pane.',
    defaultValue: DEFAULT_PLANNER_URL,
  });

  // RemNote persists the pane layout as a string, and a widget pane has no
  // RemId to encode into it - which is what makes RemNote log "cannot parse
  // window string" on every open. That's RemNote's own serialiser and a plugin
  // can't suppress it, so this offers a mode that never touches the pane
  // layout at all.
  await plugin.settings.registerDropdownSetting({
    id: OPEN_IN_SETTING,
    title: 'Open Assignments in',
    description:
      'A floating window avoids RemNote\'s "cannot parse window string" errors, which only occur for panes.',
    defaultValue: OPEN_IN_PANE,
    options: [
      { key: OPEN_IN_PANE, label: 'Pane (default, full size)', value: OPEN_IN_PANE },
      { key: OPEN_IN_FLOATING, label: 'Floating window (avoids the window-string errors)', value: OPEN_IN_FLOATING },
    ],
  });

  await plugin.settings.registerNumberSetting({
    id: SPLIT_SETTING,
    title: 'Split: percent given to the other pane',
    description:
      'When Assignments opens beside a document, how much width the document keeps. 55 leaves the planner 45%.',
    defaultValue: DEFAULT_SPLIT,
  });

  // No WidgetLocation.LeftSidebar widget here on purpose. That location is a
  // tab strip: selecting it swaps the sidebar body away from the document tree,
  // which is worse than the sidebar button below and can't be switched back
  // (there is no API to select a sidebar tab). See the README.
  try {
    await plugin.app.registerWidget(PANE_WIDGET, WidgetLocation.Pane, {
      dimensions: { height: 'auto', width: '100%' },
      widgetTabTitle: 'Assignments',
      widgetTabIcon: TAB_ICON,
    });
  } catch (e) {
    await plugin.app.toast('Assignments: pane failed to register - ' + describe(e));
  }

  // Same widget file, second location - floating widgets live outside the pane
  // layout, so opening one never triggers the window-string serialisation.
  try {
    await plugin.app.registerWidget(PANE_WIDGET, WidgetLocation.FloatingWidget, {
      dimensions: { height: 640, width: 980 },
      widgetTabTitle: 'Assignments',
    });
  } catch (e) {
    await plugin.app.toast('Assignments: floating window failed to register - ' + describe(e));
  }

  // Remembers which pane holds the planner so a second click can close it.
  // Widget panes have no remId, so panes are keyed by paneId and the planner's
  // is found by diffing the layout either side of the open.
  let plannerPaneKey: string | undefined;

  /**
   * Is the planner still in the pane we opened it in?
   *
   * A matching paneId is NOT enough: RemNote reuses paneIds, so after the
   * planner is closed the same pane can hold a document. Asking for that pane's
   * remId settles it - a widget pane has no Rem behind it, so a real remId
   * coming back means the planner is gone and the key is stale.
   */
  const plannerStillOpenAt = async (key: string) => {
    try {
      const remId = await plugin.window.getOpenPaneRemId(key);
      // No Rem at all, or RemNote's synthetic `widget~<id>`, both mean the pane
      // still holds a widget. A real RemId means a document took the paneId over.
      return !remId || remId.startsWith('widget');
    } catch {
      return false;
    }
  };

  let floatingId: string | undefined;

  const toggleFloating = async () => {
    if (floatingId && (await plugin.window.isFloatingWidgetOpen(floatingId))) {
      await plugin.window.closeFloatingWidget(floatingId);
      floatingId = undefined;
      return;
    }
    floatingId = await plugin.window.openFloatingWidget(PANE_WIDGET, { top: 64, left: 180 });
  };

  /**
   * Resize the split so the planner takes its configured share. Cosmetic, so
   * any failure is swallowed rather than nagged about.
   */
  const applySplit = async (key: string) => {
    try {
      const pct = (await plugin.settings.getSetting<number>(SPLIT_SETTING)) ?? DEFAULT_SPLIT;
      const tree = await plugin.window.getCurrentWindowTree();
      const next = toRemIdTree(setSplitForPane(tree, key, pct));
      if (next) await plugin.window.setRemWindowTree(next);
    } catch {
      /* leave the layout as RemNote made it */
    }
  };

  const toggle = async () => {
    try {
      const mode = await plugin.settings.getSetting<string>(OPEN_IN_SETTING);
      if (mode === OPEN_IN_FLOATING) {
        await toggleFloating();
        return;
      }

      const before = await plugin.window.getCurrentWindowTree();
      const beforeKeys = collectPaneKeys(before);

      const trackedPaneHasPlanner =
        !!plannerPaneKey &&
        beforeKeys.includes(plannerPaneKey) &&
        (await plannerStillOpenAt(plannerPaneKey));

      // Stale key: the pane was closed, or RemNote handed that paneId to a
      // document. Forget it and fall through to opening the planner again.
      if (plannerPaneKey && !trackedPaneHasPlanner) plannerPaneKey = undefined;

      if (plannerPaneKey && trackedPaneHasPlanner) {
        const remaining = removePane(before, plannerPaneKey);
        const tree = remaining ? toRemIdTree(remaining) : undefined;
        // Closing isn't expressible (planner is the only pane, or another
        // widget pane is open). Leave the layout alone and say nothing - this
        // is a limitation, not something the user did wrong.
        if (!tree) return;
        await plugin.window.setRemWindowTree(tree);
        plannerPaneKey = undefined;
        return;
      }

      await plugin.window.openWidgetInPane(PANE_WIDGET);

      // Whatever pane appeared is the planner's.
      const afterKeys = collectPaneKeys(await plugin.window.getCurrentWindowTree());
      plannerPaneKey = afterKeys.find((k) => !beforeKeys.includes(k));
      if (plannerPaneKey) await applySplit(plannerPaneKey);
    } catch (e) {
      await plugin.app.toast('Assignments: ' + describe(e));
    }
  };

  // A sidebar *button* rather than a tab: it runs an action on click instead of
  // taking over the sidebar body, so there's no document tree to switch back to.
  // `registerSidebarButton` is marked @hidden in the SDK and its runtime only
  // forwards { id, name } - no icon, no shortcut.
  try {
    await plugin.app.registerSidebarButton({
      id: 'assignments-sidebar-button',
      name: 'Assignments',
      action: toggle,
    });
  } catch (e) {
    await plugin.app.toast('Assignments: sidebar button unsupported - ' + describe(e));
  }

  // Confirmed working via the command palette, so it stays as the reliable
  // path and as something to bind a shortcut to.
  await plugin.app.registerCommand({
    id: 'open-assignments',
    name: 'Open Assignments',
    description: 'Open or close the Severn Planner inside RemNote',
    action: toggle,
  });

  // Diagnostic: prints the raw pane layout so the toggle can be fixed against
  // what RemNote actually returns rather than what its types imply.
  await plugin.app.registerCommand({
    id: 'assignments-pane-layout',
    name: 'Assignments: show pane layout',
    description: 'Print the current pane layout for debugging',
    action: async () => {
      try {
        const tree = await plugin.window.getCurrentWindowTree();
        await plugin.app.toast('tree: ' + JSON.stringify(tree));
        await plugin.app.toast('keys: ' + JSON.stringify(collectPaneKeys(tree)));
        await plugin.app.toast('tracking: ' + (plannerPaneKey ?? 'nothing'));
      } catch (e) {
        await plugin.app.toast('Assignments: ' + describe(e));
      }
    },
  });
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
