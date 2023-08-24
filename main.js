(function() {

    'use strict';

    const $ = document.querySelector.bind(document);
    const image = $('#image');
    const points = [];

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
        const length = path.getTotalLength();
        const sample = Math.min(Math.floor(length), 500);
        const part = length / sample;
        let cur = 0;
        while (cur <= length) {
            const pos = path.getPointAtLength(cur);
            cur += part;
            colors.push(ctx.getImageData(pos.x, pos.y, 1, 1).data);
        }
        console.log(colors.length, colors[0]);
    });

    function proses_img(str) {
        image.innerHTML = '';
        const img = document.createElement('img');

        img.addEventListener('load', () => {
            // Canvas for the image
            const imgCanvas = document.createElement('canvas');
            imgCanvas.width = img.width;
            imgCanvas.height = img.height;
            imgCanvas.getContext('2d').drawImage(img, 0, 0);
            image.appendChild(imgCanvas);

            // Canvas for drawing the lines
            const canvas = document.createElement('canvas');
            canvas.width = imgCanvas.width;
            canvas.height = imgCanvas.height;
            const ctx = canvas.getContext('2d');
            image.appendChild(canvas);

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
                }
            });
        });

        img.src = str;
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