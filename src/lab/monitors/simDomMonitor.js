import { renderSimTree } from "./treeView.js";

export function createSimDomMonitor({ runtime, previewRoot, treeRoot }) {
  function renderPreview() {
    const tree = runtime.getPhysicalTree();
    previewRoot.innerHTML = "";
    if (tree) previewRoot.append(renderNode(tree));
  }

  function renderNode(node) {
    if (node.type === "#text") return document.createTextNode(node.text);

    const element = document.createElement(node.type);
    for (const [name, value] of Object.entries(node.props || {})) {
      if (value === false || value === undefined) continue;
      if (name === "class") element.className = value;
      else if (name === "checked") element.checked = Boolean(value);
      else if (name === "value") element.value = value;
      else element.setAttribute(name, value === true ? "" : value);
    }

    node.children.forEach((child) => element.append(renderNode(child)));
    return element;
  }

  function renderTree(changedId) {
    treeRoot.innerHTML = renderSimTree(runtime.getPhysicalTree(), changedId);
  }

  runtime.bus.on("*", (event) => {
    if (event.type.startsWith("physical:")) {
      renderPreview();
      renderTree(event.nodeId);
    }
    if (event.type === "runtime:render:end") {
      renderPreview();
      renderTree();
    }
  });

  renderPreview();
  renderTree();

  return { renderPreview, renderTree };
}
