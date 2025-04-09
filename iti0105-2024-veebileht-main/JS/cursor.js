
window.applyCursor = function (type) {
    if (type === 'black-paw') {
        document.body.style.cursor = "url('/Elements/black-paw.png'), auto";
    } else if (type === 'white-paw') {
        document.body.style.cursor = "url('/Elements/white-paw.png'), auto";
    } else if (type === 'orange-paw') {
        document.body.style.cursor = "url('/Elements/orange-paw.png'), auto";
    } else {
        document.body.style.cursor = "default";
    }
};

window.saveCursor = function (type) {
    localStorage.setItem('cursorType', type);
    window.applyCursor(type);
};

window.resetCursor = function () {
    localStorage.removeItem('cursorType');
    window.applyCursor('default');
};

window.loadCursor = function () {
    const savedCursor = localStorage.getItem('cursorType');
    if (savedCursor) {
        window.applyCursor(savedCursor);
    } else {
        window.applyCursor('default');
    }
};


document.addEventListener('DOMContentLoaded', () => {
    window.loadCursor();
});
