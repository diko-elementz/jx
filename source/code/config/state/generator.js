Jx('code/config/state/generator',

   // requires
	'code/regex/parser',
   "code/config/state",
	"code/config/fragment",
	"code/config/list",
	"code/config/pointer",

function (RegexParser, State, Fragment, List, Pointer) {

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

		definition_names: ['states',
										'symbols',
										'accept_states',
										'processed',
										'token_patterns'
									],

		on_create: function (name, rpn) {

			var states = this.states;

			var operand_stack = [];

			var osl = 0;

			var c, l, lexeme;

			var state, symbol, fragment, left, right, accept_fragment;

			for (c = -1, l = rpn.length; l--;) {

				lexeme = rpn[++c];

				// push operand
				if (lexeme.operand) {

					symbol = this.create_symbol_from_lexeme(lexeme);

					fragment = this.create_fragment(

									this.create_list(

											this.create_pointer(symbol)

										)

								);

					// initially point to outgoing
					fragment.incoming.point_to(fragment.outgoing);

					operand_stack[osl++] = fragment;

				}
				else {

					// apply operations
					switch(lexeme.type) {

					// concat
					case '.':

							right = operand_stack[--osl];

							left = operand_stack[osl - 1];

							// connect to state
							operand_stack[osl - 1] = left.concat(right);

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

							operand_stack[osl - 1] = left.split();

						break;

					// zero or more
					case '*':

							left = operand_stack[osl - 1];

							operand_stack[osl - 1] = left.recur(true);

						break;

					// one or more
					case '+':

							left = operand_stack[osl - 1];

							operand_stack[osl - 1] = left.recur();

						break;

					// create capture
					case 'group()':

							left = operand_stack[osl - 1];

							operand_stack[osl - 1] = left.capture();

						break;

					}

				}

			}

			// has at least 1 fragment
			fragment = operand_stack[osl - 1].finalize();

			operand_stack.length = 0;

			// set accept state
			this.on_finalize_states(
									fragment,
									name,
									'm' + (++this.state_id_seed)
								);

		},

		on_before_create: function () {

			// create new states
			this.new_states = [];

			this.new_accept_states = [];

		},

		on_after_create: function () {

			// remove new states
			delete this.new_states;

			delete this.new_accept_states;

		},

		on_finalize_states: function (fragment, token_name, match_id) {

			var states = this.states;

			var new_states = this.new_states;

			var list, c, l, name, symbol;

			var pointers, p, pl, points, state, origin_state, pindex, access;

			// finalize states
			for (c = -1, l = new_states.length;l--;) {

				state = origin_state = new_states[++c];

				list = state.list;

				this.on_finalize_state(state);

				pointers = states[state.name];

				pl = 0;

				pindex = {};

				for (; list; list = list.next) {

					p = list.pointer;

					for (; p; p = p.next) {

						points = p.to;

						if (!points) {

							continue;

						}

						state = points.state;

						name = state.name;

						if (!name) {

							this.on_finalize_state(state);

							name = state.name;

						}

						symbol = p.symbol;

						access = '@' + symbol + name;

						if (access in pindex) {

							continue;

						}

						pindex[access] = true;

						pointers[pl++] = [symbol, name];

					}

				}

				if (origin_state.accept_state) {

					this.on_finalize_accept_state(
											origin_state,
											token_name,
											match_id
										);

				}

			}

		},

		on_finalize_state: function (state) {

			var name = state.name;

			var states = this.states;

			if (!name) {

				state.name = name = 's' + (++this.state_id_seed);

			}

			if (!(name in states)) {

				states[name] = [];

			}

		},

		on_finalize_accept_state: function (state, token_name, match_id) {

			var accept_states = this.accept_states;

			var name = state.name;

			accept_states[name] = {
										token: token_name,
										match_id: match_id
									};

		},

		on_export: function (definition) {

			this.apply_obj_definitions(this, definition);

		},

		on_import: function (definition) {

			var seed = definition.state_id_seed;

			var start = definition.start_state;

			this.apply_obj_definitions(definition, this);

			this.state_id_seed = seed || 0;

			this.start_state = start_state || "start_state";

		},

		on_reset: function () {

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

		on_define: function () {

		},

		define: function (args) {

			var index = {};

			var dl = 0;

			var matches = null;

			var c, l, regex, arg;

			this.reset();

			for (c = -1, l = args.length; l--;) {

				arg = args[++c];

				if (arg && typeof arg == 'string') {

					name = arg;

				}
				else if (name && arg instanceof RegExp) {

					this.create(name, regex_parser.parse(arg));

				}

			}

			// has at least one grammar rule created
			if (this.prepared) {

				this.on_define();

			}

			return this;

		},

      create: function (name, rpn) {

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

				}
				else {

					patterns[name]++;

				}

				this.on_before_create();

				// what's next?
				this.on_create(name, rpn);

				this.on_after_create();

			}
			else if (id) {

				throw new Error(

					name + ' symbol with (' + signature + ') is already processed'

				);

			}

			return this;

      },

		create_state: function (name) {

			var state = new State();

			var states = this.new_states;

			states[states.length] = state;

			return state;

		},

		create_fragment: function (left, right) {

			return new Fragment(this, left, right);

		},

		create_list: function (pointer) {

			return new List(pointer);

		},

		create_pointer: function (symbol) {

			return new Pointer(symbol);

		},

		create_accept_state: function (state, fragment) {

			var states = this.new_accept_states;

			states[states.length] = state;

		},

      create_symbol_from_lexeme: function (lexeme) {

			return lexeme.type == 'literal' ? lexeme.value : '';

		},

		reset: function () {

			if (this.prepared) {

				this.on_reset();

			}

			return this;

		},

      prepare: function () {

			this.prepared = true;

			this.apply_obj_definitions({}, this);

			return this;

      },

		apply_obj_definitions: function (source, target) {

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

      export_definition: function () {

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

      import_definition: function (definition) {

			this.reset();

			if (definition instanceof Array) {

				this.define(definition);

			}
			else if ($.is_object(definition)) {

				this.prepare();

				this.on_import(definition);

			}

			return this;

      }

   };
});
