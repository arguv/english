const card = document.getElementById("card");
const wordEl = document.getElementById("word");
const progressEl = document.getElementById("progress");
const speakBtn = document.getElementById("speak-btn");
const showImgBtn = document.getElementById("show-img-btn");
const wordImage = document.getElementById("word-image");
const mascot = document.getElementById("mascot");

const categorySelect = document.getElementById("category-select");
const typeSelect = document.getElementById("type-select");
const refreshBtn = document.getElementById("refresh-session");

let allWords = [];
let remaining = [];
let total = 0;
let currentWord = "";
let currentWordObj = null;
let sessionStarted = false;

const neutralColors = ["#c2e9fb", "#dffbc2", "#760c726e", "#dde9406e", "#2d6fb", "#9ecd6e"];
let bgIndex = 0;

// Initial UI state
speakBtn.style.display = "none";
showImgBtn.style.display = "none";
wordImage.style.display = "none";

// Load words.json
fetch("words.json")
    .then(res => res.json())
    .then(data => {
        allWords = normalizeWords(data.words || []);
        initMenu(data.categories, data.types);
        buildSession();
    });

// Normalize words
function normalizeWords(words) {
    const map = {};
    words.forEach(w => {
        if (!w.text) return;
        const key = w.text.toLowerCase();
        if (!map[key]) map[key] = { ...w };
        else map[key].count += w.count;
    });
    return Object.values(map);
}

// Menu
function initMenu(categories, types) {
    fillSelect(categorySelect, categories, "2");
    fillSelect(typeSelect, types, "2");

    categorySelect.onchange = resetSession;
    typeSelect.onchange = resetSession;
    refreshBtn.onclick = refreshSession;
}

function fillSelect(select, data, def) {
    select.innerHTML = "";

    // NEW: array-based structure
    if (Array.isArray(data)) {
        data.forEach(item => {
            const opt = document.createElement("option");
            opt.value = item.id;
            opt.textContent = item.name;
            select.appendChild(opt);
        });
    }
    // OLD: object-based (kept for safety / types)
    else {
        Object.keys(data).forEach(k => {
            const opt = document.createElement("option");
            opt.value = k;
            opt.textContent = data[k];
            select.appendChild(opt);
        });
    }

    select.value = def;
}


// Build session
function buildSession() {
    const catId = categorySelect.value;
    const typeId = typeSelect.value;

    remaining = [];

    allWords.forEach(w => {
        if (Array.isArray(w.category)) {
            if (!w.category.includes(catId)) return;
        } else {
            if (w.category !== catId) return;
        }
        if (w.type !== typeId) return;

        for (let i = 0; i < w.count; i++) {
            remaining.push(w);
        }
    });

    remaining.sort(() => Math.random() - 0.5);
    total = remaining.length;

    progressEl.textContent = `📘 0 / ${total}`;
    wordEl.textContent = "👋 Tap or press SPACE";

    mascot.style.display = "block";
    wordImage.style.display = "none";
    speakBtn.style.display = "none";
    showImgBtn.style.display = "none";

    categorySelect.disabled = false;
    typeSelect.disabled = false;
    sessionStarted = false;
}

// Reset
function resetSession() {
    if (sessionStarted) return;
    buildSession();
}

function refreshSession() {
    categorySelect.value = "2";
    typeSelect.value = "2";
    buildSession();
}

// Animation
function animateWord() {
    wordEl.classList.remove("animate");
    void wordEl.offsetWidth;
    wordEl.classList.add("animate");
}

// Next word
function nextWord() {
    if (!remaining.length) {
        wordEl.textContent = "🎉 Finished!";
        speakBtn.style.display = "none";
        showImgBtn.style.display = "none";
        wordImage.style.display = "none";
        mascot.style.display = "block";
        categorySelect.disabled = false;
        typeSelect.disabled = false;
        sessionStarted = false;
        return;
    }

    sessionStarted = true;
    categorySelect.disabled = true;
    typeSelect.disabled = true;
    mascot.style.display = "none";

    currentWordObj = remaining.pop();
    currentWord = currentWordObj.text;

    wordEl.textContent = currentWord;
    animateWord();
    progressEl.textContent = `📘 ${total - remaining.length} / ${total}`;

    speakBtn.style.display = "inline";
    wordImage.style.display = "none";

    // ✅ IMAGE FLAG LOGIC
    if (currentWordObj.image === true) {
        showImgBtn.style.display = "inline";
        showImgBtn.disabled = false;
    } else {
        showImgBtn.style.display = "none";
        showImgBtn.disabled = true;
    }
}

// Events
card.addEventListener("click", nextWord);

document.addEventListener("keydown", e => {
    if (e.code === "Space") {
        e.preventDefault();
        nextWord();
    }
});

speakBtn.onclick = e => {
    e.stopPropagation();
    speechSynthesis.speak(new SpeechSynthesisUtterance(currentWord));
};

showImgBtn.onclick = e => {
    e.stopPropagation();
    if (showImgBtn.disabled) return;

    wordImage.src = `images/${currentWord}.png`;
    wordImage.style.display = "block";
};

// Background
function changeBackground() {
    document.body.style.background = neutralColors[bgIndex];
    bgIndex = (bgIndex + 1) % neutralColors.length;
}

setInterval(changeBackground, 7000);
changeBackground();
