import { h } from "../core/h.js";
import { createComponentRuntime } from "../core/componentRuntime.js";

const seedTodos = [
  { id: "r1", text: "Read component workflow", done: false },
  { id: "r2", text: "Compare diff patches", done: true }
];

export function createReactTodoApp() {
  const actions = {};

  function App({ useState }) {
    const [todos, setTodos] = useState(seedTodos);
    const [draft, setDraft] = useState("");

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
    actions.editTodo = (id, text) => {
      setTodos((items) => items.map((item) => (item.id === id ? { ...item, text } : item)));
    };
    actions.deleteTodo = (id) => {
      setTodos((items) => items.filter((item) => item.id !== id));
    };
    actions.reset = () => {
      setTodos(seedTodos);
      setDraft("");
    };

    return h(
      "section",
      { class: "todo-app sim-preview" },
      TodoForm({ draft }),
      TodoStats({ todos }),
      TodoList({ todos })
    );
  }

  function TodoForm({ draft }) {
    return h(
      "div",
      { class: "todo-form" },
      h("input", {
        class: "todo-input",
        placeholder: "Add a todo through state",
        value: draft,
        "data-action": "changeDraft"
      }),
      h("button", { class: "primary", "data-action": "addTodo" }, "Add")
    );
  }

  function TodoStats({ todos }) {
    const done = todos.filter((todo) => todo.done).length;
    return h("p", { class: "stats" }, `${done} of ${todos.length} complete`);
  }

  function TodoList({ todos }) {
    return h(
      "ul",
      { class: "todo-list" },
      todos.map((todo) => TodoItem({ todo }))
    );
  }

  function TodoItem({ todo }) {
    return h(
      "li",
      { class: todo.done ? "todo-item done" : "todo-item", "data-key": todo.id },
      h("input", {
        type: "checkbox",
        checked: todo.done,
        "data-action": "toggleTodo",
        "data-id": todo.id,
        "aria-label": `Toggle ${todo.text}`
      }),
      h("input", {
        class: "edit-input",
        value: todo.text,
        "data-action": "editTodo",
        "data-id": todo.id,
        "aria-label": `Edit ${todo.text}`
      }),
      h("button", { class: "icon danger", "data-action": "deleteTodo", "data-id": todo.id }, "Delete")
    );
  }

  const runtime = createComponentRuntime(App);
  return { runtime, actions };
}
