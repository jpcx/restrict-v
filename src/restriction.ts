/**
 * @module restrict-v
 */

/**
 * @author  Justin Collier <jpcxist@gmail.com>
 * @license GPL-3.0-or-later
 * @see {@link http://github.com/jpcx/restrict-v|GitHub}
 */

/*                                                                            *
 * =========================================================================  *
 * -------------------------------------------------------------------------  *
 *                              __         .__        __                      *
 *    _______   ____   _______/  |________|__| _____/  |_          ___  __    *
 *    \_  __ \_/ __ \ /  ___/\   __\_  __ \  |/ ___\   __\  ______ \  \/ /    *
 *     |  | \/\  ___/ \___ \  |  |  |  | \/  \  \___|  |   /_____/  \   /     *
 *     |__|    \___  >____  > |__|  |__|  |__|\___  >__|             \_/      *
 *                 \/     \/                      \/                          *
 *                         Runtime Value Restrictor                           *
 * -------------------------------------------------------------------------  *
 * =========================================================================  *
 *                                                                            *
 *  This program is free software: you can redistribute it and/or modify      *
 *  it under the terms of the GNU General Public License as published by      *
 *  the Free Software Foundation, either version 3 of the License, or         *
 *  (at your option) any later version.                                       *
 *                                                                            *
 *  This program is distributed in the hope that it will be useful,           *
 *  but WITHOUT ANY WARRANTY; without even the internalied warranty of        *
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the             *
 *  GNU General Public License for more details.                              *
 *                                                                            *
 *  You should have received a copy of the GNU General Public License         *
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.    *
 *                                                                            */

import { DeepFreeze } from "./deepFreeze";
const deepFreeze = new DeepFreeze();

import {
	Conditional,
	ConditionalTarget,
	PassthroughValidator,
	RestrictionTarget,
	Schema,
	SchemaTarget,
	SchemaTargetValueType,
	SchemaValueType
} from "./types";

import { RestrictionError } from "./restrictionError";

/*.----------------------------------------------------------------------------,
 /                            [class.Restriction]                            */

export interface Restriction<T extends RestrictionTarget>
	extends Function,
		PassthroughValidator<T> {
	message: string;
	or<U>(
		message: string,
		...conditionals: Array<Conditional<U>>
	): Restriction<T | U>;
	or<U>(message: string, ...schemas: Array<Schema<U>>): Restriction<T | U>;
	or<U>(
		message: string,
		...conditionalsOrSchemas: Array<Conditional<U> | Schema<U>>
	): Restriction<T | U>;
	or<U>(...conditionals: Array<Conditional<U>>): Restriction<T | U>;
	or<U>(...schemas: Array<Schema<U>>): Restriction<T | U>;
	or<U>(
		...conditionalsOrSchemas: Array<Conditional<U> | Schema<U>>
	): Restriction<T | U>;

	and<U>(
		message: string,
		...conditionals: Array<Conditional<U>>
	): Restriction<T & U>;
	and<U>(message: string, ...schemas: Array<Schema<U>>): Restriction<T & U>;
	and<U>(
		message: string,
		...conditionalsOrSchemas: Array<Conditional<U> | Schema<U>>
	): Restriction<T & U>;
	and<U>(...conditionals: Array<Conditional<U>>): Restriction<T & U>;
	and<U>(...schemas: Array<Schema<U>>): Restriction<T & U>;
	and<U>(
		...conditionalsOrSchemas: Array<Conditional<U> | Schema<U>>
	): Restriction<T & U>;

	msg(message: string): Restriction<T>;
}

