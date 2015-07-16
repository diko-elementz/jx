Jx('code/config/state/generator',

   // requires
	'code/regex/parser',
   "code/config/state",
	"code/config/fragment",
	"code/config/list",
	"code/config/pointer",

function(RegexParser, State, Fragment, List, Pointer) {

   var $ = Jx;

	var regex_parser = new RegexParser();

   return {

		'@type': 'class',

      start_state: "start_state",

		prepared: false,

		processed: null,

		token_patterns: null,

		states: null,

		symbols: null,

		accept_states: null,

		accept_symbols: null,

		state_id_seed: 0,

		start_capture_flags: null,

		end_capture_flags: null,

		capture_flags: null,

		definition_names: ['states',
										'symbols',
										'accept_states',
										'processed',
										'token_patterns',
										'start_capture_flags',
										'end_capture_flags',
										'capture_flags'
									],

		on_create: function(name, rpn) {

			var states = this.states;

			var operand_stack = [];

			var osl = 0;

			var c, l, lexeme, capture, next_capture;

			var state, symbol, fragment, left, right;

			// capture pointer
			capture = null;

			for (c = -1, l = rpn.length; l--;) {

				lexeme = rpn[++c];

				// push operand
				if (lexeme.operand) {

					symbol = this.create_symbol_from_lexeme(lexeme);

					operand_stack[osl++] = this.create_fragment(

															this.create_list(

																this.create_pointer(symbol)

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
							state = this.create_state(
													null,
													right.incoming
												);

							fragment = state.concat(left, right);

							operand_stack[osl - 1] = fragment;

							operand_stack.length = osl;

						break;

					// alternative
					case '|':

							right = operand_stack[--osl];

							left = operand_stack[osl - 1];

							// combine left/right incoming
							operand_stack[osl - 1] = left.combine(right);

							operand_stack.length = osl;

						break;

					// zero or one
					case '?':

							left = operand_stack[osl - 1];

							operand_stack[osl - 1] = left.add_split(true);

						break;

					// zero or more
					case '*':

							left = operand_stack[osl - 1];

							operand_stack[osl - 1] = left.add_split().add_recurrence(true);

						break;

					// one or more
					case '+':

							left = operand_stack[osl - 1];

							operand_stack[osl - 1] = left.add_recurrence(true);

						break;

					// create capture
					case 'group()':

							left = operand_stack[osl - 1];

							operand_stack[osl - 1] = left.set_capture();

						break;

				}

			}

			// create start state
			fragment = operand_stack[--osl];

			operand_stack.length = osl;

			this.create_state(
					this.start_state,
					fragment.incoming
				);

			fragment = fragment.set_capture();

			// finalize
			this.on_create_accept_states(
					this.create_state(),
					fragment
				);

			this.on_finalize_states(
					fragment,
					this.new_states
				);

			this.on_finalize_accept_states(
					fragment,
					this.new_accept_states,
					name
				);

		},

		on_before_create: function() {

			// create new states
			this.new_states = [];

			this.new_accept_states = [];

		},

		on_after_create: function() {

			// remove new states
			delete this.new_states;

			delete this.new_accept_states;

		},

		on_create_accept_states: function(end, fragment) {

			var accept_list_index = this.accept_states;

			var list = fragment.split_list;

			var c, l, split_list, name, pointers, state;

			// register current state as accept state
			name = end.name;

			if (!(name in accept_list_index)) {

				this.create_accept_state(end, fragment);

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
												null,
												split_list
											);

						split_list.state = state;

					}

					// register accept state
					name = state.name;

					if (!(name in accept_list_index)) {

						this.create_accept_state(state, fragment);

					}

				}

			}

		},

		on_finalize_states: function(fragment, new_states) {

			var states = this.states;

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

		on_finalize_accept_states: function(fragment, new_states, token_name) {

			var states = this.accept_states;

			var start_flags = this.start_capture_flags;

			var end_flags = this.end_capture_flags;

			var capture_flags = this.capture_flags;

			var pattern_id = token_name + this.token_patterns[token_name];

			var index = 0;

			var c, l, p, cp, capture, allow_point_back;

			var start_flag, end_flag, pointers;

			for (cp = fragment.capture; cp; cp = cp.next) {

				capture = cp.fragment;

				console.log('----- ' + index, capture);

				// capture start flags
				for (p = capture.incoming.pointer; p; p = p.next) {

					console.log('start ', p.get_state_signature());

				}

				// capture end flags
				pointers = capture.outgoing;

				allow_point_back = !!capture.point_back;

				console.log(' capture point_back: ', capture.point_back);

				for (c = -1, l = pointers.length; l--;) {



					for (p = pointers[++c]; p; p = p.next) {

						// allow only not point_back or if has point back
						if (allow_point_back || !p.is_point_back) {

							console.log('end ', p.get_state_signature(), ' allow: ', allow_point_back, p.is_point_back);

						} else {

							console.log('not allowed? ', p.get_state_signature(), ' allow: ', allow_point_back, p.is_point_back);

						}

					}

				}

				// point back capture end flags
				pointers = capture.point_back;

				index++;

				//if (pointers) {
				//
				//	for (c = -1, l = pointers.length; l--;) {
				//
				//		for (p = pointers[++c].pointer; p; p = p.next) {
				//
				//			console.log('end:point back ', p.get_state_signature());
				//
				//		}
				//
				//	}
				//
				//}



			}


			console.log('capture: ', fragment.capture);


			for (l = new_states.length; l--;) {

				states[new_states[l].name] = token_name;

			}

		},

		on_export: function(definition) {

			this.apply_obj_definitions(this, definition);

		},

		on_import: function(definition) {

			var seed = definition.state_id_seed;

			var start = definition.start_state;

			this.apply_obj_definitions(definition, this);

			this.state_id_seed = seed || 0;

			this.start_state = start_state || "start_state";

		},

		on_reset: function() {

			var names = this.definition_names;

			var name, l;

			delete this.prepared;

			delete this.start_state;

			delete this.state_id_seed;

			// delete flags
			for (l = names.length; l--;) {

				delete this[names[l]];

			}

		},

		on_define: function() {

		},

		define: function(args) {

			var index = {};

			var dl = 0;

			var matches = null;

			var c, l, regex, arg;

			this.reset();

			for (c = -1, l = args.length; l--;) {

				arg = args[++c];

				if (arg && typeof arg == 'string') {

					name = arg;

				} else if (name && arg instanceof RegExp) {

					this.create(name, regex_parser.parse(arg));

				}

			}

			// has at least one grammar rule created
			if (this.prepared) {

				this.on_define();

			}

			return this;

		},

      create: function(name, rpn) {

			var signature = rpn.signature;

			var processed, patterns, id;

			if (!this.prepared) {

				this.prepare();

			}

			processed = this.processed;

			patterns = this.token_patterns;

			id = signature ? name + ':' + signature : void(0);

			if (id && !(id in processed)) {

				processed[id] = name;

				if (!patterns.hasOwnProperty(name)) {

					patterns[name] = 0;

				} else {

					patterns[name]++;

				}

				this.on_before_create();

				// what's next?
				this.on_create(name, rpn);

				this.on_after_create();

			} else if (id) {

				throw new Error(

					name + ' symbol with (' + signature + ') is already processed'

				);

			}

			return this;

      },

		create_state: function(name, list) {

			return new State(this, name, list);

		},

		create_fragment: function(left, right) {

			return new Fragment(left, right);

		},

		create_list: function(pointer) {

			return new List(pointer);

		},

		create_pointer: function(symbol) {

			return new Pointer(symbol);

		},

		create_accept_state: function(state, fragment) {

			var states = this.new_accept_states;

			states[states.length] = state;

		},

      create_symbol_from_lexeme: function(lexeme) {

			return lexeme.type == 'literal' ? lexeme.value : '';

		},

		reset: function() {

			if (this.prepared) {

				this.on_reset();

			}

			return this;

		},

      prepare: function() {

			this.prepared = true;

			this.apply_obj_definitions({}, this);

			return this;

      },

		apply_obj_definitions: function(source, target) {

			var J = $;

			var names = this.definition_names;

			var name, obj, t_obj, c, l, is_object;

			for (c = -1, l = names.length; l--;) {

				name = names[++c];

				t_obj = name in target ? target[name] : null;

				if (!t_obj || !J.is_object(t_obj)) {

					target[name] = t_obj = {};

				}

				if (name in source) {

					obj = source[name];

					if (J.is_object(obj)) {

						J.assign(t_obj, obj);

					}

				}

			}

		},

      export_definition: function() {

			var definition;

			if (this.prepared) {

				definition = {

						start_state: this.start_state,

						state_id_seed: this.state_id_seed

					};

				this.on_export(definition);

				return definition;

			}

			return void(0);

      },

      import_definition: function(definition) {

			this.reset();

			if (definition instanceof Array) {

				this.define(definition);

			} else if ($.is_object(definition)) {

				this.prepare();

				this.on_import(definition);

			}

			return this;

      }

   };
});
