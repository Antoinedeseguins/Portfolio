(() => {
    const menu = document.querySelector("#icon-menu");
    if (!menu) return;

    const icons = [...menu.querySelectorAll("img")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reminders = new Set();
    let idleTimer;

    const stopReminder = () => {
        reminders.forEach(animation => animation.cancel());
        reminders.clear();
    };

    const scheduleReminder = () => {
        window.clearTimeout(idleTimer);
        if (document.hidden || reducedMotion.matches) return;
        idleTimer = window.setTimeout(replayReminder, 5000);
    };

    const replayReminder = () => {
        if (document.hidden || reducedMotion.matches) return;
        stopReminder();

        icons.forEach((icon, index) => {
            const animation = icon.animate([
                { transform: "scale(1)", filter: "brightness(1)" },
                { transform: "scale(0.9)", filter: "brightness(1.3)" },
                { transform: "scale(1)", filter: "brightness(1)" }
            ], {
                duration: 1200,
                delay: index * 600,
                easing: "ease-in-out"
            });

            reminders.add(animation);
            animation.onfinish = () => reminders.delete(animation);
        });

        const sequenceDuration = Math.max(0, icons.length - 1) * 600 + 1200;
        idleTimer = window.setTimeout(scheduleReminder, sequenceDuration);
    };

    const resetIdleTimer = () => {
        stopReminder();
        scheduleReminder();
    };

    ["pointermove", "pointerdown", "keydown", "scroll", "wheel", "touchstart", "focusin"]
        .forEach(event => document.addEventListener(event, resetIdleTimer, {
            passive: true,
            capture: true
        }));

    document.addEventListener("visibilitychange", resetIdleTimer);
    reducedMotion.addEventListener("change", resetIdleTimer);
    const initialAnimations = icons.flatMap(icon => icon.getAnimations());
    if (initialAnimations.length) {
        Promise.allSettled(initialAnimations.map(animation => animation.finished))
            .then(() => {
                if (idleTimer === undefined) scheduleReminder();
            });
    } else {
        scheduleReminder();
    }
})();
