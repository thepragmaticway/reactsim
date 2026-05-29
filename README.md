# Reactsim

Reactsim is a tiny React-like implementation for learning how functional components, private state, effects, virtual DOM reconciliation, and real DOM commits fit together.

It is intentionally small and plain:

- pure JavaScript ESM
- no build step
- no dependencies
- real DOM rendering through a simple `domRenderer`
- observable events for learning tools and labs

It is not a React clone. It does not implement Fiber, keyed reconciliation, concurrent scheduling, synthetic events, or advanced host configuration.

## Core Idea

Direct DOM code often looks like this:

```text
event -> function mutates shared DOM node directly
event -> another function mutates another DOM node directly
event -> another function edits the same shared DOM tree
```

Reactsim teaches a more organized React-like path:

```text
event
-> state update
-> component functions run
-> functions return desired virtual DOM
-> virtualDom compares previous vs next desired tree
-> domRenderer patches real DOM
-> effects run after commit
```

The important shift:

```text
Direct DOM:
functions change DOM immediately

Reactsim:
functions return what the DOM should look like
```

## Step 1: Functional Composition

A component starts as a simple function.

```js
function app(data) {
  return `<h1>${data.title}</h1>${todoList(data.todos)}`;
}

function todoList(todos) {
  return `<ul>${todos.map(todoItem).join("")}</ul>`;
}

function todoItem(todo) {
  return `<li>${todo.description} - ${todo.status}</li>`;
}
```

The function receives input, processes it, and returns output:

```text
INPUT -> PROCESS -> OUTPUT
```

Reactsim keeps that idea, but instead of returning HTML strings, components return virtual DOM objects with `createElement()`.

```js
import { createElement } from "reactsim";

function TodoItem({ todo }) {
  return createElement("li", {}, `${todo.description} - ${todo.status}`);
}
```

## Step 2: Private State With `useState`

Plain functions forget local values after they return. `useState` lets a component remember private state between renders.

```js
import { createElement, useState } from "reactsim";

function Counter({ step }) {
  const [count, setCount] = useState(0);

  return createElement(
    "button",
    { "data-action": "increment" },
    `Count ${count}, step ${step}`
  );
}
```

A component output depends on both:

```text
props + private state -> component function -> desired output
```

If props or state change, the component function runs again and returns new desired output.

Hook call order must stay stable. Do not call hooks conditionally.

## Step 3: Reconciliation And Real DOM Commit

Reactsim separates desired output from actual DOM writes.

```js
import { createComponentRuntime } from "reactsim";

const runtime = createComponentRuntime(App, {
  root: document.querySelector("#app")
});

runtime.mount();
```

The runtime calls the root component, receives a virtual DOM tree, asks `virtualDom` to compare old and new trees, then asks `domRenderer` to apply simple patches to the real DOM.

Learning workflow:

```text
component functions
-> desired virtual tree
-> patch list
-> real DOM commit
```

## Step 4: External Effects With `useEffect`

Component functions should mostly process input and state, then return output. Sometimes an app must talk to the outside world:

- document title
- localStorage
- timers
- browser APIs
- API calls

Use `useEffect` for that work.

```js
import { useEffect } from "reactsim";

function App() {
  useEffect(() => {
    document.title = "Rendered by Reactsim";

    return () => {
      document.title = "Reactsim";
    };
  }, []);
}
```

Effect timing:

```text
render desired output
-> commit DOM
-> run effects
```

Supported dependency forms:

```js
useEffect(fn);          // after every commit
useEffect(fn, []);      // after first commit
useEffect(fn, [value]); // when value changes
```

Do not pass an async function directly to `useEffect`. Start async work inside the effect body and return only a cleanup function:

```js
useEffect(() => {
  let cancelled = false;

  async function load() {
    // const response = await fetch("/api/todos");
    // const todos = await response.json();
    // if (!cancelled) setTodos(todos);
  }

  load();

  return () => {
    cancelled = true;
  };
}, []);
```

If an effect callback returns a Promise, Reactsim emits `effect:warning` and ignores it as cleanup. This simplified `useEffect` runs synchronously after commit; real React schedules effects with more nuance.

## Package Usage

Install:

```powershell
npm install reactsim
```

Use:

```js
import { createComponentRuntime, createElement, useEffect, useState } from "reactsim";

function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log("DOM committed for count", count);
  }, [count]);

  return createElement(
    "button",
    { "data-action": "increment" },
    `Count ${count}`
  );
}

const runtime = createComponentRuntime(App, {
  root: document.querySelector("#app")
});

runtime.mount();
```

## Interactive Learning Lab

The root learning lab is the recommended place to start.

Run:

```powershell
npm run lab:learn
```

Open:

```text
http://127.0.0.1:4176/learning-lab/
```

It walks through:

1. Direct component functions mutating shared DOM ad hoc vs centralized reconciliation.
2. A simple direct-DOM todo app where each function edits DOM nodes directly.
3. Functional composition with hardcoded todo JSON.
4. The same functional composition implemented with Reactsim components.
5. Props plus private state with a counter.
6. A Reactsim todo app that keeps todo list state after adding items.
7. `useEffect` for external side effects such as document title, localStorage, and commented API calls.
8. A full todo initialized from and persisted to localStorage.

## Examples

Run the original comparison lab:

```powershell
npm run example
```

Open:

```text
http://127.0.0.1:4173/examples/lab/
```

Run tic tac toe:

```powershell
npm run example:tic-tac-toe
```

Open:

```text
http://127.0.0.1:4174/examples/tic-tac-toe/
```

Run localStorage todo:

```powershell
npm run example:local-storage-todo
```

Open:

```text
http://127.0.0.1:4175/examples/local-storage-todo/
```

## Source Reading Order

1. `src/core/createElement.js`
2. `src/core/hooks.js`
3. `src/core/hooksState.js`
4. `src/core/useState.js`
5. `src/core/useEffect.js`
6. `src/core/componentRuntime.js`
7. `src/core/virtualDom.js`
8. `src/core/domRenderer.js`
9. `src/core/eventBus.js`
10. `src/core/history.js`

## Events For Learning Tools

The runtime emits events that labs can subscribe to:

```js
runtime.bus.on("*", (event) => {
  console.log(event.type, event);
});
```

Useful event families:

```text
runtime:render:start
runtime:render:end
state:update
virtual:diff
dom:mount
dom:setText
dom:setAttr
dom:insert
dom:remove
effect:run
effect:cleanup
effect:warning
```

Subscriptions are for monitors and explanations. The app UI itself is rendered by `domRenderer`, not by subscription callbacks.
