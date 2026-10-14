import { styles } from "./component-style";

const PREFIX = "copa";

function prefixClasses(classString: string): string {
  return classString
    .split(" ")
    .filter(Boolean)
    .map((cls) => {
      // Handle variant prefixes (hover:, focus:, data-[...]:, etc.)
      const parts = cls.split(":");
      const utility = parts.pop()!;
      const variants = parts;
      // Reconstruct: variants + copa: + utility
      return [...variants, `${PREFIX}:${utility}`].join(":");
    })
    .join(" ");
}

export const prefixedStyles = Object.fromEntries(
  Object.entries(styles).map(([key, value]) => [key, prefixClasses(value)])
) as typeof styles;

export { prefixClasses };
