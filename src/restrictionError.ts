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

/*.----------------------------------------------------------------------------,
 /                          [class.RestrictionError]                         */

export class RestrictionError<T> extends Error {
	public value: T;
	public root: any;
	public code: string;
	public messageStack: string[];
	constructor(options: {
		value: T;
		root?: any;
		message?: string;
		sourceErr?: RestrictionError<any>;
	}) {
		super(
			options.message === undefined
				? "Value Restriction Failure"
				: options.message
		);
		Object.setPrototypeOf(this, RestrictionError.prototype);
		Object.defineProperty(this, "name", {
			value: "RestrictionError",
			writable: true,
			enumerable: false,
			configurable: true
		});
		this.code = "ERR_RESTRICTION";
		this.messageStack =
			options.sourceErr !== undefined &&
			options.sourceErr instanceof RestrictionError
				? options.sourceErr.messageStack.concat([this.message])
				: [this.message];
		if (this.stack !== undefined) {
			this.stack = this.stack.replace(
				/^(RestrictionError)/m,
				"$1 [ERR_RESTRICTION]"
			);
		}
		this.value = options.value;
		this.root = options.root !== undefined ? options.root : options.value;
		deepFreeze(this);
	}
}

deepFreeze(this);
