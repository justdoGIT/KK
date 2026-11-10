import { expect, it } from "vitest";
import { writeStyle } from "../motion/dom-style.ts";

it("avoids repaint mutations after CSS normalization and restores externally changed poses", async () => {
  const card = document.createElement("article");
  const pose = "rotateX(2.200deg)";
  writeStyle(card, "transform", pose);
  // Match the value serialized by browsers that trim redundant decimals.
  card.style.transform = "rotateX(2.2deg)";
  writeStyle(card, "transform", pose);
  let changes = 0;
  const observer = new MutationObserver(entries => { changes += entries.length; });
  observer.observe(card, { attributes: true, attributeFilter: ["style"] });
  writeStyle(card, "transform", pose);
  writeStyle(card, "transform", pose);
  await Promise.resolve();
  expect(changes).toBe(0);
  card.style.transform = "none";
  writeStyle(card, "transform", pose);
  expect(card.style.transform).not.toBe("none");
  observer.disconnect();
});
