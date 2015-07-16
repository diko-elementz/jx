"use strict";

Jx('code/regex/token_generator',

   // requires
   'code/config/state/generator',

function (Generator) {

   function create_character_set(lexeme) {

      var set = {};

      var chars = lexeme.chars;

      var l = chars.length;

      var A = Array;

      var to_str = String.fromCharCode;

      var c, chr, start, end, rl, rc;

      for (c = -1; l--;) {

         chr = chars[++c];

         // range
         if (chr instanceof A) {

            start = chr[0].charCodeAt(0);

            end = chr[1].charCodeAt(0);

            if (start > end) {

               start -= end;

               end += start;

               start = end - start;

            }

            for (rc = 0, rl = end + 1 - start; rl--;) {

               set[

                  to_str(start + (rc++))

               ] = true;

            }

         }
			else {

            set[chr] = true;

         }

      }

      return {

         not: lexeme.type == '[^]',

         set: set

      };

   }

   return {

      '@extend': Generator,

		'@type': 'class',

		definition_names: ['tokenIndex'].concat(

										Generator.prototype.definition_names

									),

		tokens: null,

		tokenIndex: null,

		capture_start: null,

		capture_end: null,

		on_create: function (name, rpn) {

			var index = this.tokenIndex;

			var list = this.tokens;

			var access = ':' + name;

			if (access in index) {

				list[list.length] = name;

				index[access] = name;

			}

			this.$super(arguments);

		},

		on_finalize_states: function (fragment, token_name) {

			var p = fragment.capture_list;

			var start = this.capture_start;

			var end = this.capture_end;

			var state, target, pt, list;

			this.$super(arguments);

			// finalize capture states
			for (; p; p = p.next) {

				list = p.incoming;

				state = list.state.name;

				for (; list; list = list.next) {

					for (pt = list.pointer; pt; pt = pt.next) {

						start[state + ':' + pt.to.state.name] = true;

					}

				}

				list = p.outgoing;

				state = list.state.name;

				for (; list; list = list.next) {

					for (pt = list.pointer; pt; pt = pt.next) {

						end[state + ':' + pt.to.state.name] = true;

					}

				}

			}

			console.log(fragment);


		},

		on_import: function (definition) {

			var J = $;

			var tokens = definition.tokens;

			var tokenIndex = definition.tokenIndex;

			var targetTokens = this.tokens;

			this.$super(arguments);

			if (tokens instanceof Array) {

				targetTokens.push.apply(targetTokens, tokens);

			}

			if (J.is_object(tokenIndex)) {

				J.assign(this.tokenIndex, tokenIndex);

			}

		},

		on_export: function (definition) {

			this.$super(arguments);

			definition.tokens = this.tokens.slice(0);

		},

		on_reset: function () {

			this.$super(arguments);

			delete this.tokens;

			delete this.tokenIndex;

			delete this.capture_start;

			delete this.capture_end;

		},

		prepare: function () {

			this.$super(arguments);

			this.tokens = [];

			this.capture_start = {};

			this.capture_end = {};

		},

      create_symbol_from_lexeme: function (lexeme) {

         var symbols = this.symbols;

         var type = lexeme.type;

         var charset = null;

         var symbol;

         switch (type) {

            case '[]':
            case '[^]':

                  charset = create_character_set(lexeme);

                  symbol = (charset.not ? ':^' : ':') + lexeme.value;

               break;

            case 'wildcard':

                  symbol = ':*';

                  charset = { not: true, set: {} };

               break;

            default:

               return this.$super(arguments);

         }

         if (!(symbol in symbols)) {

            symbols[symbol] = charset;

         }

         return symbol;

      }


   };

});
