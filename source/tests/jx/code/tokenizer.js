describe("jxCodeTokenizer module", function() {
   var J = Jx;

   J.setBaseUrl('/base/');

   //tokenizer.define([
   //   "string",         /\"([^\"]+|(\\\")+)\"/, [1],
   //                     /\'([^\']+|(\\\')+)\'/, [1],
   //
   //   "simple",         /a/,
   //
   //   "charset",        /[a-z0-9]/,
   //
   //   "one_or_none",    /a?b/,
   //                     /ab?/,
   //
   //   "one_or_more",    /a+b/,
   //                     /ab+/,
   //
   //   "more_or_none",   /a*b/,
   //                     /ab*/,
   //
   //   "grouped",        /a(bc)d/
   //]);


   // tokenizer sequence
   it('can tokenize sequence of characters that matched' +
      ' with token definition',

      function (done) {

         var definition = [
                  "A",         /a/,
                  "B",         /b/
               ],
            subject = 'ababaab',
            results = [{
                  token: "A",
                  found: "a"
               },{
                  token: "B",
                  found: "b"
               },{
                  token: "A",
                  found: "a"
               },{
                  token: "B",
                  found: "b"
               },{
                  token: "A",
                  found: "a"
               },{
                  token: "A",
                  found: "a"
               },{
                  token: "B",
                  found: "b"
               }];

         J.use('jxCodeTokenizer', function (Tokenizer) {
            var tokenizer = new Tokenizer(),
               index = 0,
               c = 0;
            var result, token;

            tokenizer.define(definition);

            tokenizer.set(subject);

            for (; token = tokenizer.find(index);) {
               result = results[c++];
               expect(result.token === token[0]).toBe(true);
               expect(result.found === token[1]).toBe(true);
               index = token[2];
            }
            expect(results.length === c).toBe(true);
            done();
         });

      });

   it('can tokenize one or no character',

      function (done) {

         var definition = [
                  "A",         /a?b/
               ],
            subject = 'bababbbbbaab',
            results = [{
                  token: "A",
                  found: "b"
               },{
                  token: "A",
                  found: "ab"
               },{
                  token: "A",
                  found: "ab"
               },{
                  token: "A",
                  found: "b"
               },{
                  token: "A",
                  found: "b"
               },{
                  token: "A",
                  found: "b"
               },{
                  token: "A",
                  found: "b"
               }];

         J.use('jxCodeTokenizer', function (Tokenizer) {
            var tokenizer = new Tokenizer(),
               index = 0,
               c = 0;
            var result, token;

            tokenizer.define(definition);

            tokenizer.set(subject);

            for (; token = tokenizer.find(index);) {
               result = results[c++];
               expect(result.token === token[0]).toBe(true);
               expect(result.found === token[1]).toBe(true);
               index = token[2];
            }
            expect(results.length === c).toBe(true);
            done();
         });

      });

   it('can tokenize repeated characters',

      function (done) {

         var definition = [
                  "A",         /a+b/,
                  "B",         /ab+/
               ],
            subject = 'ababbbbbaab',
            results = [{
                  token: "A",
                  found: "ab"
               },{
                  token: "B",
                  found: "abbbbb"
               },{
                  token: "A",
                  found: "aab"
               }];

         J.use('jxCodeTokenizer', function (Tokenizer) {
            var tokenizer = new Tokenizer(),
               index = 0,
               c = 0;
            var result, token;

            tokenizer.define(definition);

            tokenizer.set(subject);

            for (; token = tokenizer.find(index);) {
               result = results[c++];
               expect(result.token === token[0]).toBe(true);
               expect(result.found === token[1]).toBe(true);
               index = token[2];
            }
            expect(results.length === c).toBe(true);
            done();
         });

      });

   it('can tokenize Kleen star characters',

      function (done) {

         var definition = [
                  "A",         /ab/,
                  "B",         /b*a/
               ],
            subject = 'ababbbbbaab',
            results = [{
                  token: "A",
                  found: "ab"
               },{
                  token: "A",
                  found: "ab"
               },{
                  token: "B",
                  found: "bbbba"
               },{
                  token: "A",
                  found: "ab"
               }];

         J.use('jxCodeTokenizer', function (Tokenizer) {
            var tokenizer = new Tokenizer(),
               index = 0,
               c = 0;
            var result, token;

            tokenizer.define(definition);

            tokenizer.set(subject);

            for (; token = tokenizer.find(index);) {
               result = results[c++];
               expect(result.token === token[0]).toBe(true);
               expect(result.found === token[1]).toBe(true);
               index = token[2];
            }
            expect(results.length === c).toBe(true);
            done();
         });

      });

   it('can tokenize alternative characters',

      function (done) {

         var definition = [
                  "A",         /a+|b/,
                  "B",         /b+|a/
               ],
            subject = 'ababbbbbaab',
            results = [{
                  token: "A",
                  found: "a"
               },{
                  token: "A",
                  found: "b"
               },{
                  token: "A",
                  found: "a"
               },{
                  token: "B",
                  found: "bbbbb"
               },{
                  token: "A",
                  found: "aa"
               },{
                  token: "A",
                  found: "b"
               }];

         J.use('jxCodeTokenizer', function (Tokenizer) {
            var tokenizer = new Tokenizer(),
               index = 0,
               c = 0;
            var result, token;

            tokenizer.define(definition);

            tokenizer.set(subject);

            for (; token = tokenizer.find(index);) {
               result = results[c++];
               expect(result.token === token[0]).toBe(true);
               expect(result.found === token[1]).toBe(true);
               index = token[2];
            }
            expect(results.length === c).toBe(true);
            done();
         });

      });

   it('can tokenize reference tokens',

      function (done) {

         var definition = [
                  "A",         /a+/,
                  "B",         /b+{A}b+/
               ],
            subject = 'bababbbbbaab',
            results = [{
                  token: "B",
                  found: "bab"
               },{
                  token: "A",
                  found: "a"
               },{
                  token: "B",
                  found: "bbbbbaab"
               }];

         J.use('jxCodeTokenizer', function (Tokenizer) {
            var tokenizer = new Tokenizer(),
               index = 0,
               c = 0;
            var result, token;

            tokenizer.define(definition);

            tokenizer.set(subject);

            for (; token = tokenizer.find(index);) {
               result = results[c++];
               expect(result.token === token[0]).toBe(true);
               expect(result.found === token[1]).toBe(true);
               index = token[2];
            }
            expect(results.length === c).toBe(true);
            done();
         });

      });




});
