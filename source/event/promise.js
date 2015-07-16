"use strict";

Jx('event/promise', function () {

   var PENDING = 0;

   var FULFILLED = 1;

   var REJECTED = 2;

   return function(check) {

            var state = PENDING;

				var data = void(0);

            function resolve(param) {

               state = FULFILLED;

					data = param;

            }

				function reject(reason) {

					state = REJECTED;

					data = reason;

				}

            function handle(callback, match_state) {

               var interval;

               // try
               if (!state) {

                  check(resolve);

               }

               if (!state) {

                  interval = setInterval(function () {

                        check(resolve);

                        if (state) {

                           clearInterval(interval);

                           if (state == match_state) {

                              callback(data);

                           }

                        }

                     }, 1);

               }
					else if (state == match_state) {

                  callback(data);

               }

            }

            this.then = function (on_fulfill, on_reject) {

               if (on_fulfill) {

                  handle(on_fulfill, FULFILLED);

               }
					else if (on_reject) {

                  handle(on_reject, REJECTED);

               }

               return this;

            }

            return this;

         };

});
