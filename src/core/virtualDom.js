function isText(node) {
  return typeof node === "string";
}

function sameType(a, b) {
  if (isText(a) || isText(b)) return isText(a) && isText(b);
  return a?.type === b?.type;
}

function diffProps(oldProps = {}, newProps = {}, path, patches) {
  for (const [name, value] of Object.entries(newProps)) {
    if (oldProps[name] !== value) patches.push({ op: "setAttr", path, name, value });
  }

  for (const name of Object.keys(oldProps)) {
    if (!(name in newProps)) patches.push({ op: "removeAttr", path, name });
  }
}

function diffNode(oldNode, newNode, path, patches) {
  if (oldNode == null) {
    patches.push({ op: path === "0" ? "mount" : "insert", path, node: newNode });
    return;
  }

  if (newNode == null) {
    patches.push({ op: "remove", path });
    return;
  }

  if (!sameType(oldNode, newNode)) {
    patches.push({ op: "replace", path, node: newNode });
    return;
  }

  if (isText(oldNode) && isText(newNode)) {
    if (oldNode !== newNode) patches.push({ op: "setText", path, text: newNode });
    return;
  }

  diffProps(oldNode.props, newNode.props, path, patches);

  const max = Math.max(oldNode.children.length, newNode.children.length);
  for (let index = 0; index < max; index += 1) {
    diffNode(oldNode.children[index], newNode.children[index], `${path}.${index}`, patches);
  }
}

export function createVirtualDom({ bus, history, domRenderer }) {
  let currentTree = null;

  function render(nextTree) {
    const patches = [];
    diffNode(currentTree, nextTree, "0", patches);

    const event = bus.emit("virtual:diff", {
      source: "reactsim",
      phase: "reconcile",
      previousTree: currentTree,
      nextTree,
      patches
    });
    history.record(event);

    domRenderer.applyPatches(patches);
    currentTree = nextTree;
    return patches;
  }

  function getTree() {
    return currentTree;
  }

  function reset() {
    currentTree = null;
    domRenderer.reset();
  }

  return { render, getTree, reset };
}
