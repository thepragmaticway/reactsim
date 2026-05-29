import { renderRealDomTree } from "./treeView.js";

export function createRealDomMonitor({ watchedRoot, treeRoot, onMutation }) {
  function renderTree(label = "") {
    treeRoot.innerHTML = renderRealDomTree(watchedRoot, label);
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      const event = {
        id: crypto.randomUUID(),
        source: "direct-dom",
        phase: "browser commit",
        type: `mutation:${record.type}`,
        detail: {
          target: record.target.nodeName.toLowerCase(),
          added: record.addedNodes.length,
          removed: record.removedNodes.length
        },
        time: performance.now()
      };
      onMutation(event);
    }
    renderTree();
  });

  observer.observe(watchedRoot, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });

  renderTree();
  return { renderTree, disconnect: () => observer.disconnect() };
}
