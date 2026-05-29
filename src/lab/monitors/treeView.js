function formatProps(props = {}) {
  const entries = Object.entries(props)
    .filter(([name, value]) => !name.startsWith("aria") && value !== false && value !== undefined)
    .map(([name, value]) => `${name}=${JSON.stringify(value)}`);
  return entries.length ? ` ${entries.join(" ")}` : "";
}

export function renderSimTree(node, changedId) {
  if (!node) return '<p class="empty">No simulated DOM yet.</p>';

  function walk(current) {
    const active = current.id === changedId ? " active" : "";
    if (current.type === "#text") {
      return `<li class="tree-node${active}"><code>${current.id}</code> "${escapeHtml(current.text)}"</li>`;
    }

    return `
      <li class="tree-node${active}">
        <code>${current.id}</code> &lt;${current.type}${escapeHtml(formatProps(current.props))}&gt;
        ${current.children.length ? `<ul>${current.children.map(walk).join("")}</ul>` : ""}
      </li>
    `;
  }

  return `<ul class="tree">${walk(node)}</ul>`;
}

export function renderRealDomTree(element, changedText = "") {
  if (!element?.firstElementChild) return '<p class="empty">No DOM nodes yet.</p>';

  function walk(node, depth = 0) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (!text) return "";
      return `<li class="tree-node"><code>text</code> "${escapeHtml(text)}"</li>`;
    }

    const attrs = [];
    if (node.className) attrs.push(`class=${JSON.stringify(node.className)}`);
    if (node.dataset?.key) attrs.push(`data-key=${JSON.stringify(node.dataset.key)}`);
    const label = `&lt;${node.tagName.toLowerCase()}${attrs.length ? " " + attrs.join(" ") : ""}&gt;`;
    const active = changedText && label.includes(changedText) ? " active" : "";
    const children = [...node.childNodes].map((child) => walk(child, depth + 1)).join("");
    return `<li class="tree-node${active}">${label}${children ? `<ul>${children}</ul>` : ""}</li>`;
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
