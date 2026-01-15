console.log("JS loaded");

const SHEET_ID = "1UYOe8f-uzv--xQNNOxWFyBvZAC9iFZplJnr7TMfNn8U";
const PAGE_SIZE = 5;

let allEvents = [];
let eventsVisible = PAGE_SIZE;

/* ---------------- SCOREBOARD ---------------- */

function loadScoreboard() {
  fetch(`https://opensheet.elk.sh/${SHEET_ID}/scoreboard`)
    .then(res => res.json())
    .then(data => {

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

      document.getElementById("scoreboard").innerHTML = html;
      updateLastUpdatedTime();
    })
    .catch(err => console.error("Scoreboard error:", err));
}

/* ---------------- EVENTS ---------------- */

function loadEvents() {
  fetch(`https://opensheet.elk.sh/${SHEET_ID}/events`)
    .then(res => res.json())
    .then(data => {

      allEvents = data.filter(e =>
        e.statusflag &&
        e.statusflag.trim().toLowerCase() === "result published"
      );

      allEvents.sort(
        (a, b) => Number(b["Item no"]) - Number(a["Item no"])
      );

      // 🔑 Reset pagination on refresh
      eventsVisible = PAGE_SIZE;

      renderEvents();
    })
    .catch(err => console.error("Events error:", err));
}

function renderEvents() {
  let html = "";

  allEvents.slice(0, eventsVisible).forEach(e => {
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

  moreBtn.style.display =
    eventsVisible < allEvents.length ? "inline-block" : "none";

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

  document.getElementById("lastUpdated").innerText =
    `Last updated at: ${time}`;
}

/* ---------------- INITIAL LOAD ---------------- */

loadScoreboard();
loadEvents();

/* ---------------- AUTO REFRESH ---------------- */

setInterval(() => {
  loadScoreboard();
  loadEvents();
}, 10000);
