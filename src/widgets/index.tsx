import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import { DEFAULT_PLANNER_URL, PANE_WIDGET, PLANNER_URL_SETTING } from '../constants';

const describe = (e: unknown) =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e);

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.settings.registerStringSetting({
    id: PLANNER_URL_SETTING,
    title: 'Assignments URL',
    description: 'The site loaded inside the Assignments pane.',
    defaultValue: DEFAULT_PLANNER_URL,
  });

  // The "Assignments" row itself.
  try {
    await plugin.app.registerWidget('assignments_sidebar', WidgetLocation.LeftSidebar, {
      dimensions: { height: 'auto', width: '100%' },
    });
  } catch (e) {
    await plugin.app.toast('Assignments: sidebar row failed to register - ' + describe(e));
  }

  // The full-size view that the row opens.
  //
  // `height` must be a number or 'auto'. A percentage is valid for `width`
  // only; passing height: '100%' makes registration fail, and a pane widget
  // that never registered means openWidgetInPane silently does nothing.
  try {
    await plugin.app.registerWidget(PANE_WIDGET, WidgetLocation.Pane, {
      dimensions: { height: 'auto', width: '100%' },
      widgetTabTitle: 'Assignments',
    });
  } catch (e) {
    await plugin.app.toast('Assignments: pane failed to register - ' + describe(e));
  }

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

  // RemNote gives plugins one fixed sidebar slot with no API to pick an index,
  // and appears to render plugin rows in a container separate from the built-in
  // ones - so this may well not move anything. It is harmless if it doesn't.
  await plugin.app.registerCSS(
    'assignments-sidebar-order',
    `
    [data-plugin-id='severn-planner'],
    *:has(> [data-plugin-id='severn-planner']),
    *:has(> * > [data-plugin-id='severn-planner']) {
      order: -1;
    }
    `
  );
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
