Jx('net/base', function() {


   function validate_options(url, options) {

      var method, user, password;

      if (Jx.is_object(url)) {

         options = url;

         url = options.url;

      }

      method = options.method;

      user = options.user;

      password = options.password;

      options.url = url && typeof url == 'string' ? url : false;

      options.method = method && typeof method == 'string' ?

                           method.toUpperCase() : 'GET';

      options.async = options.async !== false;

      options.user = user && typeof user == 'string' ?

                           user : false;

      options.password = typeof password == 'string' ? password : '';

      return options;

   }

   function parse_string_headers(str) {

      var headers = {};

      var pairs, name, c, l;

      for (c = -1, l = str.length; l--;) {




      }

   }

   return {

      create_request: function(url, options) {

      },

      parse_headers: function() {

      }

   };

});
