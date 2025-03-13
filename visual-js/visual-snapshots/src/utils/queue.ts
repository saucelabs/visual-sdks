import Queue, { QueueEvent, QueueWorker } from "queue";

export function waitForEmptyQueue(queue: Queue) {
  return new Promise<void>((resolve, reject) => {
    const onEvent = (evt: QueueEvent<any, { error?: Error | undefined }>) => {
      cleanup();
      !evt.detail.error ? resolve() : reject(evt.detail.error);
    };

    const cleanup = () => {
      queue.removeEventListener("end", onEvent);
      queue.removeEventListener("error", onEvent);
    };

    queue.addEventListener("end", onEvent, { once: true });
    queue.addEventListener("error", onEvent, { once: true });
  });
}

export function queueJob(promise: Promise<unknown>): QueueWorker {
  return (cb) => {
    promise.then((res) => cb?.(undefined, res as never)).catch(cb);
  };
}
