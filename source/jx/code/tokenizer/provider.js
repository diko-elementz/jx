'use strict';


Jx('jxClass', 'jxCodeStateProvider',
    function (Class, Provider) {

        this.exports = Class.extend(Provider, {

            symId: 0,
            sid: 0,
            gid: 0,
            pid: 0,

            symbols: void(0),
            symbolIndex: void(0),
            constants: void(0),

            onReset: function () {
                this.$super(arguments);
                this.symbols = {};
                this.symbolIndex = {};
                this.constants = {};
                delete this.symId;
                delete this.sid;
                delete this.gid;
                delete this.pid;
            },


            onAdd: function (ref, pattern, returnMatch) {
                var startState = this.startState,
                    startFragment = null,
                    parser = this.regexParser,
                    states = this.states,
                    symbols = this.symbols,
                    constants = this.constants,
                    operands = [],
                    ol = 0,
                    patternId = null,
                    endPattern = void(0),
                    refName = '{' + ref + '}';

                var value, lexeme, op1, op2, fragment, symbol, pointer, outgoing,
                    notRaw,
                    returns, gid, captures, capture,
                    list, isSingle, first, last, split,
                    repeat, clone, state, l, isType;

                parser.reset(pattern);


                for (; lexeme = parser.next();) {

                    value = lexeme[1];

                    switch (lexeme[0]) {
                    case '.':   // concat
                        op2 = operands[--ol];
                        op1 = operands[ol - 1];

                        notRaw = op2.notRaw;

                        // join split
                        split = op1.split;
                        pointer = op2.pointer;
                        outgoing = op2.outgoing;
                        for (; split; split = split.next) {
                            clone = this.clonePointers(pointer);
                            fragment = split.fragment;
                            fragment.lastPointer.next = clone[0];
                            fragment.lastPointer = clone[1];
                            if (!notRaw) {
                                outgoing = outgoing.next = {
                                    pointer: clone[0],
                                    last: clone[1],
                                    next: null
                                };
                            }
                        }

                        // join
                        list = op1.end;
                        clone = null;
                        for (; list; list = list.next) {
                            clone = clone ?
                                        this.clonePointers(pointer) :
                                        [pointer, op2.lastPointer];
                            state = list.state;

                            if (state.pointer) {
                                clone[1].next = state.pointer;
                            }
                            state.pointer = clone[0];
                        }
                        op2.start = op1.end;

                        // concatenate capture group
                        list = op1.groupEnd;
                        if (list) {
                            list.next = op2.groupStart;
                        }

                        operands[ol - 1] = {
                            notRaw: true,
                            start: op1.start,
                            pointer: op1.pointer,
                            lastPointer: op1.lastPointer,
                            end: op2.end,
                            split: op2.split,
                            lastSplit: op2.lastSplit,
                            outgoing: op2.outgoing,
                            groupStart: op1.groupStart || op2.groupStart,
                            groupEnd: op2.groupEnd || op1.groupEnd
                        };
                        break;

                    // TODO: bug with combinator with repeater
                    case '|':   // combine
                        op2 = operands[--ol];
                        op1 = operands[ol - 1];

                        operands[ol - 1] = fragment = {
                            start: op1.start,
                            pointer: op1.pointer,
                            lastPointer: op2.lastPointer,
                            end: op1.end,
                            outgoing: op1.outgoing || op2.outgoing,
                            split: op1.split || op2.split,
                            lastSplit: op2.lastSplit || op1.lastSplit,
                            groupStart: op1.groupStart || op2.groupStart,
                            groupEnd: op2.groupEnd || op1.groupEnd
                        };

                        // combine pointer
                        op1.lastPointer.next = op2.pointer;

                        // combine start state
                        list = op1.start;
                        for (; list.next; list = list.next);
                        list.next = op2.start;

                        // combine end state
                        list = op1.end;
                        for (; list.next; list = list.next);
                        list.next = op2.end;

                        // combine split
                        split = op1.lastSplit;
                        if (split) {
                            split.next = op2.split;
                        }

                        // combine outgoing
                        outgoing = op1.outgoing;
                        for (; outgoing.next; outgoing = outgoing.next);
                        outgoing.next = op2.outgoing;

                        // concat group
                        list = op1.groupEnd;
                        if (list) {
                            list.next = op2.groupStart;
                        }

                        break;

                    case '?':   // split
                        this.splitFragment(operands[ol - 1]);
                        break;

                    case '*': // split/repeat
                        this.repeatFragment(
                            this.splitFragment(operands[ol - 1])
                        );
                        break;

                    case '+': // repeat
                        this.repeatFragment(operands[ol - 1]);
                        break;

                    case '()':
                        this.groupFragment(operands[ol - 1]);
                        break;

                    case '[]':  // operands
                    case '[^]':
                    case 'wildcard':
                    case 'ref':
                    case 'literal':
                        // TODO: finalize end points to support end pointers
                        pointer = {
                            id: 'pointer' + (++this.sid),
                            symbol: this.createSymbol(lexeme),
                            to: null,
                            start: null,
                            end: null,
                            next: null
                        };
                        state = 'state' + (++this.stateIdGen);
                        pointer.to = state = states[state] = {
                            name: state,
                            pointer: null
                        };
                        operands[ol++] = fragment = {
                            pointer: pointer,
                            lastPointer: pointer,
                            start: null,
                            end: {
                                state: state,
                                next: null
                            },
                            outgoing: {
                                pointer: pointer,
                                last: pointer,
                                next: null
                            },
                            split: null,
                            lastSplit: null,
                            groupStart: null,
                            groupEnd: null
                        };
                        fragment.lastEnd = fragment.end;
                        if (!startFragment) {
                            startFragment = fragment;
                            if (!this.startState) {
                                state = 'state' + (++this.stateIdGen);
                                this.startState = state = states[state] = {
                                    name: state,
                                    pointer: pointer
                                };
                            }
                            else {
                                state = this.startState;
                                pointer = state.pointer;
                                for (; pointer.next; pointer = pointer.next);
                                pointer.next = fragment.pointer;
                            }
                            fragment.start = {
                                state: state,
                                next: null
                            };
                        }

                        break;

                    case '$': // ended, postprocess state
                        op1 = operands[ol - 1];

                        // create end pattern
                        patternId = 'pattern' + (++this.pid);
                        endPattern = this.endStates[patternId] = {
                            id: patternId,
                            token: ref,
                            captures: null
                        };

                        // end end states
                        list = op1.end;
                        for (; list; list = list.next) {
                            list.state.end = endPattern;
                        }

                        // TODO: add group
                        // end splits
                        split = op1.split;
                        for (; split; split = split.next) {
                            fragment = split.fragment;
                            list = fragment.start;
                            for (; list; list = list.next) {
                                list.state.end = endPattern;
                            }
                        }

                        this.groupFragment(op1, true);

                        // create capture
                        captures = [];
                        l = 0;
                        list = op1.groupStart;
                        for (; list; list = list.next) {
                            captures[l++] = list.id;
                        }

                        l = returnMatch.length;
                        for (; l--;) {
                            value = returnMatch[l];
                            isType = typeof value;
                            if (isType === 'number' && value in captures) {
                                gid = captures[value];
                            }
                            else {
                                gid = 'group' + (++this.gid);
                                constants[gid] = isType === 'string' ?
                                                    value : '';
                            }

                            returns = {
                               id: gid,
                               index: l,
                               next: returns
                            };
                        }

                        endPattern.captures = returns;

                        // create ref pointers
                        if (!(refName in states)) {
                            states[refName] = {
                                name: refName,
                                pointer: null
                            };
                        }
                        state = states[refName];
                        clone = this.clonePointers(op1.pointer);
                        pointer = state.pointer;
                        if (pointer) {
                            clone[1].next = pointer;
                        }
                        state.pointer = clone[0];
                        break;
                    }

                }

                return endPattern;

            },

            clonePointers: function (pointer) {
                var start = null,
                    current = null;
                var clone;
                for (; pointer; pointer = pointer.next) {
                    clone = {
                        id: 'pointer' + (++this.sid),
                        symbol: pointer.symbol,
                        to: pointer.to,
                        start: pointer.start,
                        end: pointer.end,
                        next: null
                    };
                    if (start) {
                        current.next = clone;
                    }
                    else {
                        start = clone;
                    }
                    current = clone;
                }
                return [start, current];
            },

            splitFragment: function (fragment) {
                var split = fragment.lastSplit;
                if (split) {
                    split = split.next = {
                        fragment: fragment,
                        next: null
                    };
                }
                else {
                    split = fragment.split = {
                        fragment: fragment,
                        next: null
                    };
                }
                fragment.lastSplit = split;
                return fragment;
            },

            repeatFragment: function (fragment) {
                var list = fragment.end,
                    outgoing = fragment.outgoing,
                    pointer = fragment.pointer;
                var clone, state;

                //if (!outgoing) {
                //    console.log('no outgoing? ', fragment);
                //}

                for (; outgoing.next; outgoing = outgoing.next);

                for (; list; list = list.next) {
                    clone = this.clonePointers(pointer);
                    state = list.state;
                    clone[1].next = state.pointer;
                    state.pointer = clone[0];
                    outgoing = outgoing.next = {
                        pointer: clone[0],
                        last: clone[1],
                        next: null
                    };
                }
            },

            groupFragment: function (fragment, ended) {
                var id = 'group' + (++this.gid),
                    start = fragment.groupStart,
                    end = fragment.groupEnd;

                var pointer, list, group, end, endList;

                // setup group start
                fragment.groupStart = group = {
                    id: id,
                    next: fragment.groupStart
                };

                // setup group end
                if (!end) {
                    fragment.groupEnd = end || group;
                }

                // setup start pointers
                pointer = fragment.pointer;
                for (; pointer; pointer = pointer.next) {
                    pointer.start = {
                        id: id,
                        next: pointer.start
                    };
                }

                // setup end pointers
                list = fragment.outgoing;
                for (; list; list = list.next) {
                    pointer = list.pointer;
                    end = list.end;
                    for (; pointer && pointer !== end; pointer = pointer.next) {
                        pointer.end = {
                            id: id,
                            next: pointer.end
                        };
                    }
                }

                if (ended === true) { // apply last pointers as end in split
                    list = fragment.split;
                    for (; list; list = list.next) {
                        endList = list.fragment.outgoing;
                        pointer = endList.pointer;
                        end = endList.end;
                        for (; pointer && pointer !== end; pointer = pointer.next) {
                            pointer.end = {
                                id: id,
                                next: pointer.end
                            };
                        }
                    }
                }

                return fragment;
            },

            createSymbol: function (lexeme) {
                var states = this.states,
                    symbols = this.symbols,
                    index = this.symbolIndex,
                    token = lexeme[0],
                    value = lexeme[1],
                    equal = true;

                var match, len, chr, id, access, symbol, state;

                switch (token) {
                case 'wildcard':
                    access = ':' + value;
                    break;
                case '[^]':
                case '[]':
                    access = '[' + value + ']';
                    break;
                case 'ref':
                    access = value = '{' + value + '}';
                    break;
                default:
                    access = value;
                    break;
                }

                if (access in index) {
                    return symbols[index[access]];
                }

                index[access] = symbol = 'sym' + (++this.symId);
                symbols[symbol] = match = {
                    id: symbol,
                    literal: value,
                    find: null,
                    equal: true
                };

                switch (token) {

                // dot all
                case 'wildcard':
                    match.equal = false;
                    break;

                // character class
                case '[^]':
                    match.equal = false;
                case '[]':
                    len = value.length;
                    for (; len--;) {
                        chr = value.charAt(len);
                        match[chr] = chr;
                    }
                    break;

                default:
                // reference
                case 'ref':
                    if (!(access in states)) {
                        states[access] = {
                            name: access,
                            pointer: null
                        };
                    }
                    match.find = states[access];
                // default literal
                case 'literal':
                    match[value] = value;
                    break;

                }

                return match;
            },

            exportTo: function () {
                var start = this.startState;

                var state, pointer, fragment, name, target, end,
                    list, item, c, l,
                    dataStates, pl, pointers, group, groups,
                    dataPatterns, pattern, captures,
                    dataConstants;

                if (start) {
                    dataStates = {};
                    dataPatterns = {};

                   // export patterns
                    list = this.endStates;
                    for (name in list) {
                        item = list[name];
                        pattern = dataPatterns[name] = {
                            id: name,
                            name: item.token,
                            replace: item,
                            captures: captures = []
                        };
                        pointer = item.captures;
                        for (; pointer; pointer = pointer.before) {
                            captures[pointer.index] = pointer.id;
                        }
                    }

                    // export states
                    list = this.states;
                    for (name in list) {
                        state = list[name];
                        item = state.pointer;
                        pointers = [];
                        pl = 0;

                        end = state.end;

                        dataStates[name] = {
                            pointers: pointers,
                            end: end ? end.id : null
                        };

                        for (; item; item = item.next) {
                            state = item.to;
                            target = state && state.name;

                            // create pointer
                            pointers[pl++] = pointer = {
                                symbol: item.symbol.id,
                                literal: item.symbol.literal,
                                target: target
                            };

                            // create group start
                            group = item.start;
                            groups = [];
                            l = 0;
                            for (; group; group = group.next) {
                                groups[l++] = group.id;
                            }
                            pointer.gstart = l ? groups : null;

                            // create group end
                            group = item.end;
                            groups = [];
                            l = 0;
                            for (; group; group = group.next) {
                                groups[l++] = group.id;
                            }
                            pointer.gend = l ? groups : null;

                        }
                    }

                    return {
                        stateIdGen: this.stateIdGen,
                        symId: this.symId,
                        sid: this.sid,
                        gid: this.gid,
                        pid: this.pid,
                        start: start.name,
                        states: dataStates,
                        endStates: dataPatterns,
                        symbols: this.symbols,
                        constants: this.constants
                    };

                }

                return void(0);

            }

        });

    });
