// <SETTINGS>
const rateLimitInterval = 200; // ms interval between image loading
// </SETTINGS>

function getViewportWidth() {
    return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
}

function replaceDimensionsInUrl(url, width) {
    const match = url.match(/=w(\d+)-h(\d+)/);
    if (match) {
        const originalWidth = parseInt(match[1]);
        const originalHeight = parseInt(match[2]);
        const aspectRatio = originalWidth / originalHeight;
        const newHeight = Math.round(width / aspectRatio);
        return url.replace(/=w(\d+)-h(\d+)/, '=w' + width + '-h' + newHeight);
    }
    return url;
}

function adjustImagesToViewport(className) {
    const viewportWidth = getViewportWidth();
    const images = document.querySelectorAll(`img.${className}`);
    Array.from(images).forEach(function(img) {
        const url = img.src;
        const newUrl = replaceDimensionsInUrl(url, viewportWidth);
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        img.src = newUrl;
        img.width = viewportWidth;
        img.height = Math.round(viewportWidth / aspectRatio);
    });
}

function adjustLinksToViewport(className) {
    const viewportWidth = getViewportWidth();
    const links = document.querySelectorAll(`a.${className}`);
    Array.from(links).forEach((link) => {
        const url = link.href;
        const newUrl = replaceDimensionsInUrl(url, viewportWidth);
        link.href = newUrl;
    });
}

// For each image on the page if a 403 is returned, try to reload the image
// once. If the image is still 403, replace it with a placeholder.
const reloadedImages = [];
var reloadBackoff = 0;
function addImageErrorHandler(img) {
    img.addEventListener("error", (e) => {
        if (reloadedImages.includes(img.src)) {
            img.innerHTML =
                '<div class="img-error"><i class="fa-solid fa-circle-exclamation"></i> Could not load the image, please contact the administrator</div>';
            return;
        }
        // Reload the image once after a delay
        reloadedImages.push(img.src);
        setTimeout(() => {
            imh.src = img.src;
        }, reloadBackoff);
        reloadBackoff += rateLimitInterval;
    });
}

function loadImageDeferred(img, delay) {
    if (!('src' in img.dataset)) {
        return;
    }
    setTimeout(() => {
        // TODO transition the image src into image dataset src smoothly
        img.src = img.dataset.src;
        console.log('Load at', delay);
    }, delay);
}

function fadeOutOverlayOnImageLoad() {
    const imgs = document.querySelectorAll('img.thumb');
    Array.from(imgs).forEach((img) => {
        img.addEventListener('load', (e) => {
            const overlay = img.parentElement.querySelector(".overlay");
            if (overlay) {
                overlay.classList.add('fade');
                setTimeout(() => {
                    overlay.remove();
                }, 500);
            }
        });
    });
}

function getElementDistanceFromViewport(element) {
    const rect = element.getBoundingClientRect();
    return Math.abs(rect.bottom);

}

function loadAllImagesProgressively() {
    const imgs = document.querySelectorAll("img[data-src^='https://lh3.googleusercontent.com']");
    console.log('LEN', imgs.length);
    // Sort imgs by distance from viewport
    const sortedImgs = Array.from(imgs).sort((a, b) => {
        return getElementDistanceFromViewport(a) - getElementDistanceFromViewport(b);
    });
    let delay = 0;
    sortedImgs.forEach((img) => {
        console.log('Distance', getElementDistanceFromViewport(img));
        loadImageDeferred(img, delay);
        delay += rateLimitInterval;
    });
}

function addImageErrorHandlers() {
    const imgs = document.querySelectorAll("img[src^='https://lh3.googleusercontent.com']");
    Array.from(imgs).forEach((img) => {
        addImageErrorHandler(img);
    });
}

// Adjust linked image sizes to the viewport on window resize
window.addEventListener('resize', () => {
    adjustLinksToViewport('photo');
});

// Adjust right away
(function() {
    fadeOutOverlayOnImageLoad()
    loadAllImagesProgressively();
    //addImageErrorHandlers();
    adjustLinksToViewport('photo');
})();
