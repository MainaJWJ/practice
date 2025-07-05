import { c as createCommonjsModule } from './_commonjsHelpers-4f955397.js';

var genres = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = [
    'Blues',
    'Classic Rock',
    'Country',
    'Dance',
    'Disco',
    'Funk',
    'Grunge',
    'Hip-Hop',
    'Jazz',
    'Metal',
    'New Age',
    'Oldies',
    'Other',
    'Pop',
    'R&B',
    'Rap',
    'Reggae',
    'Rock',
    'Techno',
    'Industrial',
    'Alternative',
    'Ska',
    'Death Metal',
    'Pranks',
    'Soundtrack',
    'Euro-Techno',
    'Ambient',
    'Trip-Hop',
    'Vocal',
    'Jazz+Funk',
    'Fusion',
    'Trance',
    'Classical',
    'Instrumental',
    'Acid',
    'House',
    'Game',
    'Sound Clip',
    'Gospel',
    'Noise',
    'AlternRock',
    'Bass',
    'Soul',
    'Punk',
    'Space',
    'Meditative',
    'Instrumental Pop',
    'Instrumental Rock',
    'Ethnic',
    'Gothic',
    'Darkwave',
    'Techno-Industrial',
    'Electronic',
    'Pop-Folk',
    'Eurodance',
    'Dream',
    'Southern Rock',
    'Comedy',
    'Cult',
    'Gangsta Rap',
    'Top 40',
    'Christian Rap',
    'Pop / Funk',
    'Jungle',
    'Native American',
    'Cabaret',
    'New Wave',
    'Psychedelic',
    'Rave',
    'Showtunes',
    'Trailer',
    'Lo-Fi',
    'Tribal',
    'Acid Punk',
    'Acid Jazz',
    'Polka',
    'Retro',
    'Musical',
    'Rock & Roll',
    'Hard Rock',
    'Folk',
    'Folk-Rock',
    'National Folk',
    'Swing',
    'Fast  Fusion',
    'Bebob',
    'Latin',
    'Revival',
    'Celtic',
    'Bluegrass',
    'Avantgarde',
    'Gothic Rock',
    'Progressive Rock',
    'Psychedelic Rock',
    'Symphonic Rock',
    'Slow Rock',
    'Big Band',
    'Chorus',
    'Easy Listening',
    'Acoustic',
    'Humour',
    'Speech',
    'Chanson',
    'Opera',
    'Chamber Music',
    'Sonata',
    'Symphony',
    'Booty Bass',
    'Primus',
    'Porn Groove',
    'Satire',
    'Slow Jam',
    'Club',
    'Tango',
    'Samba',
    'Folklore',
    'Ballad',
    'Power Ballad',
    'Rhythmic Soul',
    'Freestyle',
    'Duet',
    'Punk Rock',
    'Drum Solo',
    'A Cappella',
    'Euro-House',
    'Dance Hall',
    'Goa',
    'Drum & Bass',
    'Club-House',
    'Hardcore',
    'Terror',
    'Indie',
    'BritPop',
    'Negerpunk',
    'Polsk Punk',
    'Beat',
    'Christian Gangsta Rap',
    'Heavy Metal',
    'Black Metal',
    'Crossover',
    'Contemporary Christian',
    'Christian Rock',
    'Merengue',
    'Salsa',
    'Thrash Metal',
    'Anime',
    'JPop',
    'Synthpop',
    'Rock/Pop',
];
});

var utils = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
var toStr = String.fromCharCode;
/**
 * Convert utf8 bytes to string.
 * @description
 * According to utf8 spec, char is encoded to [1,4] byte.
 * 1. 1 byte, 0 - 0x7f, the same as Ascii chars.
 * 2. 2 bytes, 110xxxxx 10xxxxxx.
 * 3. 3 bytes, 1110xxxx 10xxxxxx 10xxxxxx.
 * 4. 4 bytes, 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx.
 * For 2-4 bytes, remove leading 10/110/1110/11110 and get final codepoint.
 * @param bytes Utf8 binary bytes, usually array of numbers.
 * @param maxToRead Max number of bytes to read.
 */
