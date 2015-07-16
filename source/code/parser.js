Jx('code/parser',

   // requires
   'code/config/state/generator',
   'code/regex/parser',

function (Generator, RegParser) {

   var $ = Jx;

   var reg_parser = new RegParser();

   return {

      '@type': 'class',

      tokenizer: null,

      generator: null,

      constructor: function () {

         var generator = this.generator;

         if (!this.tokenizer) {

            throw new Error('Parser requires a tokenizer');

         }

         if (!(generator instanceof Generator)) {

            throw new Error('Parser requires a state generator');

         }

         this.definition = this.process_definitions(arguments);

      },

      process_definitions: function (args) {

         var definitions = {};

         var index = {};

         var dl = 0;

         var matches = null;

         var generator = this.generator;

			var reg_parser = null;

         var c, l, regex, arg;

         for (c = -1, l = args.length; l--;) {

            arg = args[++c];

            if (arg && typeof arg == 'string') {

               name = arg;

            }
				else if (name && arg instanceof RegExp) {

               generator.create(definitions, name, reg_parser.parse(arg));

            }

         }

         return definitions;

      },

      define: function (definitions) {

         // define states from tokens
         if (typeof definitions == 'string') {

            definitions = this.process_definitions(arguments);

         }
			// directly apply definitions
			else if (!$.is_object(definitions)) {

            definitions = null;

         }

         this.definition = definitions;

         this.reset();

      }

   };

});
