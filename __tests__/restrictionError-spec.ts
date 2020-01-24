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

import { RestrictionError } from "../";

const defaultInstance = new RestrictionError({
	value: "foo"
});

const root = {
	foo: "foo"
};
const rootInstance = new RestrictionError({
	value: "foo",
	root
});

const messageInstance = new RestrictionError({
	value: "foo",
	message: "I am a message"
});

const rootMessageInstance = new RestrictionError({
	value: "foo",
	root,
	message: "I am a message"
});

test("Correct instance", () => {
	expect(defaultInstance instanceof Error).toStrictEqual(true);
	expect(defaultInstance instanceof RestrictionError).toStrictEqual(true);
});

test("Default properties", () => {
	expect(defaultInstance.value).toStrictEqual("foo");
	expect(defaultInstance.root).toStrictEqual("foo");
	expect(defaultInstance.code).toStrictEqual("ERR_RESTRICTION");
	expect(defaultInstance.messageStack.length).toStrictEqual(1);
	expect(defaultInstance.messageStack[0]).toStrictEqual(
		"Value Restriction Failure"
	);
	expect(defaultInstance.message).toStrictEqual("Value Restriction Failure");
});

test("With message specified", () => {
	expect(messageInstance.value).toStrictEqual("foo");
	expect(messageInstance.root).toStrictEqual("foo");
	expect(messageInstance.code).toStrictEqual("ERR_RESTRICTION");
	expect(messageInstance.messageStack.length).toStrictEqual(1);
	expect(messageInstance.messageStack[0]).toStrictEqual("I am a message");
	expect(messageInstance.message).toStrictEqual("I am a message");
});

test("With root specified", () => {
	expect(rootInstance.value).toStrictEqual("foo");
	expect(rootInstance.root).toStrictEqual(root);
	expect(rootInstance.code).toStrictEqual("ERR_RESTRICTION");
	expect(rootInstance.messageStack.length).toStrictEqual(1);
	expect(rootInstance.messageStack[0]).toStrictEqual(
		"Value Restriction Failure"
	);
	expect(rootInstance.message).toStrictEqual("Value Restriction Failure");
});

test("With root and message specified", () => {
	expect(rootMessageInstance.value).toStrictEqual("foo");
	expect(rootMessageInstance.root).toStrictEqual(root);
	expect(rootMessageInstance.code).toStrictEqual("ERR_RESTRICTION");
	expect(rootMessageInstance.messageStack.length).toStrictEqual(1);
	expect(rootMessageInstance.messageStack[0]).toStrictEqual("I am a message");
	expect(rootMessageInstance.message).toStrictEqual("I am a message");
});