function readBytesToUTF8(bytes, maxToRead) {
    if (maxToRead == null || maxToRead < 0) {
        maxToRead = bytes.length;
    }
    else {
        maxToRead = Math.min(maxToRead, bytes.length);
    }
    var index = 0;
    // Process BOM(Byte order mark).
    if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
        index = 3;
    }
    var arr = [];
    // Continue to insert string to arr until processed bytes' length reach max.
    for (var i = 0; index < maxToRead; i++) {
        var byte1 = bytes[index++];
        var byte2 = void 0;
        var byte3 = void 0;
        var byte4 = void 0;
        var codepoint = void 0;
        // End flag.
        if (byte1 === 0x00) {
            break;
        }
        else if (byte1 < 0x80) {
            arr[i] = toStr(byte1);
        }
        else if (byte1 >= 0xC2 && byte1 < 0xE0) {
            byte2 = bytes[index++];
            arr[i] = toStr(((byte1 & 0x1F) << 6) + (byte2 & 0x3F));
        }
        else if (byte1 >= 0xE0 && byte1 < 0xF0) {
            byte2 = bytes[index++];
            byte3 = bytes[index++];
            arr[i] = toStr(((byte1 & 0x0F) << 12) + ((byte2 & 0x3F) << 6) + (byte3 & 0x3F));
        }
        else if (byte1 >= 0xF0 && byte1 < 0xF5) {
            byte2 = bytes[index++];
            byte3 = bytes[index++];
            byte4 = bytes[index++];
            // See <https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae>
            codepoint = ((byte1 & 0x07) << 18) +
                ((byte2 & 0x3F) << 12) +
                ((byte3 & 0x3F) << 6) +
                (byte4 & 0x3F) - 0x10000;
            // Invoke String.fromCharCode(H, L) to get correct char.
            arr[i] = toStr((codepoint >> 10) + 0xD800, (codepoint & 0x3FF) + 0xDC00);
        }
    }
    return arr.join('');
}
exports.readBytesToUTF8 = readBytesToUTF8;
/**
 * Convert utf16 bytes to string.
 * @description
 * Utf16 represents char with one or two 16-bit code units per code point.
 * 1. Range 0 - 0xFFFF (i.e. the BMP), can be represented with one 16-bit.
 * 2. Range 0x10000 - 0x10FFFF (i.e. outside the BMP), can only be encoded using two 16-bit code units.
 *
 * The two 16-bit is called a surrogate pair.
 * - The first code unit of a surrogate pair is always in the range from 0xD800 to 0xDBFF,
 *   and is called a high surrogate or a lead surrogate.
 * - The second code unit of a surrogate pair is always in the range from 0xDC00 to 0xDFFF,
 *   and is called a low surrogate or a trail surrogate.
 *
 * A codepoint `C` greater than 0xFFFF corresponds to a surrogate pair <H, L>:
 * H = Math.floor((C - 0x10000) / 0x400) + 0xD800
 * L = (C - 0x10000) % 0x400 + 0xDC00
 * C = (H - 0xD800) * 0x400 + L - 0xDC00 + 0x10000
 * @param bytes Utf16 binary bytes, usually array of numbers.
 * @param isBigEndian Specify whether utf16 bytes big-endian or little-endian.
 * @param maxToRead Max number of bytes to read.
 */
