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

    Jx.use = function (url, callback) {
        var module;

        if (url && typeof url == 'string' && callback instanceof Function) {
            module = resolveModule(url);

            if (module) {
                updateCallback(CALLBACK_USAGE_PRIORITY, module.name,
                    function (module) {
                        callback.call(module, module.exports);
                    });
                return module;

            }

        }
        return void(0);
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

