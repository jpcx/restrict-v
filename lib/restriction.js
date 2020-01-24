"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deepFreeze_1 = require("./deepFreeze");
const deepFreeze = new deepFreeze_1.DeepFreeze();
const restrictionError_1 = require("./restrictionError");
class Restriction extends Function {
    constructor(optMessage, ...conditionalsOrSchemas) {
        super();
        const parsedArgs = parseArgs(optMessage, conditionalsOrSchemas);
        let { message } = parsedArgs;
        const { conditionals, schemas } = parsedArgs;
        const messageGetter = () => message;
        const self = (() => {
            const restriction = (...values) => {
                values.forEach(v => {
                    schemas.forEach(s => validateSchemaValue(message, s, v));
                    conditionals.forEach(c => validateConditionalValue(message, c, v));
                });
                return values.length === 1 ? values[0] : values;
            };
            restriction.or = mkDisjunctionFactory(restriction, messageGetter);
            restriction.and = mkUnionFactory(restriction, messageGetter);
            return restriction;
        })();
        Object.defineProperty(self, "message", {
            get: messageGetter,
            set: (msg) => {
                if (typeof msg === "string") {
                    message = msg;
                }
                else {
                    throw new Error("[restrict-v] Invalid Argument: restriction.message must be a " +
                        "string");
                }
            },
            enumerable: true,
            configurable: false
        });
        self.msg = (msg) => {
            message = msg;
            return self;
        };
        return deepFreeze(Object.setPrototypeOf(self, Restriction.prototype));
    }
}
exports.Restriction = Restriction;
const defaultErrorMessage = "An invalid value was detected";
function verifySchema(sch) {
    const q = [sch];
    const checkSchemaValue = (v) => {
        if (typeof v === "function") {
        }
        else if (v instanceof Object) {
            q.push(v);
        }
        else {
            throw new Error("[restrict-v] Invalid Argument: Schema values must " +
                "be Conditional functions or Object/Array Schemas");
        }
    };
    let cur = q.pop();
    const visited = new WeakSet();
    while (cur !== undefined) {
        if (!visited.has(cur)) {
            visited.add(cur);
        }
        else {
            throw new Error("[restrict-v] Invalid Argument: Circular references within schemas " +
                "are not supported at this time");
        }
        if (cur instanceof Array) {
            for (const value of cur) {
                checkSchemaValue(value);
            }
        }
        else if (cur instanceof Object && !(typeof cur === "function")) {
            for (const value of Object.values(cur)) {
                checkSchemaValue(value);
            }
        }
        else {
            throw new Error("[restrict-v] Internal Error: Invalid state reached; verifySchema " +
                "was called with a non-object schema or a non-object was added to " +
                "the schema queue. Please notify the developer.");
        }
        cur = q.pop();
    }
}
function parseArgs(optMessage, conditionalsOrSchemas) {
    let message = defaultErrorMessage;
    const conditionals = [];
    const schemas = [];
    let msgOffset = 0;
    const optMessageIsString = typeof optMessage === "string";
    if (optMessageIsString) {
        message = optMessage;
        msgOffset = 1;
    }
    else if (optMessage !== undefined) {
        conditionalsOrSchemas.unshift(optMessage);
    }
    else {
        return {
            message,
            schemas,
            conditionals
        };
    }
    const restrictionMessages = [];
    for (let i = 0; i < conditionalsOrSchemas.length; ++i) {
        const arg = conditionalsOrSchemas[i];
        if (typeof arg === "function") {
            conditionals.push(arg);
            if (arg instanceof Restriction) {
                restrictionMessages.push(arg.message);
            }
        }
        else if (arg instanceof Object) {
            verifySchema(arg);
            schemas.push(arg);
        }
        else {
            throw Error(`[restrict-v] Invalid Argument: Constructor arg #${i +
                1 +
                msgOffset} was not a Conditional function or a Schema Object`);
        }
    }
    if (restrictionMessages.length === conditionalsOrSchemas.length &&
        !optMessageIsString) {
        message =
            restrictionMessages.length === 1
                ? restrictionMessages[0]
                : "(" + restrictionMessages.join(" && ") + ")";
    }
    return {
        message,
        schemas,
        conditionals
    };
}
function validateConditionalValue(message, conditional, value, root) {
    if (conditional instanceof Restriction) {
        try {
            conditional(value);
        }
        catch (err) {
            throw new restrictionError_1.RestrictionError({
                value,
                root,
                message,
                sourceErr: err
            });
        }
    }
    else {
        let result;
        try {
            result = conditional(value);
        }
        catch (err) {
            throw new restrictionError_1.RestrictionError({
                value,
                root,
                message
            });
        }
        if (!result) {
            throw new restrictionError_1.RestrictionError({
                value,
                root,
                message
            });
        }
    }
}
function validateSchemaValue(message, schema, root) {
    const q = [
        [schema, root]
    ];
    let cur = q.pop();
    while (cur !== undefined) {
        const [curS, curV] = cur;
        if (curS instanceof Array) {
            if (!(curV instanceof Array)) {
                throw new restrictionError_1.RestrictionError({
                    value: curV,
                    root,
                    message,
                    sourceErr: new restrictionError_1.RestrictionError({
                        value: curV,
                        root,
                        message: "Must be an Array"
                    })
                });
            }
            if (curV.length !== curS.length) {
                throw new restrictionError_1.RestrictionError({
                    value: curV,
                    root,
                    message,
                    sourceErr: new restrictionError_1.RestrictionError({
                        value: curV,
                        root,
                        message: "Must be an Array of length " + curS.length
                    })
                });
            }
            for (let i = 0; i < curS.length; ++i) {
                const s = curS[i];
                const v = curV[i];
                if (typeof s === "function") {
                    validateConditionalValue(message, s, v, root);
                }
                else {
                    q.push([s, v]);
                }
            }
        }
        else {
            if (!(curV instanceof Object)) {
                throw new restrictionError_1.RestrictionError({
                    value: curV,
                    root,
                    message,
                    sourceErr: new restrictionError_1.RestrictionError({
                        value: curV,
                        root,
                        message: "Must be an Object"
                    })
                });
            }
            for (const key of Object.keys(curV)) {
                if (!curS.hasOwnProperty(key)) {
                    throw new restrictionError_1.RestrictionError({
                        value: curV,
                        root,
                        message,
                        sourceErr: new restrictionError_1.RestrictionError({
                            value: curV,
                            root,
                            message: `Must be an Object containing key "${key}"`
                        })
                    });
                }
            }
            for (const [key, schemaV] of Object.entries(curS)) {
                if (!curV.hasOwnProperty(key)) {
                    throw new restrictionError_1.RestrictionError({
                        value: curV,
                        root,
                        message,
                        sourceErr: new restrictionError_1.RestrictionError({
                            value: curV,
                            root,
                            message: `Must be an Object containing key "${key}"`
                        })
                    });
                }
                if (typeof schemaV === "function") {
                    const cond = schemaV;
                    validateConditionalValue(message, cond, curV[key], root);
                }
                else {
                    q.push([schemaV, curV[key]]);
                }
            }
        }
        cur = q.pop();
    }
}
function mkDisjunctionFactory(baseValidator, baseMessageGetter) {
    return (optMessage, ...conditionalsOrSchemas) => {
        const { message, conditionals, schemas } = parseArgs(optMessage, conditionalsOrSchemas);
        const childRestriction = new Restriction(message, ...conditionals, ...schemas);
        const disjunctionPredicate = (v) => {
            try {
                baseValidator(v);
                return true;
            }
            catch (e) {
            }
            try {
                childRestriction(v);
                return true;
            }
            catch (e) {
                return false;
            }
        };
        if (typeof optMessage === "string") {
            return new Restriction(message, disjunctionPredicate);
        }
        else {
            const baseMessage = baseMessageGetter();
            if (baseMessage !== defaultErrorMessage) {
                return new Restriction("(" + baseMessage + " || " + message + ")", disjunctionPredicate);
            }
            else {
                return new Restriction(message, disjunctionPredicate);
            }
        }
    };
}
function mkUnionFactory(baseValidator, baseMessageGetter) {
    return (optMessage, ...conditionalsOrSchemas) => {
        const { message, conditionals, schemas } = parseArgs(optMessage, conditionalsOrSchemas);
        const childRestriction = new Restriction(message, ...conditionals, ...schemas);
        const unionPredicate = (v) => {
            baseValidator(v);
            childRestriction(v);
            return true;
        };
        if (typeof optMessage === "string") {
            return new Restriction(message, unionPredicate);
        }
        else {
            const baseMessage = baseMessageGetter();
            if (baseMessage !== defaultErrorMessage) {
                return new Restriction("(" + baseMessage + " && " + message + ")", unionPredicate);
            }
            else {
                return new Restriction(message, unionPredicate);
            }
        }
    };
}
deepFreeze(this);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdHJpY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcmVzdHJpY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFxQ0EsNkNBQTBDO0FBQzFDLE1BQU0sVUFBVSxHQUFHLElBQUksdUJBQVUsRUFBRSxDQUFDO0FBYXBDLHlEQUFzRDtBQTBDdEQsTUFBYSxXQUF5QyxTQUFRLFFBQVE7SUFVckUsWUFDQyxVQUErQyxFQUMvQyxHQUFHLHFCQUF3RDtRQUUzRCxLQUFLLEVBQUUsQ0FBQztRQUVSLE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBSSxVQUFVLEVBQUUscUJBQXFCLENBQUMsQ0FBQztRQUNuRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsVUFBVSxDQUFDO1FBQzdCLE1BQU0sRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLEdBQUcsVUFBVSxDQUFDO1FBRTdDLE1BQU0sYUFBYSxHQUFHLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUVwQyxNQUFNLElBQUksR0FBbUIsQ0FBQyxHQUFnQixFQUFFO1lBQy9DLE1BQU0sV0FBVyxHQUE0QixDQUFDLEdBQUcsTUFBVyxFQUFFLEVBQUU7Z0JBQy9ELE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQ2xCLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3pELFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BFLENBQUMsQ0FBQyxDQUFDO2dCQUNILE9BQU8sTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxD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LENBQUMsQ0FBTSxDQUFDLENBQUM7WUFDekIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDLENBQUM7UUFFRixJQUFJLE9BQU8sVUFBVSxLQUFLLFFBQVEsRUFBRTtZQUNuQyxPQUFPLElBQUksV0FBVyxDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztTQUNoRDthQUFNO1lBQ04sTUFBTSxXQUFXLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQztZQUN4QyxJQUFJLFdBQVcsS0FBSyxtQkFBbUIsRUFBRTtnQkFDeEMsT0FBTyxJQUFJLFdBQVcsQ0FDckIsR0FBRyxHQUFHLFdBQVcsR0FBRyxNQUFNLEdBQUcsT0FBTyxHQUFHLEdBQUcsRUFDMUMsY0FBYyxDQUNkLENBQUM7YUFDRjtpQkFBTTtnQkFDTixPQUFPLElBQUksV0FBVyxDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQzthQUNoRDtTQUNEO0lBQ0YsQ0FBQyxDQUFDO0FBQ0gsQ0FBQztBQUVELFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG1vZHVsZSByZXN0cmljdC12XG4gKi9cblxuLyoqXG4gKiBAYXV0aG9yICBKdXN0aW4gQ29sbGllciA8anBjeGlzdEBnbWFpbC5jb20+XG4gKiBAbGljZW5zZSBHUEwtMy4wLW9yLWxhdGVyXG4gKiBAc2VlIHtAbGluayBodHRwOi8vZ2l0aHViLmNvbS9qcGN4L3Jlc3RyaWN0LXZ8R2l0SHVifVxuICovXG5cbi8qICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gICpcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX18gICAgICAgICAuX18gICAgICAgIF9fICAgICAgICAgICAgICAgICAgICAgICpcbiAqICAgIF9fX19fX18gICBfX19fICAgX19fX19fXy8gIHxfX19fX19fX3xfX3wgX19fX18vICB8XyAgICAgICAgICBfX18gIF9fICAgICpcbiAqICAgIFxcXyAgX18gXFxfLyBfXyBcXCAvICBfX18vXFwgICBfX1xcXyAgX18gXFwgIHwvIF9fX1xcICAgX19cXCAgX19fX19fIFxcICBcXC8gLyAgICAqXG4gKiAgICAgfCAgfCBcXC9cXCAgX19fLyBcXF9fXyBcXCAgfCAgfCAgfCAgfCBcXC8gIFxcICBcXF9fX3wgIHwgICAvX19fX18vICBcXCAgIC8gICAgICpcbiAqICAgICB8X198ICAgIFxcX19fICA+X19fXyAgPiB8X198ICB8X198ICB8X198XFxfX18gID5fX3wgICAgICAgICAgICAgXFxfLyAgICAgICpcbiAqICAgICAgICAgICAgICAgICBcXC8gICAgIFxcLyAgICAgICAgICAgICAgICAgICAgICBcXC8gICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgIFJ1bnRpbWUgVmFsdWUgUmVzdHJpY3RvciAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gICpcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeSAgICAgICpcbiAqICBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieSAgICAgICpcbiAqICB0aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvciAgICAgICAgICpcbiAqICAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCwgICAgICAgICAgICpcbiAqICBidXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW50ZXJuYWxpZWQgd2FycmFudHkgb2YgICAgICAgICpcbiAqICBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlICAgICAgICAgICAgICpcbiAqICBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqICBZb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSAgICAgICAgICpcbiAqICBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbS4gIElmIG5vdCwgc2VlIDxodHRwczovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uICAgICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG5cbmltcG9ydCB7IERlZXBGcmVlemUgfSBmcm9tIFwiLi9kZWVwRnJlZXplXCI7XG5jb25zdCBkZWVwRnJlZXplID0gbmV3IERlZXBGcmVlemUoKTtcblxuaW1wb3J0IHtcblx0Q29uZGl0aW9uYWwsXG5cdENvbmRpdGlvbmFsVGFyZ2V0LFxuXHRQYXNzdGhyb3VnaFZhbGlkYXRvcixcblx0UmVzdHJpY3Rpb25UYXJnZXQsXG5cdFNjaGVtYSxcblx0U2NoZW1hVGFyZ2V0LFxuXHRTY2hlbWFUYXJnZXRWYWx1ZVR5cGUsXG5cdFNjaGVtYVZhbHVlVHlwZVxufSBmcm9tIFwiLi90eXBlc1wiO1xuXG5pbXBvcnQgeyBSZXN0cmljdGlvbkVycm9yIH0gZnJvbSBcIi4vcmVzdHJpY3Rpb25FcnJvclwiO1xuXG4vKi4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLFxuIC8gICAgICAgICAgICAgICAgICAgICAgICAgICAgW2NsYXNzLlJlc3RyaWN0aW9uXSAgICAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlc3RyaWN0aW9uPFQgZXh0ZW5kcyBSZXN0cmljdGlvblRhcmdldD5cblx0ZXh0ZW5kcyBGdW5jdGlvbixcblx0XHRQYXNzdGhyb3VnaFZhbGlkYXRvcjxUPiB7XG5cdG1lc3NhZ2U6IHN0cmluZztcblx0b3I8VT4oXG5cdFx0bWVzc2FnZTogc3RyaW5nLFxuXHRcdC4uLmNvbmRpdGlvbmFsczogQXJyYXk8Q29uZGl0aW9uYWw8VT4+XG5cdCk6IFJlc3RyaWN0aW9uPFQgfCBVPjtcblx0b3I8VT4obWVzc2FnZTogc3RyaW5nLCAuLi5zY2hlbWFzOiBBcnJheTxTY2hlbWE8VT4+KTogUmVzdHJpY3Rpb248VCB8IFU+O1xuXHRvcjxVPihcblx0XHRtZXNzYWdlOiBzdHJpbmcsXG5cdFx0Li4uY29uZGl0aW9uYWxzT3JTY2hlbWFzOiBBcnJheTxDb25kaXRpb25hbDxVPiB8IFNjaGVtYTxVPj5cblx0KTogUmVzdHJpY3Rpb248VCB8IFU+O1xuXHRvcjxVPiguLi5jb25kaXRpb25hbHM6IEFycmF5PENvbmRpdGlvbmFsPFU+Pik6IFJlc3RyaWN0aW9uPFQgfCBVPjtcblx0b3I8VT4oLi4uc2NoZW1hczogQXJyYXk8U2NoZW1hPFU+Pik6IFJlc3RyaWN0aW9uPFQgfCBVPjtcblx0b3I8VT4oXG5cdFx0Li4uY29uZGl0aW9uYWxzT3JTY2hlbWFzOiBBcnJheTxDb25kaXRpb25hbDxVPiB8IFNjaGVtYTxVPj5cblx0KTogUmVzdHJpY3Rpb248VCB8IFU+O1xuXG5cdGFuZDxVPihcblx0XHRtZXNzYWdlOiBzdHJpbmcsXG5cdFx0Li4uY29uZGl0aW9uYWxzOiBBcnJheTxDb25kaXRpb25hbDxVPj5cblx0KTogUmVzdHJpY3Rpb248VCAmIFU+O1xuXHRhbmQ8VT4obWVzc2FnZTogc3RyaW5nLCAuLi5zY2hlbWFzOiBBcnJheTxTY2hlbWE8VT4+KTogUmVzdHJpY3Rpb248VCAmIFU+O1xuXHRhbmQ8VT4oXG5cdFx0bWVzc2FnZTogc3RyaW5nLFxuXHRcdC4uLmNvbmRpdGlvbmFsc09yU2NoZW1hczogQXJyYXk8Q29uZGl0aW9uYWw8VT4gfCBTY2hlbWE8VT4+XG5cdCk6IFJlc3RyaWN0aW9uPFQgJiBVPjtcblx0YW5kPFU+KC4uLmNvbmRpdGlvbmFsczogQXJyYXk8Q29uZGl0aW9uYWw8VT4+KTogUmVzdHJpY3Rpb248VCAmIFU+O1xuXHRhbmQ8VT4oLi4uc2NoZW1hczogQXJyYXk8U2NoZW1hPFU+Pik6IFJlc3RyaWN0aW9uPFQgJiBVPjtcblx0YW5kPFU+KFxuXHRcdC4uLmNvbmRpdGlvbmFsc09yU2NoZW1hczogQXJyYXk8Q29uZGl0aW9uYWw8VT4gfCBTY2hlbWE8VT4+XG5cdCk6IFJlc3RyaWN0aW9uPFQgJiBVPjtcblxuXHRtc2cobWVzc2FnZTogc3RyaW5nKTogUmVzdHJpY3Rpb248VD47XG59XG5cbmV4cG9ydCBjbGFzcyBSZXN0cmljdGlvbjxUIGV4dGVuZHMgUmVzdHJpY3Rpb25UYXJnZXQ+IGV4dGVuZHMgRnVuY3Rpb24ge1xuXHRjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcsIC4uLmNvbmRpdGlvbmFsczogQXJyYXk8Q29uZGl0aW9uYWw8VD4+KTtcblx0Y29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nLCAuLi5zY2hlbWFzOiBBcnJheTxTY2hlbWE8VD4+KTtcblx0Y29uc3RydWN0b3IoXG5cdFx0bWVzc2FnZTogc3RyaW5nLFxuXHRcdC4uLmNvbmRpdGlvbmFsc09yU2NoZW1hczogQXJyYXk8Q29uZGl0aW9uYWw8VD4gfCBTY2hlbWE8VD4+XG5cdCk7XG5cdGNvbnN0cnVjdG9yKC4uLmNvbmRpdGlvbmFsczogQXJyYXk8Q29uZGl0aW9uYWw8VD4+KTtcblx0Y29uc3RydWN0b3IoLi4uc2NoZW1hczogQXJyYXk8U2NoZW1hPFQ+Pik7XG5cdGNvbnN0cnVjdG9yKC4uLmNvbmRpdGlvbmFsc09yU2NoZW1hczogQXJyYXk8Q29uZGl0aW9uYWw8VD4gfCBTY2hlbWE8VD4+KTtcblx0Y29uc3RydWN0b3IoXG5cdFx0b3B0TWVzc2FnZTogc3RyaW5nIHwgQ29uZGl0aW9uYWw8VD4gfCBTY2hlbWE8VD4sXG5cdFx0Li4uY29uZGl0aW9uYWxzT3JTY2hlbWFzOiBBcnJheTxDb25kaXRpb25hbDxUPiB8IFNjaGVtYTxUPj5cblx0KSB7XG5cdFx0c3VwZXIoKTtcblxuXHRcdGNvbnN0IHBhcnNlZEFyZ3MgPSBwYXJzZUFyZ3M8VD4ob3B0TWVzc2FnZSwgY29uZGl0aW9uYWxzT3JTY2hlbWFzKTtcblx0XHRsZXQgeyBtZXNzYWdlIH0gPSBwYXJzZWRBcmdzO1xuXHRcdGNvbnN0IHsgY29uZGl0aW9uYWxzLCBzY2hlbWFzIH0gPSBwYXJzZWRBcmdzO1xuXG5cdFx0Y29uc3QgbWVzc2FnZUdldHRlciA9ICgpID0+IG1lc3NhZ2U7XG5cblx0XHRjb25zdCBzZWxmOiBSZXN0cmljdGlvbjxUPiA9ICg8VSBleHRlbmRzIFQ+KCkgPT4ge1xuXHRcdFx0Y29uc3QgcmVzdHJpY3Rpb246IFBhc3N0aHJvdWdoVmFsaWRhdG9yPFU+ID0gKC4uLnZhbHVlczogVVtdKSA9PiB7XG5cdFx0XHRcdHZhbHVlcy5mb3JFYWNoKHYgPT4ge1xuXHRcdFx0XHRcdHNjaGVtYXMuZm9yRWFjaChzID0+IHZhbGlkYXRlU2NoZW1hVmFsdWUobWVzc2FnZSwgcywgdikpO1xuXHRcdFx0XHRcdGNvbmRpdGlvbmFscy5mb3JFYWNoKGMgPT4gdmFsaWRhdGVDb25kaXRpb25hbFZhbHVlKG1lc3NhZ2UsIGMsIHYpKTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdHJldHVybiB2YWx1ZXMubGVuZ3RoID09PSAxID8gdmFsdWVzWzBdIDogdmFsdWVzO1xuXHRcdFx0fTtcblx0XHRcdChyZXN0cmljdGlvbiBhcyBSZXN0cmljdGlvbjxVPikub3IgPSBta0Rpc2p1bmN0aW9uRmFjdG9yeShcblx0XHRcdFx0cmVzdHJpY3Rpb24sXG5cdFx0XHRcdG1lc3NhZ2VHZXR0ZXJcblx0XHRcdCk7XG5cdFx0XHQocmVzdHJpY3Rpb24gYXMgUmVzdHJpY3Rpb248VT4pLmFuZCA9IG1rVW5pb25GYWN0b3J5KFxuXHRcdFx0XHRyZXN0cmljdGlvbixcblx0XHRcdFx0bWVzc2FnZUdldHRlclxuXHRcdFx0KTtcblx0XHRcdHJldHVybiByZXN0cmljdGlvbiBhcyBSZXN0cmljdGlvbjxVPjtcblx0XHR9KSgpO1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzZWxmLCBcIm1lc3NhZ2VcIiwge1xuXHRcdFx0Z2V0OiBtZXNzYWdlR2V0dGVyLFxuXHRcdFx0c2V0OiAobXNnOiBzdHJpbmcpID0+IHtcblx0XHRcdFx0aWYgKHR5cGVvZiBtc2cgPT09IFwic3RyaW5nXCIpIHtcblx0XHRcdFx0XHRtZXNzYWdlID0gbXNnO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdFx0XHRcdFwiW3Jlc3RyaWN0LXZdIEludmFsaWQgQXJndW1lbnQ6IHJlc3RyaWN0aW9uLm1lc3NhZ2UgbXVzdCBiZSBhIFwiICtcblx0XHRcdFx0XHRcdFx0XCJzdHJpbmdcIlxuXHRcdFx0XHRcdCk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuXHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZVxuXHRcdH0pO1xuXHRcdHNlbGYubXNnID0gKG1zZzogc3RyaW5nKSA9PiB7XG5cdFx0XHRtZXNzYWdlID0gbXNnO1xuXHRcdFx0cmV0dXJuIHNlbGY7XG5cdFx0fTtcblx0XHRyZXR1cm4gZGVlcEZyZWV6ZShPYmplY3Quc2V0UHJvdG90eXBlT2Yoc2VsZiwgUmVzdHJpY3Rpb24ucHJvdG90eXBlKSk7XG5cdH1cbn1cblxuLyouLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSxcbiAvICAgICAgICAgICAgICAgICAgICAgICAgICBQcml2YXRlIEZ1bmN0aW9ucyAmIERhdGEgICAgICAgICAgICAgICAgICAgICAgICAgKi9cblxuY29uc3QgZGVmYXVsdEVycm9yTWVzc2FnZSA9IFwiQW4gaW52YWxpZCB2YWx1ZSB3YXMgZGV0ZWN0ZWRcIjtcblxuZnVuY3Rpb24gdmVyaWZ5U2NoZW1hPFQgZXh0ZW5kcyBSZXN0cmljdGlvblRhcmdldD4oc2NoOiBTY2hlbWE8VD4pOiB2b2lkIHtcblx0Y29uc3QgcSA9IFtzY2hdOyAvLyBMSUZPXG5cdGNvbnN0IGNoZWNrU2NoZW1hVmFsdWUgPSAodjogU2NoZW1hVmFsdWVUeXBlPFQ+KSA9PiB7XG5cdFx0aWYgKHR5cGVvZiB2ID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdC8qIGRvIG5vdGhpbmcgKi9cblx0XHR9IGVsc2UgaWYgKHYgaW5zdGFuY2VvZiBPYmplY3QpIHtcblx0XHRcdHEucHVzaCh2KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHRcIltyZXN0cmljdC12XSBJbnZhbGlkIEFyZ3VtZW50OiBTY2hlbWEgdmFsdWVzIG11c3QgXCIgK1xuXHRcdFx0XHRcdFwiYmUgQ29uZGl0aW9uYWwgZnVuY3Rpb25zIG9yIE9iamVjdC9BcnJheSBTY2hlbWFzXCJcblx0XHRcdCk7XG5cdFx0fVxuXHR9O1xuXG5cdGxldCBjdXIgPSBxLnBvcCgpO1xuXHRjb25zdCB2aXNpdGVkID0gbmV3IFdlYWtTZXQoKTtcblx0d2hpbGUgKGN1ciAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0aWYgKCF2aXNpdGVkLmhhcyhjdXIpKSB7XG5cdFx0XHR2aXNpdGVkLmFkZChjdXIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdFwiW3Jlc3RyaWN0LXZdIEludmFsaWQgQXJndW1lbnQ6IENpcmN1bGFyIHJlZmVyZW5jZXMgd2l0aGluIHNjaGVtYXMgXCIgK1xuXHRcdFx0XHRcdFwiYXJlIG5vdCBzdXBwb3J0ZWQgYXQgdGhpcyB0aW1lXCJcblx0XHRcdCk7XG5cdFx0fVxuXHRcdGlmIChjdXIgaW5zdGFuY2VvZiBBcnJheSkge1xuXHRcdFx0Zm9yIChjb25zdCB2YWx1ZSBvZiBjdXIpIHtcblx0XHRcdFx0Y2hlY2tTY2hlbWFWYWx1ZSh2YWx1ZSk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChjdXIgaW5zdGFuY2VvZiBPYmplY3QgJiYgISh0eXBlb2YgY3VyID09PSBcImZ1bmN0aW9uXCIpKSB7XG5cdFx0XHRmb3IgKGNvbnN0IHZhbHVlIG9mIE9iamVjdC52YWx1ZXMoY3VyKSkge1xuXHRcdFx0XHRjaGVja1NjaGVtYVZhbHVlKHZhbHVlKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHRcIltyZXN0cmljdC12XSBJbnRlcm5hbCBFcnJvcjogSW52YWxpZCBzdGF0ZSByZWFjaGVkOyB2ZXJpZnlTY2hlbWEgXCIgK1xuXHRcdFx0XHRcdFwid2FzIGNhbGxlZCB3aXRoIGEgbm9uLW9iamVjdCBzY2hlbWEgb3IgYSBub24tb2JqZWN0IHdhcyBhZGRlZCB0byBcIiArXG5cdFx0XHRcdFx0XCJ0aGUgc2NoZW1hIHF1ZXVlLiBQbGVhc2Ugbm90aWZ5IHRoZSBkZXZlbG9wZXIuXCJcblx0XHRcdCk7XG5cdFx0fVxuXHRcdGN1ciA9IHEucG9wKCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gcGFyc2VBcmdzPFQgZXh0ZW5kcyBSZXN0cmljdGlvblRhcmdldD4oXG5cdG9wdE1lc3NhZ2U6IHN0cmluZyB8IENvbmRpdGlvbmFsPFQ+IHwgU2NoZW1hPFQ+LFxuXHRjb25kaXRpb25hbHNPclNjaGVtYXM6IEFycmF5PENvbmRpdGlvbmFsPFQ+IHwgU2NoZW1hPFQ+PlxuKToge1xuXHRtZXNzYWdlOiBzdHJpbmc7XG5cdGNvbmRpdGlvbmFsczogQXJyYXk8Q29uZGl0aW9uYWw8VD4+O1xuXHRzY2hlbWFzOiBBcnJheTxTY2hlbWE8VD4+O1xufSB7XG5cdGxldCBtZXNzYWdlOiBzdHJpbmcgPSBkZWZhdWx0RXJyb3JNZXNzYWdlO1xuXHRjb25zdCBjb25kaXRpb25hbHM6IEFycmF5PENvbmRpdGlvbmFsPFQ+PiA9IFtdO1xuXHRjb25zdCBzY2hlbWFzOiBBcnJheTxTY2hlbWE8VD4+ID0gW107XG5cblx0bGV0IG1zZ09mZnNldCA9IDA7XG5cblx0Y29uc3Qgb3B0TWVzc2FnZUlzU3RyaW5nID0gdHlwZW9mIG9wdE1lc3NhZ2UgPT09IFwic3RyaW5nXCI7XG5cblx0aWYgKG9wdE1lc3NhZ2VJc1N0cmluZykge1xuXHRcdG1lc3NhZ2UgPSBvcHRNZXNzYWdlIGFzIHN0cmluZztcblx0XHRtc2dPZmZzZXQgPSAxO1xuXHR9IGVsc2UgaWYgKG9wdE1lc3NhZ2UgIT09IHVuZGVmaW5lZCkge1xuXHRcdGNvbmRpdGlvbmFsc09yU2NoZW1hcy51bnNoaWZ0KG9wdE1lc3NhZ2UgYXMgQ29uZGl0aW9uYWw8VD4gfCBTY2hlbWE8VD4pO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiB7XG5cdFx0XHRtZXNzYWdlLFxuXHRcdFx0c2NoZW1hcyxcblx0XHRcdGNvbmRpdGlvbmFsc1xuXHRcdH07XG5cdH1cblxuXHRjb25zdCByZXN0cmljdGlvbk1lc3NhZ2VzOiBzdHJpbmdbXSA9IFtdO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgY29uZGl0aW9uYWxzT3JTY2hlbWFzLmxlbmd0aDsgKytpKSB7XG5cdFx0Y29uc3QgYXJnID0gY29uZGl0aW9uYWxzT3JTY2hlbWFzW2ldO1xuXHRcdGlmICh0eXBlb2YgYXJnID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdGNvbmRpdGlvbmFscy5wdXNoKGFyZyk7XG5cdFx0XHRpZiAoYXJnIGluc3RhbmNlb2YgUmVzdHJpY3Rpb24pIHtcblx0XHRcdFx0cmVzdHJpY3Rpb25NZXNzYWdlcy5wdXNoKGFyZy5tZXNzYWdlKTtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIE9iamVjdCkge1xuXHRcdFx0dmVyaWZ5U2NoZW1hKGFyZyk7XG5cdFx0XHRzY2hlbWFzLnB1c2goYXJnKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgRXJyb3IoXG5cdFx0XHRcdGBbcmVzdHJpY3Qtdl0gSW52YWxpZCBBcmd1bWVudDogQ29uc3RydWN0b3IgYXJnICMke2kgK1xuXHRcdFx0XHRcdDEgK1xuXHRcdFx0XHRcdG1zZ09mZnNldH0gd2FzIG5vdCBhIENvbmRpdGlvbmFsIGZ1bmN0aW9uIG9yIGEgU2NoZW1hIE9iamVjdGBcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKFxuXHRcdHJlc3RyaWN0aW9uTWVzc2FnZXMubGVuZ3RoID09PSBjb25kaXRpb25hbHNPclNjaGVtYXMubGVuZ3RoICYmXG5cdFx0IW9wdE1lc3NhZ2VJc1N0cmluZ1xuXHQpIHtcblx0XHQvLyBhbGwgY29uZGl0aW9uYWxzT3JTY2hlbWFzIGFyZSBSZXN0cmljdGlvbnMgYW5kIG1lc3NhZ2Ugd2FzIG5vdCBwcm92aWRlZFxuXHRcdC8vIGNyZWF0ZSBhIGRlZmF1bHQgbWVzc2FnZSBvZiBhbGwgcmVzdHJpY3Rpb25NZXNzYWdlcyBqb2luZWQgd2l0aCAmJlxuXHRcdG1lc3NhZ2UgPVxuXHRcdFx0cmVzdHJpY3Rpb25NZXNzYWdlcy5sZW5ndGggPT09IDFcblx0XHRcdFx0PyByZXN0cmljdGlvbk1lc3NhZ2VzWzBdXG5cdFx0XHRcdDogXCIoXCIgKyByZXN0cmljdGlvbk1lc3NhZ2VzLmpvaW4oXCIgJiYgXCIpICsgXCIpXCI7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdG1lc3NhZ2UsXG5cdFx0c2NoZW1hcyxcblx0XHRjb25kaXRpb25hbHNcblx0fTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVDb25kaXRpb25hbFZhbHVlPFQgZXh0ZW5kcyBDb25kaXRpb25hbFRhcmdldD4oXG5cdG1lc3NhZ2U6IHN0cmluZyxcblx0Y29uZGl0aW9uYWw6IENvbmRpdGlvbmFsPFQ+LFxuXHR2YWx1ZTogVCxcblx0cm9vdD86IGFueVxuKTogdm9pZCB7XG5cdGlmIChjb25kaXRpb25hbCBpbnN0YW5jZW9mIFJlc3RyaWN0aW9uKSB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbmRpdGlvbmFsKHZhbHVlKTtcblx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdHRocm93IG5ldyBSZXN0cmljdGlvbkVycm9yPFQ+KHtcblx0XHRcdFx0dmFsdWUsXG5cdFx0XHRcdHJvb3QsXG5cdFx0XHRcdG1lc3NhZ2UsXG5cdFx0XHRcdHNvdXJjZUVycjogZXJyIGFzIFJlc3RyaWN0aW9uRXJyb3I8VD5cblx0XHRcdH0pO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRsZXQgcmVzdWx0OiBib29sZWFuIHwgdm9pZDtcblx0XHR0cnkge1xuXHRcdFx0cmVzdWx0ID0gY29uZGl0aW9uYWwodmFsdWUpO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0dGhyb3cgbmV3IFJlc3RyaWN0aW9uRXJyb3Ioe1xuXHRcdFx0XHR2YWx1ZSxcblx0XHRcdFx0cm9vdCxcblx0XHRcdFx0bWVzc2FnZVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGlmICghcmVzdWx0KSB7XG5cdFx0XHR0aHJvdyBuZXcgUmVzdHJpY3Rpb25FcnJvcih7XG5cdFx0XHRcdHZhbHVlLFxuXHRcdFx0XHRyb290LFxuXHRcdFx0XHRtZXNzYWdlXG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVTY2hlbWFWYWx1ZTxUIGV4dGVuZHMgU2NoZW1hVGFyZ2V0Pihcblx0bWVzc2FnZTogc3RyaW5nLFxuXHRzY2hlbWE6IFNjaGVtYTxUPixcblx0cm9vdDogVFxuKTogdm9pZCB7XG5cdGNvbnN0IHE6IEFycmF5PFtTY2hlbWE8U2NoZW1hVGFyZ2V0PiwgU2NoZW1hVGFyZ2V0VmFsdWVUeXBlXT4gPSBbXG5cdFx0W3NjaGVtYSwgcm9vdF1cblx0XTsgLy8gTElGT1xuXHRsZXQgY3VyID0gcS5wb3AoKTtcblx0d2hpbGUgKGN1ciAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0Y29uc3QgW2N1clMsIGN1clZdID0gY3VyO1xuXHRcdGlmIChjdXJTIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHRcdC8vIHVzaW5nIEFycmF5U2NoZW1hXG5cdFx0XHRpZiAoIShjdXJWIGluc3RhbmNlb2YgQXJyYXkpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBSZXN0cmljdGlvbkVycm9yKHtcblx0XHRcdFx0XHR2YWx1ZTogY3VyVixcblx0XHRcdFx0XHRyb290LFxuXHRcdFx0XHRcdG1lc3NhZ2UsXG5cdFx0XHRcdFx0c291cmNlRXJyOiBuZXcgUmVzdHJpY3Rpb25FcnJvcih7XG5cdFx0XHRcdFx0XHR2YWx1ZTogY3VyVixcblx0XHRcdFx0XHRcdHJvb3QsXG5cdFx0XHRcdFx0XHRtZXNzYWdlOiBcIk11c3QgYmUgYW4gQXJyYXlcIlxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGN1clYubGVuZ3RoICE9PSBjdXJTLmxlbmd0aCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgUmVzdHJpY3Rpb25FcnJvcih7XG5cdFx0XHRcdFx0dmFsdWU6IGN1clYsXG5cdFx0XHRcdFx0cm9vdCxcblx0XHRcdFx0XHRtZXNzYWdlLFxuXHRcdFx0XHRcdHNvdXJjZUVycjogbmV3IFJlc3RyaWN0aW9uRXJyb3Ioe1xuXHRcdFx0XHRcdFx0dmFsdWU6IGN1clYsXG5cdFx0XHRcdFx0XHRyb290LFxuXHRcdFx0XHRcdFx0bWVzc2FnZTogXCJNdXN0IGJlIGFuIEFycmF5IG9mIGxlbmd0aCBcIiArIGN1clMubGVuZ3RoXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGN1clMubGVuZ3RoOyArK2kpIHtcblx0XHRcdFx0Y29uc3QgcyA9IGN1clNbaV07XG5cdFx0XHRcdGNvbnN0IHYgPSBjdXJWW2ldO1xuXHRcdFx0XHRpZiAodHlwZW9mIHMgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0XHRcdHZhbGlkYXRlQ29uZGl0aW9uYWxWYWx1ZShtZXNzYWdlLCBzLCB2LCByb290KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRxLnB1c2goW3MsIHZdKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyB1c2luZyBPYmplY3RTY2hlbWFcblx0XHRcdGlmICghKGN1clYgaW5zdGFuY2VvZiBPYmplY3QpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBSZXN0cmljdGlvbkVycm9yKHtcblx0XHRcdFx0XHR2YWx1ZTogY3VyVixcblx0XHRcdFx0XHRyb290LFxuXHRcdFx0XHRcdG1lc3NhZ2UsXG5cdFx0XHRcdFx0c291cmNlRXJyOiBuZXcgUmVzdHJpY3Rpb25FcnJvcih7XG5cdFx0XHRcdFx0XHR2YWx1ZTogY3VyVixcblx0XHRcdFx0XHRcdHJvb3QsXG5cdFx0XHRcdFx0XHRtZXNzYWdlOiBcIk11c3QgYmUgYW4gT2JqZWN0XCJcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGN1clYpKSB7XG5cdFx0XHRcdGlmICghY3VyUy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IFJlc3RyaWN0aW9uRXJyb3Ioe1xuXHRcdFx0XHRcdFx0dmFsdWU6IGN1clYsXG5cdFx0XHRcdFx0XHRyb290LFxuXHRcdFx0XHRcdFx0bWVzc2FnZSxcblx0XHRcdFx0XHRcdHNvdXJjZUVycjogbmV3IFJlc3RyaWN0aW9uRXJyb3Ioe1xuXHRcdFx0XHRcdFx0XHR2YWx1ZTogY3VyVixcblx0XHRcdFx0XHRcdFx0cm9vdCxcblx0XHRcdFx0XHRcdFx0bWVzc2FnZTogYE11c3QgYmUgYW4gT2JqZWN0IGNvbnRhaW5pbmcga2V5IFwiJHtrZXl9XCJgXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRmb3IgKGNvbnN0IFtrZXksIHNjaGVtYVZdIG9mIE9iamVjdC5lbnRyaWVzKGN1clMpKSB7XG5cdFx0XHRcdGlmICghY3VyVi5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IFJlc3RyaWN0aW9uRXJyb3Ioe1xuXHRcdFx0XHRcdFx0dmFsdWU6IGN1clYsXG5cdFx0XHRcdFx0XHRyb290LFxuXHRcdFx0XHRcdFx0bWVzc2FnZSxcblx0XHRcdFx0XHRcdHNvdXJjZUVycjogbmV3IFJlc3RyaWN0aW9uRXJyb3Ioe1xuXHRcdFx0XHRcdFx0XHR2YWx1ZTogY3VyVixcblx0XHRcdFx0XHRcdFx0cm9vdCxcblx0XHRcdFx0XHRcdFx0bWVzc2FnZTogYE11c3QgYmUgYW4gT2JqZWN0IGNvbnRhaW5pbmcga2V5IFwiJHtrZXl9XCJgXG5cdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0eXBlb2Ygc2NoZW1hViA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHRcdFx0Y29uc3QgY29uZCA9IHNjaGVtYVY7XG5cdFx0XHRcdFx0dmFsaWRhdGVDb25kaXRpb25hbFZhbHVlKG1lc3NhZ2UsIGNvbmQsIGN1clZba2V5XSwgcm9vdCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cS5wdXNoKFtzY2hlbWFWLCBjdXJWW2tleV1dKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRjdXIgPSBxLnBvcCgpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIG1rRGlzanVuY3Rpb25GYWN0b3J5PFQ+KFxuXHRiYXNlVmFsaWRhdG9yOiBQYXNzdGhyb3VnaFZhbGlkYXRvcjxUPixcblx0YmFzZU1lc3NhZ2VHZXR0ZXI6ICgpID0+IHN0cmluZ1xuKSB7XG5cdHJldHVybiA8VT4oXG5cdFx0b3B0TWVzc2FnZTogc3RyaW5nIHwgQ29uZGl0aW9uYWw8VT4gfCBTY2hlbWE8VT4sXG5cdFx0Li4uY29uZGl0aW9uYWxzT3JTY2hlbWFzOiBBcnJheTxDb25kaXRpb25hbDxVPiB8IFNjaGVtYTxVPj5cblx0KTogUmVzdHJpY3Rpb248VCB8IFU+ID0+IHtcblx0XHRjb25zdCB7IG1lc3NhZ2UsIGNvbmRpdGlvbmFscywgc2NoZW1hcyB9ID0gcGFyc2VBcmdzPFU+KFxuXHRcdFx0b3B0TWVzc2FnZSxcblx0XHRcdGNvbmRpdGlvbmFsc09yU2NoZW1hc1xuXHRcdCk7XG5cblx0XHRjb25zdCBjaGlsZFJlc3RyaWN0aW9uID0gbmV3IFJlc3RyaWN0aW9uKFxuXHRcdFx0bWVzc2FnZSxcblx0XHRcdC4uLmNvbmRpdGlvbmFscyxcblx0XHRcdC4uLnNjaGVtYXNcblx0XHQpO1xuXG5cdFx0Y29uc3QgZGlzanVuY3Rpb25QcmVkaWNhdGUgPSAodjogVCB8IFUpID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGJhc2VWYWxpZGF0b3IodiBhcyBUKTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdC8qIGRvIG5vdGhpbmcgKi9cblx0XHRcdH1cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNoaWxkUmVzdHJpY3Rpb24odiBhcyBVKTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0aWYgKHR5cGVvZiBvcHRNZXNzYWdlID09PSBcInN0cmluZ1wiKSB7XG5cdFx0XHRyZXR1cm4gbmV3IFJlc3RyaWN0aW9uKG1lc3NhZ2UsIGRpc2p1bmN0aW9uUHJlZGljYXRlKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgYmFzZU1lc3NhZ2UgPSBiYXNlTWVzc2FnZUdldHRlcigpO1xuXHRcdFx0aWYgKGJhc2VNZXNzYWdlICE9PSBkZWZhdWx0RXJyb3JNZXNzYWdlKSB7XG5cdFx0XHRcdHJldHVybiBuZXcgUmVzdHJpY3Rpb24oXG5cdFx0XHRcdFx0XCIoXCIgKyBiYXNlTWVzc2FnZSArIFwiIHx8IFwiICsgbWVzc2FnZSArIFwiKVwiLFxuXHRcdFx0XHRcdGRpc2p1bmN0aW9uUHJlZGljYXRlXG5cdFx0XHRcdCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gbmV3IFJlc3RyaWN0aW9uKG1lc3NhZ2UsIGRpc2p1bmN0aW9uUHJlZGljYXRlKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIG1rVW5pb25GYWN0b3J5PFQ+KFxuXHRiYXNlVmFsaWRhdG9yOiBQYXNzdGhyb3VnaFZhbGlkYXRvcjxUPixcblx0YmFzZU1lc3NhZ2VHZXR0ZXI6ICgpID0+IHN0cmluZ1xuKSB7XG5cdHJldHVybiA8VT4oXG5cdFx0b3B0TWVzc2FnZTogc3RyaW5nIHwgQ29uZGl0aW9uYWw8VT4gfCBTY2hlbWE8VT4sXG5cdFx0Li4uY29uZGl0aW9uYWxzT3JTY2hlbWFzOiBBcnJheTxDb25kaXRpb25hbDxVPiB8IFNjaGVtYTxVPj5cblx0KTogUmVzdHJpY3Rpb248VCAmIFU+ID0+IHtcblx0XHRjb25zdCB7IG1lc3NhZ2UsIGNvbmRpdGlvbmFscywgc2NoZW1hcyB9ID0gcGFyc2VBcmdzPFU+KFxuXHRcdFx0b3B0TWVzc2FnZSxcblx0XHRcdGNvbmRpdGlvbmFsc09yU2NoZW1hc1xuXHRcdCk7XG5cblx0XHRjb25zdCBjaGlsZFJlc3RyaWN0aW9uID0gbmV3IFJlc3RyaWN0aW9uKFxuXHRcdFx0bWVzc2FnZSxcblx0XHRcdC4uLmNvbmRpdGlvbmFscyxcblx0XHRcdC4uLnNjaGVtYXNcblx0XHQpO1xuXG5cdFx0Y29uc3QgdW5pb25QcmVkaWNhdGUgPSAodjogVCAmIFUpID0+IHtcblx0XHRcdGJhc2VWYWxpZGF0b3IodiBhcyBUKTtcblx0XHRcdGNoaWxkUmVzdHJpY3Rpb24odiBhcyBVKTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH07XG5cblx0XHRpZiAodHlwZW9mIG9wdE1lc3NhZ2UgPT09IFwic3RyaW5nXCIpIHtcblx0XHRcdHJldHVybiBuZXcgUmVzdHJpY3Rpb24obWVzc2FnZSwgdW5pb25QcmVkaWNhdGUpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBiYXNlTWVzc2FnZSA9IGJhc2VNZXNzYWdlR2V0dGVyKCk7XG5cdFx0XHRpZiAoYmFzZU1lc3NhZ2UgIT09IGRlZmF1bHRFcnJvck1lc3NhZ2UpIHtcblx0XHRcdFx0cmV0dXJuIG5ldyBSZXN0cmljdGlvbihcblx0XHRcdFx0XHRcIihcIiArIGJhc2VNZXNzYWdlICsgXCIgJiYgXCIgKyBtZXNzYWdlICsgXCIpXCIsXG5cdFx0XHRcdFx0dW5pb25QcmVkaWNhdGVcblx0XHRcdFx0KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBuZXcgUmVzdHJpY3Rpb24obWVzc2FnZSwgdW5pb25QcmVkaWNhdGUpO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcbn1cblxuZGVlcEZyZWV6ZSh0aGlzKTtcbiJdfQ==