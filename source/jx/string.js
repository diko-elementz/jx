'use strict';


Jx('jxClass',
    function (Class) {

        var PRINTABLES = /[\u0020-\u007E]/,
            J = Jx;

        this.exports = Class.singleton({

            'regexEscape': function (str) {
                return this.strEscape(str);
            },

            'strEscape': function (str, characterSets) {
                var l = str.length,
                    encoded = [],
                    S = String;

                var code, escaped, chr, len, l, encoded, set;

                if (typeof str === 'string') {

                    if (!J.isObject(characterSets)) {
                        characterSets = {};
                    }

                    for (; l--;) {
                        code = str.charCodeAt(l);
                        if (code in characterSets) {
                            set = characterSets[code];
                            escaped = set[0];
                            chr = set[1];
                        }
                        else {
                            switch (code) {
                            case 0: escaped = '\\'; chr = '0'; break;
                            case 8: escaped = '\\'; chr = 'b'; break;
                            case 9: escaped = '\\'; chr = 't'; break;
                            case 10: escaped = '\\'; chr = 'n'; break;
                            case 11: escaped = '\\'; chr = 'v'; break;
                            case 12: escaped = '\\'; chr = 'f'; break;
                            case 13: escaped = '\\'; chr = 'r'; break;
                            case 34: escaped = '\\'; chr = '"'; break;
                            case 39: escaped = '\\'; chr = "'"; break;
                            case 92: escaped = '\\'; chr = '\\'; break;
                            default:
                                if (code > 31 && code < 127) {
                                    escaped = '';
                                    chr = S.fromCharCode(code);
                                }
                                else {
                                    escaped = '\\u';
                                    chr = code.toString(16);
                                    len = 4 - chr.length;
                                    for (; len--;) {
                                        escaped += '0';
                                    }
                                }
                            }
                        }
                        encoded[l] = escaped + chr;
                    }
                    return encoded.join('');
                }

                return '';

            },

            'trim': function (str) {
            },

            'pad': function (str, pad, limit) {
                var len;

                if (typeof str === 'string' &&
                    typeof pad === 'string') {

                    if (typeof limit === 'number' &&
                        isFinite(limit) && limit > 0) {



                    }

                    return pad + str;

                }
                return '';
            }

        });

    });
