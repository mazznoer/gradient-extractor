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

    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);
    const image = $('#image');
    const template = $("#template-text-widget");
    const consoleInput = new GXLib.Console($('#console-input'));
    const consoleOutput = new GXLib.Console($('#console-output'));
    const points = [];
    const gradient = new GXLib.Gradient([], []);

    consoleInput.log('Select image file.');

    function textWidget(content, title = "") {
        const elm = template.content.cloneNode(true);
        elm.querySelector("span").innerText = title;
        elm.querySelector("textarea").value = content;
        return elm;
    }

    $('#file input').addEventListener('change', e => {
        if (!e.target.files[0]) {
            return;
        }
        read_file(e.target.files[0])
            .then(str => proses_img(str))
            .catch(err => console.log(err));
        e.target.value = '';
    });

    $('#file').addEventListener('drop', e => {
        e.preventDefault();

        if (e.dataTransfer.items) {
            const item = [...e.dataTransfer.items][0];
            if (item.kind === 'file') {
                const file = item.getAsFile();
                read_file(file)
                    .then(str => proses_img(str))
                    .catch(err => console.log(err));
            }
        } else {
            const file = [...e.dataTransfer.files][0];
            read_file(file)
                .then(str => proses_img(str))
                .catch(err => console.log(err));
        }
    });

    $('#file').addEventListener('dragover', e => {
        e.preventDefault()
    });

    $('#extract').addEventListener('click', () => {
        const canvas = $('#image canvas');

        if (canvas == null || points.length == 0) {
            return;
        }

        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Get colors along lines
        const colors = [];
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        path.setAttribute('points', points.map(([x, y]) => `${x},${y}`).join(' '));
        image.appendChild(path);
        const length = lineTotalLength();
        const sample = Math.min(Math.floor(length), 500);
        const part = length / sample;
        let cur = 0;
        while (cur <= length) {
            const pos = path.getPointAtLength(cur);
            cur += part;
            colors.push(ctx.getImageData(pos.x, pos.y, 1, 1).data);
        }

        const [pos, cols] = GXLib.simplifyColors(colors);
        gradient.colors = cols;
        gradient.positions = pos;
        consoleOutput.log(`${cols.length} color stops from ${colors.length} sample colors.`);

        $('#result').style.display = 'block';

        const div = $('#gradient');
        div.style.background = `linear-gradient(to right, ${gradient.css()})`;
        const bounds = div.getBoundingClientRect();

        const el = $('#texts');
        el.innerHTML = '';
        el.appendChild(textWidget(gradient.colorsStr(), 'Colors'));
        el.appendChild(textWidget(gradient.positionsStr(), 'Positions'));
        el.appendChild(textWidget(`linear-gradient(${gradient.css()})`, 'CSS'));
        el.appendChild(textWidget(gradient.svg(), 'SVG'));

        const div2 = $("#stops-pos");
        div2.innerHTML = '';
        const stopsPos = gradient.canvasStopsPos(bounds.width, bounds.width * 0.04);
        stopsPos.setAttribute('title', 'Color stop positions');
        div2.appendChild(stopsPos);

        $$('.output .text-widget button').forEach(el => el.addEventListener('click', e => {
            const nextElm = e.target.nextElementSibling;
            if (nextElm != null) {
                GXLib.copy(nextElm.value);
            }
        }));

        $$('.output .text-widget textarea').forEach(el => {
            el.style.height = el.scrollHeight + 'px';
        });
    });

    $('#reset').addEventListener('click', () => {
        let canvasImg = $('#image canvas');
        if (canvasImg == null) {
            return;
        }
        let canvas = canvasImg.nextSibling;
        let ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        points.length = 0;
        consoleInput.log("Click on the image to draw line");
    });

    $('#save-svg').addEventListener('click', () => {
        const blob = new Blob([gradient.svgFull()], {
            type: 'image/svg+xml;charset=utf-8'
        });
        GXLib.download(blob, 'gradient.svg');
    });

    $('#save-ggr').addEventListener('click', () => {
        const blob = new Blob([gradient.ggr()], {
            type: 'text/plain'
        });
        GXLib.download(blob, 'gradient.ggr');
    });

    let controller = null;

    function proses_img(str) {
        if (controller !== null) {
            controller.abort();
            points.length = 0;
        }

        image.innerHTML = '';
        const img = document.createElement('img');

        img.addEventListener('load', () => {
            // Canvas for the image
            const imgCanvas = document.createElement('canvas');
            imgCanvas.width = img.width;
            imgCanvas.height = img.height;
            imgCanvas.getContext('2d', {
                willReadFrequently: true
            }).drawImage(img, 0, 0);
            image.appendChild(imgCanvas);

            // Canvas for drawing the lines
            const canvas = document.createElement('canvas');
            canvas.width = imgCanvas.width;
            canvas.height = imgCanvas.height;
            const ctx = canvas.getContext('2d');
            image.appendChild(canvas);

            controller = new AbortController();

            canvas.addEventListener('click', event => {
                const bounds = event.target.getBoundingClientRect();
                const scale = img.width / bounds.width;
                const x = (event.clientX - bounds.left) * scale;
                const y = (event.clientY - bounds.top) * scale;
                points.push([x, y]);
                ctx.lineWidth = 2 * scale;
                ctx.strokeStyle = '#fff';
                ctx.shadowColor = '#000b';
                ctx.shadowBlur = 3 * scale;

                if (points.length == 1) {
                    // draw circle for first point
                    ctx.beginPath();
                    ctx.arc(x, y, 5 * scale, 0, Math.PI * 2, false);
                    ctx.fillStyle = '#fff';
                    ctx.fill();
                } else {
                    // draw line
                    const prev = points[points.length - 2];
                    ctx.beginPath();
                    ctx.moveTo(prev[0], prev[1]);
                    ctx.lineTo(x, y);
                    ctx.stroke();

                    consoleInput.log('Click "Extract" to extract the gradient.');
                }
            }, {
                signal: controller.signal
            });
        });

        img.src = str;
        $('#options').style.display = 'block';
        consoleInput.log("Click on the image to draw line");
    }

    function dist(p1, p2) {
        return Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2);
    }

    function lineTotalLength() {
        let length = 0;
        for (let i = 0, n = points.length - 1; i < n; i++) {
            length += dist(points[i], points[i + 1]);
        }
        return length;
    }

    function read_file(f) {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.onerror = error => reject(error);
            fr.readAsDataURL(f);
        });
    }

})();