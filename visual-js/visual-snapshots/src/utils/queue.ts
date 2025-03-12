import Queue from "queue";

export function waitForEmptyQueue(queue: Queue) {
  return new Promise<void>((resolve, reject) => {
    const onError = (err: unknown) => {
      cleanup();
      reject(err);
    };

    const onSuccess = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      queue.removeEventListener("end", onSuccess);
      queue.removeEventListener("error", onError);
    };

    queue.addEventListener("end", onSuccess, { once: true });
    queue.addEventListener("error", onError, { once: true });
  });
}
