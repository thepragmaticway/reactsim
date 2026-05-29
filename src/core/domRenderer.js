function createDomNode(vnode) {
  if (typeof vnode === "string") return document.createTextNode(vnode);

  const element = document.createElement(vnode.type);
  setProps(element, {}, vnode.props);
  vnode.children.forEach((child) => element.append(createDomNode(child)));
  return element;
}

function setProps(element, oldProps = {}, newProps = {}) {
  for (const [name, value] of Object.entries(newProps)) {
    if (oldProps[name] !== value) setProp(element, name, value);
  }

  for (const name of Object.keys(oldProps)) {
    if (!(name in newProps)) removeProp(element, name);
  }
}

function setProp(element, name, value) {
  if (value === false || value === undefined || value === null) {
    removeProp(element, name);
    return;
  }

  if (name === "class") element.className = value;
  else if (name === "value") element.value = value;
  else if (name === "checked") element.checked = Boolean(value);
  else element.setAttribute(name, value === true ? "" : value);
}

function removeProp(element, name) {
  if (name === "class") element.removeAttribute("class");
  else if (name === "value") element.value = "";
  else if (name === "checked") element.checked = false;
  else element.removeAttribute(name);
}

function findDomNode(root, path) {
  if (path === "0") return root.firstChild;
  return path
    .split(".")
    .slice(1)
    .reduce((node, index) => node?.childNodes[Number(index)], root.firstChild);
}

function findParentDom(root, path) {
  const parts = path.split(".");
  return {
    parent: parts.length === 2 ? root.firstChild : findDomNode(root, parts.slice(0, -1).join(".")),
    index: Number(parts.at(-1))
  };
}

export function createDomRenderer({ root, bus, history }) {
  if (!root) throw new Error("createDomRenderer requires a real DOM root element.");

  function applyPatch(patch) {
    if (patch.op === "mount") {
      root.replaceChildren(createDomNode(patch.node));
    }

    if (patch.op === "replace") {
      if (patch.path === "0") root.replaceChildren(createDomNode(patch.node));
      else {
        const node = findDomNode(root, patch.path);
        node.replaceWith(createDomNode(patch.node));
      }
    }

    if (patch.op === "setText") {
      const node = findDomNode(root, patch.path);
      node.textContent = patch.text;
    }

    if (patch.op === "setAttr") {
      setProp(findDomNode(root, patch.path), patch.name, patch.value);
    }

    if (patch.op === "removeAttr") {
      removeProp(findDomNode(root, patch.path), patch.name);
    }

    if (patch.op === "insert") {
      const { parent, index } = findParentDom(root, patch.path);
      parent.insertBefore(createDomNode(patch.node), parent.childNodes[index] || null);
    }

    if (patch.op === "remove") {
      findDomNode(root, patch.path)?.remove();
    }

    const event = bus.emit(`dom:${patch.op}`, {
      source: "reactsim",
      phase: "commit",
      patch,
      nodeId: patch.path
    });
    history.record(event);
  }

  function applyPatches(patches) {
    patches.forEach(applyPatch);
  }

  function reset() {
    root.replaceChildren();
    const event = bus.emit("dom:reset", { source: "reactsim", phase: "commit" });
    history.record(event);
  }

  return { applyPatch, applyPatches, reset };
}
