"use strict";

Jx('native/string', function() {

   return {

      pad: function(str, len, pad_chr) {

            var sl = str.length;

            var pl = pad_chr.length;

            var l = Math.max(len - sl, 0);

            var pads = [];

            var pc = 0;

            var diff, cl;

            for (; l;) {

               l = Math.max(0, diff = l - pl);

               pads[pc++] = l || diff ?

                  pad_chr : pad_chr.substring(0, pl + diff);

            }

            return pads.join('') + str;

         }

      }

});
