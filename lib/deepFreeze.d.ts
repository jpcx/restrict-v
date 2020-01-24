export interface DeepFreeze extends Function {
    <T extends object>(freezeRoot: T): T;
}
export declare class DeepFreeze extends Function {
    constructor();
}
