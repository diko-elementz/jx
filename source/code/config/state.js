Jx('code/config/state', function() {

   return {

      '@type': 'class',

      name: null,

		pointers: null,

		generator: null,

      constructor: function (generator, name, list) {

         var states = generator.states;

         var new_states = generator.new_states;

         name = name || ':' + (++generator.state_id_seed);

         // new state name
         new_states[new_states.length] = this;

         list = list || generator.create_list();

         list.state = this;

         this.name = name;

         this.pointers = list;

         this.pointers.state = this;

			this.generator = generator;

      },

      concat: function(left, right) {

			var fragment;

			left.point(this);

			// apply split list
			if (left.split_list) {

				left.apply_split(right);

			}

			// create parent fragment
			fragment = this.generator.create_fragment(
													left.incoming,
													right.outgoing
												);

			// inherit split list
			if (right.split_list) {

				fragment.split_list = right.split_list;

			}

			if (right.point_back) {

				fragment.point_back = right.point_back;

			}

			return fragment;

		}

   };


});
