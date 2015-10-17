'use strict';

Jx('jx', 'jxExtensions', function (Jx) {

    var O = Object,
        BASE_CONSTRUCTOR_NAME = 'onconstruct',
        AUGMENTABLE_RE = /this\.\$super/,
        exports = this.exports;

    function empty() {
    }

    function assignProperty(value, name, obj) {

        var toString = Object.prototype.toString,
            target = this.$superclass;
        var current, superMethod, isConstructor;

        if (obj.hasOwnProperty(name)) {

            if (toString.call(value) === '[object Function]') {
                isConstructor = name === 'constructor';

                if (name in target &&
                    (isConstructor || AUGMENTABLE_RE.test(value.toString()))
                ) {

                    if (isConstructor) {
                        name = BASE_CONSTRUCTOR_NAME;
                        superMethod = function (args) {
                            return (name in target ?
                                    target[name] :
                                    target.constructor
                                ).apply(this, args || []);

                        };

                    }
                    else {
                        superMethod = function (args) {
                            return name in target ?
                                    target[name].apply(this, args || []) :
                                    void(0);

                        };
                    }

                    current = value;
                    value = function () {
                        var oldParent = this.$super;
                        var result;

                        this.$super = superMethod;
                        result = current.apply(this, arguments);

                        if (oldParent) {
                            this.$super = oldParent;
                        }
                        else {
                            delete this.$super;
                        }

                        return result;
                    };
                }

            }

            this[name] = value;
        }

    }

    function extend(properties) {
        return exports.extend(this, properties);
    }

    exports.extend = function (SuperClass, properties) {
        var J = Jx;
        var Proto, SuperProto, old;

        function Class() {
            var instance = this;

            if (!(instance instanceof Class)) {
                instance = createRawInstance(Class.prototype);
            }

            instance.onconstruct.apply(instance, arguments);
            return instance;

        }

        if (J.isObject(SuperClass)) {
            properties = SuperClass;
            SuperClass = O;
        }

        if (J.isFunction(SuperClass) && J.isObject(properties)) {

            empty.prototype;
            empty.prototype = SuperProto = SuperClass.prototype;
            Class.prototype = Proto = new empty();
            Proto.constructor = Class;

            Proto.$superclass = SuperClass.prototype;
            Jx.each(properties, assignProperty, Proto);

            if (!(BASE_CONSTRUCTOR_NAME in Proto)) {
                Proto.onconstruct = SuperProto.constructor;
            }

            Class.extend = extend;

            return Class;

        }

        return void(0);
    };

});
