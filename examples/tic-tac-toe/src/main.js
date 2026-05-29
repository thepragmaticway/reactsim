import { createComponentRuntime, createElement, useState } from "../../../src/index.js";

const lines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

const gameRoot = document.querySelector("#game-root");
const resetButton = document.querySelector("#reset-game");
const timelineRoot = document.querySelector("#timeline");
const eventCount = document.querySelector("#event-count");

const actions = {};
let eventTotal = 0;

function calculateWinner(squares) {
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { player: squares[a], line: [a, b, c] };
    }
  }
  return null;
}

function App() {
  const [squares, setSquares] = useState(Array(9).fill(""));
  const [xIsNext, setXIsNext] = useState(true);
  const winner = calculateWinner(squares);
  const isDraw = !winner && squares.every(Boolean);
  const current = xIsNext ? "X" : "O";

  actions.play = (index) => {
    if (squares[index] || winner) return;
    const nextSquares = squares.map((square, squareIndex) => (squareIndex === index ? current : square));
    setSquares(nextSquares);
    setXIsNext(!xIsNext);
  };

  actions.reset = () => {
    setSquares(Array(9).fill(""));
    setXIsNext(true);
  };

  return createElement(
    "section",
    { class: "game" },
    createElement(
      "div",
      { class: "status-row" },
      createElement("p", { class: "status" }, statusText({ winner, isDraw, current })),
      createElement("p", { class: "substatus" }, "Each move updates state, reruns App(), diffs the board, and patches the changed button.")
    ),
    Board({ squares, winnerLine: winner?.line || [] })
  );
}

function statusText({ winner, isDraw, current }) {
  if (winner) return `${winner.player} wins`;
  if (isDraw) return "Draw game";
  return `${current} to move`;
}

function Board({ squares, winnerLine }) {
  return createElement(
    "div",
    { class: "board", role: "grid", "aria-label": "Tic tac toe board" },
    squares.map((value, index) => Square({ value, index, isWinner: winnerLine.includes(index) }))
  );
}

function Square({ value, index, isWinner }) {
  const className = ["square", value ? "filled" : "", isWinner ? "winner" : ""].filter(Boolean).join(" ");

  return createElement(
    "button",
    {
      class: className,
      "data-action": "play",
      "data-index": index,
      "aria-label": value ? `Square ${index + 1}, ${value}` : `Square ${index + 1}, empty`
    },
    value
  );
}

function pushTimeline(event) {
  if (!["state:update", "virtual:diff"].includes(event.type) && !event.type.startsWith("dom:")) return;

  eventTotal += 1;
  eventCount.textContent = `${eventTotal} events`;

  const item = document.createElement("li");
  item.className = `timeline-item ${event.type.startsWith("dom:") ? "commit" : "render"}`;
  item.innerHTML = `
    <span>${event.type}</span>
    <small>${describeEvent(event)}</small>
  `;
  timelineRoot.prepend(item);

  while (timelineRoot.children.length > 36) {
    timelineRoot.lastElementChild.remove();
  }
}

function describeEvent(event) {
  if (event.type === "state:update") return `slot ${event.slot} scheduled a render`;
  if (event.type === "virtual:diff") return `${event.patches.length} patch${event.patches.length === 1 ? "" : "es"} calculated`;
  if (event.patch) return `${event.patch.op} at ${event.patch.path}`;
  return event.phase || "";
}

const runtime = createComponentRuntime(App, { root: gameRoot });
runtime.bus.on("*", pushTimeline);
runtime.mount();

gameRoot.addEventListener("click", (event) => {
  const square = event.target.closest("[data-action='play']");
  if (!square) return;
  actions.play(Number(square.dataset.index));
});

resetButton.addEventListener("click", () => {
  eventTotal = 0;
  eventCount.textContent = "0 events";
  timelineRoot.innerHTML = "";
  actions.reset();
});
