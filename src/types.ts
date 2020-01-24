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

import { Restriction } from "./restriction";

/*.----------------------------------------------------------------------------,
 /                                   Types                                   */

export type Predicate<T> = (...value: T[]) => boolean;
export type Assertion<T> = (...value: T[]) => void;
export interface PassthroughValidator<T> {
	<U extends T>(value: U): U;
	<U extends T[]>(...value: U): U;
}

/** Describes any value that may be tested using a Conditional */
export type ConditionalTarget = any;
/** Describes an Object to be tested by a Schema */
export type SchemaTarget =
	| {
			[key: string]: any;
	  }
	| any[];

/**
 * Describes a function used to specify conditions for Restriction instances.
 * Accepts ConditionalTarget as only argument.
 * May be one of: Restriction instance, true/false predicate, or void assertion.
 */
export type Conditional<T extends ConditionalTarget> =
	| Predicate<T>
	| Assertion<T>
	| PassthroughValidator<T>
	| Restriction<T>;
/** Refers to the type of a value within a Schema Object/Array */
export type SchemaValueType<T extends SchemaTarget> = Conditional<T> | Schema<T>;
/** Refers to the type of a value within a SchemaTarget Object/Array */
export type SchemaTargetValueType = any;
/**
 * Describes an Object/Array whose structure outlines a SchemaTarget structure.
 * Keys / nesting must be match SchemaTarget; values must be Conditionals.
 */
export type Schema<T extends SchemaTarget> = {
	[key in keyof T]: SchemaValueType<T[key]>
};
/** Describes any value that may be checked with an instance of Restriction */
export type RestrictionTarget = ConditionalTarget | SchemaTarget;

export type RestrictionTargetType<
	RestrictionGeneric
> = RestrictionGeneric extends Restriction<infer T> ? T : never;

export type SchemaTargetType<SchemaGeneric> = SchemaGeneric extends Schema<infer T>
	? T
	: never;

/**
 * A function that uses new to construct an object of type T.
 */
export interface ConstructorFunction<T> extends Function {
	name: string;
	new (...args: any): T;
}
