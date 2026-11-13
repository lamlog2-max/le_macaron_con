// État du jeu
const state = {
    hasRedBook: false,
    bookPlaced: false,
    hasSmallKey: false,
    deskUnlocked: false,
    paintingMoved: false,
    safeUnlocked: false,
    hasDoorKey: false,
    selectedItem: null,
    gameOver: false,
    timeLeft: 180 // 3 minutes en secondes
};

// Position et vitesse du personnage
const player = {
    x: 380,
    y: 350,
    speed: 6,
    el: document.getElementById('player')
};

// Touches pressées
const keys = {};

// Éléments du DOM
const msgBox = document.getElementById('message-box');
const invContainer = document.getElementById('inventory-items');
const modal = document.getElementById('modal');
const safeCodeInput = document.getElementById('safe-code');
const timerEl = document.getElementById('timer');

// Gestion du clavier
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    // Interagir avec la barre d'espace
    if (e.code === 'Space' && modal.style.display !== 'flex') {
        checkProximityInteraction();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Boucle de déplacement du personnage (60 images par seconde)
function gameLoop() {
    if (!state.gameOver && modal.style.display !== 'flex') {
        if (keys['ArrowLeft'] || keys['q'] || keys['a']) {
            player.x -= player.speed;
            player.el.style.transform = 'scaleX(-1)';
        }
        if (keys['ArrowRight'] || keys['d']) {
            player.x += player.speed;
            player.el.style.transform = 'scaleX(1)';
        }
        if (keys['ArrowUp'] || keys['z'] || keys['w']) {
            player.y -= player.speed;
        }
        if (keys['ArrowDown'] || keys['s']) {
            player.y += player.speed;
        }

        // Limites de déplacement (uniquement sur le sol)
        player.x = Math.max(10, Math.min(740, player.x));
        player.y = Math.max(270, Math.min(390, player.y));

        player.el.style.left = player.x + 'px';
        player.el.style.top = player.y + 'px';
    }
    requestAnimationFrame(gameLoop);
}
gameLoop();

// Chronomètre
const timerInterval = setInterval(() => {
    if (state.gameOver) {
        clearInterval(timerInterval);
        return;
    }
    state.timeLeft--;
    const minutes = Math.floor(state.timeLeft / 60).toString().padStart(2, '0');
    const seconds = (state.timeLeft % 60).toString().padStart(2, '0');
    timerEl.innerText = `Temps : ${minutes}:${seconds}`;

    if (state.timeLeft <= 0) {
        state.gameOver = true;
        setMessage("⏰ TEMPS ÉCOULÉ ! Le système de sécurité a verrouillé la pièce définitivement. Rechargez la page pour réessayer.");
    }
}, 1000);

// Interaction par proximité (Touche Espace)
function checkProximityInteraction() {
    if (state.gameOver) return;
    if (player.x < 150) interactDoor();
    else if (player.x >= 170 && player.x <= 310) {
        if (!state.paintingMoved) interactPainting();
        else openSafeModal();
    }
    else if (player.x > 310 && player.x <= 390) interactPlant();
    else if (player.x > 390 && player.x <= 540) interactBookshelf();
    else if (player.x > 580) interactDesk();
}

// Interaction par clic direct sur les objets
document.getElementById('plant').addEventListener('click', interactPlant);
document.getElementById('bookshelf').addEventListener('click', interactBookshelf);
document.getElementById('desk').addEventListener('click', interactDesk);
document.getElementById('painting').addEventListener('click', interactPainting);
document.getElementById('safe').addEventListener('click', openSafeModal);
document.getElementById('door').addEventListener('click', interactDoor);
document.getElementById('btn-validate').addEventListener('click', checkCode);
document.getElementById('btn-close').addEventListener('click', closeModal);

safeCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkCode();
});

// Fonctions d'interface
function setMessage(text) {
    msgBox.innerHTML = text;
}

