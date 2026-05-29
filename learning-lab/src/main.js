import { createComponentRuntime, createElement, useEffect, useState } from "../../src/index.js";

const code = {
  directTodo: `const state = { todos: [] };

function addTodo() {
  const todo = { id: crypto.randomUUID(), text: input.value, done: false };
  state.todos.push(todo);
  appendTodoNode(todo);       // direct DOM insert
  input.value = "";           // direct DOM update
}

function toggleTodo(id, checkbox) {
  const todo = state.todos.find((item) => item.id === id);
  todo.done = checkbox.checked;
  checkbox.closest("li").classList.toggle("done", todo.done); // direct DOM class change
}

function removeTodo(id, button) {
  state.todos = state.todos.filter((item) => item.id !== id);
  button.closest("li").remove(); // direct DOM removal
}`,
  composition: `const data = {
  title: "Today",
  todos: [
    { id: 1, description: "Learn functions", status: "open" },
    { id: 2, description: "Return view output", status: "done" }
  ]
};

function app(data) {
  return \`<h1>\${data.title}</h1>\${todoList(data.todos)}\`;
}

function todoList(todos) {
  return \`<ul>\${todos.map(todoItem).join("")}</ul>\`;
}

function todoItem(todo) {
  return \`<li>\${todo.description} - \${todo.status}</li>\`;
}`,
  reactsimStatic: `function App({ data }) {
  return createElement(
    "section",
    {},
    createElement("h1", {}, data.title),
    TodoList({ todos: data.todos })
  );
}

function TodoList({ todos }) {
  return createElement("ul", {}, todos.map((todo) => TodoItem({ todo })));
}

function TodoItem({ todo }) {
  return createElement("li", {}, \`\${todo.description} - \${todo.status}\`);
}

createComponentRuntime(() => App({ data }), { root }).mount();`,
  counter: `function App() {
  const [step, setStep] = useState(1);      // parent state becomes child prop

  actions.setStep = (value) => setStep(value);

  return Counter({ label: "Counter", step });
}

function Counter({ label, step }) {
  const [count, setCount] = useState(0);    // private hook state

  actions.increment = () => setCount(count + step);

  return createElement("section", {}, label, count);
}`,
  stateTodo: `function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [draft, setDraft] = useState("");

  actions.addTodo = () => {
    setTodos((items) => [...items, { id: crypto.randomUUID(), text: draft }]);
    setDraft("");
  };

  return createElement("section", {}, TodoForm({ draft }), TodoList({ todos }));
}`,
  effect: `function SideEffectDemo() {
  const [title, setTitle] = useState("Reactsim effects");

  useEffect(() => {
    document.title = title;                 // update external browser state
    localStorage.setItem("lab.title", title);

    // async function load() {
    //   const response = await fetch("/api/title");
    //   if (!cancelled) setTitle(await response.text());
    // }
    // load();

    return () => {
      document.title = "Reactsim Learning Lab";
    };
  }, [title]);

  return createElement("input", { value: title });
}`,
  storageTodo: `function StorageTodoApp() {
  const [todos, setTodos] = useState(readStoredTodos); // lazy init, once
  const [draft, setDraft] = useState("");

  useEffect(() => {
    localStorage.setItem("learning-lab.todos", JSON.stringify(todos));
  }, [todos]);

  actions.addTodo = () => {
    setTodos((items) => [...items, { id: crypto.randomUUID(), text: draft, done: false }]);
    setDraft("");
  };

  return createElement("section", {}, TodoForm({ draft }), TodoList({ todos }));
}`
};

const compositionData = {
  title: "Today",
  todos: [
    { id: 1, description: "Learn functions", status: "open" },
    { id: 2, description: "Return view output", status: "done" }
  ]
};

setCode("code-direct-todo", code.directTodo);
setCode("code-composition", code.composition);
setCode("code-reactsim-static", code.reactsimStatic);
setCode("code-counter", code.counter);
setCode("code-state-todo", code.stateTodo);
setCode("code-effect", code.effect);
setCode("code-storage-todo", code.storageTodo);

document.querySelector("#composition-json").textContent = JSON.stringify(compositionData, null, 2);
document.querySelector("#composition-output").innerHTML = appHtml(compositionData);

mountDirectTodo();
mountStaticReactsim();
mountCounter();
mountStateTodo();
mountEffectDemo();
mountStorageTodo();

function setCode(id, value) {
  document.querySelector(`#${id}`).textContent = value;
}

function appHtml(data) {
  return `<h3>${data.title}</h3>${todoListHtml(data.todos)}`;
}

function todoListHtml(todos) {
  return `<ul>${todos.map(todoItemHtml).join("")}</ul>`;
}

