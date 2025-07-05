export const V = {
  newInt(value) {
    return {type: "INT", value: Number(value)};
  },
  newBool(value) {
    return {type: "BOOLEAN", value: value ? 1 : 0};
  }
};
