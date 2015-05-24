Jx("code/config/pointer",

	// requires
	"class/base",

function(Class) {

   return {

      '@type': 'class',

      symbol: '',

		is_point_back: false,

		from_list: null,

      point_to_list: null,

      next: null,

      constructor: function(symbol) {

         this.symbol = symbol;

      },

      clone: function() {

			var clone = Class.clone(this);

			clone.next = null;

			return clone;

      },

		get_state_signature: function() {

			var from = this.from_list;

			var to = this.point_to_list;

			var name = [

								from.state ? from.state.name : '',

								'>',

								to.state ? to.state.name : '',

						];

			return name.join('');

		}

   };

});
