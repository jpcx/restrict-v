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

/*.----------------------------------------------------------------------------,
 /                             [class.DeepFreeze]                            */ 

/**
 * Upon construction, whitelists all deep properties and prototype chains in the
 * globalThis object. Upon function use, freezes any deep properties and
 * prototype chains attached to the provided object that are not in the
 * globalThis whitelist.
 */
export interface DeepFreeze extends Function {
	<T extends object>(freezeRoot: T): T;
}
export class DeepFreeze extends Function {
	constructor() {
		super();
		const globalThisWhitelist = (() => {
			const wl = new WeakSet();
			const q = [globalThis];
			while (q.length) {
				const cur = q.pop();
				if (cur instanceof Object && !wl.has(cur)) {
					wl.add(cur);
					q.push(Object.getPrototypeOf(cur));
					Object.values(Object.getOwnPropertyDescriptors(cur))
						.reduce((a: any[], v) => a.concat(Object.values(v)), [])
						.forEach(x => q.push(x));
				}
			}
			return wl;
		})();
		const self: DeepFreeze = freezeRoot => {
			if (!(freezeRoot instanceof Object)) {
				return freezeRoot;
			}
			const visited = new WeakSet();
			const q = [freezeRoot];
			while (q.length) {
				const cur = q.pop();
				if (cur instanceof Object && !visited.has(cur)) {
					visited.add(cur);
					if (!globalThisWhitelist.has(cur)) {
						Object.freeze(cur);
					}
					q.push(Object.getPrototypeOf(cur));
					Object.values(Object.getOwnPropertyDescriptors(cur))
						.reduce((a: any[], v) => a.concat(Object.values(v)), [])
						.forEach(x => q.push(x));
				}
			}
			if (!globalThisWhitelist.has(freezeRoot)) {
				Object.freeze(freezeRoot);
			}
			return freezeRoot;
		};
		return Object.freeze(Object.setPrototypeOf(self, DeepFreeze.prototype));
	}
}
