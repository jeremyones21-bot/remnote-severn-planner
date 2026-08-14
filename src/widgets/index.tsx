import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import { DEFAULT_PLANNER_URL, PANE_WIDGET, PLANNER_URL_SETTING, TAB_ICON } from '../constants';
import { collectPaneKeys, removePane, toRemIdTree } from '../window_tree';

const describe = (e: unknown) =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e);

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.settings.registerStringSetting({
    id: PLANNER_URL_SETTING,
    title: 'Assignments URL',
    description: 'The site loaded inside the Assignments pane.',
    defaultValue: DEFAULT_PLANNER_URL,
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

  // A sidebar *button* rather than a tab: it runs an action on click instead of
  // taking over the sidebar body, so there's no document tree to switch back to.
  // `registerSidebarButton` is marked @hidden in the SDK and its runtime only
  // forwards { id, name } - no icon, no shortcut - so RemNote may render it
  // plainly or ignore it outright. It costs nothing if unsupported.
  // Remembers which pane holds the planner so a second click can close it.
  // Widget panes have no remId, so panes are keyed by paneId and the planner's
  // is found by diffing the layout either side of the open.
  let plannerPaneKey: string | undefined;

  const toggle = async () => {
    try {
      const before = await plugin.window.getCurrentWindowTree();
      const beforeKeys = collectPaneKeys(before);

      if (plannerPaneKey && beforeKeys.includes(plannerPaneKey)) {
        const remaining = removePane(before, plannerPaneKey);
        // RemNote needs at least one pane, so refuse rather than empty it.
        if (!remaining) {
          await plugin.app.toast('Assignments is the only open pane, so it stays open.');
          return;
        }
        const tree = toRemIdTree(remaining);
        if (!tree) {
          await plugin.app.toast("Assignments: can't close - another widget pane is open.");
          return;
        }
        await plugin.window.setRemWindowTree(tree);
        plannerPaneKey = undefined;
        return;
      }

      await plugin.window.openWidgetInPane(PANE_WIDGET);

      // Whatever pane appeared is the planner's.
      const afterKeys = collectPaneKeys(await plugin.window.getCurrentWindowTree());
      plannerPaneKey = afterKeys.find((k) => !beforeKeys.includes(k));
    } catch (e) {
      await plugin.app.toast('Assignments: ' + describe(e));
    }
  };

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
