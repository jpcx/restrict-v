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

import { ConstructorFunction } from "./types";

import { Restriction } from "./restriction";

export const restrict = (() => {
	const primitive = {
		string: new Restriction(
			"Must be a 'string'",
			(v: string) => typeof v === "string"
		),
		number: new Restriction(
			"Must be a 'number'",
			(v: number) => typeof v === "number"
		),
		bigint: new Restriction(
			"Must be a 'bigint'",
			(v: bigint) => typeof v === "bigint"
		),
		boolean: new Restriction(
			"Must be a 'boolean'",
			(v: boolean) => typeof v === "boolean"
		),
		null: new Restriction("Must be null", (v: null) => v === null),
		undefined: new Restriction(
			"Must be 'undefined'",
			(v: undefined) => typeof v === "undefined"
		),
		symbol: new Restriction(
			"Must be a 'symbol'",
			(v: symbol) => typeof v === "symbol"
		)
	};

	const equality = {
		eq: <T>(target: T) =>
			new Restriction(
				"Must be strictly equal to " + target,
				(v: T) => v === target
			),
		neq: <T>(target: T) =>
			new Restriction(
				"Must not be strictly equal to " + target,
				(v: T) => v !== target
			)
	};

	const range = {
		integer: new Restriction("Must be an integer", (v: number | bigint) => {
			if (typeof v === "bigint") {
				return true;
			} else if (typeof v === "number") {
				return Math.floor(v) === v;
			} else {
				return false;
			}
		}),

		gt: <N extends number | bigint, T = N extends number ? number : bigint>(
			bound: N
		) => {
			if (typeof bound === "number" || typeof bound === "bigint") {
				return new Restriction<T>(
					`Must be a '${typeof bound}' greater than ${bound}`,
					(v: T) => typeof v === typeof bound && v > (bound as N & T)
				);
			} else {
				throw new Error(
					"[restrict-v] Invalid Argument: restrict.gt creation requires a " +
						"bound of type 'number' or 'bigint'"
				);
			}
		},

		lt: <N extends number | bigint, T = N extends number ? number : bigint>(
			bound: N
		) => {
			if (typeof bound === "number" || typeof bound === "bigint") {
				return new Restriction<T>(
					`Must be a '${typeof bound}' less than ${bound}`,
					(v: T) => typeof v === typeof bound && v < (bound as N & T)
				);
			} else {
				throw new Error(
					"[restrict-v] Invalid Argument: restrict.lt creation requires " +
						"a bound of type 'number' or 'bigint'"
				);
			}
		},

		gte: <N extends number | bigint, T = N extends number ? number : bigint>(
			bound: N
		) => {
			if (typeof bound === "number" || typeof bound === "bigint") {
				return new Restriction<T>(
					`Must be a '${typeof bound}' greater than or equal to ${bound}`,
					(v: T) => typeof v === typeof bound && v >= (bound as N & T)
				);
			} else {
				throw new Error(
					"[restrict-v] Invalid Argument: restrict.gte creation requires " +
						"a bound of type 'number' or 'bigint'"
				);
			}
		},

		lte: <N extends number | bigint, T = N extends number ? number : bigint>(
			bound: N
		) => {
			if (typeof bound === "number" || typeof bound === "bigint") {
				return new Restriction<T>(
					`Must be a '${typeof bound}' less than or equal to ${bound}`,
					(v: T) => typeof v === typeof bound && v <= (bound as N & T)
				);
			} else {
				throw new Error(
					"[restrict-v] Invalid Argument: restrict.lte creation requires " +
						"a bound of type 'number' or 'bigint'"
				);
			}
		},

		range: <
			NLower extends number | bigint,
			NUpper extends NLower extends number ? number : bigint,
			T = NLower extends number ? number : bigint
		>(
			lower: NLower,
			upper: NUpper,
			lowerInclusive: boolean = true,
			upperInclusive: boolean = false
		) => {
			if (
				typeof lower === typeof upper &&
				(typeof lower === "number" || typeof lower === "bigint")
			) {
				return new Restriction<T>(
					`Must be a '${typeof lower}' within the range ${
						lowerInclusive ? "[" : "("
					}${lower}, ${upper}${upperInclusive ? "]" : ")"}`,
					lowerInclusive ? range.gte(lower) : range.gt(lower),
					upperInclusive ? range.lte(upper) : range.lt(upper)
				);
			} else {
				throw new Error(
					"[restrict-v] Invalid Argument: restrict.range creation requires " +
						"same-typed lower and upper bounds of type 'number' or 'bigint'"
				);
			}
		}
	};

	const rangePresets = {
		positive: range
			.gte(0)
			.or(range.gte(BigInt(0)))
			.msg("Must be a positive 'number' or 'bigint'"),
		negative: range
			.lt(0)
			.or(range.lt(BigInt(0)))
			.msg("Must be a negative 'number' or 'bigint'")
	};

	const instances = {
		Object: new Restriction(
			"Must be an instance of Object",
			(v: object) => v instanceof Object
		),
		Array: new Restriction(
			"Must be an instance of Array",
			(v: any[]) => v instanceof Array
		),
		instanceof: <T>(instance: ConstructorFunction<T>) =>
			new Restriction(
				`Must be an instance of ${instance.name}`,
				(value: T) => value instanceof instance
			)
	};

	const strings = {
		match: (matcher: string | RegExp) => {
			if (matcher instanceof RegExp) {
				return primitive.string.and(
					"Must be a 'string' matching " + matcher.toString(),
					(v: string) => v.match(matcher)
				);
			} else if (typeof matcher === "string") {
				return primitive.string.and(
					"Must be a 'string' matching '" + matcher + "'",
					(v: string) => v.match(matcher)
				);
			} else {
				throw Error(
					"[restrict-v] Invalid Argument: Must supply a string or RegExp " +
						"instance for restrict.match creation"
				);
			}
		}
	};

	return {
		...primitive,
		...equality,
		...range,
		...rangePresets,
		...instances,
		...strings
	};
})();

deepFreeze(this);