function readBytesToUTF16(bytes, isBigEndian, maxToRead) {
    if (maxToRead == null || maxToRead < 0) {
        maxToRead = bytes.length;
    }
    else {
        maxToRead = Math.min(maxToRead, bytes.length);
    }
    var index = 0;
    var offset1 = 1;
    var offset2 = 0;
    // Check BOM and set isBigEndian.
    if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
        isBigEndian = true;
        index = 2;
    }
    else if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
        isBigEndian = false;
        index = 2;
    }
    if (isBigEndian) {
        offset1 = 0;
        offset2 = 1;
    }
    var arr = [];
    var byte1;
    var byte2;
    var word1;
    var word2;
    var byte3;
    var byte4;
    for (var i = 0; index < maxToRead; i++) {
        // Set high/low 8 bit corresponding to LE/BE.
        byte1 = bytes[index + offset1];
        byte2 = bytes[index + offset2];
        // Get first 16 bits' value.
        word1 = (byte1 << 8) + byte2;
        index += 2;
        // If 16 bits are all 0, means end.
        if (word1 === 0x0000) {
            break;
        }
        else if (byte1 < 0xD8 || byte1 >= 0xE0) {
            arr[i] = toStr(word1);
        }
        else {
            // Get next 16 bits.
            byte3 = bytes[index + offset1];
            byte4 = bytes[index + offset2];
            word2 = (byte3 << 8) + byte4;
            index += 2;
            // Then invoke String.fromCharCode(H, L) to get correct char.
            arr[i] = toStr(word1, word2);
        }
    }
    return arr.join('');
}
exports.readBytesToUTF16 = readBytesToUTF16;
function readBytesToISO8859(bytes, maxToRead) {
    if (maxToRead == null || maxToRead < 0) {
        maxToRead = bytes.length;
    }
    else {
        maxToRead = Math.min(maxToRead, bytes.length);
    }
    var arr = [];
    for (var i = 0; i < maxToRead; i++) {
        arr.push(toStr(bytes[i]));
    }
    return arr.join('');
}
exports.readBytesToISO8859 = readBytesToISO8859;
/**
 * Convert bytes to string according to encoding.
 * @param bytes Binary bytes.
 * @param encoding id3v2 tag encoding, always 0/1/2/3.
 * @param maxToRead Max number of bytes to read.
 */
function readBytesToString(bytes, encoding, maxToRead) {
    if (encoding === 0) {
        return readBytesToISO8859(bytes, maxToRead);
    }
    else if (encoding === 3) {
        return readBytesToUTF8(bytes, maxToRead);
    }
    else if (encoding === 1 || encoding === 2) {
        return readBytesToUTF16(bytes, undefined, maxToRead);
    }
    else {
        return null;
    }
}
exports.readBytesToString = readBytesToString;
function getEndpointOfBytes(bytes, encoding, start) {
    if (start === void 0) { start = 0; }
    // ISO-8859 use $00 as end flag, and
    // unicode use $00 00 as end flag.
    var checker = encoding === 0
        ? function (index) { return bytes[index] === 0; }
        : function (index) { return (bytes[index] === 0 && bytes[index + 1] === 0); };
    var i = start;
    for (; i < bytes.length; i++) {
        if (checker(i)) {
            break;
        }
    }
    return i;
}
exports.getEndpointOfBytes = getEndpointOfBytes;
function skipPaddingZeros(bytes, start) {
    for (var i = start;; i++) {
        if (bytes[i] === 0) {
            start++;
        }
        else {
            break;
        }
    }
    return start;
}
exports.skipPaddingZeros = skipPaddingZeros;
});

