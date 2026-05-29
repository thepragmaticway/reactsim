function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function createNode(vnode, path = "0") {
  if (typeof vnode === "string") {
    return { id: path, type: "#text", text: vnode, props: {}, children: [] };
  }

  return {
    id: path,
    type: vnode.type,
    props: { ...vnode.props },
    children: vnode.children.map((child, index) => createNode(child, `${path}.${index}`))
  };
}

function findNode(root, path) {
  if (!root || path === "0") return root;
  return path.split(".").slice(1).reduce((node, index) => node?.children[Number(index)], root);
}

function findParent(root, path) {
  const parts = path.split(".");
  if (parts.length === 1) return null;
  return {
    parent: findNode(root, parts.slice(0, -1).join(".")),
    index: Number(parts.at(-1))
  };
}

function reindex(node, path = "0") {
  if (!node) return;
  node.id = path;
  node.children.forEach((child, index) => reindex(child, `${path}.${index}`));
}

export function createPhysicalDomSim({ bus, history }) {
  let root = null;

  function applyPatch(patch) {
    const before = clone(root);

    if (patch.op === "mount") {
      root = createNode(patch.node);
    }

    if (patch.op === "replace") {
      if (patch.path === "0") {
        root = createNode(patch.node);
      } else {
        const ref = findParent(root, patch.path);
        ref.parent.children[ref.index] = createNode(patch.node, patch.path);
      }
    }

    if (patch.op === "setText") {
      const node = findNode(root, patch.path);
      node.text = patch.text;
    }

    if (patch.op === "setAttr") {
      const node = findNode(root, patch.path);
      node.props[patch.name] = patch.value;
    }

    if (patch.op === "removeAttr") {
      const node = findNode(root, patch.path);
      delete node.props[patch.name];
    }

    if (patch.op === "insert") {
      const ref = findParent(root, patch.path);
      ref.parent.children.splice(ref.index, 0, createNode(patch.node, patch.path));
      reindex(root);
    }

    if (patch.op === "remove") {
      const ref = findParent(root, patch.path);
      ref.parent.children.splice(ref.index, 1);
      reindex(root);
    }

    const event = bus.emit(`physical:${patch.op}`, {
      source: "reactsim",
      phase: "commit",
      patch,
      before,
      after: clone(root),
      nodeId: patch.path
    });
    history.record(event);
  }

  function applyPatches(patches) {
    patches.forEach(applyPatch);
  }

  function getTree() {
    return clone(root);
  }

  function reset() {
    root = null;
    const event = bus.emit("physical:reset", { source: "reactsim", phase: "commit" });
    history.record(event);
  }

  return { applyPatch, applyPatches, getTree, reset };
}
