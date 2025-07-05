export default class MakiFile {
  constructor(data) {
    this._arr = new Uint8Array(data);
    this._i = 0;
  }
  isEof() {
    return this._i == this._arr.length;
  }
  readInt32LE() {
    const offset = this._i >>> 0;
    this._i += 4;
    return this._arr[offset] | this._arr[offset + 1] << 8 | this._arr[offset + 2] << 16 | this._arr[offset + 3] << 24;
  }
  readUInt32LE() {
    const int = this.peekUInt32LE();
    this._i += 4;
    return int;
  }
  peekUInt32LE() {
    const offset = this._i >>> 0;
    return (this._arr[offset] | this._arr[offset + 1] << 8 | this._arr[offset + 2] << 16) + this._arr[offset + 3] * 16777216;
  }
  readUInt16LE() {
    const offset = this._i >>> 0;
    this._i += 2;
    return this._arr[offset] | this._arr[offset + 1] << 8;
  }
  readUInt8() {
    const int = this._arr[this._i];
    this._i++;
    return int;
  }
  readStringOfLength(length) {
    let ret = "";
    const end = Math.min(this._arr.length, this._i + length);
    const buffer = this._arr.slice(this._i, end);
    ret = new TextDecoder().decode(buffer);
    this._i += length;
    return ret;
  }
  readString() {
    return this.readStringOfLength(this.readUInt16LE());
  }
  getPosition() {
    return this._i;
  }
}
