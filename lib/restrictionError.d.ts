export declare class RestrictionError<T> extends Error {
    value: T;
    root: any;
    code: string;
    messageStack: string[];
    constructor(options: {
        value: T;
        root?: any;
        message?: string;
        sourceErr?: RestrictionError<any>;
    });
}
