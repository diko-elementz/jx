Jx('code/config/state', function() {

   return {

      '@type': 'class',

      name: null,

		pointers: null,

		definition: null,

		generator: null,

      constructor: function (generator, definition, name, list) {

         var states = definition.states;

         var new_states = definition.new_states;

         name = name || ':' + (++definition.state_id_seed);

         // new state name
         new_states[new_states.length] = this;

         list = list || generator.on_create_list(definition);

         list.state = this;

         this.name = name;

         this.definition = definition;

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
			fragment = this.generator.on_create_fragment(
													this.definition,
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
