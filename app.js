// Sorted! swipe demo. Items, sprites and answers are taken from the game's own item data
// (correctCategory: Recycle = swipe left, Trash = swipe right).
(function () {
  "use strict";

  var COUNTRIES = {
    usa: { name: "USA", backdrop: "img/cities/usa.webp", items: [
      ["SodaCan", "Soda can", 1], ["PlasticBottle", "Plastic bottle", 1], ["Newspaper", "Newspaper", 1],
      ["Milk", "Milk carton", 1], ["EggCarton", "Egg carton", 1],
      ["AppleCore", "Apple core", 0], ["BananaPeel", "Banana peel", 0], ["ChipBag", "Chip bag", 0],
      ["Candy", "Candy wrapper", 0], ["Takeout", "Takeout box", 0], ["Pizza", "Greasy pizza box", 0]] },
    japan: { name: "Japan", backdrop: "img/cities/japan.webp", items: [
      ["CoffeeCan", "Canned coffee", 1], ["WaterBottle", "Water bottle", 1], ["PlasticBag", "Plastic bag", 1],
      ["RamenCup", "Ramen cup", 0], ["OnigiriWrapper", "Onigiri wrapper", 0], ["BentoBox", "Bento tray", 0],
      ["EggSalad", "Egg sando wrapper", 0], ["MatchaCup", "Matcha cup", 0]] },
    thailand: { name: "Thailand", backdrop: "img/cities/thailand.webp", items: [
      ["CoconutWaterCan", "Coconut water can", 1], ["OfferingBottle", "Glass bottle", 1], ["ThaiTeaBag", "Thai tea bag", 1],
      ["IncenseBundle", "Incense sticks", 0], ["LeafBoat", "Krathong", 0], ["StickyRiceBox", "Sticky rice box", 0],
      ["DragonFruitHalf", "Dragon fruit", 0]] },
    vietnam: { name: "Vietnam", backdrop: "img/cities/vietnam.webp", items: [
      ["CondensedMilkCan", "Condensed milk can", 1], ["PhinFilter", "Phin coffee filter", 1], ["PlasticStool", "Plastic stool", 1],
      ["PlasticBottleVietnam", "Plastic bottle", 1],
      ["LotusPod", "Lotus pod", 0], ["Mangosteen", "Mangosteen", 0], ["NonLaHat", "Worn-out nón lá", 0]] },
    indonesia: { name: "Indonesia", backdrop: "img/cities/indonesia.webp", items: [
      ["IndonesiaCan", "Drink can", 1], ["AquaCup", "Water cup", 1], ["RiceSack", "Rice sack", 1],
      ["CoconutShell", "Coconut shell", 0], ["NoodleCup", "Noodle cup", 0], ["PalmWrapper", "Ketupat wrapper", 0],
      ["RamenWrapper", "Noodle wrapper", 0]] }
  };
  var ROUND = 8;               // items before the "you sorted X" prompt
  var THRESHOLD = 70;          // px of drag that counts as a swipe
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var scene = document.getElementById("scene");
  if (!scene) return;
  var verdict = document.getElementById("verdict");
  var elStreak = document.getElementById("streak");
  var elScore = document.getElementById("score");
  var binRecycle = document.getElementById("binRecycle");
  var binTrash = document.getElementById("binTrash");
  var done = document.getElementById("done");
  var doneText = document.getElementById("doneText");
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));

  var country = "usa", queue = [], card = null, current = null;
  var streak = 0, sorted = 0, roundCount = 0, roundRight = 0, busy = false;
  var startX = 0, dx = 0, dragging = false, verdictTimer = 0;

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function nextItem() {
    if (!queue.length) queue = shuffle(COUNTRIES[country].items);
    return queue.shift();
  }

  function deal() {
    current = nextItem();
    card = document.createElement("button");
    card.type = "button";
    card.className = "card";
    card.setAttribute("aria-label", current[1] + ". Swipe left to recycle or right to trash.");
    card.innerHTML = '<img src="img/items/' + current[0] + '.webp" alt=""><b>' + current[1] + "</b>";
    card.addEventListener("pointerdown", onDown);
    scene.appendChild(card);
  }

  function hot(dir) {
    binRecycle.classList.toggle("is-hot", dir < 0);
    binTrash.classList.toggle("is-hot", dir > 0);
  }

  function onDown(e) {
    if (busy) return;
    dragging = true; startX = e.clientX; dx = 0;
    card.classList.add("is-dragging");
    card.setPointerCapture(e.pointerId);
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerup", onUp);
    card.addEventListener("pointercancel", onUp);
  }
  function onMove(e) {
    if (!dragging) return;
    dx = e.clientX - startX;
    card.style.transform = "translate(calc(-50% + " + dx + "px), -50%) rotate(" + dx / 14 + "deg)";
    hot(Math.abs(dx) > 30 ? dx : 0);
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    card.classList.remove("is-dragging");
    card.removeEventListener("pointermove", onMove);
    card.removeEventListener("pointerup", onUp);
    card.removeEventListener("pointercancel", onUp);
    if (Math.abs(dx) > THRESHOLD) sort(dx < 0 ? -1 : 1);
    else { card.style.transform = ""; hot(0); }
  }

  function say(text, bad) {
    verdict.textContent = text;
    verdict.className = "verdict is-on" + (bad ? " is-bad" : "");
    clearTimeout(verdictTimer);
    verdictTimer = setTimeout(function () { verdict.classList.remove("is-on"); }, 1800);
  }

  function sort(dir) {
    if (busy || !card) return;
    busy = true; hot(0);
    var isRecycle = current[2] === 1;
    var right = (dir < 0) === isRecycle;
    sorted++; roundCount++;
    if (right) { streak++; roundRight++; } else { streak = 0; }
    elStreak.textContent = streak;
    elScore.textContent = sorted;

    if (right) say(streak >= 3 ? "Combo ×" + streak + "!" : (isRecycle ? "Recycled!" : "Trashed!"));
    else say("Not quite: " + current[1].toLowerCase() + " goes in " + (isRecycle ? "recycling." : "the trash."), true);

    var bin = dir < 0 ? binRecycle : binTrash;
    bin.classList.remove("is-hit"); void bin.offsetWidth; bin.classList.add("is-hit");

    var gone = card;
    gone.removeEventListener("pointerdown", onDown);
    if (reduceMotion) { finish(gone); return; }
    gone.classList.add("is-flying");
    gone.style.transform = "translate(calc(-50% + " + dir * scene.clientWidth + "px), -50%) rotate(" + dir * 30 + "deg)";
    setTimeout(function () { finish(gone); }, 320);
  }

  function finish(gone) {
    var hadFocus = document.activeElement === gone;
    gone.remove();
    if (roundCount === ROUND) {
      var c = country === "usa" ? "the USA" : COUNTRIES[country].name;
      doneText.textContent = "You sorted " + roundRight + " of " + ROUND + " in " + c + ". The full game has dozens of levels across five countries.";
      done.hidden = false;
    }
    deal();
    if (hadFocus) card.focus();
    busy = false;
  }

  function setCountry(key) {
    country = key; queue = []; roundCount = 0; roundRight = 0; done.hidden = true;
    tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t.getAttribute("data-country") === key)); });
    scene.style.backgroundImage = "url(" + COUNTRIES[key].backdrop + ")";
    if (card) card.remove();
    deal();
  }

  tabs.forEach(function (t) { t.addEventListener("click", function () { setCountry(t.getAttribute("data-country")); }); });
  document.getElementById("goRecycle").addEventListener("click", function () { sort(-1); });
  document.getElementById("goTrash").addEventListener("click", function () { sort(1); });
  document.getElementById("play").addEventListener("keydown", function (e) {
    if (e.target.classList && e.target.classList.contains("tab")) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); sort(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); sort(1); }
  });

  setCountry("usa");
})();
