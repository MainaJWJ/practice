import { c as createCommonjsModule, a as commonjsGlobal } from './common/_commonjsHelpers-4f955397.js';
import { u as utils, g as genres, v as v2parser } from './common/v2parser-d130ad23.js';

var v1parser = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });


var V1_MIN_LENGTH = 128;
/**
 * Parse ID3v1 metadata from binary bytes.
 * @description
 * ID3v1 tag occupies 128 bytes, beginning with the string TAG 128 bytes
 * from the end of the file.
 *
 * And the format is like: header(3) + title(30) + artist(30) +
 * album(30) + year(4) + comment(30) + genre(1).
 *
 * And extended tag is only supported by few programs, so we ignore it.
 * @param bytes binary bytes.
 */
function parseV1Data(bytes) {
    if (!bytes || bytes.length < V1_MIN_LENGTH) {
        return false;
    }
    bytes = bytes.slice(bytes.length - V1_MIN_LENGTH);
    var tags = {
        version: {
            major: 1,
            minor: 0,
        },
    };
    var flag = utils.readBytesToUTF8(bytes, 3);
    if (flag !== 'TAG') {
        return false;
    }
    // Strings are either space- or zero-padded. So remove them.
    var reWhiteSpace = /(^[\s0]+|[\s0]+$)/;
    tags.title = utils.readBytesToUTF8(bytes.slice(3), 30).replace(reWhiteSpace, '');
    tags.artist = utils.readBytesToUTF8(bytes.slice(33), 30).replace(reWhiteSpace, '');
    tags.album = utils.readBytesToUTF8(bytes.slice(63), 30).replace(reWhiteSpace, '');
    tags.year = utils.readBytesToUTF8(bytes.slice(93), 4).replace(reWhiteSpace, '');
    // If there is a zero byte at [125], the comment is 28 bytes and the remaining 2 are [0, trackno]
    if (bytes[125] === 0) {
        tags.comments = utils.readBytesToUTF8(bytes.slice(97), 28).replace(reWhiteSpace, '');
        tags.version.minor = 1;
        tags.track = bytes[126];
    }
    else {
        tags.comments = utils.readBytesToUTF8(bytes.slice(97), 30).replace(reWhiteSpace, '');
    }
    tags.genre = genres.default[bytes[127]] || '';
    return tags;
}
exports.default = parseV1Data;
});

var polyfill_1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
function polyfill() {
    // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.slice
    if (typeof Uint8Array === 'function' && !Uint8Array.prototype.slice) {
        Object.defineProperty(Uint8Array.prototype, 'slice', {
            value: Array.prototype.slice,
        });
    }
}
exports.default = polyfill;
});

var lib = createCommonjsModule(function (module, exports) {
var __assign = (commonjsGlobal && commonjsGlobal.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __rest = (commonjsGlobal && commonjsGlobal.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });

exports.parseV1Tag = v1parser.default;

exports.parseV2Tag = v2parser.default;

polyfill_1.default(); // do polyfill.
function parse(bytes) {
    var v1data = v1parser.default(bytes);
    var v2data = v2parser.default(bytes);
    if (!v2data && !v1data) {
        return false;
    }
    var defaultValue = { version: false };
    var _a = v2data || defaultValue, v2 = _a.version, v2meta = __rest(_a, ["version"]);
    var _b = v1data || defaultValue, v1 = _b.version, v1meta = __rest(_b, ["version"]);
    var result = __assign({ version: {
            v1: v1,
            v2: v2,
        } }, v1meta, v2meta);
    /* tslint:disable:no-any */
    if (v1meta.comments) {
        result.comments = [{
                value: v1meta.comments,
            }].concat((v2meta && v2meta.comments) ? v2meta.comments : []);
    }
    /* tslint:enable:no-any */
    return result;
}
exports.parse = parse;
});

var parseV1Tag = lib.parseV1Tag;
var parseV2Tag = lib.parseV2Tag;
export { parseV1Tag, parseV2Tag };
