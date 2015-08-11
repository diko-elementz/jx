

describe("Core jx module", function() {
   var J = Jx;
   Jx.setBaseUrl('/base/');

   it('exposes Jx global variable', function (done) {
      expect(Jx).toEqual(Jx.GLOBAL.Jx);
      done();
   });

   it('can load jxExtensions module and use its exports', function (done) {
      Jx.use('jxExtensions', function(ext) {
         expect(ext.assign).toBe(Jx.assign);
         expect(ext.isObject).toBe(Jx.isObject);
         expect(ext.isFunction).toBe(Jx.isFunction);
         expect(ext.isString).toBe(Jx.isString);
         done();
      });
   });

   it('can declare custom inline modules', function (done) {
      Jx.inline('testModule', function () {
         Jx('jxClass', 'jxExtensions', function (Class, Extensions) {
            this.exports.name = 'testModule';
         });
      });
      Jx.use('testModule', function (test) {
         expect(test.name).toBe('testModule');
         done();
      });
   });

});
