document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    // Handle photo groups and standalone images
    const photoGroups = document.querySelectorAll('.photo-group');
    const standaloneImages = document.querySelectorAll('.gallery > img');

    // Setup photo groups - wait for all images in group to load
    photoGroups.forEach(group => {
        const images = Array.from(group.querySelectorAll('img'));
        const title = group.querySelector('.photo-title');
        let shown = false;

        const showGroup = () => {
            if (shown) return;
            shown = true;

            requestAnimationFrame(() => {
                // Show all images and title together
                images.forEach(img => {
                    img.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    img.style.opacity = '1';
                    img.style.transform = 'translateY(0)';
                });

                if (title) {
                    title.style.transition = 'opacity 0.5s ease';
                    title.style.opacity = '1';
                }
            });
        };

        // Check if all images are loaded
        const checkAllLoaded = () => {
            const allLoaded = images.every(img => img.complete && img.naturalHeight > 0);
            if (allLoaded) {
                showGroup();
            }
        };

        images.forEach(img => {
            img.addEventListener('load', checkAllLoaded);
            img.addEventListener('error', checkAllLoaded);
        });

        // Initial check in case images are cached
        checkAllLoaded();
    });

    // Setup standalone images
    standaloneImages.forEach(img => {
        let shown = false;

        const showImage = () => {
            if (shown) return;
            if (img.complete && img.naturalHeight > 0) {
                shown = true;
                requestAnimationFrame(() => {
                    img.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    img.style.opacity = '1';
                    img.style.transform = 'translateY(0)';
                });
            }
        };

        img.addEventListener('load', showImage);
        img.addEventListener('error', showImage);
        showImage();
    });

    // Desktop Lightbox functionality
    if (window.innerWidth >= 768) {
        initLightbox();
    }

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768 && !document.querySelector('.lightbox-overlay')) {
            initLightbox();
        }
    });
});

