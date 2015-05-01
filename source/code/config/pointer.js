Jx("code/config/pointer", function() {

   return {

      '@type': 'class',

      symbol: '',

      point_to_list: null,

      next: null,

      constructor: function(symbol) {

         this.symbol = symbol;

      },

      clone: function() {

         return new this.constructor(this.symbol);

      }

   };

});
