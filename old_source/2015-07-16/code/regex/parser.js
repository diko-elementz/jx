"use strict";

Jx('code/regex/parser',

   // requires
   'native/string',

function (string) {

   var CTRL_CHAR = {
            '0': "\0",
            'n': "\n",
            'r': "\r",
            't': "\t",
            'b': "\b",
            'f': "\f"
         };

   var CTRL_CHAR_SEQUENCE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

   var LEFT_ASSOC = 1,
         RIGHT_ASSOC = 2,
         UNARY = 3,
         ENC_OPEN = 4,
         ENC_CLOSE = 5;

   var RANGE_RE = /^([ \s]*([0-9]+)?[ \s]*\,)?[ \s]*([0-9]+)[ \s]*$/;

   //  operators with precedence
   var OPERATORS = {

            '?': 9,
            '*': 9,
            '+': 9,
            '{}': 9,

            '.': 6,

            '|': 2,


            '(': 0,

            ')': 0

         };

   var SPECIAL_CHARS = {

            '.': 'wildcard'

         };


   // append concat operator token if:
   //    previous_token == OPERAND_START_TOKENS and
   //    current_token == OPERAND_END_TOKENS

   var OPERAND_START_TOKENS = {

            'literal': true,
            'ref': true,
            '[]': true,
            '[^]': true,
            'wildcard': true,
            '?': true,
            '*': true,
            '+': true,
            '{}': true,
            ')': true

         };

   var OPERAND_END_TOKENS = {

            'literal': true,
            'ref': true,
            '[]': true,
            '[^]': true,
            'wildcard': true,
            '[': true,
            '(': true

         };

   function escape_literal(subject, c) {

      // c should be character after \\
      var chr = subject.charAt(c);

      var literal = chr;

      var processed = 1;

      switch (chr) {

		// escape control characters
		case 'c':

				chr = subject.substring(c + 2, c + 3);

				literal = String.fromCharCode(

					CTRL_CHAR_SEQUENCE.indexOf(chr.toUpperCase()) + 1

				);

				processed = 2;

			break;

		// escape hex ascii (e.g. "\xa9")
		case 'x':

				chr = subject.substring(c + 2, c + 4);

				literal = String.fromCharCode(parseInt(chr, 16));

				processed = 3;

			break;

		// escape utf-8 (e.g. "\u0013")
		case 'u':

				chr = subject.substring(c + 2, c + 6);

				literal = String.fromCharCode(parseInt(chr, 16));

				processed = 5;

			break;

		// escape control characters and literals
		default:

				literal = chr in CTRL_CHAR ?

							CTRL_CHAR[chr] : chr;

			break;

      }

      return [literal, processed];

   }

   function post_process_range(token) {

      var str = token.value;

      var m = str.match(RANGE_RE);

      var min = parseInt(m[3], 10);

      var max = min;

      if (m[2]) {

         min = m[1] ? parseInt(m[1]) : 0;

      }

      token.min = min;

      token.max = max;

   }

   function post_process_character_class(token) {

      var str = token.value;

      var chars = [];

      var range = null;

      var cl = 0;

      var c, l, chr, o, processed, next;

      token.chars = chars;

      for (c = -1, l = str.length; l--;) {

         chr = str.charAt(++c);

         if (chr == '\\') {

            o = escape_literal(str, c + 1);

            chr = o[0];

            processed = o[1];

            c += processed;

            l -= processed;

         }

         // check if range
         if (range) {

            range[1] = chr;

            range = null;

         }
			else if (!range && l && str.charAt(c + 1) == '-') {

            chars[cl++] = range = [chr];

            c++;

            l--;

         }
			else {

            chars[cl++] = chr;

         }

      }

   }

   return {

      '@type': 'class',

      subject: '',

      anchor: 0,

      token_buffer: null,

      last_token_type: null,

		process_escaped_literal: escape_literal,

      constructor: function (regex) {

         this.token_buffer = [];

         this.set_subject(regex);

      },

      next_token: function () {

         var subject = this.subject;

         var c = this.anchor;

         var l = subject.length;

         var buffer = this.token_buffer;

         var last_type = this.last_token_type;

         var bl = buffer.length;

         var chr, next, processed, type, token, sl, sc, o, from, to;

         // find token
         if (bl || c < l) {

            // shift buffer first
            if (bl) {

               token = buffer.splice(0, 1)[0];

               type = token.type;

            }
				// tokenize
				else {

               from = c;

               chr = subject.charAt(c);

               processed = 1;

               type = 'literal';

               // tokenize range or canonical name reference
               if (chr == '{') {

                  for (sc = 0, sl = l - c; sl--;) {

                     if (subject.charAt((++sc) + c) == '}') {

                        break;

                     }

                  }

                  processed = sc;

                  chr = subject.substring(c + 1, c + sc);

                  type = RANGE_RE.test(chr) ? '{}' : 'ref';

               }
					// tokenize character class
					else if (chr == '[') {

                  next = subject.charAt(c + 1);

                  sc = 0;

                  if (next == '^') {

                     sc += 1;

                     type = '[^]';

                  }
						else {

                     type = '[]';

                  }

                  next = [];

                  for (sl = l - c; sl--;) {

                     chr = subject.charAt((++sc) + c);

                     // leave out escaped character
                     if (chr == '\\') {

                        o = this.process_escaped_literal(subject, c + sc + 1);

                        chr = o[0];

                        to = o[1];

                        sl -= to;

                        sc += to;

                     }
							else if (chr == ']') {

                        break;

                     }

                     next[next.length] = chr;

                  }

                  chr = next.join('');

                  processed = sc + 1;

               }
					// tokenize special characters
					else if (chr in SPECIAL_CHARS){

                  type = SPECIAL_CHARS[chr];

               }
					// tokenize operators and operands of same type
					else if (chr in OPERATORS) {

                  type = chr;

               }
					// tokenize escaped literal
					else if (chr == '\\') {

                  o = this.process_escaped_literal(subject, c + 1);

                  chr = o[0];

                  processed = o[1] + 1;

               }

               to = c + processed;

               this.anchor = to;

               token = {
                     type: type,
                     value: chr,
                     from: from,
                     to: to
                  };

            }

            // append concat operator and push to buffer
            if (last_type &&

               last_type in OPERAND_START_TOKENS &&

               type in OPERAND_END_TOKENS) {

               buffer[bl++] = token;

               type = '.';

               from = token.from;

               token = {

                  type: type,

                  value: type,

                  from: from,

                  to: from

               };

            }

            // post process token
            switch (type) {
				case '{}':
					post_process_range(token);
					break;

				case '[]':
				case '[^]':
					post_process_character_class(token);
					break;
            }

            this.last_token_type = type;

            return token;

         }

         return false;

      },

      set_subject: function (subject) {

         if (subject instanceof RegExp) {

            this.subject = subject = subject.source;

            this.reset();

         }
			else {

            subject = this.subject;

         }

         return subject.length > 0;

      },

      parse: function (subject) {

         var stack = [];

         var rpn = [];

         var sl = 0;

         var rl = 0;

         var token, type, precedence, last_stack;

         if (this.set_subject(subject)) {

            for (; token = this.next_token();) {

               type = token.type;

               // is an operator
               if (type in OPERATORS) {

                  token.precedence = OPERATORS[type];

                  if (type == '(') {

                     stack[sl++] = token;

                  }
						else if (type == ')') {

                     for (; sl && stack[sl - 1].type != '(';) {

                        rpn[rl++] = stack[--sl];

                     }

                     stack.length = --sl;

                     // morph token to grouping token
                     token.type = 'group()';

                     token.value = '()';

                     rpn[rl++] = token;

                  }
						else {

                     precedence = token.precedence;

                     for (; sl;) {

                        last_stack = stack[sl - 1];

                        if (token.precedence <= last_stack.precedence) {

                           stack.length = --sl;

                           rpn[rl++] = last_stack;

                        }
								else {

                           break;

                        }

                     }

                     stack[sl++] = token;

                  }

               // operand
               }
					else {

                  rpn[rl++] = token;

                  token.operand = true;

               }

            }

            // pop operators
            for (;sl--;) {

               rpn[rl++] = stack[sl];

            }

            stack.length = 0;

            rpn.signature = this.subject;

         }

         return rpn;

      },

      reset: function () {

         var buffer = this.token_buffer;

         this.anchor = 0;

         buffer.splice(0, buffer.length);

         this.last_token_type = null;

      }

   };
});
