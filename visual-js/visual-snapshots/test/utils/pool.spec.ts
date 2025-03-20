import workerpool, { WorkerPoolOptions } from "workerpool";
import path from "path";
import { execAll, WorkerMethod } from "../../src/utils/pool.js";
import { __dirname } from "../helpers.js";

function* workers(
  elements: number[]
): Generator<WorkerMethod<"elementWorker", (i: number) => number>> {
  for (const element of elements) {
    yield {
      method: "elementWorker",
      args: [element],
    };
  }
}

function* workersThrowingGenerator(
  elements: number[],
  index: number,
  message: string
): Generator<WorkerMethod<"elementWorker", (i: number) => number>> {
  for (let i = 0; i < elements.length; i++) {
    if (i === index) {
      throw new Error(message);
    }

    yield {
      method: "elementWorker",
      args: [elements[i]],
    };
  }
}

function* throwingWorkersGenerator(
  elements: number[],
  index: number,
  message: string
): Generator<
  WorkerMethod<
    "elementWorker" | "throwingElementWorker",
    ((i: number) => number) | ((message: string) => never)
  >
> {
  for (let i = 0; i < elements.length; i++) {
    if (i === index) {
      yield {
        method: "throwingElementWorker",
        args: [message],
      };
    } else {
      yield {
        method: "elementWorker",
        args: [elements[i]],
      };
    }
  }
}

function createPool(opts?: WorkerPoolOptions) {
  return workerpool.pool(
    path.join(__dirname(import.meta), "./pool.worker.js"),
    opts
  );
}

async function usePool(
  fn: (pool: workerpool.Pool) => Promise<void>,
  opts?: WorkerPoolOptions
) {
  const pool = createPool(opts);
  try {
    return await fn(pool);
  } finally {
    pool.terminate();
  }
}

function range(count: number) {
  return [...new Array(count)].map((_, i) => i);
}

describe("execAll", () => {
  it("should enqueue and complete all elements with concurrency greater than element count", async () => {
    const elements = range(10);

    await usePool(
      async (pool) => {
        const actual = await execAll(pool, workers(elements));
        expect(actual.sort((a, b) => a - b)).toEqual(elements);
      },
      { maxWorkers: 20 }
    );
  });

  it("should enqueue and complete all elements with concurrency less than element count", async () => {
    const elements = range(100);

    await usePool(
      async (pool) => {
        const actual = await execAll(pool, workers(elements));
        expect(actual.sort((a, b) => a - b)).toEqual(elements);
      },
      { maxWorkers: 10 }
    );
  });

  it("should reject if first worker creator throws", async () => {
    const elements = range(100);

    await usePool(
      async (pool) => {
        const error = new Error("test");
        const promise = execAll(
          pool,
          workersThrowingGenerator(elements, 0, "test")
        );

        await expect(promise).rejects.toThrow(error);
      },
      { maxWorkers: 1 }
    );
  });

  it("should reject if n-th worker creator throws where n < concurrency", async () => {
    const elements = range(100);

    await usePool(
      async (pool) => {
        const error = new Error("test");
        const promise = execAll(
          pool,
          workersThrowingGenerator(elements, 5, "test")
        );

        await expect(promise).rejects.toThrow(error);
      },
      { maxWorkers: 10 }
    );
  });

  it("should reject if n-th worker creator throws where n > concurrency", async () => {
    const elements = range(100);

    await usePool(
      async (pool) => {
        const error = new Error("test");
        const promise = execAll(
          pool,
          workersThrowingGenerator(elements, 90, "test")
        );

        await expect(promise).rejects.toThrow(error);
      },
      { maxWorkers: 1 }
    );
  });

  it("should reject if last worker creator throws", async () => {
    const elements = range(100);

    await usePool(
      async (pool) => {
        const error = new Error("test");
        const promise = execAll(
          pool,
          workersThrowingGenerator(elements, elements.length - 1, "test")
        );

        await expect(promise).rejects.toThrow(error);
      },
      { maxWorkers: 1 }
    );
  });

  it("should reject if first worker throws", async () => {
    const elements = range(100);

    await usePool(
      async (pool) => {
        const error = new Error("test");
        const promise = execAll(
          pool,
          workersThrowingGenerator(elements, 0, "test")
        );

        await expect(promise).rejects.toThrow(error);
      },
      { maxWorkers: 1 }
    );
  });

  it("should reject if n-th worker throws where n < concurrency", async () => {
    const elements = range(100);

    await usePool(
      async (pool) => {
        const error = new Error("test");
        const promise = execAll(
          pool,
          throwingWorkersGenerator(elements, 5, "test")
        );

        await expect(promise).rejects.toThrow(error);
      },
      { maxWorkers: 10 }
    );
  });

  it("should reject if n-th worker throws where n > concurrency", async () => {
    const elements = range(100);

    await usePool(
      async (pool) => {
        const error = new Error("test");
        const promise = execAll(
          pool,
          throwingWorkersGenerator(elements, 90, "test")
        );

        await expect(promise).rejects.toThrow(error);
      },
      { maxWorkers: 1 }
    );
  });

  it("should reject if last worker throws", async () => {
    const elements = range(100);

    await usePool(
      async (pool) => {
        const error = new Error("test");
        const promise = execAll(
          pool,
          throwingWorkersGenerator(elements, elements.length - 1, "test")
        );

        await expect(promise).rejects.toThrow(error);
      },
      { maxWorkers: 1 }
    );
  });
});
