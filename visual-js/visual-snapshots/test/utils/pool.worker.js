import workerpool from "workerpool";

function elementWorker(i) {
  return i;
}

function throwingElementWorker(message) {
  throw new Error(message);
}

workerpool.worker({ elementWorker, throwingElementWorker });
