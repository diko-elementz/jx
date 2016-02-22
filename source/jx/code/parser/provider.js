'use strict';


Jx('jxClass',
    'jxCodeStateProvider',
    'jxCodeTokenizer',
    'jxCodeGrammarTokenizer',
    function (Class, Provider, Tokenizer, GrammarTokenizer) {

        this.exports = Class.extend(Provider, {

            LEXEME_TYPE_TERMINAL: 1,
            LEXEME_TYPE_NONTERMINAL: 2,

            grammarTokenizer: GrammarTokenizer,

            root: '{Root}',
            tokenIdGen: 0,
            symbolIdGen: 0,
            grammar: void(0),
            symbols: void(0),
            tokens: void(0),
            tokenizer: void(0),

            constructor: function () {
                this.tokenizer = new Tokenizer();
                this.$super(arguments);
            },

            onReset: function () {
                this.$super(arguments);
                this.tokenizer.provider.reset();
                this.grammar = {};
                this.symbols = {};
                this.tokens = [];
                this.symbolIdGen = 0;
                this.tokenIdGen = 0;
            },

            onAdd: function (ref, pattern, returnMatch) {
                var grammarTokenizer = this.grammarTokenizer,
                    TERMINAL = this.LEXEME_TYPE_TERMINAL,
                    NONTERMINAL = this.LEXEME_TYPE_NONTERMINAL,

                    start = null,
                    names = [],
                    nl = 0;

                var token, ended, value, nextIndex, current, lexeme;

                grammarTokenizer.set(pattern.source);

                nextIndex = 0;
                current = start;

                for (; token = grammarTokenizer.find(nextIndex);) {

                    ended = token[3];
                    nextIndex = token[2];
                    value = token[1];
                    token = token[0];

                    switch (token) {
                    case 'Token':
                    case 'NonTerminal':
                        lexeme = this.createLexeme(value,
                                            token === 'Token' ?
                                                TERMINAL : NONTERMINAL
                                        );

                        if (!start) {
                            start = current = lexeme;
                        }
                        else {
                            lexeme.before = current;
                            lexeme.index = current.index + 1;
                            current = current.next = lexeme;
                        }
                        names[nl++] = lexeme.name;
                        break;

                    case 'Alternative':
                        this.createRule(ref, start, names);
                        start = current = null;
                        names = [];
                        nl = 0;
                        break;
                    }
                    if (ended) {
                        this.createRule(ref, start, names);
                    }
                }

            },

            onDefine: function () {
                var tokens = this.tokens,
                    l = tokens.length,
                    root = this.root,
                    grammar = this.grammar;

                // define tokens
                if (l) {
                    this.tokenizer.define(tokens, false);
                    tokens.splice(0, l);
                }

                if (root in grammar) {
                    this.onDefineStates(root);
                }

            },

            onDefineStates: function (rules) {
                // define states

            },

            setRoot: function (root) {
                var grammar = this.grammar;
                if (root && typeof root === 'string') {
                    this.root = root = '{' + root  + '}';
                    if (this.defined && root in grammar) {
                        this.onDefineStates(root);
                    }
                }
                return this;
            },

            createLexeme: function (value, type) {
                var symbols = this.symbols,
                    terminal = type === this.LEXEME_TYPE_TERMINAL,
                    access = terminal ? ':' + value : '{' + value + '}';

                var symbol;

                if (access in symbols) {
                    symbol = symbols[access];
                }
                else {
                    symbol = terminal ?
                                'token' + (++this.symbolIdGen) : access;
                    symbols[access] = symbol;
                }

                return {
                    type: type,
                    name: symbol,
                    value: value,
                    index: 0,
                    before: null,
                    next: null
                };
            },

            createRule: function (name, lexemes, names) {
                var grammar = this.grammar,
                    access = '{' + name + '}';

                var rule, rules, tokens, tl, lexeme, index;

                rule = {
                    name: name,
                    lexemes: lexemes,
                    next: null
                };

                if (access in grammar) {
                    rules = grammar[access];
                    rules.last = rules.last.next = rule;

                }
                else {
                    grammar[access] = rules = {
                        rule: rule,
                        last: rule
                    };

                }

                // register tokens and lexical name access
                tokens = this.tokens;
                tl = tokens.length;

                for (lexeme = lexemes; lexeme; lexeme = lexeme.next) {

                    index = lexeme.index;
                    names.splice(index, 0, '.');
                    lexeme.lexicalId = names.join(':');
                    names.splice(index, 1);

                    if (lexeme.type === this.LEXEME_TYPE_TERMINAL) {
                        tokens[tl++] = lexeme.name;
                        tokens[tl++] = new RegExp(lexeme.value);
                    }
                }

            }

        });
    });
