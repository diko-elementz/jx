"use strict";

function Jx(id, callback) {

   var args = arguments;

   var l = args.length;

   var requires;

   if (l > 1 && id && typeof id == 'string') {

      if (l > 2) {

         requires = Array.prototype.slice.call(arguments, 1);

         callback = requires.pop();

      } else {

         requires = [];

      }

      Jx.define(id, requires, callback);

   }

};


(function(J) {

   var exports = {};

   var definitions = {};

   var declare_list = [];

   var aliases = {};

   var export_processors = {
            ':default': function(definition, properties) {

               return properties;

            }
         };

   var is_bulk_declaring = false;

   var to_string = Object.prototype.toString;


   function is_declarable (id) {

      var definition = get_definition(id);

      var requires = definition.undefined_modules;

      var l;

      for (l = requires.length; l--;) {

         if (!is_declared(requires[l])) {

            return false;

         }

         requires.splice(l, 1);

      }

      return true;

   }

   function is_declared(id) {

      return id in exports;

   }

   function get_definition(id) {

      return id in definitions ? definitions[id] : void(0);

   }

   function get_exports(id) {

      return id in exports ? exports[id] : void(0);

   }

   function get_required_exports(id) {

      var definition = get_definition(id);

      var modules = definition.requires.slice(0);

      var l;

      for (l = modules.length; l--;) {

         modules[l] = get_exports(':' + modules[l]);

      }

      return modules;

   }

   function set_alias(id, name) {

      var list;

      if (id in aliases) {

         list = aliases[id];

      } else {

         list = [];

         aliases[id] = list;

      }

      list[list.length] = name;

      // directly apply aliases
      if (is_declared(id)) {

         apply_aliases(id);

      }

   }

   function parse_name(name) {

      return name && to_string.call(name) == '[object String]' ?

                  ':' + name : void(0);

   }

   function register(id) {

      if (id && !(id in definitions)) {

         return definitions[id] = {

            name: id.substring(1, id.length),

            undefined_modules: [],

            requires: [],

            initializer: null

         };

      }

      return void(0);

   }

   function prepare_required (id, requires) {

      var definition = get_definition(id);

      var def_requires = definition.requires;

      var undefined_modules = definition.undefined_modules;

      var l = requires.length;

      var module, module_id;

      for (; l--;) {

         module = requires[l];

         def_requires[l] = module;

         undefined_modules[l] = parse_name(module);

      }

   }

   function bulk_declare() {

      var l, id, definition;

      var count = 5;

      if (!is_bulk_declaring) {

         is_bulk_declaring = true;

         for (l = declare_list.length; l--;) {

            id = declare_list[l];

            // check requires
            if (is_declarable(id)) {

               declare(id);

               declare_list.splice(l, 1);

               l = declare_list.length;

            }

         }

         is_bulk_declaring = false;

      }

   }

   function declare(id) {

      var definition = get_definition(id);

      var initializer = definition.initializer;

      var type_access = '@type';

      var params, method, method_access, properties;

      params = get_required_exports(id);

      if (initializer instanceof Function) {

         initializer = initializer.apply(definition, params);

      }

      if (!(initializer instanceof Function) &&

          !(to_string.call(initializer) == '[object Object]' &&

            initializer instanceof Object)

      ) {

         initializer =  { $$status: 'initializer of module: "' +
                                 definition.name +
                                 '" has invalid value "' +
                                 initializer +
                                 '"'
                        };

      }

      properties = initializer;

      definition.required_exports = params;

      // declare exports
      method_access = type_access in properties &&
                        typeof properties[type_access] == 'string' ?
                           ':' + properties[type_access] : ':default';

      exports[id] = export_processors[
                        method_access in export_processors ?
                           method_access : ':default'
                        ](id.substring(1, id.length), definition, properties);

      apply_aliases(id);

   }

   function apply_aliases(id) {

      var definition = get_definition(id);

      var exported = get_exports(id);

      var list, name, access, l, alias_definition, alias_exported;

      if (id in aliases) {

         list = aliases[id].slice(0); // get copy

         for (l = list.length; l--;) {

            access = parse_name(list[l]);

            list.splice(l, 1);

            alias_definition = get_definition(access);

            alias_exported = get_exports(access);

            // validate alias
            if (is_declared(access)) {

               // throw alias conflict error
               if (alias_definition == definition) {

                  throw new Error("alias conflict");

               }

               continue;

            }

            definitions[access] = definition;

            exports[access] = exported;

         }

      }

   }

   J.modules = exports;

   J.definitions = definitions;

   J.GLOBAL = (new Function('return this;'))();

   J.define = function(name, requires, callback) {

      var id = parse_name(name);

      var definition = id && register(id);

      var nil = void(0);

      var module;

      if (!definition) {

         throw new Error("unable to register module");

         return nil;

      }

      prepare_required(id, requires);

      definition.initializer = callback;

      declare_list[declare_list.length] = id;

      bulk_declare();

      return get_exports(id);

   };

   J.exporter = function(type, callback) {

      if (type && typeof type == 'string' &&

         to_string.call(callback) == '[object Function]'

      ) {

         export_processors[':' + type] = callback;

         return true;

      }

      throw new Error("unable to create exporter");

      return false;

   };

   J.alias = function(name) {

      var id = parse_name(name);

      var alias, c, l;

      if (id && arguments.length > 1) {

         for (c = 0, l = arguments.length - 1; l--;) {

            alias = arguments[++c];

            if (alias && typeof alias == 'string') {

               set_alias(id, alias);

            }

         }

      }

   };

})(Jx);
