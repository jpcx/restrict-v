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

import { restrict, Restriction } from "../";

const objects = {
	b8998n: BigInt(8998),
	b8999n: BigInt(8999),
	b9000n: BigInt(9000),
	b9001n: BigInt(9001),
	b9002n: BigInt(9002),
	emptyArray: [],
	oneNumberArray: [42],
	twoNumberArray: [42, 64],
	object: {
		foo: "bar"
	},
	map: new Map()
};

const testRestriction = <T>({
	name,
	fn,
	good,
	bad,
	badMsg
}: {
	name: string;
	fn: Restriction<T>;
	good: T[];
	bad: any[];
	badMsg: string;
}) => {
	test(name, () => {
		for (const g of good) {
			expect(fn(g)).toStrictEqual(g);
		}
		for (const b of bad) {
			expect(() => (fn as Restriction<any>)(b)).toThrowError(badMsg);
		}
	});
};

/* // Restriction Presets // */

testRestriction({
	name: "restrict.string",
	fn: restrict.string,
	good: ["foo"],
	bad: [42],
	badMsg: "Must be a 'string'"
});
testRestriction({
	name: "restrict.number",
	fn: restrict.number,
	good: [42],
	bad: ["foo"],
	badMsg: "Must be a 'number'"
});
testRestriction({
	name: "restrict.bigint",
	fn: restrict.bigint,
	good: [objects.b9000n],
	bad: [42],
	badMsg: "Must be a 'bigint'"
});
testRestriction({
	name: "restrict.boolean",
	fn: restrict.boolean,
	good: [true],
	bad: [42],
	badMsg: "Must be a 'boolean'"
});
testRestriction({
	name: "restrict.null",
	fn: restrict.null,
	good: [null],
	bad: [undefined],
	badMsg: "Must be null"
});
testRestriction({
	name: "restrict.undefined",
	fn: restrict.undefined,
	good: [undefined],
	bad: [null],
	badMsg: "Must be 'undefined'"
});
testRestriction({
	name: "restrict.symbol",
	fn: restrict.symbol,
	good: [Symbol.iterator],
	bad: ["foo"],
	badMsg: "Must be a 'symbol'"
});
testRestriction({
	name: "restrict.integer",
	fn: restrict.integer,
	good: [42, objects.b9000n],
	bad: [3.14],
	badMsg: "Must be an integer"
});
testRestriction({
	name: "restrict.positive",
	fn: restrict.positive,
	good: [42, objects.b9000n],
	bad: [-42, -objects.b9000n],
	badMsg: "Must be a positive 'number' or 'bigint'"
});
testRestriction({
	name: "restrict.negative",
	fn: restrict.negative,
	good: [-42, -objects.b9000n],
	bad: [42, objects.b9000n],
	badMsg: "Must be a negative 'number' or 'bigint'"
});
testRestriction({
	name: "restrict.Object",
	fn: restrict.Object,
	good: [objects.object],
	bad: [42],
	badMsg: "Must be an instance of Object"
});
testRestriction({
	name: "restrict.Array",
	fn: restrict.Array,
	good: [objects.emptyArray],
	bad: [objects.object, 42],
	badMsg: "Must be an instance of Array"
});

/* // Restriction Factories // */

