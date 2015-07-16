"use strict";

Jx('extensions', function () {

   var J = Jx;

   var O = Object;

   var Call = O.prototype;

   var toString = Call.toString;

   var unenumerables = (function (names, defaults) {

            var sample = {};

            var isEnumerable = Call.propertyIsEnumerable;

            var name, l;

            for (l = names.length; l--;) {

               name = names[l];

               sample[name] = 1;

               if (isEnumerable.call(sample, name)) {

                  names.splice(l, 1);

               }

            }

            return names;

         })(['constructor',
               'hasOwnProperty',
               'valueOf',
               'isPrototypeOf',
               'propertyIsEnumerable',
               'toLocaleString',
               'toString'
               ], Call);

   var properties = {};


   function each(o, fn, scope) {

      scope = scope || null;

      var name, l, hasOwn, enums;

      for (name in o) {

         if (fn.call(scope, name, o[name], o) === false) {

            break;

         }

      }

      if (o instanceof O) {

         hasOwn = Call.hasOwnProperty;

         enums = unenumerables;

         for (l = enums.length; l--;) {

            name = enums[l];

            if ((hasOwn.call(o, name) || o[name] !== Call[name]) &&

               fn.call(scope, name, o[name], o) === false) {

               break;

            }

         }

      }

      return o;

   }

   function callback_assign(name, value) {

      this[name] = value;

   }

   function callback_clear(name, value, properties) {

      delete properties[name];

   }

   properties.each = each;

   properties.assign = function (target, source) {

      each(source, callback_assign, target)

      return target;

   };

   properties.clear = function (target) {

      each(target, callback_clear);

      return target;

   };

   properties.is_object = function (target) {

      return toString.call(target) == '[object Object]' && target instanceof O;

   };

   properties.is_function = function (target) {

      return target instanceof Function;

   };

   properties.is_array = function (target) {

      return target instanceof Array;

   };

   properties.is_string = function (target) {

      return toString.call(target) == '[object String]';

   };

   properties.is_number = function (target) {

      return !isNaN(target) && isFinite(target);

   };

   properties.is_scalar = function (target) {

      return toString.call(target) == '[object String]' ||

               (!isNaN(target) && isFinite(target));

   };

   properties.is_date = function (target) {

      return target instanceof Date;

   };

   properties.is_regexp = function (target) {

      return target instanceof RegExp;

   };

   properties.is_empty = function (target) {

      return !target;

   };

   // apply properties to jx
   properties.assign(J, properties);

   return properties;

});
