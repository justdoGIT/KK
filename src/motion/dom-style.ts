/** Avoid invalidating settled layers when another section scrolls. */
const styles = new WeakMap<HTMLElement, Map<string, { requested: string; serialized: string }>>();

export function writeStyle(element: HTMLElement, property: string, value: string): void {
  const current = element.style.getPropertyValue(property);
  const previous = styles.get(element)?.get(property);
  // CSS normalizes values such as rotateX(2.200deg) to rotateX(2.2deg).
  // Remember that serialization, while detecting external React/style changes.
  if (current === value || (previous?.requested === value && previous.serialized === current)) return;
  element.style.setProperty(property, value);
  let properties = styles.get(element);
  if (!properties) { properties = new Map(); styles.set(element, properties); }
  properties.set(property, { requested: value, serialized: element.style.getPropertyValue(property) });
}

export function toggleClass(element: HTMLElement, name: string, enabled: boolean): void {
  if (element.classList.contains(name) !== enabled) element.classList.toggle(name, enabled);
}
