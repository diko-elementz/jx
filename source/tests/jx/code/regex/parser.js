describe("jxCodeRegexParser module", function() {
   var J = Jx;

   J.setBaseUrl('/base/');

   it('can tokenize Regular Expression and auto append concatenate operator ' +
      'to resulting tokens',
      function (done) {
         J.use('jxCodeRegexParser', function (Parser) {
            var subject = /abc\,d\xf2(ef)/,
               parser = new Parser(subject),
               tokens = [
                  ['literal', 'a'],
                  ['.', '.'],
                  ['literal', 'b'],
                  ['.', '.'],
                  ['literal', 'c'],
                  ['.', '.'],
                  ['literal', ','],
                  ['.', '.'],
                  ['literal', 'd'],
                  ['.', '.'],
                  ['literal', '\xf2'],
                  ['.', '.'],
                  ['(', '('],
                  ['literal', 'e'],
                  ['.', '.'],
                  ['literal', 'f'],
                  [')', ')'],
                  ['$', '']
               ],
               c = 0;

            var token, match;

            for (; token = parser.tokenize(); c++) {
               match = tokens[c];
               expect(token[0]).toBe(match[0]);
               expect(token[1]).toBe(match[1]);
            }

            expect(token !== false).toBe(true);
            done();
         });
      });


   it('can tokenize Regular Expression by escaping characters ' +
      'in Character Class',
      function (done) {
         J.use('jxCodeRegexParser', function (Parser) {
            var subject = /[\u00f1\xf1]/,
               parser = new Parser(subject),
               tokens = [
                  ['[]', '\u00f1\xf1'],
                  ['$', '']
               ],
               c = 0;

            var token, match;

            for (; token = parser.tokenize(); c++) {
               match = tokens[c];
               expect(token[0]).toBe(match[0]);
               expect(token[1]).toBe(match[1]);
            }

            expect(token !== false).toBe(true);
            done();
         });
      });

   it('can tokenize Regular Expression and determine a Repeater Range ' +
      'from a Named Reference',
      function (done) {
         J.use('jxCodeRegexParser', function (Parser) {
            var subject = /a{,1}b{10,}c{20}e{Name}{Delimiter}/,
               parser = new Parser(subject),
               tokens = [
                  ['literal', 'a'],
                  ['{}', ',1'],
                  ['.', '.'],
                  ['literal', 'b'],
                  ['{}', '10,'],
                  ['.', '.'],
                  ['literal', 'c'],
                  ['{}', '20'],
                  ['.', '.'],
                  ['literal', 'e'],
                  ['.', '.'],
                  ['ref', 'Name'],
                  ['.', '.'],
                  ['ref', 'Delimiter'],
                  ['$', '']
               ],
               c = 0;

            var token, match;

            for (; token = parser.tokenize(); c++) {
               match = tokens[c];
               expect(token[0]).toBe(match[0]);
               expect(token[1]).toBe(match[1]);
            }

            expect(token !== false).toBe(true);
            done();
         });
      });


});
