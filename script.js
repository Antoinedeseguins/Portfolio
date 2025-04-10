// Section par défaut au démarrage
let activeSection = "home-aboutme";

// Fonction pour charger dynamiquement le contenu depuis un fichier HTML
const loadContent = (section) => {
    const contentElement = document.querySelector("#content");

    // Animation : on réinitialise avant le changement de contenu
    contentElement.style.opacity = 0;
    contentElement.style.transform = "translateX(-15px)";

    // Charger le contenu HTML depuis le dossier
    fetch(`components/interactive-menu/${section}.html`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load content');
            }
            return response.text();
        })
        .then(htmlContent => {
            // Appliquer un délai pour la transition
            setTimeout(() => {
                contentElement.innerHTML = htmlContent;

                // Redémarrer la transition d'apparition
                contentElement.style.transition = "none";
                setTimeout(() => {
                    contentElement.style.transition = "opacity 1s ease, transform 1s ease";
                    contentElement.style.opacity = 1;
                    contentElement.style.transform = "translateX(0)";
                }, 50);
            }, 300);
        })
        .catch(error => {
            console.error("Error loading content:", error);
            contentElement.innerHTML = "<p>Failed to load the content. Please try again later.</p>";
        });
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

