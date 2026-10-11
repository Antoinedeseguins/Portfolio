// Fit each loaded category into the fixed-height mobile or tablet panel.
(() => {
    const compactLayout = window.matchMedia('(max-width: 1060px), (min-width: 577px) and (max-width: 1366px) and (hover: none) and (pointer: coarse)');
    const originalSizes = new WeakMap();
    const originalLineHeights = new WeakMap();
    let frame;

    function fitText() {
        const panel = document.querySelector('#content, #content2');
        if (!panel) return;
        const elements = [...panel.querySelectorAll('*')];
        elements.forEach(element => {
            if (!originalSizes.has(element)) originalSizes.set(element, element.style.fontSize);
            if (!originalLineHeights.has(element)) originalLineHeights.set(element, element.style.lineHeight);
            element.style.fontSize = originalSizes.get(element);
            element.style.lineHeight = originalLineHeights.get(element);
        });
        panel.style.removeProperty('--tablet-text-scale');
        panel.style.removeProperty('--tablet-spacing-scale');
        // Hide whole trailing icons rather than clipping part of the next one.
        panel.querySelectorAll('.logo-skills, .logo-tools').forEach(row => {
            const icons = [...row.querySelectorAll('img')];
            icons.forEach(icon => { icon.hidden = false; });
            if (window.innerWidth > 576) return;
            const style = getComputedStyle(row);
            const gap = parseFloat(style.columnGap) || 0;
            const available = row.clientWidth - (parseFloat(style.paddingLeft) || 0)
                - (parseFloat(style.paddingRight) || 0);
            let used = 0;
            let full = false;
            icons.forEach(icon => {
                const iconStyle = getComputedStyle(icon);
                const width = icon.getBoundingClientRect().width
                    + (parseFloat(iconStyle.marginLeft) || 0) + (parseFloat(iconStyle.marginRight) || 0);
                const next = used + (used ? gap : 0) + width;
                full ||= next > available;
                icon.hidden = full;
                if (!full) used = next;
            });
        });
        if (!compactLayout.matches || !panel.clientHeight) return;

        // Section headings keep their CSS size, including any nested emphasis.
        const scalableElements = elements.filter(element => !element.closest('h1, h2, h3, .project-section-title'));
        const metrics = scalableElements.map(element => {
            const style = getComputedStyle(element);
            const size = parseFloat(style.fontSize);
            return { size, lineHeight: parseFloat(style.lineHeight) / size };
        });
        const applyScale = scale => {
            const spacingScale = Math.max(0.9, Math.min(1, 1 - (1 - scale) * 0.3));
            panel.style.setProperty('--tablet-text-scale', scale);
            panel.style.setProperty('--tablet-spacing-scale', spacingScale);
            scalableElements.forEach((element, index) => {
                const { size, lineHeight } = metrics[index];
                element.style.fontSize = `${size * scale}px`;
                if (Number.isFinite(lineHeight)) {
                    element.style.lineHeight = Math.max(1.2, lineHeight * spacingScale);
                }
            });
        };
        // Leave room for icon shadows and avoid rounding into the clipped edge.
        const fits = () => {
            const bounds = panel.getBoundingClientRect();
            const bottomLimit = bounds.bottom - 8;
            return panel.scrollHeight <= panel.clientHeight
                && panel.scrollWidth <= panel.clientWidth
                && [...panel.children].every(child => child.getBoundingClientRect().bottom <= bottomLimit);
        };

        let low = 0.5;
        let high = 1.35;
        applyScale(high);
        if (fits()) return;

        for (let step = 0; step < 9; step++) {
            const scale = (low + high) / 2;
            applyScale(scale);
            if (fits()) low = scale;
            else high = scale;
        }
        applyScale(low);
    }

    function scheduleFit() {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(fitText);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const panel = document.querySelector('#content, #content2');
        if (!panel) return;
        new MutationObserver(scheduleFit).observe(panel, { childList: true, subtree: true });
        new ResizeObserver(scheduleFit).observe(panel);
        panel.addEventListener('load', scheduleFit, true);
        compactLayout.addEventListener('change', scheduleFit);
        window.addEventListener('resize', scheduleFit);
        document.fonts.ready.then(scheduleFit);
        scheduleFit();
    });
})();