var frameTypes = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
var FRAME_TYPES = {
    /*
     * Textual frames
     */
    TALB: 'album',
    TBPM: 'bpm',
    TCOM: 'composer',
    TCON: 'genre',
    TCOP: 'copyright',
    TDEN: 'encoding-time',
    TDLY: 'playlist-delay',
    TDOR: 'original-release-time',
    TDRC: 'recording-time',
    TDRL: 'release-time',
    TDTG: 'tagging-time',
    TENC: 'encoder',
    TEXT: 'writer',
    TFLT: 'file-type',
    TIPL: 'involved-people',
    TIT1: 'content-group',
    TIT2: 'title',
    TIT3: 'subtitle',
    TKEY: 'initial-key',
    TLAN: 'language',
    TLEN: 'length',
    TMCL: 'credits',
    TMED: 'media-type',
    TMOO: 'mood',
    TOAL: 'original-album',
    TOFN: 'original-filename',
    TOLY: 'original-writer',
    TOPE: 'original-artist',
    TOWN: 'owner',
    TPE1: 'artist',
    TPE2: 'band',
    TPE3: 'conductor',
    TPE4: 'remixer',
    TPOS: 'set-part',
    TPRO: 'produced-notice',
    TPUB: 'publisher',
    TRCK: 'track',
    TRSN: 'radio-name',
    TRSO: 'radio-owner',
    TSOA: 'album-sort',
    TSOP: 'performer-sort',
    TSOT: 'title-sort',
    TSRC: 'isrc',
    TSSE: 'encoder-settings',
    TSST: 'set-subtitle',
    TXXX: 'user-defined-text-information',
    TYER: 'year',
    /*
     * URL frames
     */
    WCOM: 'url-commercial',
    WCOP: 'url-legal',
    WOAF: 'url-file',
    WOAR: 'url-artist',
    WOAS: 'url-source',
    WORS: 'url-radio',
    WPAY: 'url-payment',
    WPUB: 'url-publisher',
    /*
     * URL frames (<=2.2)
     */
    WAF: 'url-file',
    WAR: 'url-artist',
    WAS: 'url-source',
    WCM: 'url-commercial',
    WCP: 'url-copyright',
    WPB: 'url-publisher',
    /*
     * Comment frame
     */
    COMM: 'comments',
    USLT: 'lyrics',
    /*
     * Image frame
     */
    APIC: 'image',
    PIC: 'image',
    /**
     * User/owner/involved people frame
     */
    IPLS: 'involved-people-list',
    OWNE: 'ownership',
};
exports.default = FRAME_TYPES;
// Frame type to value map.
exports.FrameTypeValueMap = {
    TXXX: 'array',
    COMM: 'array',
    USLT: 'array',
};
});

var imageTypes = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = [
    'other',
    'file-icon',
    'icon',
    'cover-front',
    'cover-back',
    'leaflet',
    'media',
    'artist-lead',
    'artist',
    'conductor',
    'band',
    'composer',
    'lyricist-writer',
    'recording-location',
    'during-recording',
    'during-performance',
    'screen',
    'fish',
    'illustration',
    'logo-band',
    'logo-publisher',
];
});

var v2parser = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });




var V2_MIN_LENGTH = 20; // TAG HEADER(10) + ONE FRAME HEADER(10)
function parseV2Data(bytes) {
    if (!bytes || bytes.length < V2_MIN_LENGTH) {
        return false;
    }
    var tags = parseV2Header(bytes.slice(0, 10));
    if (!tags) {
        return false;
    }
    var flags = tags.version.flags;
    // Currently do not support unsynchronisation
    if (flags.unsync) {
        throw new Error('no support for unsynchronisation');
    }
    var headerSize = 10;
    // Increment the header size if an extended header exists.
    if (flags.xheader) {
        // Usually extended header size is 6 or 10 bytes
        headerSize += calcTagSize(bytes.slice(10, 14));
    }
    var tagSize = calcTagSize(bytes.slice(6, 10));
    parseV2Frames(bytes.slice(headerSize, tagSize + headerSize), tags);
    return tags;
}
exports.default = parseV2Data;
/**
 * Parse ID3v2 tag header.
 * @description
 * A typical ID3v2 tag (header) is like:
 * $49 44 33 yy yy xx zz zz zz zz
 *
 * Where yy is less than $FF, xx is the 'flags' byte and zz is less than $80.
 * @param bytes binary bytes.
 */
function parseV2Header(bytes) {
    if (!bytes || bytes.length < 10) {
        return false;
    }
    var identity = utils.readBytesToUTF8(bytes, 3);
    if (identity !== 'ID3') {
        return false;
    }
    var flagByte = bytes[5];
    var version = {
        major: 2,
        minor: bytes[3],
        revision: bytes[4],
        flags: {
            unsync: (flagByte & 0x80) !== 0,
            xheader: (flagByte & 0x40) !== 0,
            experimental: (flagByte & 0x20) !== 0,
        },
    };
    return { version: version };
}
/**
 * Calculate the total tag size, but excluding the header size(10 bytes).
 * @param bytes binary bytes.
 */
