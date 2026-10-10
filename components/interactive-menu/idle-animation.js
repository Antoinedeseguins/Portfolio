(() => {
    const menu = document.querySelector("#icon-menu");
    if (!menu) return;

    const icons = [...menu.querySelectorAll("img")];
    icons.forEach(icon => {
        icon.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                icon.click();
            }
        });
    });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reminders = new Set();
    let idleTimer;
    let hasChangedSection = false;
    const initialSection = menu.querySelector(".active-icon")?.dataset.section
        ?? icons[0]?.dataset.section;

    const stopReminder = () => {
        reminders.forEach(animation => animation.cancel());
        reminders.clear();
    };

    const scheduleReminder = () => {
        window.clearTimeout(idleTimer);
        if (hasChangedSection || document.hidden || reducedMotion.matches) return;
        idleTimer = window.setTimeout(replayReminder, 5000);
    };

    const replayReminder = () => {
        if (hasChangedSection || document.hidden || reducedMotion.matches) return;
        stopReminder();

        icons.forEach((icon, index) => {
            const animation = icon.animate([
                { transform: "scale(1)", filter: "brightness(1.08)" },
                { transform: "scale(0.9)", filter: "brightness(1.3)" },
                { transform: "scale(1)", filter: "brightness(1.08)" }
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

    // Category handlers run on the icons before these bubbling menu listeners.
    const stopAfterSectionChange = () => {
        const selectedSection = menu.querySelector(".active-icon")?.dataset.section;
        if (hasChangedSection || !selectedSection || selectedSection === initialSection) return;

        hasChangedSection = true;
        window.clearTimeout(idleTimer);
        stopReminder();
        menu.classList.add("has-changed-section");
    };

    menu.addEventListener("mouseover", stopAfterSectionChange);
    menu.addEventListener("click", stopAfterSectionChange);

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
