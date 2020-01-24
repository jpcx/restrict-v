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

import { DeepFreeze } from "../";

test("Whitelists global props upon construction", () => {
	const tmp: {
		[key: string]: any;
	} = ((globalThis as {
		[key: string]: any;
	}).tmpWhitelistTest = {
		foo: "bar"
	});
	const deepFreeze = new DeepFreeze();
	deepFreeze(globalThis);

	tmp.bar = "baz";

	expect(tmp.bar).toStrictEqual("baz");
});

test("Whitelists global prototype chains upon construction", () => {
	const tmp: {
		[key: string]: any;
	} = ((globalThis as {
		[key: string]: any;
	}).tmpWhitelistTest = {
		foo: "bar"
	});
	const tmpProto = {
		foo: "bar"
	};
	Object.setPrototypeOf(tmp, tmpProto);
	const deepFreeze = new DeepFreeze();
	deepFreeze(tmpProto);

	(tmpProto as any).bar = "baz";

	expect((tmpProto as any).bar).toStrictEqual("baz");
});

test("Freezes global props created after construction", () => {
	const deepFreeze = new DeepFreeze();
	const tmp: {
		[key: string]: any;
	} = ((globalThis as {
		[key: string]: any;
	}).tmpWhitelistTest = {
		foo: "bar",
		bar: {
			baz: {
				beh: "quux"
			}
		}
	});
	deepFreeze(globalThis);

	expect(() => {
		tmp.bar.baz.beh = "quuz";
	}).toThrowError(TypeError);

	expect(() => {
		tmp.bar.baz.beeh = "quasi";
	}).toThrowError(TypeError);

	expect(tmp.bar.baz.beh).toStrictEqual("quux");
	expect(tmp.bar.baz.beeh).toBeUndefined();
});

test("Freezes local props", () => {
	const deepFreeze = new DeepFreeze();
	const tmp = {
		foo: "bar",
		bar: {
			baz: {
				beh: "quux"
			}
		}
	};
	deepFreeze(tmp);

	expect(() => {
		(tmp as any).bar.baz.beh = "quuz";
	}).toThrowError(TypeError);

	expect(() => {
		(tmp as any).bar.baz.beeh = "quasi";
	}).toThrowError(TypeError);

	expect((tmp as any).bar.baz.beh).toStrictEqual("quux");
	expect((tmp as any).bar.baz.beeh).toBeUndefined();
});

test("Freezes prototype chain", () => {
	const deepFreeze = new DeepFreeze();
	const tmpProto = {
		baz: "beeeeh",
		qux: {
			quz: {
				quux: "quuz"
			}
		}
	};
	const tmp = {
		foo: "bar"
	};
	Object.setPrototypeOf(tmp, tmpProto);

	Object.getPrototypeOf(tmp).qux.quz.bah = "bar";

	expect(Object.getPrototypeOf(tmp).qux.quz.bah).toStrictEqual("bar");

	deepFreeze(tmp);

	expect(Object.getPrototypeOf(tmp)).toStrictEqual(tmpProto);
	expect(
		() => (Object.getPrototypeOf(tmp).qux.quz.bah = "something else")
	).toThrowError(TypeError);
	expect(
		() => (Object.getPrototypeOf(tmp).qux.quz.quuz = "newprop")
	).toThrowError(TypeError);
	expect(Object.getPrototypeOf(tmp).qux.quz.bah).toStrictEqual("bar");
	expect(Object.getPrototypeOf(tmp).qux.quz.quuz).toBeUndefined();
});
