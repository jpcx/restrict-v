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

import { restrict } from "./restrict";
import { Restriction } from "./restriction";
import { RestrictionError } from "./restrictionError";

import {
	Assertion,
	Conditional,
	ConditionalTarget,
	ConstructorFunction,
	PassthroughValidator,
	Predicate,
	RestrictionTarget,
	RestrictionTargetType,
	Schema,
	SchemaTarget,
	SchemaTargetType,
	SchemaTargetValueType,
	SchemaValueType
} from "./types";

export {
	Assertion,
	Conditional,
	ConditionalTarget,
	ConstructorFunction,
	DeepFreeze,
	PassthroughValidator,
	Predicate,
	restrict,
	Restriction,
	RestrictionError,
	RestrictionTarget,
	RestrictionTargetType,
	Schema,
	SchemaTarget,
	SchemaTargetType,
	SchemaTargetValueType,
	SchemaValueType
};

deepFreeze(this);
