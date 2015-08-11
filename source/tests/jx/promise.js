
describe("jxPromise module", function() {
   var J = Jx;

   function testDeferResolvedPromise(Promise, data, timeout) {
      return new Promise(function (resolve, reject) {
         setTimeout(function () {
            resolve(data);
         }, timeout || 500);
      });
   }

   function testDeferRejectedPromise(Promise, message, timeout) {
      return new Promise(function (resolve, reject) {
         setTimeout(function () {
            reject(message);
         }, timeout || 500);
      });
   }

   Jx.setBaseUrl('/base/');

// constructor
   it('is a thenable promise constructor with A+ spec static methods: ' +
      'all(), race(), resolve(), and reject()',
      function (done) {
         Jx.use('jxPromise', function (Promise) {
            expect(Jx.isFunction(Promise)).toBe(true);
            expect(Jx.isFunction(Promise.prototype.then)).toBe(true);
            expect(Jx.isFunction(Promise.race)).toBe(true);
            expect(Jx.isFunction(Promise.all)).toBe(true);
            expect(Jx.isFunction(Promise.resolve)).toBe(true);
            expect(Jx.isFunction(Promise.reject)).toBe(true);
            done();
         });
      });

// chaining
   it('can chain resolved promise',
      function (done) {
         Jx.use('jxPromise', function (Promise) {
            testDeferResolvedPromise(Promise, 'data', 100).
               then(function (data) {
                     return 'data1';
                  }).
               then(function (data) {
                     return testDeferResolvedPromise(Promise, 'data2');
                  }).
               then(function (data) {
                     expect(data).toBe('data2');
                     done();
                  });
         });
      });

   it('can chain rejected promise',
      function (done) {
         Jx.use('jxPromise', function (Promise) {
            testDeferResolvedPromise(Promise, 'data', 100).
               then(function (data) {
                     return testDeferRejectedPromise(Promise, 'data1');
                  }).
               then(function (data) {
                     expect('rejected').toBe(true);
                     done();
                  },
                  function (data) {
                     return testDeferRejectedPromise(Promise, 'data2');
                  }).
               then(function (data) {
                     expect('rejected').toBe(true);
                     done();
                  },
                  function (data) {
                     expect(data).toBe('data1'); // must reject from the start
                     done();
                  });
         });
      });

// Promise.all()
   it('can resolve promise with the given resolved thenable items '+
      'using Promise.all() method',
      function (done) {
         Jx.use('jxPromise', function (Promise) {
            expect(Jx.isFunction(Promise.all)).toBe(true);

            Promise.all([

                  testDeferResolvedPromise(Promise, 'data1'),
                  testDeferResolvedPromise(Promise, 'data2'),
                  testDeferResolvedPromise(Promise, 'data3')

               ]).
               then(function (data) {
                     expect(Jx.isArray(data)).toBe(true);
                     done();
                  },
                  function (message) {
                     expect('rejected').toBe(true);
                     done();
                  });

         });
      });

   it('can reject promise when one of the given thenable item ' +
      'is rejected when using Promise.all() method',
      function (done) {
         Jx.use('jxPromise', function (Promise) {
            expect(Jx.isFunction(Promise.all)).toBe(true);

            Promise.all([

                  testDeferResolvedPromise(Promise, 'data1'),
                  testDeferRejectedPromise(Promise, 'data2 rejected'),
                  testDeferResolvedPromise(Promise, 'data3')

               ]).
               then(function (data) {
                     expect('rejected').toBe(true);
                     done();
                  },
                  function (message) {
                     expect(message).toBe('data2 rejected');
                     done();
                  });
         });
      });

// Promise.race()
   it('can resolve a promise if the first promise to settle is resolved in ' +
      'thenable list using Promise.race() method',
      function (done) {
         Jx.use('jxPromise', function (Promise) {
            expect(Jx.isFunction(Promise.race)).toBe(true);

            Promise.race([

                  testDeferResolvedPromise(Promise, 'data1', 1000),
                  testDeferRejectedPromise(Promise, 'data2 rejected', 700),
                  testDeferResolvedPromise(Promise, 'data3', 300)

               ]).
               then(function (data) {
                     expect(data).toBe('data3');
                     done();
                  },
                  function (message) {
                     expect('rejected').toBe(true);
                     done();
                  });
         });
      });

   it('can reject a promise if the first promise to settle is rejected in ' +
      'thenable list using Promise.race() method',
      function (done) {
         Jx.use('jxPromise', function (Promise) {
            expect(Jx.isFunction(Promise.race)).toBe(true);

            Promise.race([

                  testDeferResolvedPromise(Promise, 'data1', 1000),
                  testDeferRejectedPromise(Promise, 'data2 rejected', 500),
                  testDeferResolvedPromise(Promise, 'data3', 700)

               ]).
               then(function (data) {
                     expect('rejected').toBe(true);
                     done();
                  },
                  function (message) {
                     expect(message).toBe('data2 rejected');
                     done();
                  });
         });
      });

// Promise.resolve()
   it('can return resolved promise when calling Promise.resolve() method',
      function (done) {
         Jx.use('jxPromise', function (Promise) {
            Promise.resolve('data1').
               then(function (data) {
                     expect(data).toBe('data1');
                     done();
                  },
                  function () {
                     expect('rejected').toBe(true);
                     done();
                  });
         });
      });

// Promise.reject()
   it('can return rejected promise when calling Promise.reject() method',
      function (done) {
         Jx.use('jxPromise', function (Promise) {
            Promise.reject('data1').
               then(function (data) {
                     expect('rejected').toBe(true);
                     done();
                  },
                  function (data) {
                     expect(data).toBe('data1');
                     done();
                  });
         });
      });

});
