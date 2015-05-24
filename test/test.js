

Jx('test',
	'code/regex/parser',
	'code/tokenizer',
	function(Parser, Tokenizer) {

   // regex parser
   //var parser = Parser(/ab[a-z0-9_\r\n]/);
   //
   //var rpn = parser.parse();

   //console.log({rpn:rpn});

   //var c = -1;
   //
   //var l = rpn.length;
   //
   //var stack = [];
   //
   //
   //for (; l--;) {
   //
   //
   //
   //
   //
   //}

   var tokenizer = Tokenizer(
                        //"name", /[a-zA-Z_][a-zA-Z0-9_]/
                        //"a_to_c", /[a-c]+/,
                        //"d_to_e", /[d-e]+/,
								"capture",
									/a(b+)c/
//                        "string",
//                           /\"([^\"]|\\\")+\"x/,
//									/\"([^\"]|\\\")+\"/,
//								"buang",
//									/a/,
//									/ab/

                     );

   //tokenizer.set_subject('"abcs\\"de"aba');
	tokenizer.set_subject('abc');

   window.t = tokenizer;


	//window.parser = new Parser();





   //console.log('found: ', tokenizer.next());
   //
   //console.log('found: ', tokenizer.next());
   //
   //console.log('tokenizer', tokenizer)





   //window.parser = parser;




   // HTTP tokens
   //var tokenizer = Tokenizer(
   //
   //                     "name", /[a-zA-Z][a-zA-Z0-9]/,
   //
   //                     "ctl", /[\x00-\x1F\x7F]/,
   //
   //                     "separators", /[\(\)\<\>\@\,\;\:\[\]\?\=\{\}\/\ \t\\]/,
   //
   //                     "token", /[\x20-\x7E]/
   //
   //
   //                  );

});
