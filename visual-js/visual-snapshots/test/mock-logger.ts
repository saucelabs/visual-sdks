import { Writable } from "node:stream";
import { pino } from "pino";

export function mockLogger() {
  const logged: object[] = [];

  const stream = new Writable({
    write(chunk, _encoding, callback) {
      const message = JSON.parse(chunk.toString("utf-8"));
      delete message.time;
      delete message.pid;
      delete message.hostname;
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
