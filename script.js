console.log("JS loaded");

const SHEET_ID = "1UYOe8f-uzv--xQNNOxWFyBvZAC9iFZplJnr7TMfNn8U";
const PAGE_SIZE = 5;

let filteredEvents = [];
let lastScoreboardData = "";
let lastEventsData = "";
let allEvents = [];
let eventsVisible = PAGE_SIZE;
let isSearching = false;
let scoreboardInitialized = false;
let eventsInitialized = false;
let dataUpdated = false;

/* ---------------- SCOREBOARD ---------------- */

function loadScoreboard() {
  fetch(`https://opensheet.elk.sh/${SHEET_ID}/scoreboard`)
    .then(res => res.json())
    .then(data => {

      // Sort for consistent comparison
      data.sort((a, b) => a.Department.localeCompare(b.Department));

      const currentSignature = data
      .map(d => `${d.Department}:${d.Points}`)
      .join("|");

      if (currentSignature === lastScoreboardData) return;

      lastScoreboardData = currentSignature;

      // Sort by points for display
      data.sort((a, b) => Number(b.Points) - Number(a.Points));

      let html = "";
      data.forEach((row, i) => {
        html += `
          <tr>
            <td>${i + 1}</td>
            <td>${row.Department}</td>
            <td>${row.Points}</td>
          </tr>
        `;
      });

    
      const table = document.getElementById("scoreboard");
      table.innerHTML = html;

      // 🔔 flicker effect
      if (scoreboardInitialized) {
        table.classList.add("update-flicker");
        setTimeout(() => table.classList.remove("update-flicker"), 1200);
      }

      scoreboardInitialized = true;

      const liveBadge = document.querySelector(".live-badge");
      liveBadge.classList.add("update-flicker");
      setTimeout(() => liveBadge.classList.remove("update-flicker"), 1200);

      dataUpdated = true;


    })
    .catch(err => console.error("Scoreboard error:", err));
}


/* ---------------- EVENTS ---------------- */

function loadEvents() {
  fetch(`https://opensheet.elk.sh/${SHEET_ID}/events`)
    .then(res => res.json())
    .then(data => {

      const published = data.filter(e =>
        e.statusflag &&
        e.statusflag.trim().toLowerCase() === "result published"
      );

      // Sort for stable comparison
      published.sort((a, b) =>
        Number(a["Item no"]) - Number(b["Item no"])
      );

      const currentData = JSON.stringify(published);

      // 🔴 NO CHANGE
      if (currentData === lastEventsData) return;

      // 🟢 DATA CHANGED
      lastEventsData = currentData;

      // Display latest first
      published.sort((a, b) =>
        Number(b["Item no"]) - Number(a["Item no"])
      );

      allEvents = published;
      filteredEvents = published;
      eventsVisible = PAGE_SIZE;

      renderEvents();

      // flicker all event cards
      if (eventsInitialized) {
        document.querySelectorAll(".event-card").forEach(card => {
          card.classList.add("update-flicker");
          setTimeout(() => card.classList.remove("update-flicker"), 1200);
        });
      }

      eventsInitialized = true;


      dataUpdated = true;

    })
    .catch(err => console.error("Events error:", err));
}
function commitUpdateTime() {
  if (!dataUpdated) return;
  dataUpdated = false;
  updateLastUpdatedTime();
}

function renderEvents() {
 let html = "";

const list = isSearching ? filteredEvents : allEvents;


if (list.length === 0) {
  document.getElementById("events").innerHTML = "";
  document.getElementById("noResults").style.display = "block";
  updateEventButtons();
  return;
}

document.getElementById("noResults").style.display = "none";


  
  list.slice(0, eventsVisible).forEach(e => {
    html += `
      <div class="col-md-4">
        <div class="event-card">
          <h5 class="mb-3">${e.Event}</h5>

          <div class="winner mb-2">
            🥇 <strong>${e.Firststud}</strong><br>
            <small>${e.Firstdept}</small>
          </div>

          <div class="winner mb-2">
            🥈 <strong>${e.Secondstud}</strong><br>
            <small>${e.Seconddept}</small>
          </div>

          <div class="winner">
            🥉 <strong>${e.Thirdstud}</strong><br>
            <small>${e.Thirddept}</small>
          </div>
        </div>
      </div>
    `;
  });

  document.getElementById("events").innerHTML = html;
  updateEventButtons();
}

/* ---------------- BUTTON VISIBILITY ---------------- */

function updateEventButtons() {
  const moreBtn = document.getElementById("viewMoreBtn");
  const lessBtn = document.getElementById("viewLessBtn");

  const list = filteredEvents.length ? filteredEvents : allEvents;

  moreBtn.style.display =
    eventsVisible < list.length ? "inline-block" : "none";

  lessBtn.style.display =
    eventsVisible > PAGE_SIZE ? "inline-block" : "none";
}


/* ---------------- VIEW MORE / LESS ---------------- */

document.getElementById("viewMoreBtn").addEventListener("click", () => {
  eventsVisible += PAGE_SIZE;
  renderEvents();
});

document.getElementById("viewLessBtn").addEventListener("click", () => {
  eventsVisible = PAGE_SIZE;
  renderEvents();

  // Smooth scroll back to events top
  document.getElementById("events")
    .scrollIntoView({ behavior: "smooth" });
});

/* ---------------- LAST UPDATED ---------------- */

function updateLastUpdatedTime() {
  const now = new Date();
  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const value = `Last updated at: ${time}`;

  // ✅ save to localStorage
  localStorage.setItem("lastUpdatedTime", value);

  document.getElementById("lastUpdated").innerText = value;
}


/* ---------------- AUTO REFRESH ---------------- */

setTimeout(() => {
  setInterval(() => {
    loadScoreboard();
    loadEvents();
  }, 30000);
}, 5000); // wait 5s after first load

document.getElementById("eventSearch").addEventListener("input", function () {
  const q = this.value.trim().toLowerCase();
  isSearching = !!q;

  if (!q) {
    filteredEvents = [];
  } else {
    filteredEvents = allEvents.filter(e =>
      e.Event.toLowerCase().includes(q) ||
      e.Firststud.toLowerCase().includes(q) ||
      e.Secondstud.toLowerCase().includes(q) ||
      e.Thirdstud.toLowerCase().includes(q) ||
      e.Firstdept.toLowerCase().includes(q) ||
      e.Seconddept.toLowerCase().includes(q) ||
      e.Thirddept.toLowerCase().includes(q)
    );
  }

  eventsVisible = PAGE_SIZE;
  renderEvents();
});

// Restore last updated time after refresh
document.addEventListener("DOMContentLoaded", () => {

  // restore last updated time
  const savedTime = localStorage.getItem("lastUpdatedTime");
  if (savedTime) {
    const el = document.getElementById("lastUpdated");
    if (el) el.innerText = savedTime;
  }

  loadScoreboard();
  loadEvents();

});

