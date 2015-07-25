'use strict';

Jx('jx', function (J) {

   var O = Object.prototype,
      toString = O.toString,
      exitCallback = [],
      tickQueue = {},
      tickIdGen = 0,
      GLOBAL = Jx.GLOBAL,
      unenumerables = (function (isEnumerable) {
            var sample = {},
               names = ['constructor',
                        'hasOwnProperty',
                        'valueOf',
                        'isPrototypeOf',
                        'propertyIsEnumerable',
                        'toLocaleString',
                        'toString'
                        ];

            var name, l;

            for (l = names.length; l--;) {

               name = names[l];
               sample[name] = 1;

               if (isEnumerable.call(sample, name)) {
                  names.splice(l, 1);
               }

            }

            return names;

         })(O.propertyIsEnumerable);

   function each(obj, callback, scope) {
      var name;
      for (name in obj) {
         if (callback.call(scope, obj[name], name, obj) === false) {
            return obj;
         }
      }
      return obj;
   }

   function assignCallback(value, name, obj) {
      this[name] = value;
   }

   function assignOwnCallback(value, name, obj) {
      if (obj.hasOwnProperty(name)) {
         this[name] = value;
      }
   }

   function clearCallback(value, name, obj) {
      this[name] = null;
      delete this[name];
   }


   // if there are unenumerables, then not all properties were iterated
   if (unenumerables.length) {
      each = function (obj, callback, scope) {
         var Native = O;
         var name, value, l, list, hasOwn;
         for (name in obj) {
            if (callback.call(scope, obj[name], name, obj) === false) {
               return obj;
            }
         }
         if (obj instanceof Native) {
            list = unenumerables;
            hasOwn = Native.hasOwnProperty;
            for (l = list.length; l--;) {
               name = list[l];
               value = obj[name];
               if ((Native[name] !== value || hasOwn.call(obj, name)) &&
                  callback.call(scope, value, name, obj) === false) {
                  return obj;
               }
            }
         }
         return obj;
      };
   }

   this.each = each;

   this.assign = function (obj) {
      var l = arguments.length - 1;
      var c = 0;
      for (; l--;) {
         each(arguments[++c], assignOwnCallback, obj);
      }
      return obj;
   };

   this.assignAll = function (obj) {
      var l = arguments.length - 1;
      var c = 0;
      for (; l--;) {
         each(arguments[++c], assignCallback, obj);
      }
      return obj;
   };

   this.clearObject = function () {
      var l = arguments.length;
      for (; l--;) {
         each(arguments[l], clearCallback);
      }
      return this;
   };

   this.is = function (obj, type) {
      return toString.call(obj) == '[object ' + type + ']';
   };

   this.isObject = function (obj) {
      return !!obj && toString.call(obj) == '[object Object]';
   };

   this.isFunction = function (obj) {
      return !!obj && toString.call(obj) == '[object Function]';
   };

   this.isString = function (obj) {
      return typeof obj == 'string';
   };

   this.isArray = function (obj) {
      return !!obj && toString.call(obj) == '[object Array]';
   };

   this.isDate = function (obj) {
      return !!obj && toString.call(obj) == '[object Date]';
   };

   this.isNumber = function (obj) {
      return typeof obj == 'number' && isFinite(obj);
   };

   this.isEmpty = function (obj) {
      switch (toString.call(obj)) {
      case '[object RegExp]': return !obj.source;
      case '[object Date]': return !obj.getTime();
      case '[object Array]': return !obj.length;
      case '[object Number]': return !isFinite(obj) || !obj;
      default: return !obj;
      }
   };

   this.exit = function (callback) {
      var list;
      if (J.isFunction(callback)) {
         list = exitCallback;
         list[list.length] = callback;
      }
      return J;
   };

   // TODO: execute exit callbacks as soon as app exits;

   switch (J.platform) {
   case 'nodejs':
      if ('setImmediate' in GLOBAL) {
         this.nextTick = setImmediate;
      }
      else if (GLOBAL.process && 'nextTick' in process) {
         this.nextTick = process.nextTick;
      }
      else {
         this.nextTick = function (callback) {
            console.log('timers are not supported in this nodejs build');
            callback();
         };
      }
   case 'browser':
      if ('setImmediate' in GLOBAL) {
         this.nextTick = setImmediate;
      }
      else {
         this.nextTick = function (callback) {
            setTimeout(callback, 10);
         };
      }
      break;
   }







   // apply to jx
   this.assign(J, this);

});
