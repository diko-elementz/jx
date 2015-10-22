'use strict';

(function () {

    var F = Function,
        GLOBAL = (new F('return this;'))(),
        MODULES = {},
        NAME_TO_PATH_RE = /[A-Z]/g,
        PATH_TO_NAME_RE = /\/([a-z])/g,
        JS_EXT_RE = /\.js$/i,
        QUEUE_LOAD = [],
        SCRIPT_UNINITIALIZED = 0,
        SCRIPT_LOADING = 1,
        SCRIPT_LOADED = 2,
        SCRIPT_RESOLVED = 3,

        CALLBACK_DECLARATION_PRIORITY = 1,
        CALLBACK_RESOLVE_PRIORITY = 2,
        CALLBACK_AFTER_DECLARATION_PRIORITY = 3,
        CALLBACK_USAGE_PRIORITY = 4,

        PLATFORM_BROWSER = 1,
        PLATFORM_NODEJS = 2,

        currentPlatform = PLATFORM_BROWSER,
        baseUrl = 'js/',
        currentScope = void(0),
        isProcessing = false,
        processes = [];

    var Jx, load, resolve, configureBaseUrl;

    function parseName(name) {
        var path = name.replace(NAME_TO_PATH_RE, parseNameToPath);
        var re = JS_EXT_RE;

        path = re.test(path) ? path : path + '.js';
        name = path.replace(PATH_TO_NAME_RE, parsePathToName);

        return {
            name: name.replace(re, ''),
            path: path,
            access: '::' + path
        };
    }

    function parseNameToPath(match) {
        return '/' + match.toLowerCase();
    }

    function parsePathToName(match, firstChar) {
        return firstChar.toUpperCase();
    }

    function emptyFn() {}

    function resolveModule(url) {
        var list = MODULES,
            o = parseName(url);

        var access, filename;

        if (o) {
            access = o.access;
            filename = o.path;
            if (access in list) {
                return list[access];
            }

            return list[access] = {
                name: o.name,
                filename: filename,
                path: baseUrl + filename,
                status: SCRIPT_UNINITIALIZED,
                modulesToLoad: 0,
                updatingState: false,
                exports: {},
                callbacks: []
            };

        }

        return void(0);

    }

    function updateState(module) {

        function stateProcessor() {
            var current = module.status,
                updating = module.updatingState;

            var l, callbacks;

            switch (current) {
                case SCRIPT_UNINITIALIZED: // load when uninitialized
                    current = SCRIPT_LOADING;
                    module.modulesToLoad++;
                    load(module, function (module) {
                        module.modulesToLoad--;
                        updateState(module);
                    });
                    break;
                case SCRIPT_LOADING:
                    if (!module.modulesToLoad) {
                        current = SCRIPT_LOADED;
                    }
                    break;
                case SCRIPT_LOADED:
                    // shift to RESOLVED only if exports is defined
                    module.status = current = SCRIPT_RESOLVED;
                    callbacks = module.callbacks;
                    for (; callbacks.length;) {
                        callbacks.shift()(module);
                    }

                    break;
            }

            return module.status = current;
        }

        processes[processes.length] = stateProcessor;

        stateProcessor.status = module.status;

        runProcess();

    }

    function runProcess() {
        var old = isProcessing;
        var current, status, process;
        if (!isProcessing) {
            isProcessing = true;

            for (; processes.length;) {

                process = processes[0];
                processes.splice(0, 1);
                status = null;
                current = process.status;
                for (; status != current;) {
                    status = current;
                    current = process();
                }

            }

            isProcessing = old;

        }
    }

    function createResolveCallback(params, index, callback) {
        return function (module) {
            params[index] = module.exports;
            callback(module);
        };
    }

    function updateCallback(priority, name, callback) {
        var module = resolveModule(name);
        var callbacks, l;

        if (module.status == SCRIPT_RESOLVED) {
            callback(module);
        } else {
            callbacks = module.callbacks;
            l = callbacks.length;

            callback.priority = priority;
            for (; l-- && callbacks[l].priority > priority;);
            callbacks.splice(++l, 0, callback);
        }
        updateState(module);
    }

    if ('Jx' in GLOBAL) {
        return;
    }

    if ('global' in GLOBAL && 'process' in GLOBAL && GLOBAL.global ===
        GLOBAL) {

        currentPlatform = PLATFORM_NODEJS;

    } else if ('window' in GLOBAL && GLOBAL.window === GLOBAL) {

        currentPlatform = PLATFORM_BROWSER;

    }

    Jx = GLOBAL.Jx = function () {
        var list = MODULES,
            l = arguments.length,
            module = currentScope;

        var arg, callback, item, params, c, rl, caller;

        if (module && l) {
            arg = arguments[--l];

            // only legit module declarator
            if (arg instanceof F) {
                params = [];
                rl = 0;
                callback = arg;
                for (c = -1; l--;) {
                    arg = arguments[++c];
                    if (arg && typeof arg == 'string') {
                        item = resolveModule(arg);
                        if (item) {
                            module.modulesToLoad++;
                            updateCallback(
                                CALLBACK_RESOLVE_PRIORITY,
                                item.name,
                                createResolveCallback(params, rl++,
                                    function (item) {
                                        module.modulesToLoad--;
                                        updateState(item);
                                        updateState(module);
                                    }));

                            updateCallback(
                                CALLBACK_AFTER_DECLARATION_PRIORITY,
                                item.name,
                                function (item) {
                                    updateState(module);
                                });

                        }

                    }
                }

                updateCallback(CALLBACK_DECLARATION_PRIORITY, module.name,
                    function (module) {
                        callback.apply(module, params);
                    });
            }

        }
        return void(0);
    };

    switch (currentPlatform) {
        case PLATFORM_NODEJS:
            Jx.platform = 'nodejs';

            configureBaseUrl = function (url) {
                var path = require('path');

                if (url && typeof url == 'string') {
                    url = path.normalize(
                        path.dirname(require.main.filename) +
                        (url ? '/' + url : ''));
                    baseUrl = url + (url.charAt(url.length - 1) != '/' ?
                        '/' : '');

                }
                return baseUrl;
            };

            load = function (module, callback) {
                var J = Jx,
                    old = currentScope,
                    path = require('path');

                currentScope = module;
                require(module.path);
                currentScope = old;
                callback(module);

            };

            exports = Jx;
            break;
        default:
            Jx.platform = 'browser';
            configureBaseUrl = function (url) {
                if (url && typeof url == 'string') {
                    baseUrl = url + (url.charAt(url.length - 1) != '/' ?
                        '/' : '');
                }
                return baseUrl;
            };

            load = function (module, callback) {
                var list = load.scripts,
                    xhr = new XMLHttpRequest;

                // preload
                xhr.open('GET', module.path, true);
                xhr.send(null);
                xhr = null;

                // actual bulk load
                list[list.length] = [module, callback];

                // start bulk load if not yet started
                load.bulkLoad();
            };

            load.isLoading = false;

            load.scripts = [];

            load.bulkLoad = function () {
                var list = load.scripts,
                    J = Jx,
                    l = list.length;

                var current, module, old;

                if (!load.isLoading && l) {

                    current = list.splice(0, 1)[0];
                    load.isLoading = true;

                    module = current[0];
                    old = currentScope;
                    currentScope = module;

                    load.request(module,
                        function (module) {
                            current[1](module);
                            currentScope = old;
                            load.isLoading = false;
                            load.bulkLoad();
                        });

                }

            };

            load.request = function (currentModule, callback) {
                var doc = document,
                    script = doc.createElement('script'),
                    type = 'onload';

                script.type = 'text/javascript';
                script.src = currentModule.path;

                if (script.readyState) {
                    type = 'onreadystatechange';
                }

                script[type] = function (evt) {
                    var script = (evt || window.event).target;
                    if (type == 'onload' || script.readyState ==
                        'complete') {
                        script[type] = null;
                        callback(currentModule);
                    }
                    script = null;
                };

                doc.getElementsByTagName('head')[0].appendChild(script);

                script = null;
                doc = null;
            };
    }

    Jx.setBaseUrl = configureBaseUrl;

    Jx.GLOBAL = GLOBAL;

    Jx.module = function (url) {
        var list = MODULES;

        var o, access;

        if (url && typeof url == 'string') {
            o = parseName(url);

            if (o) {
                access = o.access;

                if (access in list) {
                    return list[access];

                }

            }

        }

        return void(0);

    };

    Jx.use = function () {
        var callback = null,
            params = [],
            loaded = 0,
            loadCount = 0,
            called = false,
            arg = arguments,
            index = {};

        var l, c, item, loader, module, list;

        for (c = -1, l = arg.length; l--;) {
            item = arg[++c];
            if (item instanceof Function) {
                callback = item;
            }
            else if (item && typeof item === 'string') {
                module = resolveModule(item);
                if (module) {
                    if (item in index) {
                        list = index[item];
                        list[list.length] = c;
                    }
                    else {
                        index[item] = [c];
                        loadCount++;
                    }

                    updateCallback(CALLBACK_USAGE_PRIORITY, item,
                        function (module) {
                            var name = module.name,
                                list = index[name],
                                l = list.length,
                                exports = module.exports;

                            for (; l--;) {
                                loaded++;
                                params[list[l]] = exports;
                            }
                            delete index[name];
                            // call
                            if (loaded >= loadCount && callback) {
                                called = true;
                                callback.apply(Jx, params);
                            }
                        });

                }
                else {
                    params[c] = void(0);
                }
            }
        }

        if (!called && loaded >= loadCount && callback) {
            callback.apply(Jx, params);
        }

        return Jx;

    };

    Jx.inline = function (url, callback) {
        var module, old;

        if (url && typeof url == 'string' && callback instanceof Function) {
            module = resolveModule(url);

            if (module) {

                switch (module.status) {
                    case SCRIPT_UNINITIALIZED:
                        module.status = SCRIPT_RESOLVED;
                    case SCRIPT_RESOLVED:
                        old = currentScope;
                        currentScope = module;
                        callback.call(module, module.exports);
                        currentScope = old;
                        break;
                    default:
                        Jx.use(module.name, callback);
                        break;
                }

                return module;
            }
        }

        return void(0);
    };

    // set Jx as module
    Jx.inline('jx', function () {
        this.exports = Jx;
    });

})();
Jx.inline("jxExtensions", function () {'use strict';

Jx('jx', function (J) {

    var O = Object.prototype,
        toString = O.toString,
        exitCallback = [],
        tickQueue = {},
        tickIdGen = 0,
        GLOBAL = Jx.GLOBAL,
        exports = this.exports,
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
                if (callback.call(scope, obj[name], name, obj) ===
                    false) {
                    return obj;
                }
            }
            if (obj instanceof Native) {
                list = unenumerables;
                hasOwn = Native.hasOwnProperty;
                for (l = list.length; l--;) {
                    name = list[l];
                    value = obj[name];
                    if ((Native[name] !== value || hasOwn.call(obj,
                            name)) &&
                        callback.call(scope, value, name, obj) ===
                        false) {
                        return obj;
                    }
                }
            }
            return obj;
        };
    }

    exports.each = each;

    exports.assign = function (obj) {
        var l = arguments.length - 1;
        var c = 0;
        for (; l--;) {
            each(arguments[++c], assignOwnCallback, obj);
        }
        return obj;
    };

    exports.assignAll = function (obj) {
        var l = arguments.length - 1;
        var c = 0;
        for (; l--;) {
            each(arguments[++c], assignCallback, obj);
        }
        return obj;
    };

    exports.clearObject = function () {
        var l = arguments.length;
        for (; l--;) {
            each(arguments[l], clearCallback);
        }
        return this;
    };

    exports.is = function (obj, type) {
        return toString.call(obj) == '[object ' + type + ']';
    };

    exports.isObject = function (obj) {
        return !!obj && toString.call(obj) == '[object Object]';
    };

    exports.isFunction = function (obj) {
        return !!obj && toString.call(obj) == '[object Function]';
    };

    exports.isString = function (obj) {
        return typeof obj == 'string';
    };

    exports.isArray = function (obj) {
        return !!obj && toString.call(obj) == '[object Array]';
    };

    exports.isDate = function (obj) {
        return !!obj && toString.call(obj) == '[object Date]';
    };

    exports.isNumber = function (obj) {
        return typeof obj == 'number' && isFinite(obj);
    };

    exports.isEmpty = function (obj) {
        switch (toString.call(obj)) {
            case '[object RegExp]':
                return !obj.source;
            case '[object Date]':
                return !obj.getTime();
            case '[object Array]':
                return !obj.length;
            case '[object Number]':
                return !isFinite(obj) || !obj;
            default:
                return !obj;
        }
    };

    exports.exit = function (callback) {
        var list;
        if (J.isFunction(callback)) {
            list = exitCallback;
            list[list.length] = callback;
        }
        return J;
    };

    // TODO: execute exit callbacks as soon as app exits;
    if ('setImmediate' in GLOBAL) {
        exports.nextTick = GLOBAL.setImmediate;

    }
    else if ('process' in GLOBAL &&
        exports.isFunction(process) &&
        'nextTick' in process) {
        exports.nextTick = process.nextTick;

    }
    else if ('setTimeout' in GLOBAL) {
        exports.nextTick = function (callback) {
            GLOBAL.setTimeout(callback, 10);
        };

    }
    else {
        exports.nextTick = function (callback) {
            console.log(
                'timers are not supported in this nodejs build'
            );
            callback();
        };
    }

    // apply to jx
    exports.assign(J, exports);

});
});

