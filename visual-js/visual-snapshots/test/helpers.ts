import { dirname } from "node:path";
import { Writable } from "node:stream";
import { fileURLToPath } from "node:url";
import { pino } from "pino";

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

export function mockLogger() {
  const logged: object[] = [];

  const stream = new Writable({
    write(chunk, _encoding, callback) {
      const message = JSON.parse(chunk.toString("utf-8"));
      delete message.time;
      delete message.pid;
      logged.push(message);
      callback();
    },
  });

  function reset() {
    logged.length = 0;
  }

  const logger = pino(stream);
  return { logger, logged, reset };
}
