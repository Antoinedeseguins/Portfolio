// Grow continuously above Full HD, including simulated browser viewports.
(() => {
    let previousScale;

    function updateDesktopScale() {
        const width = window.innerWidth;
        // An exponent below 1 lets browser zoom-out still shrink the content.
        const scale = Math.min(1.7325, 0.855 * Math.pow(Math.max(1, width / 1920), 0.85));

        if (scale !== previousScale) {
            document.documentElement.style.setProperty('--desktop-scale', scale);
            previousScale = scale;
        }
    }

    updateDesktopScale();
    window.addEventListener('resize', updateDesktopScale);
    window.addEventListener('pageshow', updateDesktopScale);
})();
