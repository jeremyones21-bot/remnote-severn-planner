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
| Severn Planner URL | `https://severnplanner.edgeone.app` | The site loaded in the pane. Point it at a local dev build to test changes. |

## Commands

`Open Assignments` — opens the planner in the focused pane, so it can be bound to a
shortcut or run from the command palette.

## How the sidebar entry behaves

`WidgetLocation.LeftSidebar` is a **tab strip**, not a slot for a row. RemNote draws the
tab itself from `widgetTabTitle` / `widgetTabIcon` and mounts the widget only when that
tab is selected — selecting it swaps the sidebar body away from the document tree, and
swapping back restores it.

Consequences worth knowing before changing any of this:

- The entry **cannot** be placed above Flashcards. Plugin tabs live in their own strip.
- Registering without `widgetTabTitle` / `widgetTabIcon` yields an unlabelled default
  icon, and the widget's React never mounts until the tab is opened — so click handlers
  appear dead and no error surfaces anywhere.
- `dontOpenByDefaultInTabLocation: true` removes the entry from the sidebar **entirely**
  rather than leaving it closed. Don't set it.

## Project layout

| File | Role |
| --- | --- |
| `src/widgets/index.tsx` | Registers widgets, the setting, the command, and the ordering CSS |
| `src/widgets/assignments_sidebar.tsx` | The clickable **Assignments** sidebar row |
| `src/widgets/assignments_pane.tsx` | The pane that hosts the planner in an iframe |
