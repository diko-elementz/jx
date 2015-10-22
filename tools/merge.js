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
var PATH = require('path'),
   FS = require('fs'),

   TOOL_PATH = PATH.dirname(module.filename),
   ROOT_PATH = PATH.dirname(TOOL_PATH),
   CWF_PATH = (function (mod) {
                  var filename;
                  for (; mod.parent; mod = mod.parent);
                  filename = mod.filename;
                  return isFile(filename) ? filename : false;
               })(module),
   CWD = process.cwd(),
   DEFAULT_PARAMS = [
         ROOT_PATH + '/source/jx.js',
         ROOT_PATH + '/output'
      ],

   JS_RE = /\.js$/i,
   PATH_ABS_RE = /^\//,
   PATH_TO_MODULE_RE = /[^a-zA-Z0-9\_]+([a-z])/g,


   MODULE_UNINITIALIZED = 0,
   MODULE_LOADING = 1,
   MODULE_LOADED = 2,
   MODULE_DECLARED = 3,
   MODULE_ERROR = 4,

   moduleIndex = {},
   pendingLoadModules = [],
   pendingLoadIndex = 0,
   loadOutput = false;

function main() {
   var modules = [],
      c = -1,
      P = PATH;

   var l, o, filename, output;

   output = initializeParameters(modules);
   if (output) {
      loadOutput = output;
   }

   // populate
   for (l = modules.length; l--;) {
      filename = modules[++c];
      registerModule(
         createModuleName(filename, P.dirname(filename)),
         filename,
         null
      );

   }

   bulkLoad();

}

// MODULE_UNINITIALIZED = 0
//   MODULE_LOADED = 1
//   MODULE_DECLARED = 2
//   MODULE_ERROR = 3

function updateModuleState(name) {

   var list = moduleIndex,
      P = PATH;

   var module, oldState;

   if (list.hasOwnProperty(name)) {
      module = list[name];
      oldState = module.status;
      switch (module.status) {
      case MODULE_UNINITIALIZED: // load module contents
         module.status = MODULE_LOADING;
         load(module.filename,
            function (basename, dirname, data) {
               var requires = fetchRequiredModules(data),
                  mr = module.requires,
                  nl = module.notLoaded,
                  childdirname = P.join(dirname, basename).
                                    replace(JS_RE, '');

               var owner, ownerDir, ownerName;

               // populate dependencies
               mr.push.apply(mr, requires);
               nl.push.apply(nl, requires);
               filterModuleNotLoaded(nl);
               module.content = data;
               module.status = MODULE_LOADED;
               bulkLoad();

               // load others
               if (isDirectory(childdirname)) {

                  owner = list[module.owner || module.name];
                  ownerDir = P.dirname(owner.filename);
                  ownerName = owner.name;

                  eachFile(childdirname,
                     function (basename, dirname) {

                        var filename = P.join(dirname, basename);

                        registerModule(
                              createModuleName(
                                    filename,
                                    ownerDir
                                 ),
                              filename,
                              ownerName
                           );

                        bulkLoad();

                     });

               }

            }, {encoding: 'utf-8'});

         break;
      case MODULE_LOADED: // contents loaded and dependencies fetched
         if (filterModuleNotLoaded(module.notLoaded)) {

            if (module.name == 'jx') {
               writeToOutput(module.content);
            }
            else {
               writeToOutput(
                  'Jx.inline("', module.name, '", function () {',
                     module.content,
                  '});',
                  "\n\n");
            }

            module.status = MODULE_DECLARED;
         }
         break;
      }

      // if there are state changes, then try bulkload
      if (oldState != module.status) {
         bulkLoad();
         return true;

      }

   }

   return false;

}

function bulkLoad() {
   var list = pendingLoadModules;
   var l, o;

   // request to run parent
   if (bulkLoad.running) {
      bulkLoad.nextTick = true;

   }
   // bulk run
   else {
      bulkLoad.running = true;
      bulkLoad.nextTick = true;

      while (bulkLoad.nextTick) {
         delete bulkLoad.nextTick;

         for (l = pendingLoadIndex; l--;) {

            o = list[l];

            updateModuleState(o.name);

            switch (o.status) {
            case MODULE_DECLARED:
            case MODULE_ERROR:
               list.splice(l, 1);
               pendingLoadIndex--;
            }

         }

      }

      delete bulkLoad.running;
   }


}


function initializeParameters(moduleList) {
   var list = process.argv.slice(1),
      re = JS_RE,
      absre = PATH_ABS_RE,
      l = list.length,
      c = -1,
      ml = 0,
      P = PATH,
      C = CWD,
      output = false;

   var item, filename, root, moduleName;

   // remove argument
   filename = CWF_PATH;
   if (filename && list.length) {
      item = list[0];
      if (item == filename) {
         list.splice(0, 1);
         l--;
      }
   }

   if (!l) {   // use default
      list.push.apply(list, DEFAULT_PARAMS);
      l = list.length;
   }

   if (l > 1) {
      l--;
      output = list.pop();
      if (!absre.test(output)) {
         output = P.join(C, output);
      }
   }

   for (; l--;) {
      item = list[++c];

      if (item && re.test(item)) {

         if (!absre.test(item)) {
            item =  P.join(C, item);
         }

         if (re.test(item) && isFile(item)) {
            filename = FS.realpathSync(item);
            moduleList[ml++] = filename;
         }
      }

   }

   return output;

}