testRestriction({
	name: "restrict.eq",
	fn: restrict.eq(42),
	good: [42],
	bad: [41, 43, objects.b9000n],
	badMsg: "Must be strictly equal to 42"
});
testRestriction({
	name: "restrict.neq",
	fn: restrict.neq(objects.b9000n),
	good: [objects.b8999n, objects.b9001n, 9000],
	bad: [objects.b9000n],
	badMsg: "Must not be strictly equal to " + objects.b9000n
});
testRestriction({
	name: "restrict.gt",
	fn: restrict.gt(42),
	good: [43],
	bad: [42, 41, objects.b9000n],
	badMsg: "Must be a 'number' greater than 42"
});
testRestriction({
	name: "restrict.gt",
	fn: restrict.gt(objects.b9000n),
	good: [objects.b9001n],
	bad: [objects.b9000n, objects.b8999n, 42],
	badMsg: "Must be a 'bigint' greater than " + objects.b9000n
});
testRestriction({
	name: "restrict.lt",
	fn: restrict.lt(42),
	good: [41],
	bad: [42, 43, objects.b9000n],
	badMsg: "Must be a 'number' less than 42"
});
testRestriction({
	name: "restrict.lt",
	fn: restrict.lt(objects.b9000n),
	good: [objects.b8999n],
	bad: [objects.b9000n, objects.b9001n, 42],
	badMsg: "Must be a 'bigint' less than " + objects.b9000n
});
testRestriction({
	name: "restrict.gte",
	fn: restrict.gte(42),
	good: [42, 43],
	bad: [41, objects.b9000n],
	badMsg: "Must be a 'number' greater than or equal to 42"
});
testRestriction({
	name: "restrict.gte",
	fn: restrict.gte(objects.b9000n),
	good: [objects.b9000n, objects.b9001n],
	bad: [objects.b8999n, 42],
	badMsg: "Must be a 'bigint' greater than or equal to " + objects.b9000n
});
testRestriction({
	name: "restrict.lte",
	fn: restrict.lte(42),
	good: [42, 41],
	bad: [43, objects.b9000n],
	badMsg: "Must be a 'number' less than or equal to 42"
});
testRestriction({
	name: "restrict.lte",
	fn: restrict.lte(objects.b9000n),
	good: [objects.b9000n, objects.b8999n],
	bad: [objects.b9001n, 42],
	badMsg: "Must be a 'bigint' less than or equal to " + objects.b9000n
});
testRestriction({
	name: "restrict.range",
	fn: restrict.range(41, 43),
	good: [41, 42],
	bad: [40, 43, 44],
	badMsg: `Must be a 'number' within the range [41, 43)`
});
testRestriction({
	name: "restrict.range",
	fn: restrict.range(41, 43, false),
	good: [42],
	bad: [40, 41, 43, 44],
	badMsg: `Must be a 'number' within the range (41, 43)`
});
testRestriction({
	name: "restrict.range",
	fn: restrict.range(41, 43, false, true),
	good: [42, 43],
	bad: [40, 41, 44],
	badMsg: `Must be a 'number' within the range (41, 43]`
});
testRestriction({
	name: "restrict.range",
	fn: restrict.range(41, 43, true, true),
	good: [41, 42, 43],
	bad: [40, 44],
	badMsg: `Must be a 'number' within the range [41, 43]`
});
testRestriction({
	name: "restrict.range",
	fn: restrict.range(objects.b8999n, objects.b9001n),
	good: [objects.b8999n, objects.b9000n],
	bad: [objects.b8998n, objects.b9001n, objects.b9002n],
	badMsg: `Must be a 'bigint' within the range [${objects.b8999n}, ${
		objects.b9001n
	})`
});
testRestriction({
	name: "restrict.range",
	fn: restrict.range(objects.b8999n, objects.b9001n, false),
	good: [objects.b9000n],
	bad: [objects.b8998n, objects.b8999n, objects.b9001n, objects.b9002n],
	badMsg: `Must be a 'bigint' within the range (${objects.b8999n}, ${
		objects.b9001n
	})`
});
testRestriction({
	name: "restrict.range",
	fn: restrict.range(objects.b8999n, objects.b9001n, false, true),
	good: [objects.b9000n, objects.b9001n],
	bad: [objects.b8998n, objects.b8999n, objects.b9002n],
	badMsg: `Must be a 'bigint' within the range (${objects.b8999n}, ${
		objects.b9001n
	}]`
});
testRestriction({
	name: "restrict.range",
	fn: restrict.range(objects.b8999n, objects.b9001n, true, true),
	good: [objects.b8999n, objects.b9000n, objects.b9001n],
	bad: [objects.b8998n, objects.b9002n],
	badMsg: `Must be a 'bigint' within the range [${objects.b8999n}, ${
		objects.b9001n
	}]`
});
testRestriction({
	name: "restrict.instanceof",
	fn: restrict.instanceof(Map),
	good: [objects.map],
	bad: [objects.object],
	badMsg: "Must be an instance of Map"
});
testRestriction({
	name: "restrict.match",
	fn: restrict.match(/fo/g),
	good: ["foo"],
	bad: ["bar"],
	badMsg: "Must be a 'string' matching /fo/g"
});
testRestriction({
	name: "restrict.match",
	fn: restrict.match("fo"),
	good: ["foo"],
	bad: ["bar"],
	badMsg: "Must be a 'string' matching 'fo'"
});

/* // Edge Cases // */

test("Invalid restriction factory args", () => {
	expect(() =>
		(restrict.gt as (v: any) => Restriction<any>)("foo")
	).toThrowError(
		"[restrict-v] Invalid Argument: restrict.gt creation requires a " +
			"bound of type 'number' or 'bigint'"
	);
	expect(() =>
		(restrict.lt as (v: any) => Restriction<any>)("foo")
	).toThrowError(
		"[restrict-v] Invalid Argument: restrict.lt creation requires a " +
			"bound of type 'number' or 'bigint'"
	);
	expect(() =>
		(restrict.gte as (v: any) => Restriction<any>)("foo")
	).toThrowError(
		"[restrict-v] Invalid Argument: restrict.gte creation requires a " +
			"bound of type 'number' or 'bigint'"
	);
	expect(() =>
		(restrict.lte as (v: any) => Restriction<any>)("foo")
	).toThrowError(
		"[restrict-v] Invalid Argument: restrict.lte creation requires a " +
			"bound of type 'number' or 'bigint'"
	);

	expect(() =>
		(restrict.range as (...v: any[]) => Restriction<any>)("foo", "bar")
	).toThrowError(
		"[restrict-v] Invalid Argument: restrict.range creation requires " +
			"same-typed lower and upper bounds of type 'number' or 'bigint'"
	);
	expect(() =>
		(restrict.range as (...v: any[]) => Restriction<any>)(32, BigInt(35))
	).toThrowError(
		"[restrict-v] Invalid Argument: restrict.range creation requires " +
			"same-typed lower and upper bounds of type 'number' or 'bigint'"
	);

	expect(() =>
		(restrict.match as (v: any) => Restriction<any>)(32)
	).toThrowError(
		"[restrict-v] Invalid Argument: Must supply a string or RegExp " +
			"instance for restrict.match creation"
	);
});

