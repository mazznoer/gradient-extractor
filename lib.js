/* This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Copyright (C) 2023 Nor Khasyatillah
 */

(function() {

    'use strict';

    const {
        EPSILON
    } = Number;

    function simplifyColors(colors, tolerance = 3) {
        const xs = [];
        for (let i = 0, n = colors.length; i < n; i++) {
            xs.push((i * 1000) / (n - 1));
        }
        console.log(xs.length, xs[0], xs[xs.length - 1]);

        let c1 = [];
        let c2 = [];
        let c3 = [];
        let c4 = [];

        for (const [r, g, b, a] of colors) {
            c1.push(r / 255 * 100);
            c2.push(g / 255 * 100);
            c3.push(b / 255 * 100);
            c4.push(a / 255 * 100);
        }

        const smplfy = ys => {
            const points = xs.map((x, i) => ({
                x,
                y: ys[i]
            }));
            return simplify(points, tolerance, true).map(p => p.x);
        };

        let rpos = smplfy(c1);
        let gpos = smplfy(c2);
        let bpos = smplfy(c3);
        let apos = smplfy(c4);

        let rgbaPos = mergeSorted(mergeSorted(rpos, gpos), mergeSorted(bpos, apos));
        let pos = [];
        let colors2 = [];

        for (const v of rgbaPos) {
            pos.push(v / 1000);

            for (const [j, t] of xs.entries()) {
                if (Math.abs(v - t) < EPSILON) {
                    colors2.push(colors[j]);
                    break;
                }
            }
        }

        console.log(pos.length === colors2.length);
        return [pos, colors2];
    }

    function mergeSorted(a, b) {
        const n1 = a.length;
        const n2 = b.length;
        let i = 0;
        let j = 0;
        let prev = -Infinity;
        const res = [];

        while (i < n1 && j < n2) {
            if (a[i] < b[j]) {
                if (Math.abs(a[i] - prev) > EPSILON) {
                    res.push(a[i]);
                }
                prev = a[i];
                i++;
            } else {
                if (Math.abs(b[j] - prev) > EPSILON) {
                    res.push(b[j]);
                }
                prev = b[j];
                j++;
            }
        }

        while (i < n1) {
            if (Math.abs(a[i] - prev) > EPSILON) {
                res.push(a[i]);
            }
            prev = a[i];
            i++;
        }

        while (j < n2) {
            if (Math.abs(b[j] - prev) > EPSILON) {
                res.push(b[j]);
            }
            prev = b[j];
            j++;
        }

        return res;
    }

    window.GXLib = {
        simplifyColors
    };

})();