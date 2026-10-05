(() => {
    const captures = [...document.querySelectorAll(
        '.image-grid img, .image-grid2 img, .image-grid3 img'
    )];
    if (!captures.length) return;

    const images = [...new Map(captures.map(img => [img.src, img])).values()];
    const dialog = document.createElement('dialog');
    dialog.className = 'project-viewer';
    dialog.setAttribute('aria-label', 'Project screenshots');
    dialog.innerHTML = `
        <button class="project-viewer-close" type="button" aria-label="Close viewer" autofocus><span aria-hidden="true">&times;</span></button>
        <button class="project-viewer-prev" type="button" aria-label="Previous image">&#10094;</button>
        <img class="project-viewer-image" alt="">
        <button class="project-viewer-next" type="button" aria-label="Next image">&#10095;</button>
        <p class="project-viewer-count" aria-live="polite"></p>`;
    // Outside the body so its responsive zoom does not scale the viewer.
    document.documentElement.appendChild(dialog);

    const preview = dialog.querySelector('img');
    preview.addEventListener('load', () => {
        if (preview.naturalHeight) {
            preview.style.setProperty('--capture-ratio', preview.naturalWidth / preview.naturalHeight);
        }
    });
    const counter = dialog.querySelector('p');
    let index = 0;
    let trigger;
    let previousOverflow;
    let previousBodyOverflow;

    const show = position => {
        index = (position + images.length) % images.length;
        preview.src = images[index].src;
        preview.alt = images[index].alt || 'Project screenshot';
        counter.textContent = `${index + 1} / ${images.length}`;
    };

    const open = img => {
        if (dialog.open) return;
        trigger = img;
        show(images.findIndex(image => image.src === img.src));
        previousOverflow = document.documentElement.style.overflow;
        previousBodyOverflow = document.body.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        dialog.showModal();
    };

    captures.forEach(img => {
        img.classList.add('project-capture');
        img.tabIndex = 0;
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', `Enlarge screenshot: ${img.alt || 'project'}`);
        img.addEventListener('click', () => open(img));
        img.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open(img);
            }
        });
    });

    dialog.querySelector('.project-viewer-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.project-viewer-prev').addEventListener('click', () => show(index - 1));
    dialog.querySelector('.project-viewer-next').addEventListener('click', () => show(index + 1));
    dialog.querySelectorAll('.project-viewer-prev, .project-viewer-next').forEach(button => {
        button.hidden = images.length < 2;
    });
    dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            show(index + (event.key === 'ArrowRight' ? 1 : -1));
        }
    });
    dialog.addEventListener('close', () => {
        document.documentElement.style.overflow = previousOverflow;
        document.body.style.overflow = previousBodyOverflow;
        trigger?.focus({ preventScroll: true });
    });
})();
