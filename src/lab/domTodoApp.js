const initialTodos = [
  { id: "d1", text: "Touch real DOM nodes", done: false },
  { id: "d2", text: "Watch redundant writes", done: true }
];

export function createDomTodoApp(root, onOperation) {
  let todos = structuredClone(initialTodos);
  let draft = "";

  function emit(type, detail) {
    onOperation({
      id: crypto.randomUUID(),
      source: "direct-dom",
      phase: "mutation",
      type,
      detail,
      time: performance.now()
    });
  }

  function render(reason) {
    emit("dom:render:start", { reason, note: "The module clears and rebuilds the list." });
    root.innerHTML = "";

    const app = document.createElement("section");
    app.className = "todo-app";

    const form = document.createElement("div");
    form.className = "todo-form";

    const input = document.createElement("input");
    input.className = "todo-input";
    input.placeholder = "Add a todo by mutating DOM";
    input.value = draft;
    input.addEventListener("input", () => {
      draft = input.value;
      emit("dom:input-value", { value: draft, note: "Local variable changes before DOM writes." });
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") addTodo();
    });

    const add = document.createElement("button");
    add.className = "primary";
    add.textContent = "Add";
    add.addEventListener("click", addTodo);

    form.append(input, add);
    app.append(form);

    const stats = document.createElement("p");
    stats.className = "stats";
    stats.textContent = `${todos.filter((todo) => todo.done).length} of ${todos.length} complete`;
    app.append(stats);

    const list = document.createElement("ul");
    list.className = "todo-list";

    for (const todo of todos) {
      const item = document.createElement("li");
      item.className = todo.done ? "todo-item done" : "todo-item";
      item.dataset.key = todo.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = todo.done;
      checkbox.ariaLabel = `Toggle ${todo.text}`;
      checkbox.addEventListener("change", () => toggleTodo(todo.id));

      const edit = document.createElement("input");
      edit.className = "edit-input";
      edit.value = todo.text;
      edit.ariaLabel = `Edit ${todo.text}`;
      edit.addEventListener("input", () => editTodo(todo.id, edit.value));

      const remove = document.createElement("button");
      remove.className = "icon danger";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => deleteTodo(todo.id));

      item.append(checkbox, edit, remove);
      list.append(item);
      emit("dom:create-row", { id: todo.id, note: "Row recreated even when only one item changed." });
    }

    app.append(list);
    root.append(app);
    emit("dom:render:end", { count: todos.length });
  }

  function addTodo() {
    const text = draft.trim();
    if (!text) return;
    todos.push({ id: crypto.randomUUID().slice(0, 8), text, done: false });
    draft = "";
    render("add todo");
  }

  function toggleTodo(id) {
    const item = todos.find((todo) => todo.id === id);
    item.done = !item.done;
    render("toggle todo");
  }

  function editTodo(id, text) {
    const item = todos.find((todo) => todo.id === id);
    item.text = text;
    render("edit todo");
  }

  function deleteTodo(id) {
    todos = todos.filter((todo) => todo.id !== id);
    render("delete todo");
  }

  function reset() {
    todos = structuredClone(initialTodos);
    draft = "";
    render("reset");
  }

  render("mount");
  return { reset };
}
