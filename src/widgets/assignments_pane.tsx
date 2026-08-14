import { renderWidget, usePlugin, useTrackerPlugin } from '@remnote/plugin-sdk';
import { useEffect } from 'react';
import { DEFAULT_PLANNER_URL, PLANNER_URL_SETTING } from '../constants';

/**
 * As with the sidebar row: no CSS file, because installed builds never load one.
 * The height chain has to be forced from script instead.
 */
const useFullHeightDocument = () => {
  useEffect(() => {
    const nodes: HTMLElement[] = [document.documentElement, document.body];
    let el = document.body.firstElementChild as HTMLElement | null;
    while (el) {
      nodes.push(el);
      el = el.firstElementChild as HTMLElement | null;
    }
    const previous = nodes.map((n) => n.style.cssText);
    nodes.forEach((n) => {
      n.style.height = '100%';
      n.style.margin = '0';
      n.style.padding = '0';
    });
    return () => nodes.forEach((n, i) => (n.style.cssText = previous[i]));
  }, []);
};

export const AssignmentsFrame = ({ url }: { url: string }) => (
  <iframe
    src={url}
    title="Severn Planner"
    allow="clipboard-read; clipboard-write; fullscreen"
    style={{ display: 'block', width: '100%', height: '100%', border: 0 }}
  />
);

export const AssignmentsPane = () => {
  const plugin = usePlugin();
  useFullHeightDocument();

  const url = useTrackerPlugin(() => plugin.settings.getSetting<string>(PLANNER_URL_SETTING));

  // `undefined` means the setting hasn't resolved yet; rendering the default
  // first would load the iframe twice.
  if (url === undefined) {
    return <div style={{ width: '100%', height: '100%' }} />;
  }

  return <AssignmentsFrame url={url || DEFAULT_PLANNER_URL} />;
};

renderWidget(AssignmentsPane);
