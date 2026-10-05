(() => {
    const galleries = new Map();

    const loadGallery = projectUrl => {
        if (!galleries.has(projectUrl)) {
            galleries.set(projectUrl, fetch(projectUrl)
                .then(response => {
                    if (!response.ok) throw new Error("Unable to load project gallery");
                    return response.text();
                })
                .then(html => {
                    const page = new DOMParser().parseFromString(html, "text/html");
                    const images = [...page.querySelectorAll(
                        ".image-grid img, .image-grid2 img, .image-grid3 img"
                    )].map(img => new URL(img.getAttribute("src"), projectUrl).href);
                    const excluded = new URL(projectUrl).pathname.endsWith("/spaceage.html")
                        ? new Set(images.slice(0, 2))
                        : new Set();
                    return [...new Set(images)].filter(url => !excluded.has(url));
                })
                .catch(() => []));
        }
        return galleries.get(projectUrl);
    };

    const preload = url => new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });

    document.querySelectorAll(".flip-card").forEach(card => {
        const link = card.querySelector("a");
        const back = card.querySelector(".flip-card-back img");
        if (!link || !back) return;

        const originalSrc = back.getAttribute("src");
        const originalUrl = back.src;
        let timer;
        let resetTimer;
        let overlay;
        let fade;
        let session = 0;
        let hovered = false;

        const reset = () => {
            if (fade) fade.cancel();
            if (overlay) overlay.remove();
            fade = null;
            overlay = null;
            back.setAttribute("src", originalSrc);
        };

        const stop = () => {
            hovered = false;
            session++;
            window.clearTimeout(timer);
            window.clearTimeout(resetTimer);
            const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 350;
            resetTimer = window.setTimeout(reset, duration);
        };

        card.addEventListener("mouseenter", () => {
            window.clearTimeout(resetTimer);
            reset();
            hovered = true;
            const currentSession = ++session;
            let nextIndex = 1;
            const gallery = loadGallery(link.href).then(images =>
                [originalUrl, ...images.filter(url => url !== originalUrl)]
            );

            const showNext = async () => {
                const images = await gallery;
                if (!hovered || session !== currentSession || images.length < 2) return;

                const nextUrl = images[nextIndex % images.length];
                const loaded = await preload(nextUrl);
                if (!hovered || session !== currentSession) return;

                let fadeDuration = 0;
                if (loaded) {
                    overlay = back.cloneNode(false);
                    overlay.src = nextUrl;
                    overlay.alt = "";
                    overlay.removeAttribute("id");
                    overlay.setAttribute("aria-hidden", "true");
                    overlay.classList.add("card-slideshow-layer");
                    back.parentElement.appendChild(overlay);

                    fadeDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 350;
                    fade = overlay.animate([{ opacity: 0 }, { opacity: 1 }], {
                        duration: fadeDuration,
                        easing: "ease-in-out",
                        fill: "forwards"
                    });
                    await fade.finished.catch(() => {});
                    if (!hovered || session !== currentSession) return;

                    back.src = nextUrl;
                    overlay.remove();
                    overlay = null;
                    fade = null;
                }
                nextIndex++;
                timer = window.setTimeout(showNext, 2000 - fadeDuration);
            };

            window.clearTimeout(timer);
            timer = window.setTimeout(showNext, 2000);
        });

        card.addEventListener("mouseleave", stop);
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) stop();
        });
    });
})();
