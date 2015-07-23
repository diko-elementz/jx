'use strict';

Jx('jx', 'jxExtensions', function (Jx) {

   var GLOBAL = Jx.GLOBAL;
   var Promise;

   // use global promise
   if (false) { //'Promise' in GLOBAL) {  // need to test Promise emulator

      Promise = GLOBAL.Promise;

   }
   // custom Promise
   else {

      Promise = (function () {

         var EXEC_PENDING = 1,
            EXEC_RESOLVED = 2,
            EXEC_REJECTED = 3,
            EXEC_SETTLED = 4,

            genId = 0,
            unsettled = {},
            unsettledCount = 0,
            processing = false;

         function emptyFn() {};

         function defaultOnFulfill(value) {
            return value;
         }

         function defaultOnReject(reason) {
            throw reason;
         }

         function isThenable(value) {
            var J = Jx;
            return J.isObject(value) && J.isFunction(value.then);
         }

         function createId() {
            var id = genId;
            var list = unsettled;
            for (; id--;) {
               if (!(id in list)) {
                  return id;
               }
            }
            return ++genId;
         }

         function runProcess() {
            var list = unsettled,
               J = Jx;
            var id, process;
            if (unsettledCount && !processing) {
               processing = true;
               for (id in list) {
                  process = list[id];
                  if (process()) {
                     unsettledCount--;
                     delete list[id];
                  }
               }
               processing = false;
            }
         }

         function Promise(executor) {
            var me = this;
            var processor;

            if (!(me instanceof Promise)) {
               return new Promise(executor);
            }

            processor = function () {
               var current = processor,
                  status = null;

               while (status !== current.status) {
                  // has status change
                  if (status) {
                     Jx.nextTick(runProcess);
                  }
                  switch (status = current.status) {
                  case EXEC_SETTLED:
                     return true;

                  case EXEC_RESOLVED:
                  case EXEC_REJECTED:
                     processor.status = EXEC_SETTLED;
                     break;

                  case EXEC_PENDING:
                     try {
                        executor.call(null, current.resolve, current.reject);
                     }
                     catch (e) {
                        current.reject(e);
                     }
                  }
               }
               return false;

            };

            processor.status = EXEC_PENDING;

            processor.resolve = function (data) {
               processor.status = EXEC_RESOLVED;
               processor.settle = function (callback) {
                  callback(data, true);
               };
               runProcess();
            };

            processor.reject = function (reason) {
               processor.status = EXEC_REJECTED;
               processor.settle = function (callback) {
                  callback(data, false);
               };
               runProcess();
            };

            me.$$processor = processor;
            unsettled[createId()] = processor;
            unsettledCount++;

            runProcess();

            return me;

         }

         // static properties
         Jx.assign(Promise, {
            /**
             * create promise that is resolved when all promises in
             * iteratable is resolved.
             */
            all: function (iteratable) {
               var count = 0,
                  values = [],
                  newPromise = null;

               var promise, createPromise, l;

               if (Jx.isArray(iteratable)) {
                  createPromise = function (index, promise) {
                        return promise.then(
                           function (data) {
                              values[index] = data;
                              return data;
                           },
                           function (reason) {
                              values.splice(0, values.length); // clear
                              throw reason;
                           });
                     };

                  for (l = iteratable.length; l--;) {
                     promise = iteratable[l];
                     if (isThenable(promise)) {
                        newPromise = createPromise(count++, promise);
                     }
                  }

                  if (newPromise) {

                     return newPromise.then(function () {
                              return values;
                           });

                  }

               }

               return Promise.reject('Invalid Promise arguments');

            },
            /**
             * create promise that settles after first promise in
             * iteratable is resolved or rejected
             */
            race: function (iteratable) {

               if (Jx.isArray(iteratable)) {



               }

            },
            /**
             * create promise that rejects with the given reason
             */
            reject: function (reason) {
               return new Promise(
                           function (resolve, reject) {
                              reject(reason);
                           });
            },
            /**
             * create promise that resolves with the given data
             */
            resolve: function (data) {
               return new Promise(
                           function (resolve, reject) {
                              resolve(data);
                           });
            }
         });

         Jx.assign(Promise.prototype, {

            constructor: Promise,

            then: function (onFulfilled, onReject) {

               var processor = this.$$processor,
                  J = Jx,
                  applied = false;

               onFulfilled = J.isFunction(onFulfilled) ?
                                          onFulfilled : defaultOnFulfill;

               onReject = J.isFunction(onReject) ?
                                       onReject : defaultOnReject;

               function executor(resolve, reject) {
                  var parent = processor;
                  if (!applied && parent.status == EXEC_SETTLED) {
                     applied = true;
                     parent.settle(function (data, resolved) {
                        if (resolved) {
                           try {
                              data = onFulfilled.call(null, data);
                           }
                           catch (e) {
                              data = e;
                              resolved = false;
                           }
                        }
                        else {
                           try {
                              onReject.call(null, data);
                           }
                           catch (e) {
                              data = e;
                              resolved = false;
                           }
                        }
                        if (!resolved) {
                           reject(data);
                        }
                        else if (isThenable(data)) {
                           data.then(resolve, reject);
                        }
                        else {
                           resolve(data);
                        }
                     });
                  }
               }

               return new Promise(executor);
            }

         });

         return Promise;

      })();

   }

   // export
   this.Promise = Promise;

   this.create = function (executor) {

      return new Promise(executor);

   };

   Jx.assign(this, Promise);


});
