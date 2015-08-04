'use strict';

Jx('jx', 'jxExtensions', function (Jx) {

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
