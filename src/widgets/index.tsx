import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import { DEFAULT_PLANNER_URL, PANE_WIDGET, PLANNER_URL_SETTING } from '../constants';

async function onActivate(plugin: ReactRNPlugin) {
  // Lets you point the plugin at a different deployment (or a local dev build)
  // without rebuilding it.
  await plugin.settings.registerStringSetting({
    id: PLANNER_URL_SETTING,
    title: 'Assignments URL',
    description: 'The site loaded inside the Assignments pane.',
    defaultValue: DEFAULT_PLANNER_URL,
  });

  // The "Assignments" row itself.
  await plugin.app.registerWidget('assignments_sidebar', WidgetLocation.LeftSidebar, {
    dimensions: { height: 'auto', width: '100%' },
  });

  // The full-size view that the row opens.
  await plugin.app.registerWidget(PANE_WIDGET, WidgetLocation.Pane, {
    dimensions: { height: '100%', width: '100%' } as any,
    widgetTabTitle: 'Assignments',
  });

  await plugin.app.registerCommand({
    id: 'open-assignments',
    name: 'Open Assignments',
    description: 'Open the Severn Planner inside RemNote',
    action: async () => {
      await plugin.window.openWidgetInPane(PANE_WIDGET);
    },
  });

  // RemNote drops every plugin into one fixed slot in the left sidebar, with no
  // API to pick an index. If RemNote happens to lay the plugin row out in the
  // same flex container as the built-in rows, a negative `order` lifts it above
  // them; the `:has()` rules cover the case where it sits inside a wrapper. If
  // RemNote renders plugins in a separate container further down the sidebar,
  // none of this can move it and the row stays where RemNote puts it.
  await plugin.app.registerCSS(
    'assignments-sidebar-order',
    `
    [data-plugin-id='severn-planner'],
    [data-plugin-id='severn-planner-assignments_sidebar'],
    *:has(> [data-plugin-id='severn-planner']),
    *:has(> * > [data-plugin-id='severn-planner']) {
      order: -1;
    }
    `
  );
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
