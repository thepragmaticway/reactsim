# Reactsim

Reactsim is a pure HTML, CSS, and JavaScript learning simulator that compares two todo apps:

- direct DOM mutation, where handlers write to real browser DOM immediately
- a simplified React-like flow, where events update state, functional components compose desired UI, a virtual DOM diff creates patches, and a physical DOM simulator records commit events

## Run

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4173
```

## Core Reading Order

1. `src/core/eventBus.js`
2. `src/core/history.js`
3. `src/core/h.js`
4. `src/core/stateSim.js`
5. `src/core/componentRuntime.js`
6. `src/core/virtualDomSim.js`
7. `src/core/physicalDomSim.js`

## Simplified React-Like Workflow

```text
event
-> setState
-> functional component calls
-> desired virtual tree
-> virtual diff
-> physical DOM simulator patches
-> monitor events and history
```

The physical DOM simulator never mutates the browser DOM directly. It only updates its internal object tree and emits events. The lab binds those events to visual monitors.

This is not a React Fiber clone. It is a small mental model for learning render, reconciliation, and commit concepts.
