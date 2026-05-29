import { createDomTodoApp } from "./domTodoApp.js";
import { createReactTodoApp } from "./reactTodoApp.js";
import { createRealDomMonitor } from "./monitors/realDomMonitor.js";
import { createRendererDomMonitor } from "./monitors/rendererDomMonitor.js";
import { createTimelineMonitor } from "./monitors/timelineMonitor.js";

const domRoot = document.querySelector("#dom-app");
const reactPreviewRoot = document.querySelector("#react-preview");
const realTreeRoot = document.querySelector("#real-dom-tree");
const rendererTreeRoot = document.querySelector("#renderer-dom-tree");
const timelineRoot = document.querySelector("#timeline");
const domCount = document.querySelector("#dom-count");
const rendererCount = document.querySelector("#renderer-count");
const resetButton = document.querySelector("#reset-all");
const domCode = document.querySelector("#dom-code");
const reactCode = document.querySelector("#react-code");

const timeline = createTimelineMonitor(timelineRoot);
let domEvents = 0;
let rendererEvents = 0;

function pushDomEvent(event) {
  domEvents += 1;
  domCount.textContent = `${domEvents} events`;
  timeline.push(event);
}

function pushSimEvent(event) {
  rendererEvents += 1;
  rendererCount.textContent = `${rendererEvents} events`;
  timeline.push(event);
}

const directApp = createDomTodoApp(domRoot, pushDomEvent);
const realMonitor = createRealDomMonitor({
  watchedRoot: domRoot,
  treeRoot: realTreeRoot,
  onMutation: pushDomEvent
});

const reactApp = createReactTodoApp(reactPreviewRoot);
reactApp.runtime.bus.on("*", pushSimEvent);

const rendererMonitor = createRendererDomMonitor({
  runtime: reactApp.runtime,
  previewRoot: reactPreviewRoot,
  treeRoot: rendererTreeRoot
});

reactPreviewRoot.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  if (action === "addTodo") reactApp.actions.addTodo();
  if (action === "deleteTodo") reactApp.actions.deleteTodo(target.dataset.id);
});

reactPreviewRoot.addEventListener("input", (event) => {
  const target = event.target;
  const action = target.dataset.action;

  if (action === "changeDraft") reactApp.actions.changeDraft(target.value);
  if (action === "editTodo") reactApp.actions.editTodo(target.dataset.id, target.value);
});

reactPreviewRoot.addEventListener("change", (event) => {
  const target = event.target;
  if (target.dataset.action === "toggleTodo") reactApp.actions.toggleTodo(target.dataset.id);
});

reactPreviewRoot.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const target = event.target;
  if (target.dataset.action === "changeDraft") reactApp.actions.addTodo();
});

resetButton.addEventListener("click", () => {
  domEvents = 0;
  rendererEvents = 0;
  domCount.textContent = "0 events";
  rendererCount.textContent = "0 events";
  timeline.clear();
  directApp.reset();
  reactApp.runtime.reset();
  realMonitor.renderTree();
  rendererMonitor.renderTree();
});

reactApp.runtime.mount();

loadCodeEditor("./src/domTodoApp.js", domCode);
loadCodeEditor("./src/reactTodoApp.js", reactCode);

async function loadCodeEditor(path, target) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    target.textContent = await response.text();
  } catch (error) {
    target.textContent = `Unable to load ${path}: ${error.message}`;
  }
}
