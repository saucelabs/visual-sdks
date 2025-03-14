import Queue from "queue";
import {
  enqueueFromIterator,
  waitForEmptyQueue,
} from "../../src/utils/queue.js";

function immediateWorker<T>(fn: () => T) {
  return new Promise<T>((resolve, reject) => {
    setImmediate(() => {
      try {
        resolve(fn());
      } catch (err) {
        reject(err);
      }
    });
  });
}

describe("waitForEmptyQueue", () => {
  it("should wait for all elements in queue to finish", async () => {
    const queue = new Queue({
      autostart: true,
    });

    const waiter = waitForEmptyQueue(queue);

    let result = 0;
    const workers = 5;
    for (let i = 0; i < workers; i++) {
      queue.push(() =>
        immediateWorker(() => {
          result += 1;
        })
      );
    }

    await waiter;
    expect(result).toEqual(5);
  });

  it("should raise an error if any worker throws", async () => {
    const queue = new Queue({
      autostart: true,
    });

    const waiter = waitForEmptyQueue(queue);

    const error = new Error("test");

    const workers = 5;
    for (let i = 0; i < workers; i++) {
      queue.push(() =>
        immediateWorker(() => {
          if (i === 3) {
            throw new Error("test");
          }
        })
      );
    }

    expect(waiter).rejects.toThrow(error);
  });
});

describe("enqueueFromIterator", () => {
  it("should enqueue and complete all elements with concurrency greater than element count", async () => {
    const elements = [...new Array(20)].map((_, i) => i);

    const queue = new Queue({
      concurrency: 30,
    });

    const actual: number[] = [];
    await enqueueFromIterator(
      queue,
      elements.values(),
      (n) => () => immediateWorker(() => actual.push(n))
    );

    await waitForEmptyQueue(queue);
    expect(actual.sort((a, b) => a - b)).toEqual(elements);
  });

  it("should enqueue and complete all elements with concurrency less than element count", async () => {
    const elements = [...new Array(100)].map((_, i) => i);

    const queue = new Queue({
      concurrency: 10,
    });

    const actual: number[] = [];
    await enqueueFromIterator(
      queue,
      elements.values(),
      (n) => () => immediateWorker(() => actual.push(n))
    );

    await waitForEmptyQueue(queue);
    expect(actual.sort((a, b) => a - b)).toEqual(elements);
  });

  it("should reject if first worker creator throws", async () => {
    const elements = [...new Array(100)].map((_, i) => i);

    const queue = new Queue({
      concurrency: 1,
    });

    const error = new Error("test");
    const promise = enqueueFromIterator(queue, elements.values(), () => {
      throw new Error("test");
    });

    await expect(promise).rejects.toThrow(error);
  });

  it("should reject if n-th worker creator throws where n < concurrency", async () => {
    const elements = [...new Array(100)].map((_, i) => i);

    const queue = new Queue({
      concurrency: 30,
    });

    const error = new Error("test");
    const promise = enqueueFromIterator(queue, elements.values(), (n) => {
      if (n === 1) {
        throw new Error("test");
      }

      return () =>
        immediateWorker(() => {
          // do nothing
        });
    });

    await expect(promise).rejects.toThrow(error);
  });

  it("should reject if n-th worker creator throws where n > concurrency", async () => {
    const elements = [...new Array(100)].map((_, i) => i);
    const queue = new Queue({
      concurrency: 1,
    });

    const error = new Error("test");
    const promise = enqueueFromIterator(queue, elements.values(), (n) => {
      if (n === 90) {
        throw new Error("test");
      }

      return () =>
        immediateWorker(() => {
          // do nothing
        });
    });

    await expect(promise).rejects.toThrow(error);
  });

  it("should reject if last worker creator throws", async () => {
    const elements = [...new Array(100)].map((_, i) => i);

    const queue = new Queue({
      concurrency: 1,
    });

    const error = new Error("test");
    const promise = enqueueFromIterator(queue, elements.values(), (n) => {
      if (n === elements.length - 1) {
        throw new Error("test");
      }

      return () =>
        immediateWorker(() => {
          // do nothing
        });
    });

    await expect(promise).rejects.toThrow(error);
  });

  it("should reject if first worker throws", async () => {
    const elements = [...new Array(100)].map((_, i) => i);

    const queue = new Queue({
      concurrency: 1,
    });

    const error = new Error("test");
    const promise = enqueueFromIterator(
      queue,
      elements.values(),
      () => () =>
        immediateWorker(() => {
          throw new Error("test");
        })
    );

    await expect(promise).rejects.toThrow(error);
  });

  it("should reject if n-th worker throws where n < concurrency", async () => {
    const elements = [...new Array(100)].map((_, i) => i);

    const queue = new Queue({
      concurrency: 30,
    });

    const error = new Error("test");
    const promise = enqueueFromIterator(
      queue,
      elements.values(),
      (n) => () =>
        immediateWorker(() => {
          if (n === 1) {
            throw new Error("test");
          }
        })
    );

    await expect(promise).rejects.toThrow(error);
  });

  it("should reject if n-th worker throws where n > concurrency", async () => {
    const elements = [...new Array(100)].map((_, i) => i);

    const queue = new Queue({
      concurrency: 1,
    });

    const error = new Error("test");
    const promise = enqueueFromIterator(
      queue,
      elements.values(),
      (n) => () =>
        immediateWorker(() => {
          if (n === 90) {
            throw new Error("test");
          }
        })
    );

    await expect(promise).rejects.toThrow(error);
  });

  it("should reject if last worker throws", async () => {
    const elements = [...new Array(100)].map((_, i) => i);

    const queue = new Queue({
      concurrency: 1,
    });

    const error = new Error("test");
    const promise = enqueueFromIterator(
      queue,
      elements.values(),
      (n) => () =>
        immediateWorker(() => {
          if (n === elements.length - 1) {
            throw new Error("test");
          }
        })
    );

    await expect(promise).rejects.toThrow(error);
  });
});