export class Restriction<T extends RestrictionTarget> extends Function {
	constructor(message: string, ...conditionals: Array<Conditional<T>>);
	constructor(message: string, ...schemas: Array<Schema<T>>);
	constructor(
		message: string,
		...conditionalsOrSchemas: Array<Conditional<T> | Schema<T>>
	);
	constructor(...conditionals: Array<Conditional<T>>);
	constructor(...schemas: Array<Schema<T>>);
	constructor(...conditionalsOrSchemas: Array<Conditional<T> | Schema<T>>);
	constructor(
		optMessage: string | Conditional<T> | Schema<T>,
		...conditionalsOrSchemas: Array<Conditional<T> | Schema<T>>
	) {
		super();

		const parsedArgs = parseArgs<T>(optMessage, conditionalsOrSchemas);
		let { message } = parsedArgs;
		const { conditionals, schemas } = parsedArgs;

		const messageGetter = () => message;

		const self: Restriction<T> = (<U extends T>() => {
			const restriction: PassthroughValidator<U> = (...values: U[]) => {
				values.forEach(v => {
					schemas.forEach(s => validateSchemaValue(message, s, v));
					conditionals.forEach(c => validateConditionalValue(message, c, v));
				});
				return values.length === 1 ? values[0] : values;
			};
			(restriction as Restriction<U>).or = mkDisjunctionFactory(
				restriction,
				messageGetter
			);
			(restriction as Restriction<U>).and = mkUnionFactory(
				restriction,
				messageGetter
			);
			return restriction as Restriction<U>;
		})();
		Object.defineProperty(self, "message", {
			get: messageGetter,
			set: (msg: string) => {
				if (typeof msg === "string") {
					message = msg;
				} else {
					throw new Error(
						"[restrict-v] Invalid Argument: restriction.message must be a " +
							"string"
					);
				}
			},
			enumerable: true,
			configurable: false
		});
		self.msg = (msg: string) => {
			message = msg;
			return self;
		};
		return deepFreeze(Object.setPrototypeOf(self, Restriction.prototype));
	}
}

/*.----------------------------------------------------------------------------,
 /                          Private Functions & Data                         */

const defaultErrorMessage = "An invalid value was detected";

function verifySchema<T extends RestrictionTarget>(sch: Schema<T>): void {
	const q = [sch]; // LIFO
	const checkSchemaValue = (v: SchemaValueType<T>) => {
		if (typeof v === "function") {
			/* do nothing */
		} else if (v instanceof Object) {
			q.push(v);
		} else {
			throw new Error(
				"[restrict-v] Invalid Argument: Schema values must " +
					"be Conditional functions or Object/Array Schemas"
			);
		}
	};

	let cur = q.pop();
	const visited = new WeakSet();
	while (cur !== undefined) {
		if (!visited.has(cur)) {
			visited.add(cur);
		} else {
			throw new Error(
				"[restrict-v] Invalid Argument: Circular references within schemas " +
					"are not supported at this time"
			);
		}
		if (cur instanceof Array) {
			for (const value of cur) {
				checkSchemaValue(value);
			}
		} else if (cur instanceof Object && !(typeof cur === "function")) {
			for (const value of Object.values(cur)) {
				checkSchemaValue(value);
			}
		} else {
			throw new Error(
				"[restrict-v] Internal Error: Invalid state reached; verifySchema " +
					"was called with a non-object schema or a non-object was added to " +
					"the schema queue. Please notify the developer."
			);
		}
		cur = q.pop();
	}
}

