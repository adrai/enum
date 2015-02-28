export const isType = (type, value) => typeof value === type;
export const isObject = (value) => isType("object", value);
export const isString = (value) => isType("string", value);
