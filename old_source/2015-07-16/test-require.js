Jx(
   'test-require/load1',
   'test-require/load2',
   function (load1, load2) {

      this.exports.name = 'buang';

      console.log('test! ', load1.name, load2.name);

   });

