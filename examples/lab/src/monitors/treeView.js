export function renderRealDomTree(element, changedPath = "") {
  if (!element?.firstElementChild) return '<p class="empty">No DOM nodes yet.</p>';

  function walk(node, path = "0") {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (!text) return "";
      const active = path === changedPath ? " active" : "";
      return `<li class="tree-node${active}"><code>${path}</code> "${escapeHtml(text)}"</li>`;
    }

    const attrs = [];
    if (node.className) attrs.push(`class=${JSON.stringify(node.className)}`);
    if (node.dataset?.key) attrs.push(`data-key=${JSON.stringify(node.dataset.key)}`);
    const label = `&lt;${node.tagName.toLowerCase()}${attrs.length ? " " + attrs.join(" ") : ""}&gt;`;
    const active = path === changedPath ? " active" : "";
    const children = [...node.childNodes].map((child, index) => walk(child, `${path}.${index}`)).join("");
    return `<li class="tree-node${active}"><code>${path}</code> ${label}${children ? `<ul>${children}</ul>` : ""}</li>`;
  }

  return `<ul class="tree">${walk(element.firstElementChild)}</ul>`;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
