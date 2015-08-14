
Jx('jxClass', function (Class) {

    var NOT_HEX_RE = /[^0-9a-f]/i,
        RANGE_RE = /^([0-9]+|[0-9]*\,[0-9]+|[0-9]+\,[0-9]*)$/,
        CTRL_CHAR_SEQUENCE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        CTRL_CHAR = {
                '0': '\0',
                'n': '\n',
                'r': '\r',
                't': '\t',
                'b': '\b',
                'f': '\f'
            },
        OPERAND_START_TOKENS = {
                'literal': true,
                'ref': true,
                '[]': true,
                '[^]': true,
                'wildcard': true,
                '?': true,
                '*': true,
                '+': true,
                '{}': true,
                ')': true
            },
        OPERAND_END_TOKENS = {
                'literal': true,
                'ref': true,
                '[]': true,
                '[^]': true,
                'wildcard': true,
                '[': true,
                '(': true
            },
        OPERATOR_PRECEDENCE = {
                '(': 0,
                ')': 0,
                '.': 1,
                '|': 2,
                '?': 3,
                '*': 3,
                '+': 3,
                '{}': 3
            };

    function escapeFrom(at, subject) {
        var S = String,
            chr = subject.charAt(at++),
            len = 1,
            str = '';
        var index;
        switch (chr) {
        // control
        case 'c':
            chr = subject.charAt(at++).toUpperCase();
            index = CTRL_CHAR_SEQUENCE.indexOf(chr);
            if (index == -1) {
                str = 'c';
            }
            else {
                str = S.fromCharCode(index + 1);
                len++;
            }
            break;
        case '0':
        case 'n':
        case 'r':
        case 't':
        case 'b':
        case 'f':
            str = CTRL_CHAR[at];
            break;

        // hex
        case 'x':
            chr = subject.substring(at, at + 2);
            len = 3;
            if (NOT_HEX_RE.test(chr)) {
                len = 0;
            }
            else {
                str = S.fromCharCode(parseInt(chr, 16));
            }
            break;
        // utf-8
        case 'u':
            chr = subject.substring(at, at + 4);
            len = 5;
            if (NOT_HEX_RE.test(chr)) {
                len = 0;
            }
            else {
                str = S.fromCharCode(parseInt(chr, 16));
            }
            break;
        // escaped literal
        default:
            str = chr;
        }
        return len ? [str, len] : false;
    }

    this.exports = Class.extend({

        subject: '',
        index: 0,
        error: false,

        ended: false,
        tokens: void(0),
        buffer: void(0),

        stack: void(0),
        queue: void(0),

        constructor: function (subject) {
           if (subject instanceof RegExp) {
              subject = subject.source;
           }
           if (typeof subject == 'string') {
              this.subject = subject;
           }
           this.tokens = [];
           this.buffer = [];
           this.stack = [];
           this.queue = [];
        },

        tokenize: function () {
            var tokens = this.tokens,
                tl = tokens.length,
                buffer = this.buffer,
                bl = buffer.length;

            var subject, chr, str, o, token, strlen, index,
                len, l, strs, stl, to, c;

            if (bl) {

                return tokens[tl++] = buffer.shift();

            }
            else if (!this.ended) { // tokenize
                subject = this.subject;
                len = subject.length;
                index = this.index;
                token = null;
                strlen = 1;
                chr = subject.charAt(index++);

                failed: switch (chr) {
                // escape?
                case '\\':
                    o = escapeFrom(index, subject);
                    if (o) {
                        token = 'literal';
                        str = o[0];
                        strlen += o[1];
                    }
                    else {
                        strlen = 0;
                    }
                    break;

                // operators
                case '|':

                case '?':
                case '*':
                case '+':

                case '(':
                case ')':
                    str = token = chr;
                    break;

                // character sets
                case '[':
                    token = '[]';
                    if (subject.charAt(index + 1) == '^') {
                        token = '[^]';
                        index++;
                        strlen++;
                    }

                    strs = [];
                    stl = 0;
                    c = index;

                    loop: for (l = len - index; l--;) {
                        chr = subject.charAt(index++);
                        strlen ++;
                        switch (chr) {
                        case '\\':
                            o = escapeFrom(index, subject);
                            if (!o) {
                                strlen = 0;
                                break failed;
                            }
                            strs[stl++] = o[0];
                            to = o[1];
                            index += to;
                            l -= to;
                            break;
                        case ']':
                            break loop;
                        default:
                            strs[stl++] = chr;
                        }
                    }
                    strlen = index - c + 1;
                    str = strs.join('');
                    break;

                // character range
                case '{':
                    strs = [];
                    stl = 0;
                    c = index;

                    loop: for (l = len - index; l--;) {
                        chr = subject.charAt(index++);
                        strlen++;
                        switch (chr) {
                        case '\\':
                            o = escapeFrom(index, subject);
                            if (!o) {
                                strlen = 0;
                                break failed;
                            }
                            strs[stl++] = o[0];
                            to = o[1];
                            index += to;
                            l -= to;
                            break;
                        case '}':
                            break loop;
                        default:
                            strs[stl++] = chr;
                        }
                    }
                    strlen = index - c + 1;
                    str = strs.join('');
                    token = RANGE_RE.test(str) ? '{}' : 'ref';
                    break;
                // special chars
                case '.':
                    token = 'wildcard';
                    str = chr;
                    break;
                case '^':
                    token = 'start';
                    str = chr;
                    break;
                case '$':
                    token = 'end';
                    str = chr;
                    break;

                // literals
                default:
                    token = 'literal';
                    str = chr;
                    break;
                }

                if (strlen) {
                    l = this.index;
                    this.index += strlen;
                    this.ended = this.index == len;

                    if (tl) { // append concat to buffer
                        o = tokens[tl - 1];

                        if (o[0] in OPERAND_START_TOKENS &&
                            token in OPERAND_END_TOKENS) {
                            buffer[bl++] = [token, str];
                            token = str = '.';
                        }

                    }

                    if (this.ended) { // append $ token to buffer
                        buffer[bl++] = ['$', ''];
                    }

                    return tokens[tl++] = [token, str];
                }

                this.ended = true;
                return false;
            }

            return void(0);

        },

        next: function () {
            var P = OPERATOR_PRECEDENCE,
                tokens = this.tokens,
                token = void(0),
                lexeme = void(0),
                queue = this.queue,
                ql = queue.length,
                stack = this.stack,
                sl = stack.length,
                error = this.error;

            var precedence, s, found;

            if (!ql && !error && (!this.ended || sl)) {
                loop: for (; token = this.tokenize();) {
                    name = token[0];
                    switch (name) {
                    case '.':
                    case '|':
                    case '?':
                    case '*':
                    case '+':
                    case '{}':
                        token[2] = precedence = P[name];
                        for (; sl--;) {
                            s = stack[sl];
                            if (precedence > s[2]) {
                                break;
                            }
                            queue[ql++] = s;
                        }
                        stack[++sl] = token;
                        stack.length = ++sl;
                        if (ql) {
                            break loop;
                        }
                        else {
                            break;
                        }
                    case '(':
                        token[2] = P[name];
                        stack[sl++] = token;
                        break;
                    case ')':   // find '('
                        found = false;
                        for (; sl--;) {
                            s = stack[sl];
                            if (s[0] == '(') {
                                sl--;
                                found = true;
                                break;
                            }
                            queue[ql++] = s;
                        }
                        if (!found) { // throw error
                            error = this.error = true;
                            break loop;
                        }
                        stack.length = ++sl;
                        queue[ql++] = ['()', '()'];
                        break loop;
                    case '$':   // stop!
                        for (; sl--;) {
                            queue[ql++] = stack[sl];
                        }
                        stack.length = 0;
                        queue[ql++] = token;
                        break loop;
                    default:
                        queue[ql++] = token;
                        break loop;
                    }
                }
            }

            if (!error && ql) {
                return queue.shift();
            }
            return void(0);

        },

        reset: function () {
            var list = this.buffer;
            list.splice(0, list.length);
            list = this.tokens;
            list.splice(0, list.length);

            list = this.stack;
            list.splice(0, list.length);
            list = this.queue;
            list.splice(0, list.length);
            delete this.index;
            delete this.error;
            delete this.ended;
        }

    });

});
