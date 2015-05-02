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

			var fragment = left.clone();

			var split = right.split_list;

			var back = right.point_back;

			fragment.point(this);

			// apply split list
			fragment.apply_split(right);

			// concatenate right
			fragment.outgoing = right.outgoing.slice(0);

			fragment.split_list = split && split.slice(0);

			fragment.point_back = back && back.slice(0);

			fragment.add_capture(right);

			return fragment;

		}

   };


});
