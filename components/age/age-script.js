// Section par défaut au démarrage
let activeSection = "age-about";

// Only the latest category may update the panel or its transition.
let contentRequest = 0;
let contentController;
let contentSwapTimer;
let contentRevealTimer;

const loadContent = async (section) => {
    const contentElement = document.querySelector("#content2");
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
        const response = await fetch(`components/age/${section}.html`, {
            signal: controller.signal
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
        contentElement.innerHTML = "<p>Échec du chargement du contenu. Veuillez réessayer plus tard.</p>";
        revealContent();
    } finally {
        if (contentController === controller) contentController = null;
    }
};

// Fonction pour mettre à jour l'apparence des icônes
const updateActiveIcons = (activeSection) => {
    document.querySelectorAll("#icon-menu img").forEach(icon => {
        const section = icon.dataset.section;

        // Enregistrer le src original si pas déjà fait
        if (!icon.dataset.originalSrc) {
            icon.dataset.originalSrc = icon.src;
        }

        const originalSrc = icon.dataset.originalSrc;

        // Met à jour l'icône selon qu'elle est active ou non
        if (section === activeSection) {
            icon.src = originalSrc.replace(".png", "_active.png");
            icon.classList.add("active-icon");
        } else {
            icon.src = originalSrc;
            icon.classList.remove("active-icon");
        }
    });
};

// Ajout des événements de survol pour chaque icône
document.querySelectorAll("#icon-menu img").forEach(icon => {
    icon.addEventListener("mouseover", () => {
        const section = icon.dataset.section;
        if (section !== activeSection) {
            activeSection = section;
            updateActiveIcons(activeSection);
            loadContent(activeSection); // Charge dans #content2
        }
    });
});

// Chargement initial
document.addEventListener("DOMContentLoaded", () => {
    updateActiveIcons(activeSection);
    loadContent(activeSection); // Charge dans #content2
});

document.querySelectorAll('.nav-icon').forEach(img => {
    img.addEventListener('mouseover', () => {
      img.src = img.dataset.hover;
    });
    img.addEventListener('mouseout', () => {
      img.src = img.dataset.default;
    });
});
