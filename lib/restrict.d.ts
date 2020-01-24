import { ConstructorFunction } from "./types";
import { Restriction } from "./restriction";
export declare const restrict: {
    match: (matcher: string | RegExp) => Restriction<string>;
    Object: Restriction<object>;
    Array: Restriction<any[]>;
    instanceof: <T>(instance: ConstructorFunction<T>) => Restriction<T>;
    positive: Restriction<number | bigint>;
    negative: Restriction<number | bigint>;
    integer: Restriction<number | bigint>;
    gt: <N extends number | bigint, T_1 = N extends number ? number : bigint>(bound: N) => Restriction<T_1>;
    lt: <N_1 extends number | bigint, T_2 = N_1 extends number ? number : bigint>(bound: N_1) => Restriction<T_2>;
    gte: <N_2 extends number | bigint, T_3 = N_2 extends number ? number : bigint>(bound: N_2) => Restriction<T_3>;
    lte: <N_3 extends number | bigint, T_4 = N_3 extends number ? number : bigint>(bound: N_3) => Restriction<T_4>;
    range: <NLower extends number | bigint, NUpper extends NLower extends number ? number : bigint, T_5 = NLower extends number ? number : bigint>(lower: NLower, upper: NUpper, lowerInclusive?: boolean, upperInclusive?: boolean) => Restriction<T_5>;
    eq: <T_6>(target: T_6) => Restriction<T_6>;
    neq: <T_7>(target: T_7) => Restriction<T_7>;
    string: Restriction<string>;
    number: Restriction<number>;
    bigint: Restriction<bigint>;
    boolean: Restriction<boolean>;
    null: Restriction<null>;
    undefined: Restriction<undefined>;
    symbol: Restriction<symbol>;
};
