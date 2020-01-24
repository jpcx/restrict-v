import { Conditional, PassthroughValidator, RestrictionTarget, Schema } from "./types";
export interface Restriction<T extends RestrictionTarget> extends Function, PassthroughValidator<T> {
    message: string;
    or<U>(message: string, ...conditionals: Array<Conditional<U>>): Restriction<T | U>;
    or<U>(message: string, ...schemas: Array<Schema<U>>): Restriction<T | U>;
    or<U>(message: string, ...conditionalsOrSchemas: Array<Conditional<U> | Schema<U>>): Restriction<T | U>;
    or<U>(...conditionals: Array<Conditional<U>>): Restriction<T | U>;
    or<U>(...schemas: Array<Schema<U>>): Restriction<T | U>;
    or<U>(...conditionalsOrSchemas: Array<Conditional<U> | Schema<U>>): Restriction<T | U>;
    and<U>(message: string, ...conditionals: Array<Conditional<U>>): Restriction<T & U>;
    and<U>(message: string, ...schemas: Array<Schema<U>>): Restriction<T & U>;
    and<U>(message: string, ...conditionalsOrSchemas: Array<Conditional<U> | Schema<U>>): Restriction<T & U>;
    and<U>(...conditionals: Array<Conditional<U>>): Restriction<T & U>;
    and<U>(...schemas: Array<Schema<U>>): Restriction<T & U>;
    and<U>(...conditionalsOrSchemas: Array<Conditional<U> | Schema<U>>): Restriction<T & U>;
    msg(message: string): Restriction<T>;
}
export declare class Restriction<T extends RestrictionTarget> extends Function {
    constructor(message: string, ...conditionals: Array<Conditional<T>>);
    constructor(message: string, ...schemas: Array<Schema<T>>);
    constructor(message: string, ...conditionalsOrSchemas: Array<Conditional<T> | Schema<T>>);
    constructor(...conditionals: Array<Conditional<T>>);
    constructor(...schemas: Array<Schema<T>>);
    constructor(...conditionalsOrSchemas: Array<Conditional<T> | Schema<T>>);
}