function registerModule(name, filename, owner) {
   var module = {
         name: name,
         owner: owner || null,
         filename: filename,
         status: MODULE_UNINITIALIZED,
         content: '',
         requires: [],
         notLoaded: []
      };

   // queue
   pendingLoadModules[pendingLoadIndex++] = module;

   return moduleIndex[name] = module;
}


function filterModuleNotLoaded(list) {
   var modules = moduleIndex;
   var name, l, o;
   for (l = list.length; l--;) {
      name = list[l];
      if (modules.hasOwnProperty(name)) {
         o = modules[name];

         // remove from list
         switch (o.status) {
         case MODULE_DECLARED:
         case MODULE_ERROR:
            list.splice(l, 1);
         }
      }
   }
   return list.length < 1;
}


function error() {
   var p = process.stderr;
   var l, c, o;
   for (c = -1, l = arguments.length; l--;) {
      o = arguments[++c];
      switch (typeof o) {
      case 'number':
         o = '' + o;
         break;
      case 'boolean':
         o = o ? 'true' : 'false';
         break;
      case 'function':
         o = o.source;
         break;
      }
      p.write(o);
      p.write('\n');

   }
}

function writeToOutput() {
   var l = arguments.length;

   var c, p;

   if (l) {
      if (loadOutput) {
         p = [];
         for (; l--;) {
            p[l] = arguments[l];
         }

         if (!writeToOutput.started) {
            writeToOutput.started = true;

            if (isFile(loadOutput)) {
               FS.truncateSync(loadOutput);
            }

         }
         FS.appendFile(loadOutput,
                        p.join(''),
                        function (err) {
                           if (err) {
                              error('error! ', err);
                           }
                        });


      }
      else {
         p = process.stdout;
         for (c = -1; l--;) {
            p.write(arguments[++c]);
         }
      }

   }

}

function eachFile(path, callback) {
   FS.readdir(path, function (err, files) {
      var file, fullpath, l, c;

      if (err) {
         throw err;
         return;
      }

      for (c = -1, l = files.length; l--;) {
         file = files[++c];
         fullpath = path + '/' + file;
         callback(file, path);
      }
   });
}

function load(path, callback, options) {

   if (isFile(path)) {

      loadFile(path, callback, options);

   }
   else if (isDirectory(path)) {

      loadDirectory(path, callback, options);

   }

}

function loadFile(fullpath, callback, options) {
   var filename = PATH.basename(fullpath);
   var path = PATH.dirname(fullpath);

   function readCallback(err, data) {
      if (err) {
         err('[!] ' + err);
      }
      else {
         callback(filename, path, data);
      }
   };

   if (options) {
      FS.readFile(fullpath, options, readCallback);
   }
   else {
      FS.readFile(fullpath, readCallback);
   }
}

function loadDirectory(path, callback, options) {
   eachFile(path,
      function (filename, path) {
         var fullpath = path + '/' + filename;
         var readCallback;

         // recurse directory
         if (isDirectory(fullpath)) {
            loadDirectory(fullpath, callback, options);
         }
         // register
         else if (JS_RE.test(filename)) {
            loadFile(fullpath, callback, options);
         }
      });
}

function isFile(path) {
   try {
      return FS.statSync(path).isFile();
   }
   catch (e) {
      return false;
   }
}

function isDirectory(path) {
   try {
      return FS.statSync(path).isDirectory();
   }
   catch (e) {
      return false;
   }
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
      case ' ':
      case '\r':
      case '\n':
      case '\t':
         token = 'whitespace';
         str = chr;
         break process;
      case 'J':
         if (data.substring(c, c + 2) == 'x(') {
            c += 2;
            str = token = 'Jx(';
            break process;
         }
      default:
         token = str = chr;
         break process;
      }
   }

   return token ? [token, str, c] : false;

}


function fetchRequiredModules(str) {
   var c = 0,
      sl = 0,
      fl = 0,
      capturing = false,
      current = '',
      stack = [],
      found = [],
      pairs = {
         ')': '(',
         '}': '{',
         ']': '['
      };

   var result, token_name, token, starter;

   for (; result = tokenize(c, str);) {
      token = result[1];
      switch (token_name = result[0]) {
      case 'string':
         if (capturing) {
            found[fl++] = token;
         }
      case ',':
      case 'whitespace':
      case 'comment-multiline':
      case 'comment':
         break;
      case 'Jx(':
         capturing = true;
         token = '(';
      case '(':
      case '[':
      case '{':
         stack[sl++] = token;
         current = token;
         break;
      case ')':
      case ']':
      case '}':
         if (sl && pairs[token] == current) {
            stack.length = --sl;
            current = sl ? stack[sl - 1] : '';
         }
      default:
         capturing = false;
         break;
      }
      c = result[2];
   }

   return found;

}

function pathToModuleCallback(m, chr) {
   return chr ? chr.toUpperCase() : m;
}


function createModuleName(filename, root) {
   var l = typeof root == 'string' ? root.length : 0,
      absre = PATH_ABS_RE,
      CP = CWD,
      P = PATH;

   // fix root
   if (!l) {
      root = P.join(CP, './');
   }
   else if (!absre.test(root)) {
      root = P.join(CP, root, './');
   }
   else {
      root = P.join(root, './');
   }

   l = root.length;

   // fix filename
   if (!absre.test(filename)) {
      filename = PATH.join(CP, filename);
   }

   // truncate filename
   if (filename.substring(0, l) == root) {
      filename = filename.substring(l, filename.length);
   }

   return filename.
            replace(JS_RE, '').
            replace(PATH_TO_MODULE_RE, pathToModuleCallback);

}


main();