function initLightbox() {
    const galleryImages = Array.from(document.querySelectorAll('.gallery img'));
    let currentIndex = 0;
    let isZoomed = false;
    let lightboxOpen = false;
    let originalImage = null;
    let isNavigating = false;

    // Create lightbox elements
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
        <div class="lightbox-content">
            <img class="lightbox-image lightbox-image-a" src="" alt="Expanded photo">
            <img class="lightbox-image lightbox-image-b" src="" alt="Expanded photo">
        </div>
        <button class="lightbox-close" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    document.body.appendChild(overlay);

    const lightboxImageA = overlay.querySelector('.lightbox-image-a');
    const lightboxImageB = overlay.querySelector('.lightbox-image-b');
    let activeImage = 'a';
    const lightboxContent = overlay.querySelector('.lightbox-content');
    const closeBtn = overlay.querySelector('.lightbox-close');

    // Add cursor style for gallery images
    galleryImages.forEach((img, index) => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', (e) => {
            e.preventDefault();
            openLightbox(img, index);
        });
    });

    function getActiveImage() {
        return activeImage === 'a' ? lightboxImageA : lightboxImageB;
    }

    function getInactiveImage() {
        return activeImage === 'a' ? lightboxImageB : lightboxImageA;
    }

    function openLightbox(img, index) {
        originalImage = img;
        currentIndex = index;
        lightboxOpen = true;
        isZoomed = false;
        activeImage = 'a';

        // Get original image position for animation
        const rect = img.getBoundingClientRect();

        // Setup images
        lightboxImageA.src = img.src;
        lightboxImageA.style.opacity = '1';
        lightboxImageA.classList.remove('zoomed');
        lightboxImageB.src = '';
        lightboxImageB.style.opacity = '0';
        lightboxImageB.classList.remove('zoomed');

        // Set initial position (matching the clicked image)
        lightboxContent.style.position = 'fixed';
        lightboxContent.style.top = rect.top + 'px';
        lightboxContent.style.left = rect.left + 'px';
        lightboxContent.style.width = rect.width + 'px';
        lightboxContent.style.height = rect.height + 'px';
        lightboxContent.style.transition = 'none';
        lightboxContent.style.cursor = 'zoom-in';
        lightboxImageA.style.cursor = 'zoom-in';
        lightboxImageB.style.cursor = 'zoom-in';

        overlay.classList.add('active');

        // Animate to center
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                lightboxContent.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                fitImageToViewport();
            });
        });
    }

    function fitImageToViewport() {
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // Calculate dimensions to fit full height
        const img = getActiveImage();
        const aspectRatio = img.naturalWidth / img.naturalHeight || 3/4;

        let newHeight = viewportHeight;
        let newWidth = newHeight * aspectRatio;

        // If too wide, constrain by width
        if (newWidth > viewportWidth) {
            newWidth = viewportWidth;
            newHeight = newWidth / aspectRatio;
        }

        const left = (viewportWidth - newWidth) / 2;
        const top = (viewportHeight - newHeight) / 2;

        lightboxContent.style.top = top + 'px';
        lightboxContent.style.left = left + 'px';
        lightboxContent.style.width = newWidth + 'px';
        lightboxContent.style.height = newHeight + 'px';
    }

    function closeLightbox() {
        if (!lightboxOpen) return;

        resetZoom();

        // Get current image position (background should already be scrolled)
        const currentImg = galleryImages[currentIndex];
        const rect = currentImg.getBoundingClientRect();

        lightboxContent.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        lightboxContent.style.top = rect.top + 'px';
        lightboxContent.style.left = rect.left + 'px';
        lightboxContent.style.width = rect.width + 'px';
        lightboxContent.style.height = rect.height + 'px';

        overlay.classList.add('closing');

        setTimeout(() => {
            overlay.classList.remove('active', 'closing');
            lightboxOpen = false;
            isZoomed = false;
        }, 400);
    }

    function toggleZoom(e) {
        if (!lightboxOpen) return;

        const currentImage = getActiveImage();

        if (isZoomed) {
            // Zoom out - keep current transformOrigin, just animate scale
            isZoomed = false;
            currentImage.classList.remove('zoomed');
            currentImage.style.pointerEvents = 'auto';
            lightboxContent.style.pointerEvents = 'auto';
            overlay.style.cursor = '';
            lightboxContent.style.cursor = '';
            lightboxContent.style.overflow = 'hidden';
            currentImage.style.transition = 'transform 0.3s ease';
            currentImage.style.transform = 'scale(1)';

            // Reset transformOrigin after animation completes
            setTimeout(() => {
                currentImage.style.transformOrigin = 'center center';
            }, 300);
        } else {
            // Zoom in
            isZoomed = true;
            currentImage.classList.add('zoomed');
            lightboxContent.style.overflow = 'hidden';

            // Calculate zoom position based on click
            const rect = lightboxContent.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;

            // Set transformOrigin first without transition, then animate scale
            currentImage.style.transition = 'none';
            currentImage.style.transformOrigin = `${x}% ${y}%`;

            // Force reflow then animate
            currentImage.offsetHeight;
            currentImage.style.transition = 'transform 0.3s ease';
            currentImage.style.transform = 'scale(2.5)';

            // Set cursor and pointer-events immediately
            overlay.style.cursor = 'zoom-out';
            lightboxContent.style.cursor = 'zoom-out';
            lightboxContent.style.pointerEvents = 'none';
            currentImage.style.pointerEvents = 'none';
        }
    }

    function handleMouseMove(e) {
        if (!isZoomed || !lightboxOpen) return;

        const currentImage = getActiveImage();
        const rect = lightboxContent.getBoundingClientRect();

        // Calculate position relative to lightboxContent, clamped to 0-100%
        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        currentImage.style.transition = 'transform-origin 0.1s ease';
        currentImage.style.transformOrigin = `${x}% ${y}%`;
    }

    function resetZoom() {
        isZoomed = false;
        lightboxImageA.style.transform = 'scale(1)';
        lightboxImageA.style.transformOrigin = 'center center';
        lightboxImageA.classList.remove('zoomed');
        lightboxImageB.style.transform = 'scale(1)';
        lightboxImageB.style.transformOrigin = 'center center';
        lightboxImageB.classList.remove('zoomed');
    }

    function scrollToCurrentImage(smooth = true) {
        const currentImg = galleryImages[currentIndex];
        const rect = currentImg.getBoundingClientRect();
        const absoluteTop = rect.top + window.pageYOffset;
        const centerOffset = (window.innerHeight - rect.height) / 2;
        const targetScroll = absoluteTop - centerOffset;

        if (smooth) {
            window.scrollTo({
                top: targetScroll,
                behavior: 'smooth'
            });
        } else {
            window.scrollTo({
                top: targetScroll,
                behavior: 'auto'
            });
        }
    }

    function navigateImages(direction) {
        if (!lightboxOpen || isNavigating) return;

        const newIndex = currentIndex + direction;
        if (newIndex < 0 || newIndex >= galleryImages.length) return;

        isNavigating = true;
        currentIndex = newIndex;
        resetZoom();

        // Scroll background to current image smoothly
        scrollToCurrentImage();

        // Get current and next image elements
        const currentImage = getActiveImage();
        const nextImage = getInactiveImage();

        // Preload the new image
        nextImage.src = galleryImages[currentIndex].src;

        const doCrossfade = () => {
            // Put the incoming image on top
            nextImage.style.zIndex = '3';
            currentImage.style.zIndex = '1';

            // Crossfade: fade out current, fade in next simultaneously
            currentImage.style.transition = 'opacity 0.35s ease';
            nextImage.style.transition = 'opacity 0.35s ease';

            currentImage.style.opacity = '0';
            nextImage.style.opacity = '1';

            // Swap active image
            activeImage = activeImage === 'a' ? 'b' : 'a';

            fitImageToViewport();

            setTimeout(() => {
                // Reset z-index after transition
                nextImage.style.zIndex = '';
                currentImage.style.zIndex = '';
                isNavigating = false;
            }, 350);
        };

        // Wait for image to load if needed
        if (nextImage.complete && nextImage.naturalWidth > 0) {
            doCrossfade();
        } else {
            nextImage.onload = doCrossfade;
        }
    }

    // Event listeners
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeLightbox();
    });

    lightboxImageA.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleZoom(e);
    });

    lightboxImageB.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleZoom(e);
    });

    lightboxContent.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isZoomed) {
            toggleZoom(e);
        }
    });

    overlay.addEventListener('mousemove', handleMouseMove);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            if (isZoomed) {
                toggleZoom(e);
            } else {
                closeLightbox();
            }
        }
    });

    // Scroll to navigate images
    overlay.addEventListener('wheel', (e) => {
        if (!lightboxOpen) return;
        e.preventDefault();
        e.stopPropagation();

        if (e.deltaY > 0) {
            navigateImages(1);
        } else if (e.deltaY < 0) {
            navigateImages(-1);
        }
    }, { passive: false });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightboxOpen) return;

        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            navigateImages(1);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            navigateImages(-1);
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (lightboxOpen && !isZoomed) {
            fitImageToViewport();
        }
    });
}
