import fs from "node:fs";
import ObjectUtil from "./ObjectUtil";

export default class Database {
  static fs = class DatabaseFileSystem {
    static targetFile = "./data/General.json";
    
    static async read(): Promise<Object> {
      return JSON.parse((await fs.promises.readFile(this.targetFile)).toString());
    }

    static async write(data: Object) {
      return fs.promises.writeFile(this.targetFile, JSON.stringify(data, null, 4));
    }
  }

  static async get(path: string) {
    let data = await this.fs.read();

    return ObjectUtil.query(data, path.split("."));
  }

  static async appendToArray(path: string, value: any) {
    const keys = path.split(".");

    let data = await this.fs.read();

    let arr = ObjectUtil.query(data, keys);
    if (!(arr instanceof Array)) 
      throw new TypeError("Try to append to non-array.");
    arr.push(value);
    
    this.fs.write(ObjectUtil.set(data, keys, arr));
  }

  static async removeFromArrayIf(path: string, predicate: (value: any, index?: number, array?: Array<any>) => boolean) {
    const keys = path.split(".");

    let data = await this.fs.read();

    let arr = ObjectUtil.query(data, keys);
    if (!(arr instanceof Array)) 
      throw new TypeError("Try to delete from to non-array.");
    arr = arr.filter((...params) => !predicate(...params));
    
    this.fs.write(ObjectUtil.set(data, keys, arr));
  }
}
