export function h(type, props = {}, ...children) {
  return {
    type,
    props: props || {},
    children: children.flat().filter((child) => child !== null && child !== false && child !== undefined)
  };
}

export function text(value) {
  return String(value);
}
