Jx('code/css/parser',

   // requires
   'code/tokenizer',

   'code/parser',

function(Tokenizer, BaseParser) {

   return {

      '@extend': BaseParser,

      tokenizer: Tokenizer(

            'string',

               /\"/

         )

   };

});
