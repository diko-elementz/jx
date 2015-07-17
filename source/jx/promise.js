'use strict';

Jx('jx', 'jxExtensions', function (Jx) {
   var GLOBAL = Jx.GLOBAL,
      EXEC_PENDING = 1,
      EXEC_RESOLVED = 2,
      EXEC_REJECTED = 3,
      EXEC_SETTLED = 4;

   var Promise, empty, defaultOnFulfill, defaultOnReject;

   function isThenable(value) {
      var J = Jx;
      return J.isObject(value) && J.isFunction(value.then);
   }


   // use global promise
   if (false) { //'Promise' in GLOBAL) {  // need to test Promise emulator

      Promise = GLOBAL.Promise;

   }
   else {

      empty = function () {};

      defaultOnFulfill = function (value) { return value; };
      defaultOnReject = function (reason) { throw reason; };

      Promise = function (executor) {
         var me = this,
            status = EXEC_PENDING,
            rejected = true;

         var callee, interval;

         function updateState() {
            switch (status) {
            case EXEC_PENDING:
               try {
                  executor.call(null, resolve, reject);
               }
               catch (e) {
                  reject(e);
               }
               break;
            case EXEC_RESOLVED:
            case EXEC_REJECTED:
               // call only if handlers were provided
               if (callee.onFulfilled) {
                  status = EXEC_SETTLED;
                  updateState();
               }
               break;
            case EXEC_SETTLED:
               if (rejected) {
                  callee.onReject.call(null, callee.data);
               }
               else {
                  callee.onFulfilled.call(null, callee.data);
               }
               break;
            }
         };

         function resolve(data) {
            status = EXEC_RESOLVED;
            callee.data = data;
            rejected = false;
            updateState();
         }

         function reject(reason) {
            status = EXEC_REJECTED;
            callee.data = reason;
            updateState();
         }

         me.$$callee = callee = {
            data: void(0),
            reject: reject,
            resolve: resolve,
            onFulfilled: null,
            onReject: null
         };

         // try
         updateState();

         // async
         if (status != EXEC_SETTLED) {
            interval = Jx.nextTick(
                           function () {
                              switch (status) {
                              case EXEC_RESOLVED:
                              case EXEC_REJECTED:
                                 updateState();
                              case EXEC_SETTLED:
                                 Jx.clearTick(interval);
                                 break;
                              }
                           }, 10);
         }

      };

      // properties
      Jx.assign(Promise.prototype, {

         $$callee: void(0),

         constructor: Promise,

         'catch': function (onReject) {
            return this.then(null, onReject);
         },

         then: function (onFulfilled, onReject) {
            var me = this,
               J = Jx,
               callee = me.$$callee,
               promise = new Promise(empty);

            onFulfilled = J.isFunction(onFulfilled) ?
                              onFulfilled : defaultOnFulfill;

            onReject = J.isFunction(onReject) ?
                              onReject : defaultOnReject;

            callee.onFulfilled = function (data) {
               var failed = false;
               var result;
               try {
                  result = onFulfilled.call(null, data);
               }
               catch (e) {
                  result = e;
                  failed = true;
               }
               promise.$$callee[failed ? 'reject': 'resolve'](result);
            };

            callee.onReject = function (reason) {
               try {
                  onReject.call(null, reason);
               }
               catch (e) {
                  reason = e;
               }
               promise.$$callee.reject(reason);
            };

            return promise;

         }

      });

      // static properties
      Jx.assign(Promise, {
         all: function () {
         },
         race: function () {
         },
         reject: function () {
         },
         resolve: function () {
         }
      });

   }

   // export
   this.create = function (executor) {

      return new Promise(executor);

   };

   Jx.assign(this, Promise);


});
