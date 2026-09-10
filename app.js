let nextId = 0;
const startupTime = Date.now();
const customers = [
  { name: "Maya R.", service: "Signature cut & finish", party: 1, minutesAgo: 0, status: "With stylist" },
  { name: "Jordan L.", service: "Curly cut", party: 1, minutesAgo: 5, status: "Up next" },
  { name: "Elena P.", service: "Blowout & style", party: 1, minutesAgo: 12, status: "Checking in" },
  { name: "Sam K.", service: "Color refresh", party: 1, minutesAgo: 18, status: "Arriving soon" },
  { name: "Avery B.", service: "Clipper cut", party: 1, minutesAgo: 23, status: "Checking in" },
  { name: "Riley M.", service: "Gloss & finish", party: 1, minutesAgo: 31, status: "Arriving soon" },
  { name: "Casey T.", service: "Kids cut", party: 2, minutesAgo: 38, status: "Checking in" }
].map(({ minutesAgo, ...customer }) => ({
  ...customer,
  id: nextId++,
  joinedAt: startupTime - minutesAgo * 60000
}));

const namePool = [
  "Noor A.", "Priya S.", "Diego M.", "Harper W.", "Theo N.",
  "Zoe F.", "Marcus D.", "Lena V.", "Owen C.", "Ivy R.",
  "Kai T.", "Sofia G.", "Emil H.", "Ruby P.", "Andre L."
];
const servicePool = [
  "Signature cut & finish", "Curly cut", "Blowout & style", "Color refresh",
  "Clipper cut", "Gloss & finish", "Kids cut", "Balayage touch-up",
  "Beard trim", "Deep conditioning"
];
const maxQueueLength = 8;
const slideCount = 3;

const rotationMs = 10000;
let slideIndex = 0;
let secondsLeft = rotationMs / 1000;

const elements = {
  track: document.querySelector("#stage-track"),
  rows: document.querySelector("#waitlist-rows"),
  summary: document.querySelector("#queue-summary"),
  clock: document.querySelector("#clock"),
  rotationStatus: document.querySelector("#rotation-status")
};

function statusClass(status) {
  return `status-${status.toLowerCase().replaceAll(" ", "-")}`;
}

function formatWait(customer) {
  if (customer.status === "With stylist") return "In service";
  const minutes = Math.floor((Date.now() - customer.joinedAt) / 60000);
  return minutes < 1 ? "Just joined" : `${minutes} min`;
}

function renderWaitlist() {
  elements.rows.innerHTML = customers.map((customer) => `
    <div class="table-row${customer.isNew ? " row-enter" : ""}" role="row" data-id="${customer.id}">
      <span class="customer-name" role="cell">${customer.name}</span>
      <span class="service" role="cell">${customer.service}</span>
      <span class="party" role="cell">${customer.party}</span>
      <span class="wait" role="cell">${formatWait(customer)}</span>
      <span class="status ${statusClass(customer.status)}" role="cell">${customer.status}</span>
    </div>
  `).join("");

  const waiting = customers.filter((customer) => customer.status !== "With stylist").length;
  elements.summary.textContent = `${waiting} guest${waiting === 1 ? "" : "s"} waiting`;

  if (customers.some((customer) => customer.isNew)) {
    customers.forEach((customer) => delete customer.isNew);
    requestAnimationFrame(() => {
      elements.rows.querySelectorAll(".row-enter").forEach((row) => row.classList.remove("row-enter"));
    });
  }
}

function addWaitingCustomer() {
  const usedNames = new Set(customers.map((customer) => customer.name));
  const available = namePool.filter((name) => !usedNames.has(name));
  if (!available.length || customers.length >= maxQueueLength) return;

  const name = available[Math.floor(Math.random() * available.length)];
  const service = servicePool[Math.floor(Math.random() * servicePool.length)];
  customers.push({
    id: nextId++,
    name,
    service,
    party: Math.random() < 0.2 ? 2 : 1,
    joinedAt: Date.now(),
    status: "Checking in",
    isNew: true
  });
  renderWaitlist();
}

function graduateCustomer() {
  const servingIndex = customers.findIndex((customer) => customer.status === "With stylist");
  if (servingIndex === -1) return;

  const row = elements.rows.querySelector(`[data-id="${customers[servingIndex].id}"]`);
  if (row) row.classList.add("row-exit");

  const leavingId = customers[servingIndex].id;
  window.setTimeout(() => {
    customers.splice(customers.findIndex((customer) => customer.id === leavingId), 1);
    if (customers.length) {
      customers[0].status = "With stylist";
    }
    renderWaitlist();
  }, 450);
}

function updateLiveQueue() {
  if (customers.length < 3 || Math.random() < 0.55) {
    addWaitingCustomer();
  } else {
    graduateCustomer();
  }
}

function setTrackPosition(index, animate) {
  elements.track.style.transition = animate ? "transform .6s ease" : "none";
  elements.track.style.transform = `translateX(-${index * 100}%)`;
}

function rotateDisplay() {
  slideIndex += 1;
  secondsLeft = rotationMs / 1000;
  setTrackPosition(slideIndex, true);

  if (slideIndex === slideCount) {
    elements.track.addEventListener("transitionend", () => {
      slideIndex = 0;
      setTrackPosition(slideIndex, false);
      void elements.track.offsetWidth;
    }, { once: true });
  }
}

function updateClock() {
  elements.clock.textContent = new Intl.DateTimeFormat([], {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());
}

function updateRotationStatus() {
  elements.rotationStatus.textContent = `Refreshing display in ${secondsLeft} second${secondsLeft === 1 ? "" : "s"}`;
  secondsLeft = secondsLeft > 1 ? secondsLeft - 1 : rotationMs / 1000;
}

function scheduleNextQueueUpdate() {
  const delay = 60000 + Math.random() * 60000;
  window.setTimeout(() => {
    updateLiveQueue();
    scheduleNextQueueUpdate();
  }, delay);
}

renderWaitlist();
setTrackPosition(slideIndex, false);
updateClock();
updateRotationStatus();
scheduleNextQueueUpdate();

window.setInterval(rotateDisplay, rotationMs);
window.setInterval(updateClock, 1000);
window.setInterval(updateRotationStatus, 1000);
window.setInterval(renderWaitlist, 15000);