Jx.inline("jxClass", function () {'use strict';

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
});

Jx.inline("jxPromise", function () {'use strict';

Jx('jx', 'jxClass', function (Jx, Class) {

    var GLOBAL = Jx.GLOBAL,
        EXEC_PENDING = 1,
        EXEC_RESOLVED = 2,
        EXEC_REJECTED = 3,
        EXEC_SETTLED = 4,

        genId = 0,
        unsettled = {},
        unsettledCount = 0,
        processing = false;


    function emptyFn() {};

    function defaultOnFulfill(value) {
        return value;
    }

    function defaultOnReject(reason) {
        throw reason;
    }

    function isThenable(value) {
        var J = Jx;
        return J.isObject(value) && J.isFunction(value.then);
    }

    function createId() {
        var id = genId;
        var list = unsettled;
        for (; id--;) {
            if (!(id in list)) {
                return id;
            }
        }
        return ++genId;
    }

    function runProcess() {
        var list = unsettled,
            J = Jx;
        var id, process;
        if (unsettledCount && !processing) {
            processing = true;
            for (id in list) {
                process = list[id];
                if (process() && process.status === EXEC_SETTLED) {
                    unsettledCount--;
                    delete list[id];
                }
            }
            processing = false;
        }
    }

    function Promise(executor) {
        var me = this;
        var processor;

        if (!(me instanceof Promise)) {
            return new Promise(executor);
        }

        processor = function () {
            var current = processor,
                status = null;

            while (status !== current.status) {
                // has status change
                if (status) {
                    Jx.nextTick(runProcess);
                }
                switch (status = current.status) {
                    case EXEC_SETTLED:
                        return true;

                    case EXEC_RESOLVED:
                    case EXEC_REJECTED:
                        processor.status = EXEC_SETTLED;
                        break;

                    case EXEC_PENDING:
                        try {
                            executor.call(null, current.resolve,
                                current.reject);
                        } catch (e) {
                            current.reject(e);
                        }
                }
            }
            return false;

        };

        processor.status = EXEC_PENDING;

        processor.resolve = function (data) {
            var status = processor.status;
            if (status !== EXEC_SETTLED) {
                processor.status = EXEC_RESOLVED;
                processor.settle = function (callback) {
                    callback(data, true);
                };
            }
            runProcess();
        };

        processor.reject = function (reason) {
            var status = processor.status;
            if (status !== EXEC_SETTLED) {
                processor.status = EXEC_REJECTED;
                processor.settle = function (callback) {
                    callback(reason, false);
                };
            }
            runProcess();
        };

        me.$$processor = processor;

        // try first
        processor();

        if (processor.status != EXEC_SETTLED) {
            unsettled[createId()] = processor;
            unsettledCount++;
            runProcess();
        }

        return me;

    }

    // static properties
    Jx.assign(Promise, {
        /**
         * create promise that is resolved when all promises in
         * iteratable is resolved.
         */
        all: function (iteratable) {
            var newPromise = null;

            var promise, createPromise, l, c, values, count,
                applied;

            if (Jx.isArray(iteratable)) {

                count = 0;
                values = [];

                createPromise = function (index, promise) {

                    promise = promise.
                    then(function (data) {
                        values[index] = data;
                        return data;
                    });

                    return !newPromise ? promise :
                        newPromise.
                    then(function () {
                        return promise;
                    });

                };

                for (c = -1, l = iteratable.length; l--;) {
                    promise = iteratable[++c];
                    if (isThenable(promise)) {
                        newPromise = createPromise(count++,
                            promise);
                    }
                }

                if (count) {

                    return newPromise.
                    then(function () {
                            return values;
                        },
                        function (reason) {
                            values.splice(0, values.length); // clear
                            values = null;
                            throw reason;
                        });

                }

            }

            return Promise.reject(
                'Invalid iteratable Promises argument');

        },
        /**
         * create promise that settles after first promise in
         * iteratable is resolved or rejected
         */
        race: function (iteratable) {
            var l, c, added, promise, newPromise, processor,
                onFulfill, onReject, ended;

            if (Jx.isArray(iteratable)) {
                ended = false;
                added = false;
                newPromise = new Promise(emptyFn);
                processor = newPromise.$$processor;

                onFulfill = function (data) {
                    if (!ended) {
                        ended = true;
                        processor.resolve(data);
                    }
                    return data;
                };
                onReject = function (reason) {
                    if (!ended) {
                        ended = true;
                        processor.reject(reason);
                    }
                    throw reason;
                };

                for (c = -1, l = iteratable.length; l--;) {
                    promise = iteratable[++c];
                    if (isThenable(promise)) {
                        added = true;
                        promise.then(onFulfill, onReject);
                    }
                }

                if (added) {

                    return newPromise;

                }

            }

            return Promise.reject(
                'Invalid iteratable Promises argument');

        },
        /**
         * create promise that rejects with the given reason
         */
        reject: function (reason) {
            return new Promise(
                function (resolve, reject) {
                    reject(reason);
                });
        },
        /**
         * create promise that resolves with the given data
         */
        resolve: function (data) {
            return new Promise(
                function (resolve, reject) {
                    resolve(data);
                });
        }

    });

    Jx.assign(Promise.prototype, {

        constructor: Promise,

        then: function (onFulfilled, onReject) {

            var processor = this.$$processor,
                J = Jx,
                applied = false;

            onFulfilled = J.isFunction(onFulfilled) ?
                onFulfilled : defaultOnFulfill;

            onReject = J.isFunction(onReject) ?
                onReject : defaultOnReject;

            function executor(resolve, reject) {
                var parent = processor;
                if (!applied && parent.status ==
                    EXEC_SETTLED) {
                    applied = true;
                    parent.settle(function (data, resolved) {
                        if (resolved) {
                            try {
                                data = onFulfilled.call(
                                    null, data);
                            } catch (e) {
                                data = e;
                                resolved = false;
                            }
                        } else {
                            try {
                                onReject.call(null,
                                    data);
                            } catch (e) {
                                data = e;
                                resolved = false;
                            }
                        }
                        if (!resolved) {
                            reject(data);
                        } else if (isThenable(data)) {
                            data.then(resolve,
                                reject);
                        } else {
                            resolve(data);
                        }
                    });
                }
            }

            return new Promise(executor);
        }

    });

    // export
    this.exports = Promise;

});
});

