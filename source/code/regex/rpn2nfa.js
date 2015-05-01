"use strict";

Jx('code/regex/rpn2nfa',

   // requires
   'code/config/state/generator',

function(BaseRpn2nfa) {

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

         } else {

            set[chr] = true;

         }

      }

      return {

         not: lexeme.type == '[^]',

         set: set

      };

   }

   return {

      '@extend': BaseRpn2nfa,

		on_create: function(definition, name, rpn) {

			var index = definition.tokenIndex;

			var list = definition.tokens;

			var access = ':' + name;

			if (access in index) {

				list[list.length] = name;

				index[access] = name;

			}

			// recreate new state names
         definition.new_states = [];

			this.$super(arguments);

		},

		on_create_state: function(definition) {

			var states = definition.states;

			var state = this.$super(arguments);

			var name = state.name;

			// directly register state
			if (!(name in states)) {

				states[name] = [];

			}

			return state;

		},

		prepare_definitions: function(definition) {

			this.$super(arguments);

			definition.tokens = [];

			definition.tokenIndex = {};

		},

      create_symbol_from_lexeme: function(definition, lexeme) {

         var symbols = definition.symbols;

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
