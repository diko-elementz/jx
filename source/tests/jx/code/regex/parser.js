describe("jxCodeRegexParser module", function() {
   var J = Jx;
   var SuperClass, SubClass, myInstance, mySubInstance;

   Jx.setBaseUrl('/base/');

   it('can tokenize', function (done) {
      Jx.use('jxClass', function (Class) {
         SuperClass = Class.extend(Object, {
               name: 'superClass',
               overriddenName: 'superClass',
               items: undefined,
               constructor: function () {
                  this.items = [];
               }
            });

         myInstance = new SuperClass;

         expect(Jx.isFunction(SuperClass)).toBe(true);

         expect(SuperClass.prototype.$superclass).toBe(Object.prototype);

         expect(Jx.isArray(myInstance.items)).toBe(true);

         done();
      });
   });


});
