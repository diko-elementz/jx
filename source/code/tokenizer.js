"use strict";

Jx('code/tokenizer',

   // requires
   'code/regex/token_generator',

function(Generator) {

	var $ = Jx;

	return {

		'@type': 'class',

		match_cache: null,

		end_token: '$',

		subject: '',

		anchor: 0,

		error_index: 0,

		ended: true,

		generator: null,

		definition_processed: false,

		constructor: function() {

			this.generator = this.create_generator();

			if (arguments.length) {

				this.define.apply(this, arguments);

			}

		},

		define: function() {

			var definition_arguments = [];

			var dl = 0;

			var definition = null;

			var generator = this.generator;

			var l, c, arg;

			// process definition
			for (c = -1, l = arguments.length; l--;) {

				arg = arguments[++c];

				if (arg || arg == 0) {

					if ($.is_object(arg)) {

						definition = arg;

					} else {

						definition_arguments[dl++] = arg;

					}

				}

			}

			if (generator) {

				if (dl) {

					generator.define(definition_arguments);

				} else if (definition) {

					generator.define(definition);

				}

			}

			this.reset();

		},

		create_generator: function() {

			return new Generator();

		},

		set_subject: function(subject) {

			if (typeof subject == 'string') {

				this.subject = subject;

				this.reset();

			}

		},

		reset: function() {

			this.error_index = -1;

			if (this.subject && $.is_object(this.generator)) {

				this.anchor = 0;

				this.ended = false;

			} else {

				this.anchor = -1;

				this.ended = true;

			}

		},

		next: function() {

			var subject = this.subject;

			var anchor = this.anchor;

			var def = this.generator;

			var ended = this.ended;

			var chr, symbol, c, l, sl, accept_index, edge;

			var matchers, ml, match, match, follow_pointer;

			var states, state, accept_states, found_state, matched_state;

			var accept_index, accept_token;

			if (!ended && def && def.prepared) {

				states = def.states;

				state = def.start_state;

				accept_states = def.accept_states;

				follow_pointer = null;

				sl = subject.length;

				accept_index = -1;

				accept_token = null;

				for (c = anchor - 1, l = sl - anchor; l--; ) {

					chr = subject.charAt(++c);

					// find matches
					matchers = states[state];

					state = null;

					matched_state = false;

					edge = c > accept_index;

					for (ml = matchers ? matchers.length : 0; ml--;) {

						match = matchers[ml];

						symbol = match[0];

						if (symbol == chr || this.symbol_match(symbol, chr)) {

							found_state = match[1];

							//console.log('found match ', symbol, ' state: ', found_state)

							if (matched_state) {

								follow_pointer = [found_state, c, follow_pointer];

							} else {

								matched_state = true;

								state = found_state;

							}

							// save accept_state and currently the highest index
							if (edge && found_state in accept_states) {

								accept_index = c;

								accept_token = accept_states[found_state];

							}

						}

					}

					// end
					if (!l || !state) {

						// restore follow pointer
						if (follow_pointer) {

							state = follow_pointer[0];

							c = follow_pointer[1];

							l = sl - c - 1;

							follow_pointer = follow_pointer[2];

						// no more!
						} else {

							break;

						}

					}

				}

				// found token
				if (accept_token) {

					this.anchor = accept_index + 1;

					return [accept_token, subject.substring(anchor, accept_index + 1)];

				} else {

					this.ended = true;

					// graceful exit
					if (anchor == sl) {

						return [this.end_token, ''];

					// error
					} else {

						this.error_index = this.anchor;

					}

				}

			}

			return false;

		},

		get_error_part: function() {

			var i = this.error_index;

			if (i > -1) {

				return this.subject.substring(i, i + 5);

			}

			return '';

		},

		symbol_match: function(symbol, input) {

			var symbols = this.generator.symbols;

			var charset, found;

			// charset match
			if (symbol in symbols) {

				charset = symbols[symbol];

				found = input in charset.set;

				return charset.not ? !found : found;

			}

			return symbol == input;

		}

	};

});
