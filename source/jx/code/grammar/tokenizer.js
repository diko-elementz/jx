'use strict';


Jx('jxCodeTokenizer',

   function(Tokenizer) {

      var tokenizer = Tokenizer();

      this.exports = tokenizer.define([

         'Token',       /([^\{\}\|]|\\\{|\\\}|\\\|)+/,

         'NonTerminal', /\{([a-zA-Z0-9\-\_\.\$]+)\}/, [1],

         'Alternative', /\|/

      ]);

   });