function calcTagSize(bytes) {
    return (bytes[0] & 0x7f) * 0x200000 +
        (bytes[1] & 0x7f) * 0x4000 +
        (bytes[2] & 0x7f) * 0x80 +
        (bytes[3] & 0x7f);
}
exports.calcTagSize = calcTagSize;
/**
 * Calculate frame size (just content size, exclude 10 bytes header size).
 * @param bytes binary bytes.
 */
function calcFrameSize(bytes) {
    return bytes.length < 4 ? 0 : bytes[0] * 0x1000000 +
        bytes[1] * 0x10000 +
        bytes[2] * 0x100 +
        bytes[3];
}
exports.calcFrameSize = calcFrameSize;
function parseV2Frames(bytes, tags) {
    var position = 0;
    var version = tags.version;
    while (position < bytes.length) {
        var size = calcFrameSize(bytes.slice(position + 4));
        // the left data would be '\u0000\u0000...', just a padding
        if (size === 0) {
            break;
        }
        // * < v2.3, frame ID is 3 chars, size is 3 bytes making a total size of 6 bytes
        // * >= v2.3, frame ID is 4 chars, size is 4 bytes, flags are 2 bytes, total 10 bytes
        var slice = bytes.slice(position, position + 10 + size);
        if (!slice.length) {
            break;
        }
        var frame = parseFrame(slice, version.minor, size);
        if (frame.tag) {
            if (frameTypes.FrameTypeValueMap[frame.id] === 'array') {
                if (tags[frame.tag]) {
                    tags[frame.tag].push(frame.value);
                }
                else {
                    tags[frame.tag] = [frame.value];
                }
            }
            else {
                tags[frame.tag] = frame.value;
            }
        }
        position += slice.length;
    }
}
/**
 * Parse id3 frame.
 * @description
 * Declared ID3v2 frames are of different types:
 * 1. Unique file identifier
 * 2. Text information frames
 * 3. ...
 *
 * For frames that allow different types of text encoding, the first byte after header (bytes[10])
 * represents encoding. Its value is of:
 * 1. 00 <---> ISO-8859-1 (ASCII), default encoding, represented as <text string>/<full text string>
 * 2. 01 <---> UCS-2 encoded Unicode with BOM.
 * 3. 02 <---> UTF-16BE encoded Unicode without BOM.
 * 4. 03 <---> UTF-8 encoded Unicode.
 *
 * And 2-4 represented as <text string according to encoding>/<full text string according to encoding>
 * @param bytes Binary bytes.
 * @param minor Minor version, 2/3/4
 * @param size Frame size.
 */