function updateInventory() {
    invContainer.innerHTML = '';
    if (state.hasRedBook && !state.bookPlaced) {
        createInvSlot('redBook', '📕 Livre rouge');
    }
    if (state.hasSmallKey && !state.deskUnlocked) {
        createInvSlot('smallKey', '🗝️ Petite clé');
    }
    if (state.hasDoorKey) {
        createInvSlot('doorKey', '🔑 Clé dorée');
    }
}

function createInvSlot(id, label) {
    const div = document.createElement('div');
    div.className = 'inv-slot' + (state.selectedItem === id ? ' selected' : '');
    div.innerText = label;
    div.addEventListener('click', () => {
        state.selectedItem = (state.selectedItem === id) ? null : id;
        updateInventory();
        if (state.selectedItem) {
            setMessage(`Objet équipé : <strong>${label}</strong>.`);
        }
    });
    invContainer.appendChild(div);
}

// Logique des énigmes
function interactPlant() {
    if (state.gameOver) return;
    if (!state.hasRedBook) {
        state.hasRedBook = true;
        updateInventory();
        setMessage("Vous trouvez un vieux <strong>Livre rouge</strong> caché derrière le pot de la plante !");
    } else {
        setMessage("Une plante verte tout à fait ordinaire.");
    }
}

function interactBookshelf() {
    if (state.gameOver) return;
    if (!state.bookPlaced) {
        if (state.selectedItem === 'redBook') {
            state.bookPlaced = true;
            state.hasSmallKey = true;
            state.selectedItem = null;
            updateInventory();
            setMessage("Vous glissez le livre rouge dans l'espace vide. Un mécanisme s'active et fait tomber une <strong>Petite clé</strong> !");
        } else {
            setMessage("Une grande bibliothèque. Il semble manquer un livre rouge sur l'étagère du milieu.");
        }
    } else {
        setMessage("La bibliothèque est complète maintenant.");
    }
}

function interactDesk() {
    if (state.gameOver) return;
    if (!state.deskUnlocked) {
        if (state.selectedItem === 'smallKey') {
            state.deskUnlocked = true;
            state.selectedItem = null;
            updateInventory();
            setMessage("Le tiroir s'ouvre ! Vous lisez une note : « Le code est l'année du premier pas de l'Homme sur la Lune ».");
        } else {
            setMessage("Le tiroir du bureau est verrouillé par une petite serrure.");
        }
    } else {
        setMessage("La note dit : « Le code est l'année du premier pas de l'Homme sur la Lune ».");
    }
}

function interactPainting() {
    if (state.gameOver) return;
    if (!state.paintingMoved) {
        state.paintingMoved = true;
        document.getElementById('painting').style.top = '10px';
        document.getElementById('safe').style.display = 'flex';
        setMessage("Vous soulevez le tableau... Un coffre-fort est encastré dans le mur !");
    } else {
        setMessage("Un tableau ancien accroché en hauteur.");
    }
}

function openSafeModal() {
    if (state.gameOver) return;
    if (state.safeUnlocked) {
        setMessage("Le coffre-fort est déjà ouvert et vide.");
        return;
    }
    modal.style.display = 'flex';
    safeCodeInput.value = '';
    safeCodeInput.focus();
}

function closeModal() {
    modal.style.display = 'none';
}

function checkCode() {
    const code = safeCodeInput.value;
    if (code === '1969') {
        state.safeUnlocked = true;
        state.hasDoorKey = true;
        closeModal();
        updateInventory();
        document.getElementById('safe').innerHTML = "COFFRE<br>[ 🔓 ]";
        setMessage("Clic ! Le coffre s'ouvre. Vous récupérez la <strong>Clé dorée</strong> !");
    } else {
        setMessage("Code incorrect ! Le coffre reste fermé.");
        closeModal();
    }
}

function interactDoor() {
    if (state.gameOver) return;
    if (state.selectedItem === 'doorKey') {
        state.gameOver = true;
        document.getElementById('door').style.backgroundColor = '#121212';
        document.getElementById('door').innerText = 'OUVERT';
        setMessage(`🎉 BRAVO ! Vous vous êtes échappé avec <strong>${state.timeLeft} secondes</strong> restantes !`);
    } else {
        setMessage("La porte est verrouillée. Il vous faut la grande clé dorée.");
    }
}
