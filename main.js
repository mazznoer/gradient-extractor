(function() {

    'use strict';

    const $ = document.querySelector.bind(document);

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

    function proses_img(str) {
        const img = document.createElement('img');
        $('.input').appendChild(img);

        img.addEventListener('load', () => {
            console.log('image loaded');
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