function parseArgs<T extends RestrictionTarget>(
	optMessage: string | Conditional<T> | Schema<T>,
	conditionalsOrSchemas: Array<Conditional<T> | Schema<T>>
): {
	message: string;
	conditionals: Array<Conditional<T>>;
	schemas: Array<Schema<T>>;
} {
	let message: string = defaultErrorMessage;
	const conditionals: Array<Conditional<T>> = [];
	const schemas: Array<Schema<T>> = [];

	let msgOffset = 0;

	const optMessageIsString = typeof optMessage === "string";

	if (optMessageIsString) {
		message = optMessage as string;
		msgOffset = 1;
	} else if (optMessage !== undefined) {
		conditionalsOrSchemas.unshift(optMessage as Conditional<T> | Schema<T>);
	} else {
		return {
			message,
			schemas,
			conditionals
		};
	}

	const restrictionMessages: string[] = [];

	for (let i = 0; i < conditionalsOrSchemas.length; ++i) {
		const arg = conditionalsOrSchemas[i];
		if (typeof arg === "function") {
			conditionals.push(arg);
			if (arg instanceof Restriction) {
				restrictionMessages.push(arg.message);
			}
		} else if (arg instanceof Object) {
			verifySchema(arg);
			schemas.push(arg);
		} else {
			throw Error(
				`[restrict-v] Invalid Argument: Constructor arg #${i +
					1 +
					msgOffset} was not a Conditional function or a Schema Object`
			);
		}
	}

	if (
		restrictionMessages.length === conditionalsOrSchemas.length &&
		!optMessageIsString
	) {
		// all conditionalsOrSchemas are Restrictions and message was not provided
		// create a default message of all restrictionMessages joined with &&
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

function validateConditionalValue<T extends ConditionalTarget>(
	message: string,
	conditional: Conditional<T>,
	value: T,
	root?: any
): void {
	if (conditional instanceof Restriction) {
		try {
			conditional(value);
		} catch (err) {
			throw new RestrictionError<T>({
				value,
				root,
				message,
				sourceErr: err as RestrictionError<T>
			});
		}
	} else {
		let result: boolean | void;
		try {
			result = conditional(value);
		} catch (err) {
			throw new RestrictionError({
				value,
				root,
				message
			});
		}
		if (!result) {
			throw new RestrictionError({
				value,
				root,
				message
			});
		}
	}
}

function validateSchemaValue<T extends SchemaTarget>(
	message: string,
	schema: Schema<T>,
	root: T
): void {
	const q: Array<[Schema<SchemaTarget>, SchemaTargetValueType]> = [
		[schema, root]
	]; // LIFO
	let cur = q.pop();
	while (cur !== undefined) {
		const [curS, curV] = cur;
		if (curS instanceof Array) {
			// using ArraySchema
			if (!(curV instanceof Array)) {
				throw new RestrictionError({
					value: curV,
					root,
					message,
					sourceErr: new RestrictionError({
						value: curV,
						root,
						message: "Must be an Array"
					})
				});
			}
			if (curV.length !== curS.length) {
				throw new RestrictionError({
					value: curV,
					root,
					message,
					sourceErr: new RestrictionError({
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
				} else {
					q.push([s, v]);
				}
			}
		} else {
			// using ObjectSchema
			if (!(curV instanceof Object)) {
				throw new RestrictionError({
					value: curV,
					root,
					message,
					sourceErr: new RestrictionError({
						value: curV,
						root,
						message: "Must be an Object"
					})
				});
			}
			for (const key of Object.keys(curV)) {
				if (!curS.hasOwnProperty(key)) {
					throw new RestrictionError({
						value: curV,
						root,
						message,
						sourceErr: new RestrictionError({
							value: curV,
							root,
							message: `Must be an Object containing key "${key}"`
						})
					});
				}
			}
			for (const [key, schemaV] of Object.entries(curS)) {
				if (!curV.hasOwnProperty(key)) {
					throw new RestrictionError({
						value: curV,
						root,
						message,
						sourceErr: new RestrictionError({
							value: curV,
							root,
							message: `Must be an Object containing key "${key}"`
						})
					});
				}
				if (typeof schemaV === "function") {
					const cond = schemaV;
					validateConditionalValue(message, cond, curV[key], root);
				} else {
					q.push([schemaV, curV[key]]);
				}
			}
		}
		cur = q.pop();
	}
}

function mkDisjunctionFactory<T>(
	baseValidator: PassthroughValidator<T>,
	baseMessageGetter: () => string
) {
	return <U>(
		optMessage: string | Conditional<U> | Schema<U>,
		...conditionalsOrSchemas: Array<Conditional<U> | Schema<U>>
	): Restriction<T | U> => {
		const { message, conditionals, schemas } = parseArgs<U>(
			optMessage,
			conditionalsOrSchemas
		);

		const childRestriction = new Restriction(
			message,
			...conditionals,
			...schemas
		);

		const disjunctionPredicate = (v: T | U) => {
			try {
				baseValidator(v as T);
				return true;
			} catch (e) {
				/* do nothing */
			}
			try {
				childRestriction(v as U);
				return true;
			} catch (e) {
				return false;
			}
		};

		if (typeof optMessage === "string") {
			return new Restriction(message, disjunctionPredicate);
		} else {
			const baseMessage = baseMessageGetter();
			if (baseMessage !== defaultErrorMessage) {
				return new Restriction(
					"(" + baseMessage + " || " + message + ")",
					disjunctionPredicate
				);
			} else {
				return new Restriction(message, disjunctionPredicate);
			}
		}
	};
}

function mkUnionFactory<T>(
	baseValidator: PassthroughValidator<T>,
	baseMessageGetter: () => string
) {
	return <U>(
		optMessage: string | Conditional<U> | Schema<U>,
		...conditionalsOrSchemas: Array<Conditional<U> | Schema<U>>
	): Restriction<T & U> => {
		const { message, conditionals, schemas } = parseArgs<U>(
			optMessage,
			conditionalsOrSchemas
		);

		const childRestriction = new Restriction(
			message,
			...conditionals,
			...schemas
		);

		const unionPredicate = (v: T & U) => {
			baseValidator(v as T);
			childRestriction(v as U);
			return true;
		};

		if (typeof optMessage === "string") {
			return new Restriction(message, unionPredicate);
		} else {
			const baseMessage = baseMessageGetter();
			if (baseMessage !== defaultErrorMessage) {
				return new Restriction(
					"(" + baseMessage + " && " + message + ")",
					unionPredicate
				);
			} else {
				return new Restriction(message, unionPredicate);
			}
		}
	};
}

deepFreeze(this);