function parseFrame(bytes, minor, size) {
    var result = {
        id: null,
        tag: null,
        value: null,
    };
    var header = {
        id: utils.readBytesToUTF8(bytes, 4),
        type: null,
        size: size,
        flags: [
            bytes[8],
            bytes[9],
        ],
    };
    header.type = header.id[0];
    result.id = header.id;
    // No support for compressed, unsychronised, etc frames
    if (header.flags[1] !== 0) {
        return result;
    }
    if (!(header.id in frameTypes.default)) {
        return result;
    }
    result.tag = frameTypes.default[header.id];
    var encoding = 0;
    var variableStart = 0;
    var variableLength = 0;
    var i = 0;
    /**
     * Text information frames, structure is:
     * <Header for 'Text information frame', ID: "T000" - "TZZZ", excluding "TXXX">
     * Text encoding    $xx
     * Information    <text string according to encoding>
     */
    if (header.type === 'T') {
        encoding = bytes[10];
        // If is User defined text information frame (TXXX), then we should handle specially.
        // <Header for 'User defined text information frame', ID: "TXXX" >
        // Text encoding    $xx
        // Description < text string according to encoding > $00(00)
        // Value < text string according to encoding >
        if (header.id === 'TXXX') {
            variableStart = 11;
            variableLength = utils.getEndpointOfBytes(bytes, encoding, variableStart) - variableStart;
            var value = {
                description: utils.readBytesToString(bytes.slice(variableStart), encoding, variableLength),
                value: '',
            };
            variableStart += variableLength + 1;
            variableStart = utils.skipPaddingZeros(bytes, variableStart);
            value.value = utils.readBytesToString(bytes.slice(variableStart), encoding);
            result.value = value;
        }
        else {
            result.value = utils.readBytesToString(bytes.slice(11), encoding);
            // Specially handle the 'Content type'.
            if (header.id === 'TCON' && result.value !== null) {
                if (result.value[0] === '(') {
                    var handledTCON = result.value.match(/\(\d+\)/g);
                    if (handledTCON) {
                        result.value = handledTCON.map(function (v) { return genres.default[+v.slice(1, -1)]; }).join(',');
                    }
                }
                else {
                    var genre = parseInt(result.value, 10);
                    if (!isNaN(genre)) {
                        result.value = genres.default[genre];
                    }
                }
            }
        }
    }
    else if (header.type === 'W') {
        // User defined URL link frame
        if (header.id === 'WXXX' && bytes[10] === 0) {
            result.value = utils.readBytesToISO8859(bytes.slice(11));
        }
        else {
            result.value = utils.readBytesToISO8859(bytes.slice(10));
        }
    }
    else if (header.id === 'COMM' || header.id === 'USLT') {
        encoding = bytes[10];
        variableStart = 14;
        variableLength = 0;
        var language = utils.readBytesToISO8859(bytes.slice(11), 3);
        variableLength = utils.getEndpointOfBytes(bytes, encoding, variableStart) - variableStart;
        var description = utils.readBytesToString(bytes.slice(variableStart), encoding, variableLength);
        variableStart = utils.skipPaddingZeros(bytes, variableStart + variableLength + 1);
        result.value = {
            language: language,
            description: description,
            value: utils.readBytesToString(bytes.slice(variableStart), encoding),
        };
    }
    else if (header.id === 'APIC') {
        encoding = bytes[10];
        var image = {
            type: null,
            mime: null,
            description: null,
            data: null,
        };
        variableStart = 11;
        // MIME is always encoded as ISO-8859, So always pass 0 to encoding argument.
        variableLength = utils.getEndpointOfBytes(bytes, 0, variableStart) - variableStart;
        image.mime = utils.readBytesToString(bytes.slice(variableStart), 0, variableLength);
        image.type = imageTypes.default[bytes[variableStart + variableLength + 1]] || 'other';
        // Skip $00 and $xx(Picture type).
        variableStart += variableLength + 2;
        variableLength = 0;
        for (i = variableStart;; i++) {
            if (bytes[i] === 0) {
                variableLength = i - variableStart;
                break;
            }
        }
        image.description = variableLength === 0
            ? null
            : utils.readBytesToString(bytes.slice(variableStart), encoding, variableLength);
        // check $00 at start of the image binary data
        variableStart = utils.skipPaddingZeros(bytes, variableStart + variableLength + 1);
        image.data = bytes.slice(variableStart);
        result.value = image;
    }
    else if (header.id === 'IPLS') {
        encoding = bytes[10];
        result.value = utils.readBytesToString(bytes.slice(11), encoding);
    }
    else if (header.id === 'OWNE') {
        encoding = bytes[10];
        variableStart = 11;
        variableLength = utils.getEndpointOfBytes(bytes, encoding, variableStart);
        var pricePayed = utils.readBytesToISO8859(bytes.slice(variableStart), variableLength);
        variableStart += variableLength + 1;
        var dateOfPurch = utils.readBytesToISO8859(bytes.slice(variableStart), 8);
        variableStart += 8;
        result.value = {
            pricePayed: pricePayed,
            dateOfPurch: dateOfPurch,
            seller: utils.readBytesToString(bytes.slice(variableStart), encoding),
        };
    }
    else ;
    return result;
}
});

export { genres as g, utils as u, v2parser as v };
