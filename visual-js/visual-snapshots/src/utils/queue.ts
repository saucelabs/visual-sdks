import Queue, { QueueEvent, QueueWorker } from "queue";
import AsyncLock from "async-lock";

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

/**
 * Enqueues items from iterator. If queue is full, the function waits until a worker finishes until enqueuing next item.
 * @param queue Queue to enqueue on.
 * @param iterator Iterator to iterate over.
 * @param workerFn Callback to create a worker.
 * @returns
 */
export async function enqueueFromIterator<T>(
  queue: Queue,
  iterator: Iterator<T> | AsyncIterator<T>,
  workerFn: (t: T) => QueueWorker
) {
  queue.stop();

  const shouldRestart = () => !queue.length && !queue.autostart;

  return new Promise<void>(async (resolve, reject) => {
    const lock = new AsyncLock();

    // When a worker finishes, we iterate more and push to the queue
    const onSuccess = () => {
      if (queue.length >= queue.concurrency) {
        return;
      }

      // We need a lock here, because multiple elements can finish at once and overfill the queue
      void lock.acquire("queue", async () => {
        if (queue.length >= queue.concurrency) {
          return;
        }

        try {
          const { done, value } = await iterator.next();
          if (done) {
            cleanup();
            return resolve();
          }

          const restart = shouldRestart();
          queue.push(workerFn(value));
          if (restart) {
            queue.start().catch(onError);
          }
        } catch (error) {
          onError(error);
        }
      });
    };

    const onError = (err: unknown) => {
      cleanup();
      reject(err);
    };

    const onQueueError = (
      evt: QueueEvent<"error", { error: Error; job: QueueWorker }>
    ) => onError(evt.detail.error);

    const cleanup = () => {
      queue.removeEventListener("success", onSuccess);
      queue.removeEventListener("error", onQueueError);
    };

    queue.addEventListener("success", onSuccess);
    queue.addEventListener("error", onQueueError);

    const restart = shouldRestart();
    try {
      for (let i = 0; i < queue.concurrency; i++) {
        const { done, value } = await iterator.next();
        if (done) {
          break;
        }

        queue.push(workerFn(value));
      }
    } catch (err) {
      return onError(err);
    }

    if (restart) {
      queue.start().catch(onError);
    }
  });
}
