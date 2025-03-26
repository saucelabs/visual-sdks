import AsyncLock from "async-lock";
import os from "os";
import workerpool from "workerpool";

export type WorkerMethod<
  M extends string,
  Fn extends (...args: any[]) => unknown
> = {
  readonly method: M;
  readonly args: Fn extends (...args: infer A) => unknown ? A : never;
};

export async function execAll<M extends WorkerMethod<string, any>>(
  pool: workerpool.Pool,
  iterator: Iterator<M> | AsyncIterator<M>
) {
  type ResultType = M extends WorkerMethod<infer _, infer Fn>
    ? Fn extends (...args: infer __) => infer R
      ? R
      : never
    : never;

  const concurrency = pool.maxWorkers ?? os.cpus().length;

  return new Promise<ResultType[]>(async (resolve, reject) => {
    const lock = new AsyncLock();
    const tasks: Promise<ResultType>[] = [];

    const enqueueNext = async () => {
      void lock.acquire("queue", async () => {
        try {
          const { done, value } = await iterator.next();
          if (done) {
            return finalize();
          }

          const { method, args } = value;
          const task = pool.exec(method, args);
          tasks.push(task as never);
          task.then(enqueueNext).catch(onError);
        } catch (err) {
          onError(err);
        }
      });
    };

    const finalize = () => {
      Promise.all(tasks).then(resolve).catch(onError);
    };

    const onError = (err: unknown) => {
      reject(err);
    };

    for (let i = 0; i < concurrency; i++) {
      await enqueueNext();
    }
  });
}
