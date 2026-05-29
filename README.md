# Reactsim

Reactsim is a pure HTML, CSS, and JavaScript learning implementation that compares two todo apps:

- direct DOM mutation, where handlers write to real browser DOM immediately
- a simplified React-like flow, where events update state, functional components compose desired UI, a virtual DOM diff creates patches, and `domRenderer` applies those patches to real DOM

## Install

```powershell
npm install reactsim
```

Use the beginner-facing API:

```js
import { createComponentRuntime, createElement, useEffect, useState } from "reactsim";

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log("domRenderer committed the button");
  }, [count]);

  return createElement(
    "button",
    { "data-action": "increment" },
    `Count ${count}`
  );
}

const runtime = createComponentRuntime(Counter, {
  root: document.querySelector("#app")
});
runtime.mount();
```

Reactsim renders real browser DOM through a small `domRenderer`. It is intentionally simple for learning and does not implement React Fiber, keyed reconciliation, scheduling, synthetic events, or advanced host config behavior.

## Run The Lab Example

```powershell
npm run example
```

Open:

```text
http://127.0.0.1:4173/examples/lab/
```

## Run The Tic Tac Toe Example

```powershell
npm run example:tic-tac-toe
```

Open:

```text
http://127.0.0.1:4174/examples/tic-tac-toe/
```

## Core Reading Order

1. `src/core/eventBus.js`
2. `src/core/history.js`
3. `src/core/createElement.js`
4. `src/core/hooks.js`
5. `src/core/hooksState.js`
6. `src/core/useState.js`
7. `src/core/useEffect.js`
8. `src/core/componentRuntime.js`
9. `src/core/virtualDom.js`
10. `src/core/domRenderer.js`

## Simplified React-Like Workflow

```text
event
-> setState
-> functional component calls
-> desired virtual tree
-> virtual diff
-> domRenderer patches real DOM
-> monitor events and history
```

`virtualDom` keeps the previous desired tree, compares it with the next desired tree, and sends simple patch objects to `domRenderer`. `domRenderer` owns the real root element and performs the actual DOM writes.

In the lab, subscriptions are used only for learning monitors: timeline entries, event counts, and DOM tree highlighting. The Reactsim app UI itself is rendered by `domRenderer`, not by monitor subscriptions.

This is not a React Fiber clone. It is a small mental model for learning render, reconciliation, and commit concepts.

## Hook Model

Components import `useState` from the package API and call it while Reactsim is rendering:

```js
import { useState } from "reactsim";

function TodoForm() {
  const [draft, setDraft] = useState("");
}
```

The runtime sets the current hook context before calling the root component and clears it after rendering. This approximates React's hook dispatcher idea in a beginner-readable way.

This implementation keeps one hook slot list for the whole render traversal, so hook call order must stay stable. Do not call hooks conditionally.

## Effect Model

`useEffect` runs after `domRenderer` commits real DOM updates:

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

Supported dependency forms:

```js
useEffect(fn);        // after every commit
useEffect(fn, []);    // after first commit
useEffect(fn, [value]); // when value changes
```

Do not pass an async function directly to `useEffect`. Start async work inside the effect body and return only a cleanup function:

```js
useEffect(() => {
  let cancelled = false;

  async function load() {
    const data = await fetchData();
    if (!cancelled) setData(data);
  }

  load();

  return () => {
    cancelled = true;
  };
}, []);
```

If an effect callback returns a Promise, Reactsim emits `effect:warning` and ignores it as cleanup. This simplified `useEffect` runs synchronously after commit; real React schedules effects with more nuance.