function todoItemHtml(todo) {
  return `<li>${todo.description} - ${todo.status}</li>`;
}

function mountDirectTodo() {
  const root = document.querySelector("#direct-todo-view");
  let todos = [
    { id: "direct-1", text: "Add nodes directly", done: false },
    { id: "direct-2", text: "Toggle class directly", done: true }
  ];

  root.innerHTML = `
    <div class="form-row">
      <input aria-label="Direct todo text" placeholder="Direct DOM todo" />
      <button class="primary">Add</button>
    </div>
    <ul class="todo-list"></ul>
    <p class="status-line">Every action directly changes a DOM node.</p>
  `;

  const input = root.querySelector("input");
  const add = root.querySelector("button");
  const list = root.querySelector("ul");

  function appendTodoNode(todo) {
    const item = document.createElement("li");
    item.className = todo.done ? "todo-item done" : "todo-item";
    item.dataset.id = todo.id;
    item.innerHTML = `
      <input type="checkbox" ${todo.done ? "checked" : ""} aria-label="Toggle ${todo.text}" />
      <span>${todo.text}</span>
      <button class="danger small">Delete</button>
    `;

    item.querySelector("input").addEventListener("change", (event) => toggleTodo(todo.id, event.target));
    item.querySelector("button").addEventListener("click", (event) => removeTodo(todo.id, event.target));
    list.append(item);
  }

  function addTodo() {
    const text = input.value.trim();
    if (!text) return;

    const todo = { id: crypto.randomUUID(), text, done: false };
    todos.push(todo);
    appendTodoNode(todo);
    input.value = "";
  }

  function toggleTodo(id, checkbox) {
    const todo = todos.find((item) => item.id === id);
    todo.done = checkbox.checked;
    checkbox.closest("li").classList.toggle("done", todo.done);
  }

  function removeTodo(id, button) {
    todos = todos.filter((item) => item.id !== id);
    button.closest("li").remove();
  }

  add.addEventListener("click", addTodo);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addTodo();
  });
  todos.forEach(appendTodoNode);
}

function mountStaticReactsim() {
  const root = document.querySelector("#static-reactsim-root");

  function App({ data }) {
    return createElement(
      "section",
      {},
      createElement("h3", {}, data.title),
      TodoList({ todos: data.todos })
    );
  }

  function TodoList({ todos }) {
    return createElement("ul", {}, todos.map((todo) => TodoItem({ todo })));
  }

  function TodoItem({ todo }) {
    return createElement("li", {}, `${todo.description} - ${todo.status}`);
  }

  createComponentRuntime(() => App({ data: compositionData }), { root }).mount();
}

function mountCounter() {
  const root = document.querySelector("#counter-root");
  const actions = {};

  function App() {
    const [step, setStep] = useState(1);
    actions.setStep = (value) => setStep(value);
    return Counter({ label: "Counter output", step });
  }

  function Counter({ label, step }) {
    const [count, setCount] = useState(0);
    actions.increment = () => setCount(count + step);
    actions.reset = () => setCount(0);

    return createElement(
      "section",
      {},
      createElement("p", {}, `${label}: step prop is ${step}`),
      createElement("div", { class: "counter-value" }, String(count)),
      createElement(
        "div",
        { class: "counter-controls" },
        createElement("button", { class: "primary", "data-action": "increment" }, "Increment"),
        createElement("button", { class: "secondary", "data-action": "step1" }, "Step 1"),
        createElement("button", { class: "secondary", "data-action": "step5" }, "Step 5")
      )
    );
  }

  createComponentRuntime(App, { root }).mount();
  root.addEventListener("click", (event) => {
    const action = event.target.dataset.action;
    if (action === "increment") actions.increment();
    if (action === "step1") actions.setStep(1);
    if (action === "step5") actions.setStep(5);
  });
}

