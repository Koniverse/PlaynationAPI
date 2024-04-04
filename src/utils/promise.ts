export interface PromiseObject<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

export function createPromise<T>(): PromiseObject<T> {
  const promiseObject = {} as PromiseObject<T>;
  promiseObject.promise = new Promise<T>((resolve, reject) => {
    promiseObject.resolve = resolve;
    promiseObject.reject = reject;
  });

  return promiseObject;
}