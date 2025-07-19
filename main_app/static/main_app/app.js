const canvasContainer = document.querySelector(".canvas-container");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const viewportTransform = {
    x: 0,
    y: 0,
    scale: 1
}

const drawBtn = document.getElementById("draw-btn");
const eraseBtn = document.getElementById("erase-btn");


// undo redo logic
let undoStack = [];
let redoStack = [];
const maxHistory = 50;

function saveState() {
    if (undoStack.length >= maxHistory) {
        undoStack.shift(); // remove oldest
    }
    undoStack.push(canvas.toDataURL());
    redoStack = []; // clear redo on new action
    console.log("Saved state. Undo stack size:", undoStack.length);
}

function undo() {
    if (undoStack.length <= 1) return;

    redoStack.push(canvas.toDataURL()); // save current before undo

    // Remove current state from undo stack
	undoStack.pop();

	// Restore previous state (now last in undoStack)
	const previousState = undoStack[undoStack.length - 1];
	restoreState(previousState);
}

function redo() {
    if (redoStack.length === 0) return;

    undoStack.push(canvas.toDataURL()); // save current before redo

    const nextState = redoStack.pop();
    restoreState(nextState);
}

function restoreState(dataURL) {
    const img = new Image();
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = dataURL;
}

// undo redo buttons
document.querySelector('.undo-button').addEventListener('click', undo);
document.querySelector('.redo-button').addEventListener('click', redo);


// draw or erase
let currentTool = "draw";  // default tool

function setActiveButton(activeBtn) {
    // Remove active class from both
    drawBtn.classList.remove("btn-active");
    eraseBtn.classList.remove("btn-active");
    // Add active class to the clicked button
    activeBtn.classList.add("btn-active");
}

drawBtn.addEventListener("click", () => {
    setActiveButton(drawBtn);
    currentTool = "draw";
});

eraseBtn.addEventListener("click", () => {
    setActiveButton(eraseBtn);
    currentTool = "erase";
});

// get last used color or default to black
let currentColor = localStorage.getItem('savedColor') || '#000000';

function setMode(mode) {
    if (mode === "erase") {
        ctx.globalCompositeOperation = "source-over";  // normal drawing mode
        ctx.strokeStyle = "#ffffff";  // white color for eraser
        ctx.lineWidth = 10;  // Eraser size
    } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = currentColor;
        localStorage.setItem('savedColor', currentColor);
        ctx.lineWidth = 2;   // Pencil size
    }
}

// keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+Z or Cmd+Z
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault(); // prevent browser undo
        undo();
    }

    // Ctrl+Shift+Z or Cmd+Shift+Z || Cltr+Y or Cmd+Y
    if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        redo();
    }

     // E for eraser
    if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setActiveButton(eraseBtn);
        currentTool = "erase";
    }

    // B for brush
    if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setActiveButton(drawBtn);
        currentTool = "draw";
    }
});



// load existing data
function loadCanvasImage(dataURL) {
    // Always start with white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If no saved data, stop here
    if (!dataURL) return;

    // Draw the saved image on top of white background
    const img = new Image();
    img.onload = () => {
        ctx.drawImage(img, 0, 0);

        // save initial canvas to undo:
        undoStack.push(canvas.toDataURL());
    };
    img.src = dataURL;
}

loadCanvasImage(savedDataURL);

// Helper function to get correct canvas coords accounting for pan and zoom
function getTransformedCoordinates(clientX, clientY) {
	const rect = canvas.getBoundingClientRect();

	// Convert screen coordinates to canvas coordinates accounting for pan and zoom
	const x = (clientX - rect.left) / scale;
	const y = (clientY - rect.top) / scale;

	return { x, y };
}

// brush & eraser
let drawing = false;

// Start drawing for desktop devices
canvas.addEventListener("mousedown", e => {
    if (spacePressed) return; // don't draw when space is held
    drawing = true;
    setMode(currentTool);
    ctx.beginPath();
	ctx.moveTo(e.offsetX, e.offsetY);
});

// Draw as mouse moves
canvas.addEventListener("mousemove", e => {
    if (!drawing || spacePressed) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
});

// Stop drawing
canvas.addEventListener("mouseup", () => {
    if (spacePressed) return;
    
    drawing = false;
    saveCanvas();
    saveState();
});

// catch mouseup outside canvas after drawing started
document.addEventListener("mouseup", () => {
    if (drawing) {  // Only save if drawing was active
        drawing = false;
        saveCanvas();
        saveState();
    }
});

window.addEventListener("blur", () => {
    drawing = false;
});


// drawing mode on mobile devices
canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return; // only draw on one finger
    e.preventDefault();
    drawing = true;
    setMode(currentTool);
    const touch = e.touches[0];
	const { x, y } = getTransformedCoordinates(touch.clientX, touch.clientY);
    ctx.beginPath();
    ctx.moveTo(x, y);
});

canvas.addEventListener("touchmove", (e) => {
    if (!drawing) return;
    e.preventDefault();
    const touch = e.touches[0];
	const { x, y } = getTransformedCoordinates(touch.clientX, touch.clientY);
    ctx.lineTo(x, y);
    ctx.stroke();
});

canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    drawing = false;
    saveCanvas();
    saveState();
});


// scale and zoom variables
let scale = 1;
const zoomStep = 0.75;
const minScale = 0.5;
const maxScale = 10; 
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let lastX = 0;
let lastY = 0;
let spacePressed = false

// zoom in with buttons
const zoomInBtn = document.getElementById("zoom-in");
const zoomOutBtn = document.getElementById("zoom-out");

zoomInBtn.addEventListener("click", () => {
    scale = Math.min(maxScale, scale + zoomStep);
    updateTransform();
});

zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(minScale, scale - zoomStep);
    updateTransform();
});

// initial canvas scale (zoomed in)
function setInitialCanvasScale() {
	const containerRect = canvasContainer.getBoundingClientRect();
	const maxHeight = containerRect.height * 0.8;
	const maxWidth = containerRect.width * 0.8;

	const scaleX = maxWidth / canvas.width;
	const scaleY = maxHeight / canvas.height;

	scale = Math.min(scaleX, scaleY);

	updateTransform();
}

setInitialCanvasScale();

// Zoom
canvasContainer.addEventListener('wheel', (e) => {
    e.preventDefault();

    const zoomAmount = 0.2;
    const direction = e.deltaY > 0 ? -1 : 1;
    const newScale = Math.min(maxScale, Math.max(minScale, scale + direction * zoomAmount));

    if (newScale === scale) return;

    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const zoomFactor = newScale / scale;
    offsetX = cx - (cx - offsetX) * zoomFactor;
    offsetY = cy - (cy - offsetY) * zoomFactor;

    scale = newScale;
    updateTransform();
});

// Pan (mouse)
window.addEventListener('mousemove', (e) => {
    if (!isDragging || !spacePressed) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    offsetX += dx;
    offsetY += dy;
    lastX = e.clientX;
    lastY = e.clientY;

    updateTransform();
});

// Mouse down initiates dragging if space is held
canvasContainer.addEventListener('mousedown', (e) => {
    if (!spacePressed) return

    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
})

const onMouseUp = () => {
    isDragging = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
}

// Track spacebar key status
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        spacePressed = true
        document.body.classList.add('space-dragging')
        e.preventDefault()
    }
})

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        spacePressed = false
        document.body.classList.remove('space-dragging')
    }
})


window.addEventListener('mouseup', () => {
	isDragging = false;
});

function updateTransform() {
	canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

// coordinate plane system
let originX = 0;
let originY = 0;

// Mouse move handler
const onMouseMove = (e) => {
    if (!isDragging || !spacePressed) return

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    offsetX += dx;
    offsetY += dy;

    lastX = e.clientX;
    lastY = e.clientY;

    updateTransform();
}

let isTouchPanning = false;
let lastTouchX = 0;
let lastTouchY = 0;
let lastTouchDistance = 0;

// Utility to get distance between two touch points
function getDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// Touch start
canvasContainer.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
        isTouchPanning = true;

        // Midpoint between two fingers
        lastTouchX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        lastTouchY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        // Initial distance between fingers for zoom detection
        lastTouchDistance = getDistance(e.touches);
    }
}, { passive: false });

// Touch move
canvasContainer.addEventListener("touchmove", (e) => {
    if (isTouchPanning && e.touches.length === 2) {
        e.preventDefault();

        const currentX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const currentY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        const deltaX = currentX - lastTouchX;
        const deltaY = currentY - lastTouchY;

        // Update offsets for panning
        offsetX += deltaX;
        offsetY += deltaY;

        // Detect pinch zoom
        const currentDistance = getDistance(e.touches);
        const zoomFactor = currentDistance / lastTouchDistance;

        // Update scale within limits
        const newScale = Math.min(maxScale, Math.max(minScale, scale * zoomFactor));
        
        // Adjust offsets to zoom centered on midpoint between fingers
        const rect = canvas.getBoundingClientRect();
        const cx = currentX - rect.left;
        const cy = currentY - rect.top;

        const scaleChange = newScale / scale;

        offsetX = cx - (cx - offsetX) * scaleChange;
        offsetY = cy - (cy - offsetY) * scaleChange;

        scale = newScale;

        // Update last variables for next move
        lastTouchX = currentX;
        lastTouchY = currentY;
        lastTouchDistance = currentDistance;

        updateTransform();
    }
}, { passive: false });

// Touch end
canvasContainer.addEventListener("touchend", (e) => {
    if (e.touches.length < 2) {
        isTouchPanning = false;
    }
});

// send and save canvas data
function saveCanvas() {
    // Get image data as base64 string
    const dataURL = canvas.toDataURL();

    fetch("/save-art/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({ data: dataURL, art_id: currentDrawingId })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Saved art:", data);
    })
    .catch(err => console.error("Save failed:", err));
}

// CSRF cookie for Django
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


// color picker pickr

const pickr = Pickr.create({
    el: '.color-picker',
    theme: 'nano',
    comparison: false,
    default: currentColor,
    container: '.color-picker-popup',
    swatches: [
        'rgba(244, 67, 54, 1)',
        'rgba(233, 30, 99, 0.95)',
        'rgba(156, 39, 176, 0.9)',
        'rgba(103, 58, 183, 0.85)',
        'rgba(63, 81, 181, 0.8)',
        'rgba(33, 150, 243, 0.75)',
        'rgba(3, 169, 244, 0.7)',
        'rgba(0, 188, 212, 0.7)',
        'rgba(0, 150, 136, 0.75)',
        'rgba(76, 175, 80, 0.8)',
        'rgba(139, 195, 74, 0.85)',
        'rgba(205, 220, 57, 0.9)',
        'rgba(255, 235, 59, 0.95)',
        'rgba(255, 193, 7, 1)'
    ],

    components: {

        // Main components
        preview: true,
        opacity: true,
        hue: true,

        // Input / output Options
        interaction: {
            hex: true,
            rgba: true,
            hsla: true,
            hsva: true,
            cmyk: true,
            input: true,
            clear: false,
            save: false
        }
    }
});

pickr.on('change', (color) => {
    const rgbaColor = color.toRGBA().toString();
    currentColor = rgbaColor;  // store current pickr color
});
