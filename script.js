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
let sessionStarted = false;

const neutralColors = ["#c2e9fb", "#dffbc2", "#760c726e", "#dde9406e", "#2d6fb", "#9ecd6e"];
let bgIndex = 0;

// Hide icons before session starts
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

// Normalize words (remove empty, sum duplicates)
function normalizeWords(words) {
    const map = {};
    words.forEach(w => {
        if (!w.text) return;
        const key = w.text.toLowerCase();
        if (!map[key]) map[key] = {...w};
        else map[key].count += w.count;
    });
    return Object.values(map);
}

// Initialize menu
function initMenu(categories, types) {
    fillSelect(categorySelect, categories, "2");
    fillSelect(typeSelect, types, "2");

    categorySelect.onchange = resetSession;
    typeSelect.onchange = resetSession;
    refreshBtn.onclick = refreshSession;
}

// Fill select options
function fillSelect(select, data, def) {
    Object.keys(data).forEach(k => {
        const opt = document.createElement("option");
        opt.value = k;
        opt.textContent = data[k];
        select.appendChild(opt);
    });
    select.value = def;
}

// Build session considering multiple categories
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

        for (let i = 0; i < w.count; i++) remaining.push(w.text);
    });

    remaining.sort(() => Math.random() - 0.5);
    total = remaining.length;
    progressEl.textContent = `📘 0 / ${total}`;

    mascot.style.display = "block";
    wordImage.style.display = "none";
    wordEl.textContent = "👋 Tap or press SPACE";

    sessionStarted = false;
    speakBtn.style.display = "none";
    showImgBtn.style.display = "none";

    categorySelect.disabled = false;
    typeSelect.disabled = false;
    localStorage.removeItem("kidWords");
}

// Reset session if menu changes
function resetSession() {
    if (sessionStarted) return;
    buildSession();
}

// Refresh session button
function refreshSession() {
    localStorage.removeItem("kidWords");
    categorySelect.value = "2";
    typeSelect.value = "2";
    buildSession();
}

// Animate word
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
        mascot.style.display = "block";
        categorySelect.disabled = false;
        typeSelect.disabled = false;
        wordImage.style.display = "none";
        sessionStarted = false;
        return;
    }

    sessionStarted = true;
    categorySelect.disabled = true;
    typeSelect.disabled = true;
    mascot.style.display = "none";

    currentWord = remaining.pop();
    wordEl.textContent = currentWord;
    animateWord();
    progressEl.textContent = `📘 ${total - remaining.length} / ${total}`;

    speakBtn.style.display = "inline";
    showImgBtn.style.display = "inline";
    wordImage.style.display = "none";
}

// Card click & spacebar
card.addEventListener("click", nextWord);
document.addEventListener("keydown", e => {
    if (e.code === "Space") {
        e.preventDefault();
        nextWord();
    }
});

// Speak button
speakBtn.onclick = e => {
    e.stopPropagation();
    speechSynthesis.speak(new SpeechSynthesisUtterance(currentWord));
};

// Show image button
showImgBtn.onclick = e => {
    e.stopPropagation();
    wordImage.src = `images/${currentWord}.png`;
    wordImage.style.display = "block";
};

// Background animation
function changeBackground() {
    document.body.style.background = neutralColors[bgIndex];
    bgIndex = (bgIndex + 1) % neutralColors.length;
}

setInterval(changeBackground, 7000);
changeBackground();
