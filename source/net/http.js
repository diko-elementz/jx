
Jx('net/http', 'class/base', 'event/promise', function(Class, Promise) {

   function get_driver() {

      return 'XmlHttpRequest' in Jx.GLOBAL ?

               new XmlHttpRequest() : false;

   }


   function apply_headers(options) {


   }

   function request(url, options) {

      var driver = get_driver();

      //options = validate_options(url, options);
      //
      //if (driver) {
      //
      //
      //
      //}

      return false;

   }

   return {

      '@type': 'class',

      '@singleton': true,

      request: function() {

      }

   };


});
