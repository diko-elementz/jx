'use strict';


Jx('jxClass',

   'jxCodeTokenizerProvider',

   function(Class, Provider) {

      // TODO: fix errors in captures


      this.exports = Class.extend({

            cache: void(0),

            constructor: function () {
               this.provider = new Provider();
               this.cache = [];
               this.reset();
            },

            define: function (definitions, replace) {
               this.provider.define(definitions, replace);
               return this;
            },

            set: function (str) {
               str = typeof str == 'string' ? str : '';
               this.cache = Array.prototype.slice.call(str, 0);
               return this;
            },

            append: function (str) {
               var cache;
               if (str && typeof str == 'string') {
                  cache = this.cache;
                  cache.push.apply(
                     cache,
                     Array.prototype.slice.call(str, 0)
                  );
               }
               return this;
            },

            find: function (from, target) {
               var provider = this.provider,
                  state = provider.startState,
                  states = provider.states,
                  str = this.cache,
                  strlen = str.length,
                  constants = provider.constants,
                  opStack = null,
                  followStack = null,
                  limit = 100;

               var pointer, symbol,
                  c, l, cache, cl,
                  input, il, match, value, vl,
                  end, max, pattern,
                  map, capture, captureId, captureSet, captureEnd, captured,
                  capturelen;

               // validate start index
               from = from === 0 || from ? from : 0;

               // validate start state and expected token
               if (arguments.length > 1) {
                  target = typeof target === 'string' ?
                              '{' + target + '}' : '';

                  if (target in states) {
                     state = states[target];
                  }
                  else {
                     return false;
                  }

               }

               if (!state || from < 0 || from >= strlen) {
                  return false;
               }

               c = from;
               l = strlen - from;
               cl = 0;
               cache = [];
               map = {};
               pointer = state.pointer;
               max = 0;
               input = match = end = null;

               opStart: for (; l--;) {

                  // find input
                  if (!input && pointer) {
                     symbol = pointer.symbol;
                     if (symbol.find) {
                        // create follow stack
                        if (pointer.next) {
                           followStack = {
                              c: c,
                              l: l + 1,
                              cl: cl,
                              state: state,
                              pointer: pointer.next,
                              before: followStack
                           };
                        }
                        opStack = {
                           l: ++l,
                           c: c,
                           from: from,
                           state: state,
                           pointer: pointer,
                           cache: cache,
                           cl: cl,
                           max: max,
                           end: end,
                           map: map,
                           followStack: followStack,
                           before: opStack
                        };
                        state = symbol.find;
                        pointer = state.pointer;
                        cache = [];
                        from = c;
                        cl = 0;
                        map = {};
                        followStack = null;
                        input = null;
                        continue opStart;
                     }
                     // fetch from input by basic match
                     else {
                        match = str[c];
                        input = [match, match, 1];
                     }
                  }

                  // find match
                  if (input) {
                     match = input[0];

                     for (; pointer; pointer = pointer.next) {
                        symbol = pointer.symbol;
                        if (match in symbol === symbol.equal) {
                           // follow next pointer
                           if (pointer.next) {
                              followStack = {
                                 c: c,
                                 l: l + 1,
                                 cl: cl,
                                 state: state,
                                 pointer: pointer.next,
                                 before: followStack
                              };
                           }
                           break;
                        }
                     }
                  }

                  // first input iteration
                  if (pointer) {

                      // capture
                     capture = pointer.start;
                     for (; capture; capture = capture.next) {
                        captureId = capture.id;
                        if (!(captureId in map)) {
                           map[captureId] = [cl, false];
                        }
                     }

                     capture = pointer.end;
                     for (; capture; capture = capture.next) {
                        map[capture.id][1] = cl + 1;
                     }


                     // go to next
                     state = pointer.to;
                     pointer = state.pointer;
                     il = input[2];
                     c += il;

                     if (il > 1) {
                        l -= il - 1;
                     }


                     cache[cl++] = input[1];
                     pattern = state.end;
                     if (pattern && cl > max) {
                        max = cl;
                        value = [];
                        vl = 0;
                        capture = pattern.captures;

                        for (; capture; capture = capture.next) {
                           captureId = capture.id;
                           if (captureId in constants) {
                              value[vl++] = constants[captureId];
                           }
                           else if (captureId in map) {
                              captureSet = map[captureId];
                              captureEnd = captureSet[1];
                              if (captureEnd !== false) {
                                 capturelen = captureEnd - captureSet[0];
                                 for (; capturelen--;) {
                                    value[vl++] = cache[
                                                      captureEnd -
                                                      capturelen - 1
                                                   ];
                                 }
                              }
                           }

                        }

                        end = [pattern.token, value.join(''), c, strlen === c];

                     }

                     input = null;

                  }
                  // try follow stack
                  else if (followStack) {

                     c = followStack.c;
                     l = followStack.l;
                     cl = followStack.cl;
                     state = followStack.state;
                     pointer = followStack.pointer;
                     followStack = followStack.before;
                     input = null;

                  }
                  // try operation stack
                  else if (opStack) {

                     // create input
                     if (end) {
                        input = [
                              '{' + end[0] + '}',
                              end[1],
                              end[2] - from
                           ];
                     }
                     else {
                        input = ['', '', 0];
                     }

                     c = opStack.c;
                     l = opStack.l;
                     from = opStack.from;
                     state = opStack.state;
                     pointer = opStack.pointer;
                     cache = opStack.cache;
                     cl = opStack.cl;
                     max = opStack.max;
                     map = opStack.map;
                     end = opStack.end;
                     followStack = opStack.followStack;
                     opStack = opStack.before;

                  }

               }

               return end || false;

            },

            reset: function () {
               return this;
            }

         });



   });
