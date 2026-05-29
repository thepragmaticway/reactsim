import { createEventBus } from "./eventBus.js";
import { createHistory } from "./history.js";
import { createPhysicalDomSim } from "./physicalDomSim.js";
import { createVirtualDomSim } from "./virtualDomSim.js";
import { createStateSim } from "./stateSim.js";

export function createComponentRuntime(rootComponent) {
  const bus = createEventBus();
  const history = createHistory();
  const physicalDom = createPhysicalDomSim({ bus, history });
  const virtualDom = createVirtualDomSim({ bus, history, physicalDom });

  let scheduled = false;
  let renderCount = 0;
  let stateSim;

  function render(reason = "manual") {
    scheduled = false;
    stateSim.beginRender();

    const startEvent = bus.emit("runtime:render:start", {
      source: "reactsim",
      phase: "render",
      reason,
      renderCount: renderCount + 1
    });
    history.record(startEvent);

    const desiredTree = rootComponent({ useState: stateSim.useState });
    const patches = virtualDom.render(desiredTree);
    renderCount += 1;

    const endEvent = bus.emit("runtime:render:end", {
      source: "reactsim",
      phase: "commit",
      renderCount,
      patchCount: patches.length
    });
    history.record(endEvent);
  }

  function requestRender() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => render("state update"));
  }

  stateSim = createStateSim({ bus, history, requestRender });

  function mount() {
    render("mount");
  }

  function reset() {
    renderCount = 0;
    scheduled = false;
    stateSim.reset();
    virtualDom.reset();
    history.clear();
    mount();
  }

  return {
    bus,
    history,
    mount,
    reset,
    render,
    getPhysicalTree: physicalDom.getTree,
    getVirtualTree: virtualDom.getTree,
    getStateSlots: stateSim.getSlots
  };
}
