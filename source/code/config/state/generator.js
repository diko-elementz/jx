Jx('code/config/state/generator',

   // requires
   "code/config/state",
	"code/config/fragment",
	"code/config/list",
	"code/config/pointer",

function(State, Fragment, List, Pointer) {

   var $ = Jx;

   return {

		'@singleton': true,

      start_state_name: "start_state",

		processed: null,

		constructor: function() {

			this.processed = {};

			this.$super(arguments);

		},

		on_create: function(definition, name, rpn) {

			var operand_stack = [];

			var osl = 0;

			var c, l, lexeme;

			var state, symbol, fragment, left, right;

			for (c = -1, l = rpn.length; l--;) {

				lexeme = rpn[++c];

				// push operand
				if (lexeme.operand) {

					symbol = this.create_symbol_from_lexeme(definition, lexeme);

					operand_stack[osl++] = this.on_create_fragment(

															definition,

															this.on_create_list(

																definition,

																this.on_create_pointer(

																		definition,

																		symbol

																)
															)

														);

					continue;

				}

				// apply operations
				switch(lexeme.type) {

					// concat
					case '.':

							right = operand_stack[--osl];

							left = operand_stack[osl - 1];

							// connect to state
							state = this.on_create_state(
													definition,
													null,
													right.incoming
												);

							operand_stack[osl - 1] = state.concat(left, right);

							operand_stack.length = osl;

						break;

					// alternative
					case '|':

							right = operand_stack[--osl];

							left = operand_stack[osl - 1];

							// combine left/right incoming
							left.combine(right);

							operand_stack.length = osl;

						break;

					// zero or one
					case '?':

							left = operand_stack[osl - 1];

							left.add_split(left.incoming);

						break;

					// zero or more
					case '*':

							left = operand_stack[osl - 1];

							left.add_split(left.incoming);

							left.add_recurrence(left.incoming);

						break;

					// one or more
					case '+':

							left = operand_stack[osl - 1];

							left.add_recurrence(left.incoming);

						break;

				}

			}

			// create start state
			fragment = operand_stack[--osl];

			operand_stack.length = osl;

			this.on_create_state(
					definition,
					definition.start_state,
					fragment.incoming
				);

			// finalize
			this.on_create_accept_states(

					definition,
					this.on_create_state(definition),
					fragment,
					name

				);

			this.on_finalize_states(
					definition,
					fragment,
					definition.new_states
				);

			// remove new states
			delete definition.new_states;

		},

      on_create_state: function(definition, name, list) {

			return new State(this, definition, name, list);

		},

		on_create_fragment: function(definition, left, right) {

			return new Fragment(left, right);

		},

		on_create_list: function(definition, pointer) {

			return new List(pointer);

		},

		on_create_pointer: function(definition, symbol) {

			return new Pointer(symbol);

		},

		on_create_accept_state: function(definition, state, token_name) {

			definition.accept_states[state.name] = token_name;

		},

		on_create_accept_states: function(definition, end, fragment, token_name) {

			var accept_list_index = definition.accept_states;

			var list = fragment.split_list;

			var c, l, split_list, name, pointers, state;

			// register current state as accept state
			name = end.name;

			if (!(name in accept_list_index)) {

				this.on_create_accept_state(definition, name, token_name);

			}

			// point fragment to this state
			fragment.point(end);

			// set split pointer states as end state
			if (list) {

				l = list.length;

				for (c = -1; l--;) {

					split_list = list[++c];

					if (split_list.state) {

						state = split_list.state;

					} else {

						state = this.on_create_state(
												definition,
												null,
												split_list
											);

						split_list.state = state;

					}

					// register accept state
					name = state.name;

					if (!(name in accept_list_index)) {

						this.on_create_accept_state(definition, name, token_name);

					}

				}

			}

		},

		on_finalize_states: function(definition, fragment, new_states) {

			var states = definition.states;

			var c, l, name, symbol, pointers, p, points, state, pindex, access;

			// finalize states
			for (l = new_states.length;l--;) {

				state = new_states[l];

				pointers = states[state.name];

				p = state.pointers.pointer;

				pindex = {};

				for (; p; p = p.next) {

					points = p.point_to_list;

					if (!points) {

						continue;

					}

					name = points.state.name;

					symbol = p.symbol;

					access = '@' + symbol + name;

					if (access in pindex) {

						continue;

					}

					pindex[access] = true;

					pointers[pointers.length] = [symbol, name];

				}

			}

		},

      create: function(definition, name, rpn) {

			var signature = rpn.signature;

			var processed = this.processed;

			var id = signature ? name + ':' + signature : void(0);

			console.log('processed ', this.processed, ' id: ', id, ' construct: ', this.$name);

			if (id && !(id in processed)) {

				processed[id] = name;

				if (!definition.is_prepared) {

					definition.is_prepared = true;

					this.prepare_definitions(definition);

				}

				// what's next?
				this.on_create(definition, name, rpn);

			} else if (id) {

				throw new Error(

					name + ' symbol with (' + signature + ') is already processed'

				);

			}



			return definition;

      },

      create_symbol_from_lexeme: function(definition, lexeme) {

			return lexeme.type == 'literal' ? lexeme.value : '';

		},

      prepare_definitions: function(definition) {

         var start_state = definition.start_state;

         var states = definition.states;

         var symbols = definition.symbols;

         var accept_states = definition.accept_states;

         var state_id_seed = definition.state_id_seed;

         if (!start_state || typeof start_state != 'string') {

            definition.start_state = this.start_state_name;

         }

         if (isNaN(state_id_seed) || !isFinite(state_id_seed)) {

            definition.state_id_seed = 0;

         }

         if (!$.is_object(states)) {

            definition.states = {};

         }

         if (!$.is_object(symbols)) {

            definition.symbols = {};

         }

         if (!$.is_object(accept_states)) {

				definition.accept_states = {};

			}

      },

      export_definition: function(definition) {

      },

      import_definition: function(definition) {

      }

   };
});
