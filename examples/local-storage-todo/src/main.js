import { createComponentRuntime, createElement, useEffect, useState } from "../../../src/index.js";

const storageKey = "reactsim.local-storage-todo.items";
const todoRoot = document.querySelector("#todo-root");
const clearStorageButton = document.querySelector("#clear-storage");
const timelineRoot = document.querySelector("#timeline");
const eventCount = document.querySelector("#event-count");

const actions = {};
let eventTotal = 0;

function readStoredTodos() {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : seedTodos();
  } catch {
    return seedTodos();
  }
}

function seedTodos() {
  return [
    { id: "learn-effect", text: "Learn useEffect persistence", done: false },
    { id: "refresh-page", text: "Refresh and keep todos", done: true }
  ];
}

function App() {
  const [todos, setTodos] = useState(readStoredTodos);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(todos));
  }, [todos]);

  actions.changeDraft = (value) => setDraft(value);
  actions.addTodo = () => {
    const text = draft.trim();
    if (!text) return;

    setTodos((items) => [...items, { id: crypto.randomUUID().slice(0, 8), text, done: false }]);
    setDraft("");
  };
  actions.toggleTodo = (id) => {
    setTodos((items) => items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };
  actions.deleteTodo = (id) => {
    setTodos((items) => items.filter((item) => item.id !== id));
  };
  actions.clearCompleted = () => {
    setTodos((items) => items.filter((item) => !item.done));
  };
  actions.resetStorage = () => {
    localStorage.removeItem(storageKey);
    setTodos(seedTodos());
    setDraft("");
  };

  return createElement(
    "section",
    { class: "todo-app" },
    createElement(
      "div",
      { class: "todo-form" },
      createElement("input", {
        class: "todo-input",
        value: draft,
        placeholder: "Add a persistent todo",
        "data-action": "changeDraft",
        "aria-label": "Todo text"
      }),
      createElement("button", { class: "primary", "data-action": "addTodo" }, "Add")
    ),
    createElement(
      "div",
      { class: "summary" },
      createElement("p", {}, `${todos.filter((todo) => todo.done).length} of ${todos.length} complete`),
      createElement("button", { class: "secondary small", "data-action": "clearCompleted" }, "Clear Done")
    ),
    TodoList({ todos })
  );
}

function TodoList({ todos }) {
  if (!todos.length) {
    return createElement("p", { class: "empty" }, "No todos saved.");
  }

  return createElement(
    "ul",
    { class: "todo-list" },
    todos.map((todo) => TodoItem({ todo }))
  );
}

function TodoItem({ todo }) {
  return createElement(
    "li",
    { class: todo.done ? "todo-item done" : "todo-item", "data-key": todo.id },
    createElement("input", {
      type: "checkbox",
      checked: todo.done,
      "data-action": "toggleTodo",
      "data-id": todo.id,
      "aria-label": `Toggle ${todo.text}`
    }),
    createElement("span", { class: "todo-text" }, todo.text),
    createElement("button", { class: "danger small", "data-action": "deleteTodo", "data-id": todo.id }, "Delete")
  );
}

function pushTimeline(event) {
  if (!["state:update", "virtual:diff"].includes(event.type) && !event.type.startsWith("dom:") && !event.type.startsWith("effect:")) {
    return;
  }

  eventTotal += 1;
  eventCount.textContent = `${eventTotal} events`;

  const item = document.createElement("li");
  item.className = `timeline-item ${timelineKind(event)}`;
  item.innerHTML = `
    <span>${event.type}</span>
    <small>${describeEvent(event)}</small>
  `;
  timelineRoot.prepend(item);

  while (timelineRoot.children.length > 40) {
    timelineRoot.lastElementChild.remove();
  }
}

function describeEvent(event) {
  if (event.type === "state:update") return `slot ${event.slot} changed`;
  if (event.type === "virtual:diff") return `${event.patches.length} patch${event.patches.length === 1 ? "" : "es"} calculated`;
  if (event.type === "effect:run") return `useEffect persisted todos after commit`;
  if (event.type === "effect:cleanup") return `effect slot ${event.slot} cleanup`;
  if (event.patch) return `${event.patch.op} at ${event.patch.path}`;
  return event.message || event.phase || "";
}

function timelineKind(event) {
  if (event.type.startsWith("dom:")) return "commit";
  if (event.type.startsWith("effect:")) return "effect";
  return "render";
}

const runtime = createComponentRuntime(App, { root: todoRoot });
runtime.bus.on("*", pushTimeline);
runtime.mount();

todoRoot.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  if (action === "addTodo") actions.addTodo();
  if (action === "toggleTodo") actions.toggleTodo(target.dataset.id);
  if (action === "deleteTodo") actions.deleteTodo(target.dataset.id);
  if (action === "clearCompleted") actions.clearCompleted();
});

todoRoot.addEventListener("input", (event) => {
  if (event.target.dataset.action === "changeDraft") {
    actions.changeDraft(event.target.value);
  }
});

todoRoot.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.dataset.action === "changeDraft") {
    actions.addTodo();
  }
});

clearStorageButton.addEventListener("click", () => {
  eventTotal = 0;
  eventCount.textContent = "0 events";
  timelineRoot.innerHTML = "";
  actions.resetStorage();
});
