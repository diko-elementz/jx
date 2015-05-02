//"use strict";

Jx.alias('class/base', '$class');

Jx('class/base', function() {

   var $ = Jx;

   var Base = create_constructor();

	var definitions = {};

   //    { category_name+':'+id => [ callback1(), ... ] }
   var processors = {};

   //    { ':'+category_name => [ category_name+':'+id1, ... ] }
   var processor_categories = {};

   // struct: { category_name+':'+id => '@'+name }
   var processor_index = {};


   function is_method(properties, name) {

      var value;

      if (name in properties) {

         value = properties[name];

         if (value != Object.prototype[name]) {

            return value instanceof Function;

         }

      }

      return false;

   }

   function is_subclass_of(Class, Super) {

      var Prototype;

      if (Super instanceof Function) {

         return Class === Super ||

            (Class instanceof Function && Class.prototype instanceof Super);

      }

      return false;

   }

   function get_processors(category, id) {

      var access = category + ':' + id;

      return access in processors ?

               processors[access] : void(0);

   }

   function get_processor_category(id) {

      var access = ':' + id;

      return access in processor_categories ?

               processor_categories[access] : void(0);

   }

   function empty() {}

   function create_constructor() {

      function Class() {

         var instance = this;

         if (!(instance instanceof Class)) {

            instance = instantiate(Class);

         }

         instance.destroyed = false;

         instance.construct.apply(instance, arguments);

         return instance;

      }

      return Class;

   }

   function create_processor(category, name, callback) {

      var list = get_processors(category, name);

      var clist, access;

      if (!list) {

         clist = get_processor_category(category);

         // register category
         if (!clist) {

            clist = [];

            processor_categories[':' + category] = clist;

         }

         access = category + ':' + name;

         clist[clist.length] = access;

         // register index
         processor_index[access] = '@' + name;

         // register processor list
         processors[access] = list = [];

      }

      list[list.length] = callback;

   }

   function parse_processor_name(name) {

      var index = name.indexOf(':');

      var category = 'ON';

      if (index == -1) {

         category = name.substring(0, index).toUpperCase();

         name = name.substring(index + 1, name.length);

      }

      return category && name ? [category, name] : false;

   }

   function instantiate(Class) {

      empty.prototype = Class.prototype;

      return new empty();

   }

   function extend(Super, properties) {

      var Prototype = instantiate(Super == Object ? Base : Super);

      var Class = create_constructor();

      var is_native_object = Super == Object;

      var Prototype, is_base;

      if (is_native_object) {

         Super = Base;

      }

      is_base = is_subclass_of(Super, Base);

      Prototype = is_native_object ? {} : instantiate(Super);

      Class.prototype = Prototype;

      // augment properties for non-Base class
      if (!is_base) {

         $.each(Base.prototype, apply_base_property_callback, Prototype);

         Prototype.construct = Super;

      }

      // relocate constructor if defined
      if (is_method(properties, 'constructor')) {

         properties.construct = properties.constructor;

      }

      Prototype.constructor = Class;

      Prototype.$superclass = Super.prototype;

      // relocate and augment methods
      extend_properties_callback.$access = 'super';

      $.each(properties, extend_properties_callback, Class.prototype);

      return Class;

   }

	function create_sub_method(submethod, supermethod) {

		function call_super(args) {

			return supermethod.apply(this, args || []);

		}

		function method() {

			var old = this.$super;

			var result;

			this.$super = call_super;

			result = submethod.apply(this, arguments);

			this.$super = old;

			return result;

		};

		method.target = submethod;

		method.supermethod = supermethod;

		return method;

	}

   function extend_properties_callback(name, value, properties) {

      var Prototype = this;

      var pvalue = name in Prototype ?

                     Prototype[name] : void(0);

      if (name == 'constructor') {

         return;

      }

      // augment
      if (value instanceof Function &&

         is_method(Prototype, name)

      ) {

			value = create_sub_method(value, Prototype[name]);

      }

      Prototype[name] = value;

   }


   function apply_base_property_callback(name, value, Prototype) {

      if (Prototype.hasOwnProperty(name)) {

         this[name] = value;

      }

   }

   function call_processors(category, subject, args) {

      var access = ':' + category;

      var return_result = void(0);

      var callbacks, processor_names, processor_name,

         c, l, cc, cl, result, property_name, params;

      if (access in processor_categories) {

         processor_names = processor_categories[access];

         for (c = -1, l = processor_names.length; l--;) {

            processor_name = processor_names[++c];

            property_name = processor_index[processor_name];

            if (processor_name in processors) {

               params = [

                  property_name in subject ?

                     subject[property_name] : void(0)

               ];

               params.push.apply(params, args);

               callbacks = processors[processor_name];

               for (cc = -1, cl = callbacks.length; cl--;) {

                  result = callbacks[++cc].apply(subject, params);

                  if (result) {

                     return_result = result;

                  }

               }

            }

         }

      }

      return return_result;

   }

   function export_class(id, definition, properties) {

      var default_properties, Class;

      default_properties = call_processors('PRE', properties, [definition]);

      Class = call_processors('ON', default_properties, [definition]);

      //return call_processors('POST', Class.prototype, [definition]);

		var post = call_processors('POST', Class.prototype, [definition]);

		return post;

   }


   // create base class properties
   Base.prototype = {

      $name: 'base',

      constructor: Base,

      destroyed: true,

      construct: function() {},

      destruct: function() {

         $.clear(this);

      }

   };


   // create PRE processors
   create_processor('PRE', 'extend', function(value, definition) {

         var Super = this;

         var Constructor;

         if (Super instanceof Function) {

            definition.Superclass = Super;

            return { '@singleton': false };

         } else {

            Super = Base;

            if (value instanceof Function) {

               delete this['@extend'];

               Super = value;

            } else if (value instanceof Object) {

               Constructor = value.constructor;

               if (Constructor instanceof Function && Constructor != Object) {

                  Super = Constructor;

               }

            }

            definition.Superclass = Super;

            return this;

         }

      });

   // create ON processors
   create_processor('ON', 'extend', function(value, definition) {

         var Class = extend(definition.Superclass, this);

         Class.prototype.$name = definition.name;

         definition.Class = Class;

         return Class;

      });

   // create POST processors
   create_processor('POST', 'singleton', function(value, definition) {

         var Class = this.constructor;

         // return instance if singleton
         return value === true ? new Class() :

                     // return prototype if not singleton (default)
                     value !== false ? Class.prototype :

                        // return class if not singleton is explicitly defined
                        Class;

      });

	create_processor('POST', 'static', function(value, definition) {

			var Class = definition.Class;

			if ($.is_object(value)) {

				$.assign(Class, value);

			}

		});

   // create default exporter
   $.exporter('default', export_class);

   // create class exporter
   $.exporter('class', function(id, definition, properties) {

      var is_singleton = '@singleton' in properties ?

                              properties['@singleton'] === true : false;

      properties['@singleton'] = is_singleton;

      return export_class(id, definition, properties);

   });

	Jx.processors = processors;

	Jx.processor_categories = processor_categories;

   // exports
   return extend(Base, {

      $name: 'class/base',

      subclass_of: is_subclass_of,

		clone: function(obj) {

			if ($.is_object(obj)) {

				empty.prototype = obj;

				return new empty();

			}

			return void(0);

		},

      instantiate: function(Class, args) {

         var instance;

         if (Class instanceof Function) {

            instance = instantiate(Class);

            instance.constructor.apply(instance, args || []);

            return instance;

         }

         return false;

      },

      processors: function(name, callback) {

         var parts = parse_processor_name(name);

         if (parts && callback instanceof Function) {

            create_processor(parts[0], parts[1], callback);

            return true;

         }

         return false;

      },

      create: function(properties) {

         if ($.is_object(properties)) {

            return extend(Base, properties);

         }

         return false;

      },

      extend: function(Class, properties) {

         if (Class instanceof Function && $.is_object(properties)) {

            return extend(Class, properties);

         }

         return false;

      }

   }).prototype;

});
