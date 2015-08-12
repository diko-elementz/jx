
Jx('jxClass', function (Class) {

   var NOT_HEX = /[^0-9a-f]/i,
      CTRL_CHAR_SEQUENCE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      CTRL_CHAR = {
            '0': '\0',
            'n': '\n',
            'r': '\r',
            't': '\t',
            'b': '\b',
            'f': '\f'
         },
      OPERAND_START_TOKENS = {
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
         },
      OPERAND_END_TOKENS = {
            'literal': true,
            'ref': true,
            '[]': true,
            '[^]': true,
            'wildcard': true,
            '[': true,
            '(': true
         },
      OPERATOR_PRECEDENCE = {
            '.': 1,
            '|': 2,
            '?': 3,
            '*': 3,
            '+': 3,
            '{}': 3,
            '(': 4

         };

   function escapeFrom(at, subject) {
      var S = String,
         chr = subject.charAt(at++),
         len = 1,
         str = '';
      var index;
      switch (chr) {
      // control
      case 'c':
         chr = subject.charAt(at++).toUpperCase();
         index = CTRL_CHAR_SEQUENCE.indexOf(chr);
         if (index == -1) {
            str = 'c';
         }
         else {
            str = S.fromCharCode(index + 1);
            len++;
         }
         break;
      case '0':
      case 'n':
      case 'r':
      case 't':
      case 'b':
      case 'f':
         str = CTRL_CHAR[at];
         break;

      // hex
      case 'x':
         chr = subject.substring(at, at + 2);
         len = 3;
         if (NOT_HEX.test(chr)) {
            len = 0;
         }
         else {
            str = S.fromCharCode(parseInt(chr, 16));
         }
         break;
      // utf-8
      case 'u':
         chr = subject.substring(at, at + 4);
         len = 5;
         if (NOT_HEX.test(chr)) {
            len = 0;
         }
         else {
            str = S.fromCharCode(parseInt(chr, 16));
         }
         break;
      // escaped literal
      default:
         str = chr;
      }
      return len ? [str, len] : false;
   }

   this.exports = Class.extend({

      subject: '',
      index: 0,
      parseIndex: 0,
      ended: false,
      tokens: void(0),
      buffer: void(0),

      constructor: function (subject) {
         if (subject instanceof RegExp) {
            subject = subject.source;
         }
         if (typeof subject == 'string') {
            this.subject = subject;
         }
         this.tokens = [];
         this.buffer = [];
      },

      tokenize: function () {
         var tokens = this.tokens,
            tl = tokens.length,
            buffer = this.buffer,
            bl = buffer.length;

         var subject, chr, str, o, token, strlen, index, len, l, strs, stl, to;

         if (bl) {

            o = buffer[--bl];
            buffer.length = bl;
            return o;

         }
         else if (!this.ended) { // tokenize
            subject = this.subject;
            len = subject.length;
            index = this.index;
            token = null;
            strlen = 1;
            chr = subject.charAt(index++);

            failed: switch (chr) {
            // escape?
            case '\\':
               o = escapeFrom(index, subject);
               if (o) {
                  token = 'literal';
                  str = o[0];
                  strlen += o[1];
               }
               else {
                  strlen = 0;
               }
               break;

            // operators
            case '|':

            case '?':
            case '*':
            case '+':

            case '(':
            case ')':
               str = token = chr;
               break;

            // character sets
            case '[':
               token = '[]';
               if (subject.charAt(index + 1) == '^') {
                  token = '[^]';
                  index++;
                  strlen++;
               }

               strs = [];
               stl = 0;

               loop: for (l = len - index; l--;) {
                  chr = subject.charAt(index++);
                  strlen ++;
                  switch (chr) {
                  case '\\':
                     o = escapeFrom(index, subject);
                     if (o) {
                        strs[stl++] = o[0];
                        to = o[1];
                        strlen += to;
                        index += to;
                        l -= to;
                     }
                     else {
                        strlen = 0;
                        token = null;
                        break failed;
                     }
                     break;
                  case ']':
                     break loop;
                  default:
                     strs[stl++] = chr;
                  }
               }

               str = strs.join('');
               break;

            // character range
            case '{':
               break;
            // special chars
            case '.':
               token = 'wildcard';
               str = chr;
               break;
            case '^':
               token = 'start';
               str = chr;
               break;
            case '$':
               token = 'end';
               str = chr;
               break;

            // literals
            default:
               token = 'literal';
               str = chr;
               break;
            }

            if (token) {
               l = this.index;
               this.index += strlen;
               this.ended = this.index == len;

               if (tl) { // append concat to buffer
                  o = tokens[tl - 1];

                  if (o[0] in OPERAND_START_TOKENS &&
                     token in OPERAND_END_TOKENS) {
                     tokens[tl++] = o = ['.', '.'];
                     tokens[tl++] = buffer[bl++] = [token, str];
                     return o;
                  }

               }

               if (this.ended) { // append $ token to buffer

                  tokens[tl++] = buffer[bl++] = ['$', ''];

               }

               return tokens[tl++] = [token, str];
            }
            this.ended = true;
            return false;
         }

         return void(0);

      },

      next: function () {

         var token, name;

         for (; token = this.tokenize();) {
            name = token[0];
            console.log(name, ' = ', token[1]);
            switch (name) {

            }
         }

         return void(0);

      },

      reset: function () {
         var list = this.buffer;
         list.splice(0, list.length);
         list = this.tokens;
         list.splice(0, list.length);
         delete this.index;
         delete this.parseIndex;
         delete this.ended;
      }

   });

});
