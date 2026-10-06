// Section par défaut au démarrage
let activeSection = "home-aboutme";

// Home image associated with each interactive category.
const profileImages = {
    "home-aboutme": { src: "/assets/identity/profile.webp", alt: "Antoine de Seguins — About me" },
    "home-experience": { src: "/assets/identity/profile2.webp", alt: "Antoine de Seguins — My Experience" },
    "home-skills": { src: "/assets/identity/profile3.webp", alt: "Antoine de Seguins — My Skills" },
    "home-love": { src: "/assets/identity/profile4.webp", alt: "Antoine de Seguins — What I Love" }
};

const profileLoads = new Map();
let profileRequest = 0;
let profileAnimation;
let profileOverlay;

const updateProfileImage = async section => {
    const picture = document.querySelector("#profile-picture img");
    const next = profileImages[section];
    if (!picture || !next) return;

    const request = ++profileRequest;
    if (profileAnimation) {
        profileAnimation.cancel();
        profileAnimation = null;
    }
    if (profileOverlay) {
        profileOverlay.remove();
        profileOverlay = null;
    }
    if (picture.getAttribute("src") === next.src) return;

    if (!profileLoads.has(next.src)) {
        profileLoads.set(next.src, new Promise(resolve => {
            const image = new Image();
            image.onload = () => resolve(true);
            image.onerror = () => resolve(false);
            image.src = next.src;
        }));
    }
    const loaded = await profileLoads.get(next.src);
    if (!loaded || request !== profileRequest) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        picture.src = next.src;
        picture.alt = next.alt;
        return;
    }

    profileOverlay = picture.cloneNode(false);
    profileOverlay.src = next.src;
    profileOverlay.alt = "";
    profileOverlay.removeAttribute("id");
    profileOverlay.setAttribute("aria-hidden", "true");
    profileOverlay.classList.add("profile-transition-layer");
    picture.parentElement.appendChild(profileOverlay);

    profileAnimation = profileOverlay.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 700,
        easing: "ease-in-out",
        fill: "forwards"
    });
    await profileAnimation.finished.catch(() => {});
    if (request !== profileRequest) return;

    picture.src = next.src;
    picture.alt = next.alt;
    profileOverlay.remove();
    profileOverlay = null;
    profileAnimation = null;
};

// Only the latest category may update the panel or its transition.
let contentRequest = 0;
let contentController;
let contentSwapTimer;
let contentRevealTimer;

const loadContent = async (section) => {
    updateProfileImage(section);
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

        // Enregistrer le src original si pas déjà fait
        if (!icon.dataset.originalSrc) {
            icon.dataset.originalSrc = icon.src;
        }

        const originalSrc = icon.dataset.originalSrc;

        // Met à jour l'icône selon qu'elle est active ou non
        if (section === activeSection) {
            icon.src = originalSrc.replace(".webp", "_active.webp");
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

