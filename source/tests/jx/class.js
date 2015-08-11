

describe("jxClass module", function() {
   var J = Jx;
   var SuperClass, SubClass, myInstance, mySubInstance;

   Jx.setBaseUrl('/base/');

   it('can create Class by extending native JS Objects', function (done) {
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



   it('can extend SuperClass to create SubClass', function (done) {

      Jx.use('jxClass', function (Class) {

         SubClass = Class.extend(SuperClass, {
            overriddenName: 'subClass',
            newName: 'subClass',
            constructor: function () {
               this.$super(arguments);
               this.items.push('item pushed');
            }
         });

         mySubInstance = new SubClass();

         expect(mySubInstance.name).toBe('superClass');

         expect(mySubInstance.overriddenName).toBe('subClass');

         expect(mySubInstance.newName).toBe('subClass');

         expect(mySubInstance.items.length).toBe(1);

         done();
      });

   });


});
