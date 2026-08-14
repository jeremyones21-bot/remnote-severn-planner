import { renderWidget, usePlugin } from '@remnote/plugin-sdk';
import { useEffect, useState } from 'react';
import { PANE_WIDGET } from '../constants';

/**
 * RemNote draws the sidebar entry itself (from `widgetTabTitle` /
 * `widgetTabIcon`) and mounts this component only once the tab is opened.
 * So opening the tab *is* the click - the pane is launched on mount, and this
 * panel is just the fallback if that ever fails.
 *
 * All styling is inline: the production build extracts CSS to `[name].css`,
 * which the template's HTML shim never injects, so installed builds load no
 * stylesheet at all.
 */

const describe = (e: unknown) =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e);

const button: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid rgba(127,127,127,0.35)',
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  fontSize: 13,
  cursor: 'pointer',
};

export const AssignmentsLauncher = ({
  open,
  error,
}: {
  open: () => void;
  error?: string;
}) => (
  <div style={{ padding: 8, fontSize: 13, lineHeight: '18px' }}>
    {error && (
      <div style={{ marginBottom: 8, opacity: 0.85 }}>Couldn't open automatically: {error}</div>
    )}
    <button type="button" style={button} onClick={open}>
      Open Assignments
    </button>
  </div>
);

export const AssignmentsSidebar = () => {
  const plugin = usePlugin();
  const [error, setError] = useState<string | undefined>();

  const open = async () => {
    try {
      await plugin.window.openWidgetInPane(PANE_WIDGET);
      setError(undefined);
    } catch (e) {
      setError(describe(e));
    }
  };

  useEffect(() => {
    open();
  }, []);

  return <AssignmentsLauncher open={open} error={error} />;
};

renderWidget(AssignmentsSidebar);
