"use strict";

Jx('event/promise', function() {

   var PENDING = 0;

   var FULFILLED = 1;

   var REJECTED = 2;

   return function(check) {

            var state = PENDING;

            var Promise = this;

            function resolve(fulfilled) {

               state = fulfilled !== false ?

                           FULFILLED : REJECTED;

            }

            function handle(callback, match_state) {

               var interval;

               // try
               if (!state) {

                  check(resolve);

               }

               if (!state) {

                  interval = setInterval(function() {

                        check(resolve);

                        if (state != PENDING) {

                           clearInterval(interval);

                           if (state == match_state) {

                              callback(Promise);

                           }

                        }

                     }, 1);

               } else if (state == match_state) {

                  callback(Promise);

               }

            }

            function then(on_fulfill, on_reject) {

               if (on_fulfill) {

                  handle(on_fulfill, FULFILLED);

               }

               if (on_reject) {

                  handle(on_reject, REJECTED);

               }

               return this;

            }

            this.then = then;

            return this;

         };

});
