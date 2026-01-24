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

// Colors for background animation
const colors = ["#e74c3c", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6", "#e67e22", "#1abc9c"];
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

// Remove duplicates, sum counts
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

// Initialize top menu
function initMenu(categories, types) {
  fillSelect(categorySelect, categories, "Common");
  fillSelect(typeSelect, types, "Word");

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

// Build session words based on category/type
function buildSession() {
  const cat = categorySelect.value;
  const type = typeSelect.value;

  remaining = [];
  allWords.forEach(w => {
    if (w.category === cat && w.type === type) {
      for (let i = 0; i < w.count; i++) remaining.push(w.text);
    }
  });

  remaining.sort(() => Math.random() - 0.5);
  total = remaining.length;
  progressEl.textContent = `📘 0 / ${total}`;

  mascot.style.display = "block";
  wordImage.style.display = "none"; // Hide image at start
  wordEl.textContent = "👋 Tap or press SPACE";

  sessionStarted = false;
  speakBtn.style.display = "none";
  showImgBtn.style.display = "none";

  categorySelect.disabled = false;
  typeSelect.disabled = false;

  // Clear any stored session
  localStorage.removeItem("kidWords");
}

// Reset session if user changes menu (before session starts)
function resetSession() {
  if (sessionStarted) return;
  buildSession();
}

// Refresh session button logic
function refreshSession() {
  localStorage.removeItem("kidWords");
  categorySelect.value = "Common";
  typeSelect.value = "Word";
  buildSession();
}

// Animate word
function animateWord() {
  wordEl.classList.remove("animate");
  void wordEl.offsetWidth; // trigger reflow
  wordEl.classList.add("animate");
}

// Next word logic
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
  wordImage.src = `images/${currentWord}.jpeg`;
  wordImage.style.display = "block";
};

// Background cycling animation
function changeBackground() {
  document.body.style.background = neutralColors[bgIndex];
  bgIndex = (bgIndex + 1) % neutralColors.length;
}
setInterval(changeBackground, 7000);
changeBackground();
