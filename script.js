const card = document.getElementById("card");
const wordEl = document.getElementById("word");
const progressEl = document.getElementById("progress");
const starCountEl = document.getElementById("star-count");
const learningActions = document.getElementById("learning-actions");
const knowItBtn = document.getElementById("know-it-btn");
const practiceAgainBtn = document.getElementById("practice-again-btn");
const speakBtn = document.getElementById("speak-btn");
const slowSpeakBtn = document.getElementById("slow-speak-btn");
const speechStatus = document.getElementById("speech-status");
const speechSupported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
const CORRECT_WORDS_PER_STAR = 3;
let englishVoice = null;

function updateEnglishVoice() {
    const voices = window.speechSynthesis.getVoices();
    const language = voice => voice.lang.toLowerCase().replace(/_/g, "-");
    englishVoice = voices.find(voice => language(voice) === "en-us")
        || voices.find(voice => /^en(?:-|$)/.test(language(voice)))
        || null;
}

function stopSpeech() {
    if (speechSupported) window.speechSynthesis.cancel();
}

function setSpeechControls(visible) {
    speakBtn.style.display = slowSpeakBtn.style.display = visible && speechSupported ? "inline" : "none";
    speechStatus.hidden = !visible || speechSupported;
}

function pronounceWord(rate) {
    if (!speechSupported || !currentWord) return;
    stopSpeech();
    updateEnglishVoice();
    const utterance = new window.SpeechSynthesisUtterance(currentWord);
    utterance.lang = "en-US";
    if (englishVoice) utterance.voice = englishVoice;
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
}

if (speechSupported) {
    updateEnglishVoice();
    window.speechSynthesis.addEventListener("voiceschanged", updateEnglishVoice);
}
const showImgBtn = document.getElementById("show-img-btn");
const wordImage = document.getElementById("word-image");
const mascot = document.getElementById("mascot");

const categorySelect = document.getElementById("category-select");
const typeSelect = document.getElementById("type-select");
const refreshBtn = document.getElementById("refresh-session");

let allWords = [];
let remaining = [];
let total = 0;
let known = 0;
let starTotal = 0;
let currentWord = "";
let currentWordObj = null;
let sessionStarted = false;

const neutralColors = ["#c2e9fb", "#dffbc2", "#760c726e", "#dde9406e", "#a2d6fb", "#9ecd6e"];
let bgIndex = 0;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// For quick category lookup
let categoryMap = {};
let categoriesByType = {};

// Initial UI state
setSpeechControls(false);
showImgBtn.style.display = "none";
wordImage.style.display = "none";

// Load words.json
fetch("words.json")
    .then(res => res.json())
    .then(data => {
        allWords = normalizeWords(data.words || []);
        initMenu(data);
        buildSession();
    });

// Normalize words
function normalizeWords(words) {
    const map = new Map();
    words.forEach(w => {
        if (!w.text) return;
        const key = JSON.stringify([w.type, w.text.toLowerCase()]);
        if (!map.has(key)) map.set(key, { ...w });
        else {
            const existing = map.get(key);
            existing.count += w.count;
            existing.category = [...new Set([].concat(existing.category, w.category))];
        }
    });
    return [...map.values()];
}

// Menu
function initMenu(data) {
    const types = data.types.map(type => {
        const id = Object.keys(type).find(key => key !== "categories");
        categoriesByType[id] = data[type.categories];
        return { id, name: type[id] };
    });
    fillSelect(typeSelect, types, "2");
    updateCategories();

    categorySelect.onchange = resetSession;
    typeSelect.onchange = () => {
        if (sessionStarted) return;
        updateCategories();
        buildSession();
    };
    refreshBtn.onclick = refreshSession;
}

function updateCategories() {
    const categories = categoriesByType[typeSelect.value] || [];
    categoryMap = Object.fromEntries(categories.map(category => [category.id, category]));
    fillSelect(categorySelect, categories, categories[0]?.id);
}

function fillSelect(select, data, def) {
    select.innerHTML = "";

    if (Array.isArray(data)) {
        data.forEach(item => {
            const opt = document.createElement("option");
            opt.value = item.id;
            opt.textContent = item.name;
            select.appendChild(opt);
        });
    } else {
        Object.keys(data).forEach(k => {
            const opt = document.createElement("option");
            opt.value = k;
            opt.textContent = data[k];
            select.appendChild(opt);
        });
    }

    if (def !== undefined) select.value = def;
}

