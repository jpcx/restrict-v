import { Restriction } from "./restriction";
export declare type Predicate<T> = (...value: T[]) => boolean;
export declare type Assertion<T> = (...value: T[]) => void;
export interface PassthroughValidator<T> {
    <U extends T>(value: U): U;
    <U extends T[]>(...value: U): U;
}
export declare type ConditionalTarget = any;
export declare type SchemaTarget = {
    [key: string]: any;
} | any[];
export declare type Conditional<T extends ConditionalTarget> = Predicate<T> | Assertion<T> | PassthroughValidator<T> | Restriction<T>;
export declare type SchemaValueType<T extends SchemaTarget> = Conditional<T> | Schema<T>;
export declare type SchemaTargetValueType = any;
export declare type Schema<T extends SchemaTarget> = {
    [key in keyof T]: SchemaValueType<T[key]>;
};
export declare type RestrictionTarget = ConditionalTarget | SchemaTarget;
export declare type RestrictionTargetType<RestrictionGeneric> = RestrictionGeneric extends Restriction<infer T> ? T : never;
export declare type SchemaTargetType<SchemaGeneric> = SchemaGeneric extends Schema<infer T> ? T : never;
export interface ConstructorFunction<T> extends Function {
    name: string;
    new (...args: any): T;
}
