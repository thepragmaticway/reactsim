import { renderRealDomTree } from "./treeView.js";

export function createRendererDomMonitor({ runtime, previewRoot, treeRoot }) {
  function renderTree(changedId) {
    treeRoot.innerHTML = renderRealDomTree(previewRoot, changedId);
  }

  runtime.bus.on("*", (event) => {
    if (event.type.startsWith("dom:")) {
      renderTree(event.nodeId);
    }
  });

  renderTree();

  return { renderTree };
}
