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
        for (let i = 0, n = colors.length - 1; i <= n; i++) {
            xs.push((i * 1000) / n);
        }
        console.log(xs.length, xs[0], xs[xs.length - 1]);

        const c1 = [];
        const c2 = [];
        const c3 = [];
        const c4 = [];

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

        const rgbaPos = mergeSorted(mergeSorted(smplfy(c1), smplfy(c2)), mergeSorted(smplfy(c3), smplfy(c4)));
        const pos = [];
        const colors2 = [];

        for (const v of rgbaPos) {
            pos.push(v / 1000);

            for (const [i, t] of xs.entries()) {
                if (Math.abs(v - t) < EPSILON) {
                    colors2.push(colors[i]);
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

    const svgStart = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100">
<title>SVG Gradient</title>
<!-- Generated using https://github.com/mazznoer/gradient-extractor -->
<defs>
<linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
`;

    const svgEnd = `
</linearGradient>
</defs>
<rect x="0" y="0" width="1000" height="100" fill="url(#gradient)" />
</svg>`;

    class Gradient {
        constructor(colors, positions) {
            this.colors = colors;
            this.positions = positions;
        }

        colorsStr() {
            return '[' + this.colors.map(c => '"' + toHex(c) + '"').join(', ') + ']';
        }

        positionsStr() {
            return '[' + this.positions.map(f =>
                parseFloat(f.toFixed(4))
            ).join(', ') + ']';
        }

        css() {
            return toCss(this.colors, this.positions);
        }

        svg() {
            return toSvg(this.colors, this.positions);
        }

        svgFull() {
            return svgStart + this.svg() + svgEnd;
        }

        ggr() {
            return toGgr(this.colors, this.positions);
        }

        canvasStopsPos(width, height) {
            return drawStops(this.positions, width, height);
        }
    }

    function toHex(rgba) {
        let hex = '#';
        hex += rgba[0].toString(16).padStart(2, '0');
        hex += rgba[1].toString(16).padStart(2, '0');
        hex += rgba[2].toString(16).padStart(2, '0');
        if (rgba[3] < 255) {
            hex += rgba[3].toString(16).padStart(2, '0');
        }
        return hex;
    }

    function toCss(colors, positions) {
        const fmt = t => parseFloat(t.toFixed(2));
        const last = colors.length - 1;
        let res = '';

        for (const [i, pos] of positions.entries()) {
            res += `${toHex(colors[i])} ${fmt(pos*100)}%`;

            if (i < last) {
                res += ', ';
            }
        }

        return res;
    }

    function toSvg(colors, positions) {
        const fmt = t => t.toFixed(6);
        const last = colors.length - 1;
        let res = '';

        for (const [i, pos] of positions.entries()) {
            res += `<stop offset="${fmt(pos)}" stop-color="${toHex(colors[i])}" />`;
            if (i < last) {
                res += '\n';
            }
        }

        return res;
    }

    function toGgr(colors, positions, name = "My Gradient") {
        const fmt = t => t.toFixed(6);
        const normColor = c => [c[0] / 255, c[1] / 255, c[2] / 255, c[3] / 255];
        const last = colors.length - 2;
        let res = `GIMP Gradient\nName: ${name}\n${colors.length-1}\n`;

        for (let i = 0, n = colors.length - 1; i < n; i++) {
            const pos_a = positions[i];
            const pos_b = positions[i + 1];
            const pos_m = pos_a + (pos_b - pos_a) / 2;

            res += `${fmt(pos_a)} ${fmt(pos_m)} ${fmt(pos_b)} `;

            let [r, g, b, a] = normColor(colors[i]);
            res += `${fmt(r)} ${fmt(g)} ${fmt(b)} ${fmt(a)} `;

            [r, g, b, a] = normColor(colors[i + 1]);
            res += `${fmt(r)} ${fmt(g)} ${fmt(b)} ${fmt(a)} `;

            res += '0 0 0 0';

            if (i < last) {
                res += '\n';
            }
        }

        return res;
    }

    function drawStops(positions, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Draw color stop positions
        ctx.strokeStyle = "#777";
        ctx.lineWidth = 1;
        for (const t of positions) {
            const x = 1 + t * (width - 2);
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        return canvas;
    }

    async function copy(text) {
        await navigator.clipboard.writeText(text);
    }

    function download(blob, filename) {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.click();
        URL.revokeObjectURL(url);
    }

    class Console {
        constructor(el) {
            this.el = el;
        }

        clear() {
            this.el.innerHTML = '';
        }

        log(msg) {
            this.el.innerHTML = msg;
        }

        error(msg) {
            this.el.innerHTML = `<span class='error'>${msg}</span>`;
        }
    }

    window.GXLib = {
        simplifyColors,
        Gradient,
        copy,
        download,
        Console,
    };

})();