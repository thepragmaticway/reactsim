import { createComponentRuntime, createElement, useState } from "../../../src/index.js";

const seedTodos = [
  { id: "r1", text: "Read component workflow", done: false },
  { id: "r2", text: "Compare diff patches", done: true }
];

export function createReactTodoApp(root) {
  const actions = {};

  function App() {
    const [todos, setTodos] = useState(seedTodos);

    function addTodo(text) {
      setTodos((items) => [...items, { id: crypto.randomUUID().slice(0, 8), text, done: false }]);
    }

    actions.toggleTodo = (id) => {
      setTodos((items) => items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
    };
    actions.editTodo = (id, text) => {
      setTodos((items) => items.map((item) => (item.id === id ? { ...item, text } : item)));
    };
    actions.deleteTodo = (id) => {
      setTodos((items) => items.filter((item) => item.id !== id));
    };
    actions.reset = () => {
      setTodos(seedTodos);
    };

    return createElement(
      "section",
      { class: "todo-app sim-preview" },
      TodoForm({ onAdd: addTodo, actions }),
      TodoStats({ todos }),
      TodoList({ todos })
    );
  }

  function TodoForm({ onAdd, actions }) {
    const [draft, setDraft] = useState("");

    actions.changeDraft = (value) => setDraft(value);
    actions.addTodo = () => {
      const text = draft.trim();
      if (!text) return;
      onAdd(text);
      setDraft("");
    };

    return createElement(
      "div",
      { class: "todo-form" },
      createElement("input", {
        class: "todo-input",
        placeholder: "Add a todo through state",
        value: draft,
        "data-action": "changeDraft"
      }),
      createElement("button", { class: "primary", "data-action": "addTodo" }, "Add")
    );
  }

  function TodoStats({ todos }) {
    const done = todos.filter((todo) => todo.done).length;
    return createElement("p", { class: "stats" }, `${done} of ${todos.length} complete`);
  }

  function TodoList({ todos }) {
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
      createElement("input", {
        class: "edit-input",
        value: todo.text,
        "data-action": "editTodo",
        "data-id": todo.id,
        "aria-label": `Edit ${todo.text}`
      }),
      createElement("button", { class: "icon danger", "data-action": "deleteTodo", "data-id": todo.id }, "Delete")
    );
  }

  const runtime = createComponentRuntime(App, { root });
  return { runtime, actions };
}
