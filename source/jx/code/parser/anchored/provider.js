'use strict';


Jx('jxClass',
   'jxCodeParserProvider',
   'jxString',
    function (Class, Provider, jString) {


        this.exports = Class.extend(Provider, {

            onDefineStates: function (root) {

                var grammar = this.grammar,
                    TERMINAL = this.LEXEME_TYPE_TERMINAL,
                    NONTERMINAL = this.LEXEME_TYPE_NONTERMINAL,
                    states = this.states,
                    stack = null;

                var name, rules, rule, scope, last,
                    startState, state, stateid, pointers, lexeme;

                var maxIterate = 100;

                stateid = 'state' + (++this.stateIdGen);

                this.startState = states[stateid] = state = {
                    id: stateid,
                    pointers: {},
                    end: []
                };

                rules = grammar[root];

                rule = rules.rule;

                lexeme = rule.lexemes;

                startState = state;

                scope = {

                };

                console.log('rule: ', rule.name);

                for (; lexeme && maxIterate--; ) {

                    name = lexeme.name;
                    pointers = state.pointers;
                    if (name in pointers) {
                        state = pointers[name];
                    }
                    else {
                        stateid = 'state' + (++this.stateIdGen);
                        states[stateid] = pointers[name] = state = {
                            id: stateid,
                            pointers: {},
                            end: []
                        };

                    }

                    console.log(lexeme.name);

                    // next
                    last = lexeme;
                    lexeme = lexeme.next;

                    // before it ends, go to next rule
                    if (!lexeme) {
                        rule = rule.next;

                        // end state
                        state.end[state.end.length] = last.name;

                        // try next rule
                        if (rule) {
                            lexeme = rule.lexemes;
                            state = startState;
                            console.log('rule: ', rule.name);
                            continue;
                        }
                        // pop stack if there are still unprocessed rules
                        else if (stack) {

                        }
                    }

                }

                //queue = last = {
                //    state: state,
                //    name: root,
                //    rule: rules.rule,
                //    scope: {},
                //    next: null
                //};
                //
                //for (; queue; queue = queue.next) {
                //    scope = queue.scope;
                //    state = queue.state;
                //    rule = queue.rule;
                //    next = rule.next;
                //    if (next) {
                //        last = last.next = {
                //            state: state,
                //            name: last.name,
                //            rule: next,
                //            next: null
                //        };
                //    }
                //
                //    name = rule.lexicalName;
                //
                //    // recursion found!
                //    //if (name in scope) {
                //    //    continue;
                //    //}
                //
                //
                //    lexeme = rule.lexemes;
                //
                //    console.log('for rule:', queue.name);
                //    for (; lexeme; lexeme = lexeme.next) {
                //
                //        name = lexeme.name;
                //
                //        console.log(name, ' = ', lexeme.lexicalId);
                //
                //
                //        pointers = state.pointers;
                //
                //    }
                //
                //}


            }

        });
    });
