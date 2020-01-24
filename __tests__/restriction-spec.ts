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

import {
	restrict,
	Restriction,
	RestrictionTargetType,
	SchemaTargetType
} from "../";

/* // Restriction Schemas // */

const SITE_CREATION_TIME = 1548174793502;
const rTimeWithinSiteExistence = restrict.range(SITE_CREATION_TIME, Date.now());
const userSchema = {
	name: restrict.string,
	age: restrict.number,
	joined: rTimeWithinSiteExistence,
	credentials: {
		sessionToken: restrict.match(
			/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/m
		)
	},
	history: {
		lastThreeVisits: [
			rTimeWithinSiteExistence,
			rTimeWithinSiteExistence,
			rTimeWithinSiteExistence
		]
	}
};

const rUserSchema = new Restriction(userSchema)
	.and(
		(v: SchemaTargetType<typeof userSchema>) =>
			v.history.lastThreeVisits[2] >= v.joined &&
			v.history.lastThreeVisits[2] < v.history.lastThreeVisits[1] &&
			v.history.lastThreeVisits[1] < v.history.lastThreeVisits[0]
	)
	.msg("Must be a valid user snapshot object");

type UserSchema = RestrictionTargetType<typeof rUserSchema>;

const testSchemaPass = (sch: UserSchema) => {
	expect(rUserSchema(sch)).toStrictEqual(sch);
};

const testSchemaFail = (sch: any) => {
	expect(() => rUserSchema(sch)).toThrowError(
		"Must be a valid user snapshot object"
	);
};

test("General", () => {
	testSchemaPass({
		name: "John Smith",
		age: 42,
		joined: Date.now() - 1000000,
		credentials: {
			sessionToken: "90212B1A-1D3C-464F-BF7B-D3FA081FAB19"
		},
		history: {
			lastThreeVisits: [
				Date.now() - 100001,
				Date.now() - 100002,
				Date.now() - 100003
			]
		}
	});
});

test("Fail Base Structure: Missing Properties", () => {
	testSchemaFail({
		age: 42,
		joined: Date.now() - 1000000,
		credentials: {
			sessionToken: "90212B1A-1D3C-464F-BF7B-D3FA081FAB19"
		},
		history: {
			lastThreeVisits: [
				Date.now() - 100001,
				Date.now() - 100002,
				Date.now() - 100003
			]
		}
	});
	testSchemaFail({
		name: "John Smith",
		age: 42,
		joined: Date.now() - 1000000,
		credentials: {},
		history: {
			lastThreeVisits: [
				Date.now() - 100001,
				Date.now() - 100002,
				Date.now() - 100003
			]
		}
	});
});

test("Fail Base Structure: Extra Properties", () => {
	testSchemaFail({
		name: "John Smith",
		age: 42,
		joined: Date.now() - 1000000,
		credentials: {
			sessionToken: "90212B1A-1D3C-464F-BF7B-D3FA081FAB19"
		},
		history: {
			lastThreeVisits: [
				Date.now() - 100001,
				Date.now() - 100002,
				Date.now() - 100003
			]
		},
		extra: "I shouldn't be here"
	});
	testSchemaFail({
		name: "John Smith",
		age: 42,
		joined: Date.now() - 1000000,
		credentials: {},
		history: {
			lastThreeVisits: [
				Date.now() - 100001,
				Date.now() - 100002,
				Date.now() - 100003,
				Date.now() - 100004
			]
		}
	});
});

test("Fail Union Condition", () => {
	testSchemaFail({
		name: "John Smith",
		age: 42,
		joined: Date.now() - 1000000,
		credentials: {
			sessionToken: "90212B1A-1D3C-464F-BF7B-D3FA081FAB19"
		},
		history: {
			lastThreeVisits: [
				Date.now() - 100002,
				Date.now() - 100002,
				Date.now() - 100002
			]
		},
		extra: "I shouldn't be here"
	});
});

test("Array Restriction", () => {
	const rStringPair = new Restriction("Must be a pair of strings", [
		restrict.string,
		restrict.string
	]);
	const testData = ["foo", "bar"];
	expect(rStringPair(testData)).toStrictEqual(testData);
	// @ts-ignore
	expect(() => rStringPair(["foo", 847])).toThrowError(
		"Must be a pair of strings"
	);
});

/* // Edge Cases // */

test("Schema value type checking", () => {
	const badSchema = {
		key: "not a function or schema"
	};
	expect(() => new Restriction(badSchema)).toThrowError(
		"[restrict-v] Invalid Argument: Schema values must " +
			"be Conditional functions or Object/Array Schemas"
	);
});

test("Circular References Within Schemas", () => {
	const circ = (() => {
		interface Circ {
			circ: Circ;
		}
		const self: {
			[key: string]: any;
		} = {};
		self.circ = self;
		return self as Circ;
	})();
	const [circA, circB] = (() => {
		interface CircA {
			circB: CircB;
		}
		interface CircB {
			circA: CircA;
		}
		const selfA: {
			[key: string]: any;
		} = {};
		const selfB: {
			[key: string]: any;
		} = {};
		selfA.circB = selfB;
		selfB.circA = selfA;
		return [selfA, selfB] as [CircA, CircB];
	})();
	const desiredError =
		"[restrict-v] Invalid Argument: Circular references within schemas are " +
		"not supported at this time";
	expect(() => new Restriction(circ)).toThrowError(desiredError);
	expect(() => new Restriction(circA)).toThrowError(desiredError);
	expect(() => new Restriction(circB)).toThrowError(desiredError);
});

test("Empty restrictions", () => {
	const r = new Restriction();
	expect(r(42)).toStrictEqual(42);
	const rMsg = new Restriction("I will never throw");
	expect(rMsg(42)).toStrictEqual(42);

	const rAnd = r.and(restrict.string);
	expect(rAnd("I am a foo")).toStrictEqual("I am a foo");
	expect(() => rAnd(42)).toThrowError("Must be a 'string'");
});

test("Setter message assignment", () => {
	const r = new Restriction(restrict.string);
	expect(r.message).toStrictEqual("Must be a 'string'");
	r.message = "Calling r with a non-string results in a throw!";
	expect(() => (r as Restriction<any>)(42)).toThrowError(
		"Calling r with a non-string results in a throw!"
	);
	expect(() => {
		(r.message as any) = 42;
	}).toThrowError(
		"[restrict-v] Invalid Argument: restriction.message must be a string"
	);
});

test("Multi-value Restriction usage", () => {
	const [foo, bar] = restrict.string("foo", "bar");
	expect(foo).toStrictEqual("foo");
	expect(bar).toStrictEqual("bar");
});
