import Queue from "queue";
import { waitForEmptyQueue } from "../../src/utils/queue.js";

describe("waitForEmptyQueue", () => {
  it("should wait for all elements in queue to finish", async () => {
    const queue = new Queue({
      autostart: true,
    });

    const waiter = waitForEmptyQueue(queue);

    let result = 0;
    const workers = 5;
    for (let i = 0; i < workers; i++) {
      queue.push(() => {
        return new Promise<void>((resolve) => {
          setImmediate(() => {
            result += 1;
            resolve();
          });
        });
      });
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
      queue.push(
        () =>
          new Promise<void>((resolve, reject) => {
            setImmediate(() => {
              if (i === 3) {
                reject(error);
              } else {
                resolve();
              }
            });
          })
      );
    }

    expect(waiter).rejects.toThrow(error);
  });
});
