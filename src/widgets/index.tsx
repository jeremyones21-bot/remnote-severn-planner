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

  // LeftSidebar is a *tab* location: RemNote draws the entry itself from
  // `widgetTabTitle` / `widgetTabIcon`, and only mounts the widget's React
  // once the tab is opened. Supplying neither is what produced an unlabelled
  // placeholder icon that appeared to do nothing when clicked.
  try {
    await plugin.app.registerWidget('assignments_sidebar', WidgetLocation.LeftSidebar, {
      dimensions: { height: 'auto', width: '100%' },
      widgetTabTitle: 'Assignments',
      widgetTabIcon: TAB_ICON,
      // Without this the tab opens on every launch, which would pop the
      // planner open each time RemNote starts.
      dontOpenByDefaultInTabLocation: true,
    });
  } catch (e) {
    await plugin.app.toast('Assignments: sidebar entry failed to register - ' + describe(e));
  }

  try {
    await plugin.app.registerWidget(PANE_WIDGET, WidgetLocation.Pane, {
      dimensions: { height: 'auto', width: '100%' },
      widgetTabTitle: 'Assignments',
      widgetTabIcon: TAB_ICON,
    });
  } catch (e) {
    await plugin.app.toast('Assignments: pane failed to register - ' + describe(e));
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
