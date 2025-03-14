import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * ESM helper for getting __filename. Pass `import.meta` to this function.
 * @param meta `import.meta`
 * @returns __filename equivalent
 */
export const __filename = (meta: ImportMeta) => fileURLToPath(meta.url);

/**
 * ESM helper for getting __dirname. Pass `import.meta` to this function.
 * @param meta `import.meta`
 * @returns __dirname equivalent
 */
export const __dirname = (meta: ImportMeta) => dirname(__filename(meta));
