'use strict';

if (typeof require != 'undefined') {
   require('../source/Jx.js');
}

Jx.setBaseUrl('../source/');


Jx.use('jxPromise', function (Promise) {

   console.log('promise', this.status);

   Promise.create(function (resolve, reject) {

      resolve('yes!');

   }).
   then(
      function (data) {
         return Promise.create(function (resolve, reject) {
            resolve('inner yes!');
         });
      },
      function (reason) {
         console.log('rejected! ', reason);
      }).
   then(
      function (data) {
         console.log('sub resolved! ', data);
         return data;
      });

});


Jx.use('jxPromise', function (Promise) {

   console.log('next: ', this.status);

});

Jx.use('jxPromise', function (Promise) {

   console.log('next 2: ', this.status);
});



//Jx.use('jxExtensions', function (J) {
//
//   var c = 0;
//   var id = J.nextTick(function () {
//      c++;
//      if (c > 3000) {
//         J.clearTick(id);
//         id = 0;
//      }
//      else {
//         console.log('tick!', c);
//      }
//   }, 10);
//
//
//
//});

















//Jx.use('jxClass', function () { console.log('callback from ', this); });
//
//Jx.inline('buang', function () {
//
//   Jx(function () {
//
//      this.exports.name = 'this is buang';
//
//      console.log('buang code!');
//
//
//   });
//
//   Jx(function () {
//
//      this.exports.name2 = 'this is buang';
//
//      console.log('buang code2!');
//
//
//   });
//
//
//});
//
//
//
//Jx.use('buang', function (buang) {
//
//   console.log('exports from buang: ', buang);
//});


//console.log('end ', test);




//function req() {
//   //var test = Jx.use('test-require');
//   //console.log(' test: ', test);
//   //console.log(' another: ', Jx.use('test-require'));
//
//
//   //var xhr = new XMLHttpRequest();
//   //
//   ////while (document.readyState != 'ready') {
//   //   console.log('try loading');
//   //   xhr.open('HEAD', location.pathname, true);
//   //   xhr.onload = function () {
//   //      if (document.readyState != 'ready') {
//   //         console.log('try loading');
//   //         xhr.open('HEAD', location.pathname, true);
//   //         xhr.send(null);
//   //
//   //      }
//   //      else {
//   //         xhr.onload = null;
//   //         xhr = null;
//   //         console.log('loaded');
//   //      }
//   //
//   //   };
//   //   xhr.send(null);
//   //
//   ////}
//   //console.log('loading!');
//   //xhr = null;
//
//
//}
//
//req();
//console.log('payter!');

//var myId = setInterval(
//      function() {
//         clearInterval(myId);
//         if (document.readyState == 'complete') {
//
//            console.log('ready! ', myId);
//
//            req();
//         }
//         else {
//            console.log('not ready!');
//         }
//      }, 10);

//console.log(document.readyState);

//Jx('test',
//	'code/regex/parser',
//	'code/tokenizer',
//	function(Parser, Tokenizer) {
//
//   // regex parser
//   //var parser = Parser(/ab[a-z0-9_\r\n]/);
//   //
//   //var rpn = parser.parse();
//
//   //console.log({rpn:rpn});
//
//   //var c = -1;
//   //
//   //var l = rpn.length;
//   //
//   //var stack = [];
//   //
//   //
//   //for (; l--;) {
//   //
//   //
//   //
//   //
//   //
//   //}
//
//   var tokenizer = Tokenizer(
//                        //"name", /[a-zA-Z_][a-zA-Z0-9_]/
//                        //"a_to_c", /[a-c]+/,
//                        //"d_to_e", /[d-e]+/,
//								"capture",
//									/a(b*)c/
////                        "string",
////                           /\"([^\"]|\\\")+\"x/,
////									/\"([^\"]|\\\")+\"/,
////								"buang",
////									/a/,
////									/ab/
//
//                     );
//
//   //tokenizer.set_subject('"abcs\\"de"aba');
//	tokenizer.set_subject('abc');
//
//   window.t = tokenizer;
//
//
//	//window.parser = new Parser();
//
//
//
//
//
//   //console.log('found: ', tokenizer.next());
//   //
//   //console.log('found: ', tokenizer.next());
//   //
//   //console.log('tokenizer', tokenizer)
//
//
//
//
//
//   //window.parser = parser;
//
//
//
//
//   // HTTP tokens
//   //var tokenizer = Tokenizer(
//   //
//   //                     "name", /[a-zA-Z][a-zA-Z0-9]/,
//   //
//   //                     "ctl", /[\x00-\x1F\x7F]/,
//   //
//   //                     "separators", /[\(\)\<\>\@\,\;\:\[\]\?\=\{\}\/\ \t\\]/,
//   //
//   //                     "token", /[\x20-\x7E]/
//   //
//   //
//   //                  );
//
//});
