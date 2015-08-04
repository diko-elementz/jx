'use strict';

/**
 * TODO:
 *    1. lint - execute lint.sh
 *    2. list all modules to memory
 *    3. sequentially do the following to listed module
 *       3.1 parse and get required modules and queue them to runner
 *       3.2 queue current module to runner
 *       3.3 run the runner and apply the following to each module
 *          3.3.1 generate module container with Jx.inline
 *          3.3.2 append source code with current module
 *          3.3.3 close module container
 */
var PATH = require('path');
var FS = require('fs');

var TOOL_PATH = PATH.dirname(module.filename);
var ROOT_PATH = PATH.dirname(TOOL_PATH);
var SOURCE_PATH = ROOT_PATH + '/source';

var JS_RE = /\.js$/i;

var loadList = [];
var moduleIndex = {};
var loadCurrentIndex = -1;



function eachFile(path, callback) {
   FS.readdir(path, function (err, files) {
      var file, fullpath, l, c, stat;

      if (err) {
         throw err;
         return;
      }

      for (c = -1, l = files.length; l--;) {
         file = files[++c];
         fullpath = path + '/' + file;
         stat = FS.statSync(fullpath);
         callback(file, fullpath, stat);
      }
   });
}

function load(path, callback, options) {

   eachFile(path,
      function (filename, fullpath, stat) {
         var readCallback;

         // recurse directory
         if (stat.isDirectory()) {
            load(fullpath, callback, options);
         }
         // register
         else if (JS_RE.test(filename)) {
            readCallback = function (error, data) {
               if (error) {
                  console.log(error);
               }
               else {
                  callback(filename, fullpath, data, stat);
               }
            };

            if (options) {
               FS.readFile(fullpath, options, readCallback);
            }
            else {
               FS.readFile(fullpath, readCallback);
            }
         }
      });

}


function tokenize(from, data) {
   var len = data.length,
      l = len - from,
      c = from;
   var chr, before, buffer, bl, token, str, ender;
   str = '';
   token = '';

   process: for (; l--;) {
      chr = data.charAt(c++);
      switch (chr) {
      case "'":
      case '"':
            ender = chr;
            buffer = [];
            before = '';
            token = 'string';
            bl = 0;
            for (; l--;) {
               chr = data.charAt(c++);
               if (chr == ender && before != '\\') {
                  break;
               }
               buffer[bl++] = before = chr;
            }
            str = buffer.join('');
         break process;
      case '/':
            switch (data.charAt(c)) {
            case '*':
               before = '';
               buffer = [];
               bl = 0;
               c++;
               l--;
               token = 'comment-multiline';
               for (; l--;) {
                  chr = data.charAt(c++);
                  if (chr == '/' && before == '*') {
                     break;
                  }
                  buffer[bl++] = before = chr;
               }
               str = buffer.slice(0, bl - 1).join('');
               break process;
            case '/':
               buffer = [];
               bl = 0;
               token = 'comment';
               c++;
               l--;
               for (; l--;) {
                  chr = data.charAt(c++);
                  if (chr == '\n') {
                     break;
                  }
                  buffer[bl++] = chr;
               }
               str = buffer.join('');
               break process;
            }
         token = str = chr;
         break process;
      case ')':
      case '(':
      case ',':
         token = str = chr;
         break process;
      case ' ':
      case '\r':
      case '\n':
      case '\t':
         token = 'whitespace';
         str = chr;
         break process;
      case 'J':
         console.log('Jx ?', data.substring(c, c + 2));
         if (data.substring(c, c + 2) == 'x(') {
            c += 2;
            str = token = 'Jx(';
         }
         break process;
      }

   }

   return token ? [token, str, c] : false;

}


function jsParse(str) {
   var c = 0;
   var result;

   for (; result = tokenize(c, str);) {
      console.log(result);
      c = result[2];
   }

}





//load(ROOT_PATH + '/source',
//   function (filename, fullpath, data, stat) {
//      console.log(filename);
//      console.log(data.substring(0, 100));
//   },
//   {
//      encoding: 'utf-8'
//   });


jsParse('"diko" Jx("jxTest", "jxButangi") /* comment */');