function mountStateTodo() {
  const root = document.querySelector("#state-todo-root");
  const actions = {};

  function TodoApp() {
    const [todos, setTodos] = useState([{ id: "state-1", text: "Kept inside useState", done: false }]);
    const [draft, setDraft] = useState("");

    actions.changeDraft = (value) => setDraft(value);
    actions.addTodo = () => {
      const text = draft.trim();
      if (!text) return;
      setTodos((items) => [...items, { id: crypto.randomUUID(), text, done: false }]);
      setDraft("");
    };

    return createElement(
      "section",
      {},
      TodoForm({ draft }),
      createElement("p", { class: "status-line" }, `${todos.length} item${todos.length === 1 ? "" : "s"} in state`),
      TodoList({ todos })
    );
  }

  function TodoForm({ draft }) {
    return createElement(
      "div",
      { class: "todo-form" },
      createElement("input", { value: draft, placeholder: "State todo", "data-action": "draft" }),
      createElement("button", { class: "primary", "data-action": "add" }, "Add")
    );
  }

  function TodoList({ todos }) {
    return createElement("ul", { class: "todo-list" }, todos.map((todo) => createElement("li", { class: "todo-item" }, createElement("span", {}, todo.text))));
  }

  createComponentRuntime(TodoApp, { root }).mount();
  root.addEventListener("input", (event) => {
    if (event.target.dataset.action === "draft") actions.changeDraft(event.target.value);
  });
  root.addEventListener("click", (event) => {
    if (event.target.dataset.action === "add") actions.addTodo();
  });
  root.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.dataset.action === "draft") actions.addTodo();
  });
}

function mountEffectDemo() {
  const root = document.querySelector("#effect-root");
  const actions = {};

  function EffectDemo() {
    const [title, setTitle] = useState(() => localStorage.getItem("learning-lab.title") || "Reactsim effects");

    useEffect(() => {
      document.title = title;
      localStorage.setItem("learning-lab.title", title);

      return () => {
        document.title = "Reactsim Learning Lab";
      };
    }, [title]);

    actions.setTitle = setTitle;

    return createElement(
      "section",
      {},
      createElement("div", { class: "effect-controls" }, createElement("input", { value: title, "data-action": "title" }), createElement("button", { class: "secondary", "data-action": "default" }, "Default"), createElement("button", { class: "secondary", "data-action": "clear" }, "Clear")),
      createElement("p", { class: "status-line" }, `document.title and localStorage follow: ${title}`)
    );
  }

  createComponentRuntime(EffectDemo, { root }).mount();
  root.addEventListener("input", (event) => {
    if (event.target.dataset.action === "title") actions.setTitle(event.target.value);
  });
  root.addEventListener("click", (event) => {
    const action = event.target.dataset.action;
    if (action === "default") actions.setTitle("Reactsim effects");
    if (action === "clear") actions.setTitle("");
  });
}

function mountStorageTodo() {
  const root = document.querySelector("#storage-todo-root");
  const key = "learning-lab.todos";
  const actions = {};

  function readTodos() {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [{ id: "stored-1", text: "Persist me", done: false }];
    } catch {
      return [{ id: "stored-1", text: "Persist me", done: false }];
    }
  }

  function StorageTodoApp() {
    const [todos, setTodos] = useState(readTodos);
    const [draft, setDraft] = useState("");

    useEffect(() => {
      localStorage.setItem(key, JSON.stringify(todos));
    }, [todos]);

    actions.changeDraft = setDraft;
    actions.addTodo = () => {
      const text = draft.trim();
      if (!text) return;
      setTodos((items) => [...items, { id: crypto.randomUUID(), text, done: false }]);
      setDraft("");
    };
    actions.toggle = (id) => setTodos((items) => items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
    actions.remove = (id) => setTodos((items) => items.filter((item) => item.id !== id));
    actions.reset = () => setTodos([{ id: "stored-1", text: "Persist me", done: false }]);

    return createElement(
      "section",
      {},
      createElement("div", { class: "todo-form" }, createElement("input", { value: draft, placeholder: "Stored todo", "data-action": "draft" }), createElement("button", { class: "primary", "data-action": "add" }, "Add")),
      createElement("p", { class: "status-line" }, "Refresh the page: these items come back from localStorage."),
      TodoListFull({ todos })
    );
  }

  function TodoListFull({ todos }) {
    return createElement(
      "ul",
      { class: "todo-list" },
      todos.map((todo) =>
        createElement(
          "li",
          { class: todo.done ? "todo-item done" : "todo-item" },
          createElement("input", { type: "checkbox", checked: todo.done, "data-action": "toggle", "data-id": todo.id }),
          createElement("span", { class: "todo-text" }, todo.text),
          createElement("button", { class: "danger small", "data-action": "remove", "data-id": todo.id }, "Delete")
        )
      )
    );
  }

  createComponentRuntime(StorageTodoApp, { root }).mount();
  root.addEventListener("input", (event) => {
    if (event.target.dataset.action === "draft") actions.changeDraft(event.target.value);
  });
  root.addEventListener("change", (event) => {
    if (event.target.dataset.action === "toggle") actions.toggle(event.target.dataset.id);
  });
  root.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    if (target.dataset.action === "add") actions.addTodo();
    if (target.dataset.action === "remove") actions.remove(target.dataset.id);
  });
  root.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.dataset.action === "draft") actions.addTodo();
  });
}
