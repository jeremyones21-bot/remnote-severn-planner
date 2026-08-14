import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../index.css';

export const PLANNER_URL_SETTING = 'planner-url';
export const DEFAULT_PLANNER_URL = 'https://severnplanner.edgeone.app';

async function onActivate(plugin: ReactRNPlugin) {
  // Lets you point the plugin at a different deployment (or a local dev build)
  // without rebuilding it.
  await plugin.settings.registerStringSetting({
    id: PLANNER_URL_SETTING,
    title: 'Severn Planner URL',
    description: 'The site loaded inside the Assignments pane.',
    defaultValue: DEFAULT_PLANNER_URL,
  });

  // The "Assignments" row itself.
  await plugin.app.registerWidget('assignments_sidebar', WidgetLocation.LeftSidebar, {
    dimensions: { height: 'auto', width: '100%' },
  });

  // The full-size view that the row opens.
  await plugin.app.registerWidget('assignments_pane', WidgetLocation.Pane, {
    dimensions: { height: '100%', width: '100%' } as any,
    widgetTabTitle: 'Assignments',
  });

  await plugin.app.registerCommand({
    id: 'open-assignments',
    name: 'Open Assignments',
    description: 'Open the Severn Planner inside RemNote',
    action: async () => {
      await plugin.window.openWidgetInPane('assignments_pane');
    },
  });

  // RemNote drops every plugin into one fixed slot in the left sidebar, so a
  // plugin cannot ask to be inserted at a specific index. The sidebar is a
  // flex column, though, so a negative `order` pulls our row up above the
  // built-in Flashcards/Search rows.
  await plugin.app.registerCSS(
    'assignments-sidebar-order',
    `
    [data-plugin-id='severn-planner'] {
      order: -1;
    }
    `
  );
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
