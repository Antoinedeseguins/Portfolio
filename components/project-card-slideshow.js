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
                    return [...new Set([...page.querySelectorAll(
                        ".image-grid img, .image-grid2 img, .image-grid3 img"
                    )].map(img => new URL(img.getAttribute("src"), projectUrl).href))];
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
        const inner = card.querySelector(".flip-card-inner");
        const back = card.querySelector(".flip-card-back img");
        if (!link || !inner || !back) return;

        const originalSrc = back.getAttribute("src");
        const originalUrl = back.src;
        let timer;
        let session = 0;
        let hovered = false;

        const stop = () => {
            hovered = false;
            session++;
            window.clearTimeout(timer);
            back.setAttribute("src", originalSrc);
        };

        card.addEventListener("mouseenter", () => {
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

                if (loaded) back.src = nextUrl;
                nextIndex++;
                timer = window.setTimeout(showNext, 2000);
            };

            const style = window.getComputedStyle(inner);
            const durations = style.transitionDuration.split(",").map(value =>
                parseFloat(value) * (value.trim().endsWith("ms") ? 1 : 1000)
            );
            const delays = style.transitionDelay.split(",").map(value =>
                parseFloat(value) * (value.trim().endsWith("ms") ? 1 : 1000)
            );
            const flipDuration = Math.max(...durations.map((duration, index) =>
                duration + delays[index % delays.length]
            ));

            window.clearTimeout(timer);
            timer = window.setTimeout(showNext, flipDuration + 2000);
        });

        card.addEventListener("mouseleave", stop);
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) stop();
        });
    });
})();
