import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import { DEFAULT_PLANNER_URL, PANE_WIDGET, PLANNER_URL_SETTING, TAB_ICON } from '../constants';
import { collectRemIds, removeRemId } from '../window_tree';

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
  // A widget pane has no RemId of its own, so it's identified by diffing the
  // pane layout either side of the open.
  let plannerPaneId: string | undefined;

  const toggle = async () => {
    try {
      const before = await plugin.window.getCurrentWindowTree();
      const beforeIds = collectRemIds(before);

      if (plannerPaneId && beforeIds.includes(plannerPaneId)) {
        const remaining = removeRemId(before, plannerPaneId);
        // RemNote needs at least one pane, so refuse rather than empty it.
        if (!remaining) {
          await plugin.app.toast('Assignments is the only open pane, so it stays open.');
          return;
        }
        await plugin.window.setRemWindowTree(remaining);
        plannerPaneId = undefined;
        return;
      }

      await plugin.window.openWidgetInPane(PANE_WIDGET);

      // Whatever leaf appeared is the planner's pane.
      const afterIds = collectRemIds(await plugin.window.getCurrentWindowTree());
      plannerPaneId = afterIds.find((id) => !beforeIds.includes(id));
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
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
