'use strict';

Jx('jxClass', 'jxCodeRegexParser',
    function (Class, RegexParser) {

        var O = Object,
           toString = O.prototype.toString;

        this.exports = Class.extend({

            stateIdGen: 0,
            startState: null,
            states: void(0),
            endStates: void(0),
            definition: void(0),
            regexParser: void(0),
            defined: false,

            constructor: function () {
                this.regexParser = new RegexParser();
                this.reset();
            },

            define: function (definitions, replace) {
                var Str = toString,
                    ref = '',
                    pattern = null;

                var item, c, l;

                if (!(definitions instanceof Array)) {
                    definitions = arguments;
                }

                if (replace !== false) {
                    this.reset();
                }

                for (c = -1, l = definitions.length; l--;) {

                    item = definitions[++c];

                    switch (Str.call(item)) {
                    case '[object String]':
                        if (item) {
                            if (ref && pattern) {
                                this.onAdd(ref, pattern, [0]);
                            }
                            ref = item;
                            pattern = null;
                        }
                        break;

                    case '[object RegExp]':
                        if (ref) {
                            if (pattern) {
                                this.onAdd(ref, pattern, [0]);
                            }
                            pattern = item;
                        }
                        break;

                    case '[object Number]':
                        if (!isFinit(item) || item < 0) {
                            break;
                        }
                        item = [item];

                    case '[object Array]':
                        if (ref && pattern) {
                            this.onAdd(ref, pattern, item);
                            pattern = null;
                        }
                        break;
                    }

                    if (!l && ref && pattern) {

                        this.onAdd(ref, pattern, [0]);

                    }
                }
                this.onDefine();
                this.defined = true;
                return this;

            },

            add: function (ref, pattern, returnMatch) {
                if (ref && typeof ref == 'string' &&
                    toString.call(pattern) == '[object RegExp]' &&
                    toString.call(returnMatch) == '[object Array]') {

                    this.onAdd(ref, pattern, returnMatch);

                }
                return this;
            },

            onAdd: function (ref, pattern, returnMatch) {
                console.log(
                        'processing ', ref,
                        '-> ', pattern.source,
                        'return: ', returnMatch
                    );
            },

            onDefine: function () {

            },

            reset: function () {
                this.onReset();
                this.states = {};
                this.endStates = {};
                this.definition = {};
                delete this.defined;
                return this;
            },

            onReset: function () {
                this.stateIdGen = 0;
                this.startState = null;
            },

            exportTo: function () {
            },

            importFrom: function (data) {

            }

        });


    });
