import assert from "node:assert/strict";
import { createComponentRuntime, createElement, useEffect, useState } from "../src/index.js";
import { createDomRenderer, createHooksState, createVirtualDom } from "../src/core/index.js";

class FakeText {
  constructor(text) {
    this.nodeType = 3;
    this.textContent = text;
    this.parentNode = null;
  }

  remove() {
    this.parentNode?.removeChild(this);
  }

  replaceWith(node) {
    this.parentNode?.replaceChild(node, this);
  }
}

class FakeElement {
  constructor(type) {
    this.nodeType = 1;
    this.type = type;
    this.tagName = type.toUpperCase();
    this.childNodes = [];
    this.attributes = {};
    this.className = "";
    this.value = "";
    this.checked = false;
    this.parentNode = null;
  }

  append(node) {
    node.parentNode = this;
    this.childNodes.push(node);
  }

  insertBefore(node, before) {
    node.parentNode = this;
    const index = before ? this.childNodes.indexOf(before) : -1;
    if (index === -1) this.childNodes.push(node);
    else this.childNodes.splice(index, 0, node);
  }

  replaceChildren(...nodes) {
    this.childNodes.forEach((node) => {
      node.parentNode = null;
    });
    this.childNodes = [];
    nodes.forEach((node) => this.append(node));
  }

  replaceChild(next, previous) {
    const index = this.childNodes.indexOf(previous);
    previous.parentNode = null;
    next.parentNode = this;
    this.childNodes[index] = next;
  }

  removeChild(node) {
    const index = this.childNodes.indexOf(node);
    if (index >= 0) this.childNodes.splice(index, 1);
    node.parentNode = null;
  }

  remove() {
    this.parentNode?.removeChild(this);
  }

  replaceWith(node) {
    this.parentNode?.replaceChild(node, this);
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  removeAttribute(name) {
    delete this.attributes[name];
  }

  get firstChild() {
    return this.childNodes[0] || null;
  }
}

globalThis.document = {
  createElement: (type) => new FakeElement(type),
  createTextNode: (text) => new FakeText(text)
};

const vnode = createElement("button", { class: "primary" }, "Add");
assert.deepEqual(vnode, {
  type: "button",
  props: { class: "primary" },
  children: ["Add"]
});

let actions = {};
let effectLog = [];

function Child() {
  const [label, setLabel] = useState("ready");
  actions.setLabel = setLabel;
  useEffect(() => {
    effectLog.push(`label:${label}`);
    return () => effectLog.push(`cleanup:${label}`);
  }, [label]);
  return createElement("span", {}, label);
}

function App() {
  const [count, setCount] = useState(0);
  actions.increment = () => setCount((value) => value + 1);
  useEffect(() => {
    effectLog.push("mount-only");
    return () => effectLog.push("cleanup:mount-only");
  }, []);
  return createElement("div", { id: "root" }, `Count ${count}`, Child());
}

const root = new FakeElement("root");
const runtime = createComponentRuntime(App, { root });
runtime.mount();
actions.increment();
actions.setLabel("done");
await new Promise((resolve) => setTimeout(resolve, 0));

const appNode = root.firstChild;
assert.equal(appNode.type, "div");
assert.equal(appNode.childNodes[0].textContent, "Count 1");
assert.equal(appNode.childNodes[1].childNodes[0].textContent, "done");
assert(runtime.history.all().some((event) => event.type === "virtual:diff"));
assert(runtime.history.all().some((event) => event.type.startsWith("dom:")));
assert.deepEqual(effectLog.slice(0, 4), ["mount-only", "label:ready", "cleanup:ready", "label:done"]);
assert.equal(effectLog.filter((entry) => entry === "mount-only").length, 1);
assert(runtime.history.all().some((event) => event.type === "effect:run"));
assert(runtime.history.all().some((event) => event.type === "effect:cleanup"));

runtime.reset();
assert(effectLog.includes("cleanup:mount-only"));
assert(effectLog.includes("cleanup:done"));

assert.throws(() => useState("outside render"), /only be called while Reactsim is rendering/);
assert.throws(() => useEffect(() => {}), /only be called while Reactsim is rendering/);
assert.equal(typeof createDomRenderer, "function");
assert.equal(typeof createHooksState, "function");
assert.equal(typeof createVirtualDom, "function");

function AsyncEffectApp() {
  useEffect(async () => {});
  return createElement("p", {}, "async effect");
}

const asyncRoot = new FakeElement("root");
const asyncRuntime = createComponentRuntime(AsyncEffectApp, { root: asyncRoot });
asyncRuntime.mount();
assert(asyncRuntime.history.all().some((event) => event.type === "effect:warning"));

console.log("core tests passed");
