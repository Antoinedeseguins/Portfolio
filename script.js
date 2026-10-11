// Section par défaut au démarrage
let activeSection = "home-aboutme";

// Match the animation range to each label, including short names such as X.
const updateAboutMeLabelWidth = event => {
    const link = event.target.closest?.(".about-me-links a");
    const label = link?.querySelector(".about-me-link-label");
    if (label) {
        link.style.setProperty("--about-me-label-width", `${label.scrollWidth}px`);
    }
};
document.addEventListener("pointerover", updateAboutMeLabelWidth);
document.addEventListener("focusin", updateAboutMeLabelWidth);

// Only the latest category may update the panel or its transition.
let contentRequest = 0;
let contentController;
let contentSwapTimer;
let contentRevealTimer;

const loadContent = async (section) => {
    const contentElement = document.querySelector("#content");
    if (!contentElement) return;

    const request = ++contentRequest;
    contentController?.abort();
    clearTimeout(contentSwapTimer);
    clearTimeout(contentRevealTimer);
    const controller = new AbortController();
    contentController = controller;

    contentElement.style.opacity = 0;
    contentElement.style.transform = "translateX(-15px)";

    const revealContent = () => {
        if (request !== contentRequest) return;
        contentElement.style.transition = "opacity 1s ease, transform 1s ease";
        contentElement.style.opacity = 1;
        contentElement.style.transform = "translateX(0)";
    };

    try {
        const response = await fetch(`components/interactive-menu/${section}.html`, {
            signal: controller.signal,
            cache: "no-cache"
        });
        if (!response.ok) throw new Error("Failed to load content");
        const htmlContent = await response.text();
        if (request !== contentRequest) return;

        contentSwapTimer = setTimeout(() => {
            if (request !== contentRequest) return;
            contentElement.innerHTML = htmlContent;
            contentElement.style.transition = "none";
            contentRevealTimer = setTimeout(revealContent, 50);
        }, 300);
    } catch (error) {
        if (request !== contentRequest || error.name === "AbortError") return;
        console.error("Error loading content:", error);
        contentElement.innerHTML = "<p>Failed to load the content. Please try again later.</p>";
        revealContent();
    } finally {
        if (contentController === controller) contentController = null;
    }
};

// Fonction pour mettre à jour l'apparence des icônes
const updateActiveIcons = (activeSection) => {
    document.querySelectorAll("#icon-menu img").forEach(icon => {
        const section = icon.dataset.section;
        icon.setAttribute("aria-pressed", String(section === activeSection));

        // Enregistrer le src original si pas déjà fait
        if (!icon.dataset.originalSrc) {
            icon.dataset.originalSrc = icon.src;
        }

        const originalSrc = icon.dataset.originalSrc;

        // Met à jour l'icône selon qu'elle est active ou non
        if (section === activeSection) {
            icon.src = originalSrc.replace(".svg", "-active.svg");
            icon.classList.add("active-icon");
        } else {
            icon.src = originalSrc;
            icon.classList.remove("active-icon");
        }
    });
};

// Ajout des événements de survol et de clic pour chaque icône
document.querySelectorAll("#icon-menu img").forEach(icon => {
    // Événement de survol pour desktop
    icon.addEventListener("mouseover", () => {
        const section = icon.dataset.section;
        if (section !== activeSection) {
            activeSection = section;
            updateActiveIcons(activeSection);
            loadContent(activeSection);
        }
    });
    
    // Événement de clic pour mobile
    icon.addEventListener("click", () => {
        const section = icon.dataset.section;
        if (section !== activeSection) {
            activeSection = section;
            updateActiveIcons(activeSection);
            loadContent(activeSection);
        }
    });
});

// Chargement initial
document.addEventListener("DOMContentLoaded", () => {
    updateActiveIcons(activeSection);
    loadContent(activeSection);
});

// Gestion des icônes de navigation
document.querySelectorAll('.nav-icon').forEach(img => {
    img.addEventListener('mouseover', () => {
      img.src = img.dataset.hover;
    });
    img.addEventListener('mouseout', () => {
      img.src = img.dataset.default;
    });
});

