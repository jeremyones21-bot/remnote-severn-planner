import { renderWidget, usePlugin, useTrackerPlugin } from '@remnote/plugin-sdk';
import '../style.css';
import '../assignments_pane.css';
import { DEFAULT_PLANNER_URL, PLANNER_URL_SETTING } from './index';

export const AssignmentsFrame = ({ url }: { url: string }) => (
  <iframe
    className="assignments-frame"
    src={url}
    title="Severn Planner"
    allow="clipboard-read; clipboard-write; fullscreen"
  />
);

export const AssignmentsPane = () => {
  const plugin = usePlugin();
  const url = useTrackerPlugin(() =>
    plugin.settings.getSetting<string>(PLANNER_URL_SETTING)
  );

  // `undefined` means the setting hasn't come back yet; don't load the iframe
  // twice by rendering the default first and swapping it out.
  if (url === undefined) {
    return <div className="assignments-frame__loading" />;
  }

  return <AssignmentsFrame url={url || DEFAULT_PLANNER_URL} />;
};

renderWidget(AssignmentsPane);
