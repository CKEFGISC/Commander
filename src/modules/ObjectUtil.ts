export default class ObjectUtil {
  static make(keys: Array<string>, value: any): Object {
    let result: any = {};

    let current = result;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (i === keys.length - 1) {
        // Last key, set the value
        current[key] = value;
      } else {
        // Create an empty object for the current key
        current[key] = {};
        // Move to the next level
        current = current[key];
      }
    }

    return result;
  }

  static query(obj: Object, keys: Array<string>): any {
    let result = obj;

    for (const key of keys) {
      if (result && typeof result === "object" && key in result) {
        result = result[key];
      }
      else {
        return undefined;
      }
    }

    return result;
  }

  static set(obj: Object, keys: Array<string>, value: any): Object {
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    return obj;
  }

  static concat(obj1: Object, obj2: Object): Object {
    function isObject(obj: Object): boolean {
      return typeof obj === "object" && obj !== null && !(obj instanceof Date) && !(obj instanceof Array)
    }
    const result = { ...obj1 };

    for (const key in obj2) {
      if (obj2.hasOwnProperty(key)) {
        if (isObject(result[key]) && isObject(obj2[key])) {
          result[key] = this.concat(result[key], obj2[key]); // Recursively merge nested objects
        } else {
          result[key] = obj2[key]; // Override or add properties
        }
      }
    }

    return result;
  }
}
