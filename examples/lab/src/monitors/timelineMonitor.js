import { escapeHtml } from "./treeView.js";

const labels = {
  "runtime:render:start": "render start",
  "runtime:render:end": "commit end",
  "virtual:diff": "virtual diff",
  "state:update": "state update"
};

export function createTimelineMonitor(root) {
  const events = [];

  function push(event) {
    events.unshift(event);
    if (events.length > 80) events.pop();
    render();
  }

  function render() {
    root.innerHTML = events
      .map((event) => {
        const label = labels[event.type] || event.type;
        const note = event.detail?.note || event.patch?.op || event.phase || "";
        const count = event.patches ? ` (${event.patches.length} patches)` : "";
        return `
          <li class="timeline-item ${event.source === "direct-dom" ? "dirty" : "clean"}">
            <span>${escapeHtml(label)}${count}</span>
            <small>${escapeHtml(event.source || "reactsim")} / ${escapeHtml(note)}</small>
          </li>
        `;
      })
      .join("");
  }

  function clear() {
    events.length = 0;
    render();
  }

  return { push, render, clear };
}
