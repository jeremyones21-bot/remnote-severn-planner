import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import { DEFAULT_PLANNER_URL, PANE_WIDGET, PLANNER_URL_SETTING, TAB_ICON } from '../constants';

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
  try {
    await plugin.app.registerSidebarButton({
      id: 'assignments-sidebar-button',
      name: 'Assignments',
      action: async () => {
        try {
          await plugin.window.openWidgetInPane(PANE_WIDGET);
        } catch (e) {
          await plugin.app.toast('Assignments: could not open - ' + describe(e));
        }
      },
    });
  } catch (e) {
    await plugin.app.toast('Assignments: sidebar button unsupported - ' + describe(e));
  }

  // Confirmed working via the command palette, so it stays as the reliable
  // path and as something to bind a shortcut to.
  await plugin.app.registerCommand({
    id: 'open-assignments',
    name: 'Open Assignments',
    description: 'Open the Severn Planner inside RemNote',
    action: async () => {
      try {
        await plugin.window.openWidgetInPane(PANE_WIDGET);
      } catch (e) {
        await plugin.app.toast('Assignments: could not open - ' + describe(e));
      }
    },
  });
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
