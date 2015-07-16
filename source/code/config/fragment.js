Jx("code/config/fragment",

	// requires
	"class/base",
	"code/config/list",

function (Class, List) {

   return {

      '@type': 'class',

		generator: null,

      incoming: null,

		outgoing: null,

		split_list: null,

		capture_list: null,

		next: null,

      constructor: function (generator, incoming, outgoing) {

			this.generator = generator;

			this.incoming = incoming || generator.create_list();

			this.outgoing = outgoing || generator.create_list();

      },

		clone: function (incoming, outgoing, split) {

			var generator = this.generator;

			var fragment = generator.create_fragment();

			this.combine_list(
					fragment.incoming,
					incoming || this.incoming,
					false
				);

			this.combine_list(
					fragment.outgoing,
					outgoing || this.outgoing,
					false
				);

			split = split || this.split_list;

			if (split) {

				fragment.split_list = split;

			}

			fragment.capture_list = this.capture_list;

			return fragment;

		},

		concat: function (right) {

			var generator = this.generator;

			var right_incoming = right.incoming;

			var outgoing = this.outgoing;

			var split = this.split_list;

			var fragment = this.clone(null, right.outgoing);

			// apply split list
			if (split) {

				split.clone_pointers_from(generator, right_incoming, null);

			}

			// inherit split
			fragment.split_list = right.split_list || null;

			// combine list with state
			this.combine_list(outgoing, right_incoming, true);

			// concat capture list
			this.join_capture(fragment, right);

			return fragment;

		},

		combine: function (right) {

			var generator = this.generator;

			var fragment = this.clone(
											null,
											null,
											this.split_list || right.split_list
										);

			// combine incoming
			this.combine_list(incoming, right.incoming, false);

			// combine outgoing
			this.combine_list(outgoing, right.outgoing, false);

			// concatenate capture
			this.join_capture(fragment, right);

			return fragment;

		},

		split: function () {

			var generator = this.generator;

			var incoming = this.incoming;

			var fragment = generator.create_fragment(incoming, this.outgoing);

			fragment.capture_list = this.capture_list;

			incoming.append(

				fragment.split_list = generator.create_list()

			);

			return fragment;

		},

		recur: function (split) {

			var fragment = split ? this.split() : this.clone();

			var outgoing = fragment.outgoing;

			// attach recur pointers
			outgoing.clone_pointers_from(
					this.generator,
					fragment.incoming,
					outgoing
				);

			return fragment;

		},

		capture: function () {

			var fragment = this.clone();

			var current = fragment.capture_list;

			if (current) {

				fragment.next = current;

			}

			fragment.capture_list = fragment;

			return fragment;

		},

		join_capture: function (left, right) {

			var before = left.capture_list;

			var after = right.capture_list;

			if (after) {

				if (before) {

					for (; before.next; before = before.next);

					before.next = after;

				}
				else {

					left.capture_list = after;

				}

			}

		},

		combine_list: function (left, right, create_state) {

			var left_state = left.state;

			var right_state = right.state;

			var state = left_state ||

							right_state ||

							(create_state ? this.generator.create_state() : null);


			// resolve state if there is one
			if (state) {

				if (!right_state) {

					right.apply_state(state);

				}

				if (!left_state) {

					left.apply_state(state);

				}

				// finalize
				state.list = left;

			}

			// append
			left.append(right);

		},

		finalize: function () {

			var generator = this.generator;

			var fragment = this.capture();

			var incoming = fragment.incoming;

			var outgoing = fragment.outgoing;

			var split = fragment.split_list;

			var state;

			// apply start state
			state = incoming.state;

			if (!state) {

				state = generator.create_state();

				incoming.apply_state(state);

			}

			// set start state
			state.name = generator.start_state;

			// apply end state
			state = outgoing.state;

			if (!state) {

				state = generator.create_state();

				outgoing.apply_state(state);

			}

			state.accept_state = true;

			// set accept state to split
			if (split) {

				split.state.accept_state = true;

			}

			return fragment;


		}



   };

});