// Build session
function buildSession() {
    stopSpeech();
    currentWord = "";
    currentWordObj = null;
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

    for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    total = remaining.length;
    known = 0;
    starTotal = 0;

    updateProgress();
    updateStarCount();
    learningActions.hidden = true;
    wordEl.textContent = total ? "👋 Tap or press SPACE" : "No entries in this category yet.";
    card.disabled = total === 0;
    card.setAttribute("aria-disabled", String(total === 0));

    mascot.style.display = "block";
    wordImage.style.display = "none";
    setSpeechControls(false);
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
    buildSession();
}

// Animation
function animateWord() {
    wordEl.classList.remove("animate");
    void wordEl.offsetWidth;
    wordEl.classList.add("animate");
}

// Next word
function updateProgress() {
    progressEl.textContent = `📘 ${known} / ${total} known`;
}

function updateStarCount() {
    starCountEl.textContent = `⭐ ${starTotal}`;
}

function rateWord(knowIt) {
    if (!currentWordObj) return;
    if (knowIt) {
        known++;
        if (known % CORRECT_WORDS_PER_STAR === 0) starTotal++;
    } else {
        starTotal = Math.max(0, starTotal - 1);
        // Show up to three other cards before asking about this one again.
        remaining.splice(Math.max(0, remaining.length - 3), 0, currentWordObj);
    }
    currentWordObj = null;
    currentWord = "";
    updateProgress();
    updateStarCount();
    nextWord();
}

function nextWord() {
    if (!total) return;
    if (currentWordObj) return;
    stopSpeech();
    if (!remaining.length) {
        currentWord = "";
        currentWordObj = null;
        wordEl.textContent = "🎉 Finished!";
        card.setAttribute("aria-disabled", "true");
        learningActions.hidden = true;
        setSpeechControls(false);
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
    card.setAttribute("aria-disabled", "true");
    animateWord();
    learningActions.hidden = false;

    setSpeechControls(true);
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
knowItBtn.onclick = () => rateWord(true);
practiceAgainBtn.onclick = () => rateWord(false);

document.addEventListener("keydown", e => {
    if (e.code !== "Space" || e.defaultPrevented || e.repeat || e.isComposing
        || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

    const controls = "button, select, input, textarea, a[href], summary, audio[controls], video[controls], [contenteditable], [role], [tabindex]";
    if (e.target.closest(controls) || document.activeElement?.closest(controls)) return;

    e.preventDefault();
    nextWord();
});

speakBtn.onclick = e => {
    e.stopPropagation();
    pronounceWord(0.7);
};

slowSpeakBtn.onclick = e => {
    e.stopPropagation();
    pronounceWord(0.3);
};

window.addEventListener("pagehide", stopSpeech);

showImgBtn.onclick = e => {
    e.stopPropagation();
    if (showImgBtn.disabled) return;

    let catId = null;

    if (Array.isArray(currentWordObj.category)) {
        // Find first category with folder true
        catId = currentWordObj.category.find(id => categoryMap[id] && categoryMap[id].folder) || currentWordObj.category[0];
    } else {
        catId = currentWordObj.category;
    }

    const cat = categoryMap[catId];
    let imgPath = `images/${currentWord}.png`;

    if (cat && cat.folder === true) {
        imgPath = `images/${catId}/${currentWord}.png`;
    }

    wordImage.src = imgPath;
    wordImage.style.display = "block";
};

// Background
const backgroundChangeIntervalMs = 15000; // Change color every 15 seconds.

function changeBackground() {
    document.body.style.background = neutralColors[bgIndex];
    bgIndex = (bgIndex + 1) % neutralColors.length;
}

setInterval(() => {
    if (!reducedMotion.matches) changeBackground();
}, backgroundChangeIntervalMs);
changeBackground();

// Discourage casual inspection through context menus and common shortcuts.
document.addEventListener("contextmenu", event => {
    event.preventDefault();
});

document.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();

    if (
        key === "f12" ||
        (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key)) ||
        (event.metaKey && event.altKey && ["i", "j", "c"].includes(key))
    ) {
        event.preventDefault();
    }
});
