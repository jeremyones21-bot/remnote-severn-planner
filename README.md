# Severn Planner for RemNote

Adds an **Assignments** entry to the RemNote left sidebar. Clicking it opens
[severnplanner.edgeone.app](https://severnplanner.edgeone.app) in a RemNote pane, so
assignments and notes live in the same window.

## Install

**From a build**

1. `npm install`
2. `npm run build` — produces `PluginZip.zip`
3. RemNote → Settings → Plugins → **Build** → upload the zip

**For development**

1. `npm run dev` (serves on port 8080)
2. RemNote → Settings → Plugins → **Build** → *Develop from localhost* → `http://localhost:8080`

## Settings

| Setting | Default | Purpose |
| --- | --- | --- |
| Assignments URL | `https://severnplanner.edgeone.app` | The site loaded in the pane. Point it at a local dev build to test changes. |
| Open Assignments in | Pane | `Pane` is full size; `Floating window` avoids the error below. |

## The "cannot parse window string" error

RemNote logs this every time the planner opens **in a pane**. The string appears nowhere
in the plugin SDK — it comes from RemNote's own code. The cause is visible in the pane
layout: `getCurrentWindowTree()` returns `{ remId, paneId }` leaves, and a *widget* pane
has no Rem behind it, so it has no `remId` to encode when RemNote serialises the layout
to a string (the format `setCurrentWindowTreeFromString` consumes). The same missing
`remId` is why an early version of the toggle silently opened a second planner.

A plugin can't suppress errors raised by RemNote's own serialiser. The workaround is to
avoid panes: set **Open Assignments in → Floating window**, which uses
`openFloatingWidget` and never touches the pane layout.

## Commands

`Open Assignments` — opens the planner in the focused pane, so it can be bound to a
shortcut or run from the command palette.

## How the sidebar entry works

The **Assignments** row comes from `plugin.app.registerSidebarButton`, which puts a real
row in the main sidebar list (below Flashcards, above Create) that runs an action on
click. This is the right tool for the job — but note it's marked `@hidden` in the SDK,
so it's undocumented and could change in a future release.

Its runtime sends only `{ id, name }`:

```js
registerSidebarButton: n => { const {id, name, action} = n; ...; this._call("registerSidebarButton", {id, name}) }
```

So **the `icon` field on `Command` is dropped client-side and never reaches RemNote.**
The row always shows RemNote's generic plugin puzzle icon; there is no supported way to
change it from inside the plugin.

### Why not `WidgetLocation.LeftSidebar`

That location is a **tab strip**, not a slot for a row, and it was tried first. RemNote
draws the tab from `widgetTabTitle` / `widgetTabIcon` and mounts the widget only once the
tab is selected — which swaps the sidebar body away from the document tree, with no API
to switch it back. Traps found along the way, if anyone revisits it:

- Registering without `widgetTabTitle` / `widgetTabIcon` yields an unlabelled default
  icon, and the widget's React never mounts until the tab is opened — so click handlers
  appear dead and no error surfaces anywhere.
- `dontOpenByDefaultInTabLocation: true` removes the entry from the sidebar **entirely**
  rather than leaving it closed.

## Project layout

| File | Role |
| --- | --- |
| `src/widgets/index.tsx` | Registers widgets, the setting, the command, and the ordering CSS |
| `src/widgets/assignments_sidebar.tsx` | The clickable **Assignments** sidebar row |
| `src/widgets/assignments_pane.tsx` | The pane that hosts the planner in an iframe |
