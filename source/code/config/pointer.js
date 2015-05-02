Jx("code/config/pointer",

	// requires
	"class/base",

function(Class) {

   return {

      '@type': 'class',

      symbol: '',

		from_list: null,

      point_to_list: null,

      next: null,

      constructor: function(symbol) {

         this.symbol = symbol;

      },

      clone: function() {

			return Class.clone(this);

         //return new this.constructor(this.symbol);

      }

   };

});
