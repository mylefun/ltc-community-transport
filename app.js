const STORAGE_KEY = "ltc-community-transport-v1";

const viewTitles = {
  dashboard: "承辦人工作台",
  cases: "個案資料",
  driver: "司機入口",
  settings: "系統設定",
};

const statusLabels = {
  scheduled: "待接",
  picked_up: "接送中",
  completed: "已完成",
  late: "可能延遲",
};

const eventLabels = {
  pickup: "接到個案",
  dropoff: "送達目的地",
  heartbeat: "目前位置",
};

const taipeiBounds = {
  minLat: 25.005,
  maxLat: 25.105,
  minLng: 121.48,
  maxLng: 121.60,
};

let activeView = "dashboard";
let activeDriverId = "";
let selectedLoginDriverId = "";
let pinInput = "";
let pinMessage = "";
let filters = {
  driver: "all",
  status: "all",
};
let dataMode = "local";
let dataMessage = "本機示範資料";

let state = loadState();
state = normalizeState(state);
saveState();

function todayKey(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function localTime(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function addMinutes(minutes) {
  return localTime(new Date(Date.now() + minutes * 60_000));
}

function uid(prefix) {
  if (window.crypto?.randomUUID) {
    return `${prefix}_${window.crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();

  try {
    const parsed = JSON.parse(raw);
    if (parsed.serviceDate !== todayKey()) {
      return rollToToday(parsed);
    }
    return parsed;
  } catch {
    return defaultState();
  }
}

function normalizeState(value) {
  const fresh = defaultState();
  const next = {
    ...fresh,
    ...value,
    drivers: value.drivers?.length ? value.drivers : fresh.drivers,
    cases: value.cases?.length ? value.cases : fresh.cases,
    trips: value.trips?.length ? value.trips : fresh.trips,
    events: Array.isArray(value.events) ? value.events : [],
    driverLocations: value.driverLocations && typeof value.driverLocations === "object" ? value.driverLocations : {},
  };

  next.drivers = next.drivers.map((driver) => {
    const fallback = fresh.drivers.find((item) => item.id === driver.id);
    return {
      ...fallback,
      ...driver,
      homeLocation: driver.homeLocation ?? fallback?.homeLocation ?? fallbackLocation(driver.id),
    };
  });

  next.trips = next.trips.map((trip) => ({
    pickupLocation: null,
    dropoffLocation: null,
    ...trip,
  }));

  next.driverLocations = {
    ...seedDriverLocations(next.drivers, next.trips),
    ...next.driverLocations,
  };

  return next;
}

function rollToToday(previous) {
  const fresh = defaultState();
  return {
    ...fresh,
    drivers: previous.drivers?.length ? previous.drivers : fresh.drivers,
    cases: previous.cases?.length ? previous.cases : fresh.cases,
    driverLocations: previous.driverLocations ?? fresh.driverLocations,
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function loadRemoteState() {
  const response = await fetch("/api/state", {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }

  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error || "API failed");
  }

  state = normalizeState(payload.state);
  dataMode = "supabase";
  dataMessage = "Supabase 已連線";
  saveState();
}

async function apiAction(action, payload = {}) {
  if (dataMode !== "supabase") return false;

  const response = await fetch("/api/state", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ action, payload }),
  });

  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.error || `API ${response.status}`);
  }

  state = normalizeState(result.state);
  saveState();
  return true;
}

function updateConnectionState() {
  const target = document.querySelector(".connection-state span:last-child");
  const dot = document.querySelector(".connection-state .dot");
  if (!target || !dot) return;
  target.textContent = dataMessage;
  dot.classList.toggle("online", dataMode === "supabase");
  dot.classList.toggle("local", dataMode !== "supabase");
}

function defaultState() {
  const serviceDate = todayKey();
  const drivers = [
    {
      id: "drv_lin",
      name: "林志明",
      phone: "0912-118-205",
      vehicleNo: "KAA-1032",
      routeLabel: "A 線",
      pin: "1357",
      homeLocation: { lat: 25.0409, lng: 121.5164 },
      active: true,
    },
    {
      id: "drv_wu",
      name: "吳佳玲",
      phone: "0928-772-481",
      vehicleNo: "KAB-2210",
      routeLabel: "B 線",
      pin: "2468",
      homeLocation: { lat: 25.0311, lng: 121.4978 },
      active: true,
    },
    {
      id: "drv_chen",
      name: "陳建宏",
      phone: "0936-458-119",
      vehicleNo: "KAC-5198",
      routeLabel: "C 線",
      pin: "9753",
      homeLocation: { lat: 25.064, lng: 121.5423 },
      active: true,
    },
  ];

  const cases = [
    {
      id: "case_001",
      caseNo: "LTC-001",
      name: "李美玉",
      phone: "02-2345-1101",
      emergencyContact: "李小姐",
      emergencyPhone: "0910-552-001",
      careLevel: "長照2.0 4級",
      mobility: "輪椅",
      pickupAddress: "台北市中正區和平西路一段 38 號",
      destinationAddress: "松柏日照中心",
      note: "需協助輪椅固定，上車前請電話通知家屬。",
      active: true,
    },
    {
      id: "case_002",
      caseNo: "LTC-002",
      name: "王進財",
      phone: "02-2755-8020",
      emergencyContact: "王太太",
      emergencyPhone: "0922-810-334",
      careLevel: "長照2.0 3級",
      mobility: "需攙扶",
      pickupAddress: "台北市大安區信義路三段 91 巷 6 號",
      destinationAddress: "仁愛復能診所",
      note: "聽力較弱，抵達時請慢慢說明。",
      active: true,
    },
    {
      id: "case_003",
      caseNo: "LTC-003",
      name: "張阿月",
      phone: "02-2368-7712",
      emergencyContact: "張先生",
      emergencyPhone: "0988-610-741",
      careLevel: "長照2.0 5級",
      mobility: "輪椅",
      pickupAddress: "台北市萬華區西園路二段 122 號",
      destinationAddress: "和平醫院復健科",
      note: "回程可能有藥袋，請提醒個案攜帶健保卡。",
      active: true,
    },
    {
      id: "case_004",
      caseNo: "LTC-004",
      name: "周秀琴",
      phone: "02-2302-6168",
      emergencyContact: "周小姐",
      emergencyPhone: "0963-215-618",
      careLevel: "長照2.0 2級",
      mobility: "可自行上下車",
      pickupAddress: "台北市中山區龍江路 55 巷 8 號",
      destinationAddress: "長青據點",
      note: "固定週三參與據點課程。",
      active: true,
    },
    {
      id: "case_005",
      caseNo: "LTC-005",
      name: "黃宗義",
      phone: "02-2558-9200",
      emergencyContact: "黃先生",
      emergencyPhone: "0919-402-885",
      careLevel: "長照2.0 4級",
      mobility: "需攙扶",
      pickupAddress: "台北市士林區文林路 320 號",
      destinationAddress: "陽明日照中心",
      note: "上午血糖較低，請確認已用早餐。",
      active: true,
    },
  ];

  const trips = [
    {
      id: "trip_001",
      serviceDate,
      caseId: "case_001",
      driverId: "drv_lin",
      scheduledPickup: addMinutes(-55),
      scheduledDropoff: addMinutes(-25),
      pickupTime: addMinutes(-50),
      pickupAt: new Date(Date.now() - 50 * 60_000).toISOString(),
      pickupLocation: { lat: 25.0268, lng: 121.5199, accuracy: 24, source: "demo" },
      dropoffTime: addMinutes(-24),
      dropoffAt: new Date(Date.now() - 24 * 60_000).toISOString(),
      dropoffLocation: { lat: 25.0362, lng: 121.5278, accuracy: 22, source: "demo" },
      purpose: "日照接送",
      status: "completed",
    },
    {
      id: "trip_002",
      serviceDate,
      caseId: "case_002",
      driverId: "drv_lin",
      scheduledPickup: addMinutes(-15),
      scheduledDropoff: addMinutes(12),
      pickupTime: addMinutes(-10),
      pickupAt: new Date(Date.now() - 10 * 60_000).toISOString(),
      pickupLocation: { lat: 25.0322, lng: 121.5397, accuracy: 20, source: "demo" },
      dropoffTime: "",
      dropoffAt: "",
      dropoffLocation: null,
      purpose: "復健門診",
      status: "picked_up",
    },
    {
      id: "trip_003",
      serviceDate,
      caseId: "case_003",
      driverId: "drv_wu",
      scheduledPickup: addMinutes(-18),
      scheduledDropoff: addMinutes(12),
      pickupTime: "",
      pickupAt: "",
      pickupLocation: null,
      dropoffTime: "",
      dropoffAt: "",
      dropoffLocation: null,
      purpose: "復健治療",
      status: "scheduled",
    },
    {
      id: "trip_004",
      serviceDate,
      caseId: "case_004",
      driverId: "drv_chen",
      scheduledPickup: addMinutes(18),
      scheduledDropoff: addMinutes(46),
      pickupTime: "",
      pickupAt: "",
      pickupLocation: null,
      dropoffTime: "",
      dropoffAt: "",
      dropoffLocation: null,
      purpose: "據點活動",
      status: "scheduled",
    },
    {
      id: "trip_005",
      serviceDate,
      caseId: "case_005",
      driverId: "drv_wu",
      scheduledPickup: addMinutes(35),
      scheduledDropoff: addMinutes(68),
      pickupTime: "",
      pickupAt: "",
      pickupLocation: null,
      dropoffTime: "",
      dropoffAt: "",
      dropoffLocation: null,
      purpose: "日照接送",
      status: "scheduled",
    },
  ];

  return {
    serviceDate,
    drivers,
    cases,
    trips,
    driverLocations: seedDriverLocations(drivers, trips),
    events: [],
  };
}

function seedDriverLocations(drivers, trips) {
  return drivers.reduce((locations, driver) => {
    const latestTrip = trips
      .filter((trip) => trip.driverId === driver.id)
      .map((trip) => {
        const location = trip.dropoffLocation ?? trip.pickupLocation;
        const occurredAt = trip.dropoffAt || trip.pickupAt;
        const eventType = trip.dropoffLocation ? "dropoff" : trip.pickupLocation ? "pickup" : "heartbeat";
        return location ? { trip, location, occurredAt, eventType } : null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0];

    if (latestTrip) {
      locations[driver.id] = {
        ...latestTrip.location,
        updatedAt: latestTrip.occurredAt,
        eventType: latestTrip.eventType,
        tripId: latestTrip.trip.id,
      };
      return locations;
    }

    locations[driver.id] = {
      ...fallbackLocation(driver.id),
      accuracy: 80,
      source: "demo",
      updatedAt: new Date(Date.now() - 40 * 60_000).toISOString(),
      eventType: "heartbeat",
      tripId: "",
    };
    return locations;
  }, {});
}

function fallbackLocation(driverId, tripId = "") {
  const baseLocations = {
    drv_lin: { lat: 25.0394, lng: 121.5205 },
    drv_wu: { lat: 25.0295, lng: 121.5076 },
    drv_chen: { lat: 25.0618, lng: 121.5354 },
  };
  const base = baseLocations[driverId] ?? { lat: 25.0418, lng: 121.525 };
  const seed = `${driverId}${tripId}${new Date().getMinutes()}`;
  const drift = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return {
    lat: Number((base.lat + ((drift % 15) - 7) * 0.0007).toFixed(6)),
    lng: Number((base.lng + ((drift % 11) - 5) * 0.0007).toFixed(6)),
  };
}

function getCase(caseId) {
  return state.cases.find((item) => item.id === caseId);
}

function getDriver(driverId) {
  return state.drivers.find((item) => item.id === driverId);
}

function isTripLate(trip) {
  if (trip.pickupTime || trip.status === "completed") return false;
  const [hours, minutes] = trip.scheduledPickup.split(":").map(Number);
  const scheduled = new Date();
  scheduled.setHours(hours, minutes, 0, 0);
  return Date.now() - scheduled.getTime() > 10 * 60_000;
}

function getTripStatus(trip) {
  if (trip.dropoffTime) return "completed";
  if (trip.pickupTime) return "picked_up";
  if (isTripLate(trip)) return "late";
  return "scheduled";
}

function todayTrips() {
  return state.trips
    .filter((trip) => trip.serviceDate === state.serviceDate)
    .sort((a, b) => a.scheduledPickup.localeCompare(b.scheduledPickup));
}

function filteredTrips() {
  return todayTrips().filter((trip) => {
    const status = getTripStatus(trip);
    const driverMatch = filters.driver === "all" || trip.driverId === filters.driver;
    const statusMatch = filters.status === "all" || status === filters.status;
    return driverMatch && statusMatch;
  });
}

function render() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === activeView);
  });
  document.getElementById("viewTitle").textContent = viewTitles[activeView];
  updateConnectionState();

  if (activeView === "dashboard") renderDashboard();
  if (activeView === "cases") renderCases();
  if (activeView === "driver") renderDriver();
  if (activeView === "settings") renderSettings();
}

function renderDashboard() {
  const host = document.getElementById("appView");
  host.replaceChildren(document.getElementById("dashboardTemplate").content.cloneNode(true));

  const trips = todayTrips();
  const stats = {
    total: trips.length,
    scheduled: trips.filter((trip) => getTripStatus(trip) === "scheduled").length,
    picked_up: trips.filter((trip) => getTripStatus(trip) === "picked_up").length,
    completed: trips.filter((trip) => getTripStatus(trip) === "completed").length,
    late: trips.filter((trip) => getTripStatus(trip) === "late").length,
  };

  document.getElementById("summaryGrid").innerHTML = [
    summaryCard("今日接送", stats.total, "全部班次", ""),
    summaryCard("待接", stats.scheduled, "尚未上車", "waiting"),
    summaryCard("接送中", stats.picked_up, "已接到未送達", "moving"),
    summaryCard("已完成", stats.completed, "完成送達", "done"),
    summaryCard("可能延遲", stats.late, "逾預定 10 分鐘", "alert"),
  ].join("");
  document.getElementById("heroStatusText").textContent = stats.late
    ? `${stats.late} 筆需追蹤`
    : `${stats.picked_up} 車接送中`;

  document.getElementById("mapDriverCount").textContent = `${state.drivers.length} 位司機`;
  document.getElementById("liveMap").innerHTML = renderDriverMap();
  document.getElementById("locationFeed").innerHTML = renderLocationFeed();

  const driverFilter = document.getElementById("driverFilter");
  driverFilter.innerHTML = [
    '<option value="all">全部司機</option>',
    ...state.drivers.map((driver) => {
      return `<option value="${escapeHTML(driver.id)}">${escapeHTML(driver.name)} · ${escapeHTML(driver.routeLabel)}</option>`;
    }),
  ].join("");
  driverFilter.value = filters.driver;
  driverFilter.addEventListener("change", (event) => {
    filters.driver = event.target.value;
    renderDashboard();
  });

  const statusFilter = document.getElementById("statusFilter");
  statusFilter.value = filters.status;
  statusFilter.addEventListener("change", (event) => {
    filters.status = event.target.value;
    renderDashboard();
  });

  const board = document.getElementById("routeBoard");
  const rows = filteredTrips();
  board.innerHTML = rows.length
    ? rows.map(renderRideRow).join("")
    : '<div class="empty-state">目前沒有符合篩選條件的接送班次。</div>';

  board.addEventListener("change", (event) => {
    if (!event.target.matches(".driver-select")) return;
    const trip = state.trips.find((item) => item.id === event.target.dataset.tripId);
    if (!trip) return;
    const nextDriverId = event.target.value;
    if (dataMode === "supabase") {
      apiAction("assign_driver", { tripId: trip.id, driverId: nextDriverId })
        .then(() => renderDashboard())
        .catch((error) => {
          dataMessage = `更新失敗：${error.message}`;
          renderDashboard();
        });
      return;
    }
    trip.driverId = event.target.value;
    saveState();
    renderDashboard();
  });
}

function renderDriverMap() {
  const driverMarkers = state.drivers.map((driver) => {
    const location = state.driverLocations[driver.id] ?? {
      ...driver.homeLocation,
      updatedAt: "",
      eventType: "heartbeat",
    };
    const point = mapPoint(location);
    const status = getDriverLiveStatus(driver.id);
    return `
      <button
        class="map-marker ${escapeHTML(status)}"
        type="button"
        style="left:${point.x}%; top:${point.y}%"
        title="${escapeHTML(driver.name)} ${escapeHTML(formatCoordinate(location))}"
      >
        <span>${escapeHTML(driver.name.slice(0, 1))}</span>
      </button>
      <div class="map-label" style="left:${point.x}%; top:${Math.min(point.y + 8, 92)}%">
        <strong>${escapeHTML(driver.name)}</strong>
        <span>${escapeHTML(eventLabels[location.eventType] ?? "目前位置")} · ${escapeHTML(formatEventTime(location.updatedAt))}</span>
      </div>
    `;
  });

  return `
    <div class="map-grid-lines" aria-hidden="true"></div>
    <div class="map-road horizontal road-a" aria-hidden="true"></div>
    <div class="map-road horizontal road-b" aria-hidden="true"></div>
    <div class="map-road vertical road-c" aria-hidden="true"></div>
    <div class="map-road vertical road-d" aria-hidden="true"></div>
    <span class="map-district district-north">士林 / 中山</span>
    <span class="map-district district-west">萬華 / 中正</span>
    <span class="map-district district-east">大安 / 信義</span>
    ${driverMarkers.join("")}
  `;
}

function mapPoint(location) {
  const x = ((Number(location.lng) - taipeiBounds.minLng) / (taipeiBounds.maxLng - taipeiBounds.minLng)) * 100;
  const y = 100 - ((Number(location.lat) - taipeiBounds.minLat) / (taipeiBounds.maxLat - taipeiBounds.minLat)) * 100;
  return {
    x: Math.max(5, Math.min(95, Number(x.toFixed(2)))),
    y: Math.max(8, Math.min(88, Number(y.toFixed(2)))),
  };
}

function getDriverLiveStatus(driverId) {
  const activeTrip = todayTrips().find((trip) => trip.driverId === driverId && getTripStatus(trip) === "picked_up");
  if (activeTrip) return "moving";
  const lateTrip = todayTrips().find((trip) => trip.driverId === driverId && getTripStatus(trip) === "late");
  if (lateTrip) return "late";
  return "idle";
}

function renderLocationFeed() {
  const items = Object.entries(state.driverLocations)
    .map(([driverId, location]) => ({
      driver: getDriver(driverId),
      location,
    }))
    .filter((item) => item.driver)
    .sort((a, b) => new Date(b.location.updatedAt).getTime() - new Date(a.location.updatedAt).getTime());

  if (!items.length) {
    return '<div class="empty-state">尚無定位紀錄。</div>';
  }

  return items
    .map(({ driver, location }) => {
      return `
        <article class="location-item">
          <div>
            <strong>${escapeHTML(driver.name)}</strong>
            <p class="subtext">${escapeHTML(driver.routeLabel)} · ${escapeHTML(driver.vehicleNo)}</p>
          </div>
          <div>
            <span class="status-pill ${escapeHTML(getDriverLiveStatus(driver.id) === "moving" ? "picked_up" : "scheduled")}">
              ${escapeHTML(eventLabels[location.eventType] ?? "目前位置")}
            </span>
            <p class="subtext">${escapeHTML(formatEventTime(location.updatedAt))}</p>
            <p class="subtext">${escapeHTML(formatCoordinate(location))}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function formatEventTime(value) {
  if (!value) return "尚未回報";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "尚未回報";
  return localTime(date);
}

function formatCoordinate(location) {
  if (!location?.lat || !location?.lng) return "無座標";
  return `${Number(location.lat).toFixed(5)}, ${Number(location.lng).toFixed(5)}`;
}

function summaryCard(label, value, hint, tone) {
  return `
    <article class="summary-card ${tone}">
      <p class="eyebrow">${escapeHTML(label)}</p>
      <strong>${escapeHTML(value)}</strong>
      <p class="subtext">${escapeHTML(hint)}</p>
    </article>
  `;
}

function renderRideRow(trip) {
  const person = getCase(trip.caseId);
  const driver = getDriver(trip.driverId);
  const status = getTripStatus(trip);
  const options = state.drivers
    .map((item) => {
      const selected = item.id === trip.driverId ? "selected" : "";
      return `<option value="${escapeHTML(item.id)}" ${selected}>${escapeHTML(item.name)} · ${escapeHTML(item.vehicleNo)}</option>`;
    })
    .join("");

  return `
    <article class="ride-row">
      <div class="ride-time">
        <span class="subtext">預定上車</span>
        <strong>${escapeHTML(trip.scheduledPickup)}</strong>
        <span class="subtext">送達 ${escapeHTML(trip.scheduledDropoff)}</span>
      </div>
      <div class="ride-person">
        <strong>${escapeHTML(person?.name ?? "未知個案")}</strong>
        <p class="subtext">${escapeHTML(person?.caseNo ?? "")} · ${escapeHTML(person?.careLevel ?? "")} · ${escapeHTML(person?.mobility ?? "")}</p>
        <p class="subtext">${escapeHTML(trip.purpose)}</p>
      </div>
      <div>
        <p class="subtext">上車：${escapeHTML(person?.pickupAddress ?? "")}</p>
        <p class="subtext">目的地：${escapeHTML(person?.destinationAddress ?? "")}</p>
      </div>
      <label>
        指派司機
        <select class="driver-select" data-trip-id="${escapeHTML(trip.id)}">${options}</select>
      </label>
      <div class="status-column">
        <span class="status-pill ${escapeHTML(status)}">${escapeHTML(statusLabels[status])}</span>
        <p class="subtext">${escapeHTML(driver?.vehicleNo ?? "")}</p>
        <p class="subtext">接到 ${escapeHTML(trip.pickupTime || "--:--")} · 送達 ${escapeHTML(trip.dropoffTime || "--:--")}</p>
        <p class="subtext">定位 ${escapeHTML(formatEventTime(state.driverLocations[trip.driverId]?.updatedAt))}</p>
      </div>
    </article>
  `;
}

function renderCases() {
  const host = document.getElementById("appView");
  host.replaceChildren(document.getElementById("casesTemplate").content.cloneNode(true));

  document.getElementById("caseCount").textContent = `${state.cases.length} 位個案`;
  document.getElementById("caseList").innerHTML = state.cases.map(renderCaseCard).join("");

  const driverSelect = document.getElementById("caseDriverSelect");
  driverSelect.innerHTML = state.drivers
    .map((driver) => `<option value="${escapeHTML(driver.id)}">${escapeHTML(driver.name)} · ${escapeHTML(driver.routeLabel)}</option>`)
    .join("");

  document.getElementById("caseForm").addEventListener("submit", handleCaseSubmit);
  document.getElementById("caseList").addEventListener("click", handleCaseAction);
}

function renderCaseCard(person) {
  const activeText = person.active ? "服務中" : "已停用";
  const activeClass = person.active ? "completed" : "scheduled";
  const hasTodayTrip = state.trips.some((trip) => trip.caseId === person.id && trip.serviceDate === state.serviceDate);

  return `
    <article class="case-card">
      <div>
        <strong>${escapeHTML(person.name)}</strong>
        <p class="subtext">${escapeHTML(person.caseNo)} · ${escapeHTML(person.careLevel)}</p>
        <p class="subtext">${escapeHTML(person.phone)}</p>
        <span class="status-pill ${activeClass}">${activeText}</span>
      </div>
      <div>
        <p class="subtext">上車：${escapeHTML(person.pickupAddress)}</p>
        <p class="subtext">目的地：${escapeHTML(person.destinationAddress)}</p>
        <p class="subtext">行動：${escapeHTML(person.mobility)}</p>
        <p class="subtext">備註：${escapeHTML(person.note || "無")}</p>
      </div>
      <div class="task-actions">
        <button class="secondary-btn" type="button" data-action="trip" data-case-id="${escapeHTML(person.id)}" ${hasTodayTrip ? "disabled" : ""}>
          ${hasTodayTrip ? "已在今日班表" : "加入今日班表"}
        </button>
        <button class="ghost-btn" type="button" data-action="toggle" data-case-id="${escapeHTML(person.id)}">
          ${person.active ? "停用個案" : "恢復服務"}
        </button>
      </div>
    </article>
  `;
}

async function handleCaseSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const newCase = {
    id: uid("case"),
    caseNo: String(form.get("caseNo")).trim(),
    name: String(form.get("name")).trim(),
    phone: String(form.get("phone")).trim(),
    emergencyContact: "",
    emergencyPhone: "",
    careLevel: String(form.get("careLevel")),
    mobility: String(form.get("mobility")),
    pickupAddress: String(form.get("pickupAddress")).trim(),
    destinationAddress: String(form.get("destinationAddress")).trim(),
    note: String(form.get("note")).trim(),
    active: true,
  };

  if (dataMode === "supabase") {
    try {
      await apiAction("create_case", {
        case: newCase,
        trip: form.get("createTrip")
          ? {
              driverId: String(form.get("driverId")),
              scheduledPickup: String(form.get("scheduledPickup")),
              scheduledDropoff: String(form.get("scheduledDropoff")),
            }
          : null,
      });
      renderCases();
    } catch (error) {
      dataMessage = `新增失敗：${error.message}`;
      renderCases();
    }
    return;
  }

  state.cases.push(newCase);

  if (form.get("createTrip")) {
    state.trips.push({
      id: uid("trip"),
      serviceDate: state.serviceDate,
      caseId: newCase.id,
      driverId: String(form.get("driverId")),
      scheduledPickup: String(form.get("scheduledPickup")),
      scheduledDropoff: String(form.get("scheduledDropoff")),
      pickupTime: "",
      pickupAt: "",
      pickupLocation: null,
      dropoffTime: "",
      dropoffAt: "",
      dropoffLocation: null,
      purpose: "日照接送",
      status: "scheduled",
    });
  }

  saveState();
  renderCases();
}

async function handleCaseAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const person = state.cases.find((item) => item.id === button.dataset.caseId);
  if (!person) return;

  if (dataMode === "supabase") {
    try {
      if (button.dataset.action === "toggle") {
        await apiAction("toggle_case", { caseId: person.id, active: !person.active });
      }

      if (button.dataset.action === "trip") {
        await apiAction("create_trip", {
          caseId: person.id,
          driverId: state.drivers[0]?.id ?? "",
        });
      }
      renderCases();
    } catch (error) {
      dataMessage = `更新失敗：${error.message}`;
      renderCases();
    }
    return;
  }

  if (button.dataset.action === "toggle") {
    person.active = !person.active;
  }

  if (button.dataset.action === "trip") {
    state.trips.push({
      id: uid("trip"),
      serviceDate: state.serviceDate,
      caseId: person.id,
      driverId: state.drivers[0]?.id ?? "",
      scheduledPickup: addMinutes(30),
      scheduledDropoff: addMinutes(60),
      pickupTime: "",
      pickupAt: "",
      pickupLocation: null,
      dropoffTime: "",
      dropoffAt: "",
      dropoffLocation: null,
      purpose: "臨時接送",
      status: "scheduled",
    });
  }

  saveState();
  renderCases();
}

function renderDriver() {
  const host = document.getElementById("appView");
  host.replaceChildren(document.getElementById("driverTemplate").content.cloneNode(true));

  if (activeDriverId) {
    renderDriverWorkspace();
  } else {
    renderDriverLogin();
  }
}

function renderDriverLogin() {
  const view = document.getElementById("driverView");
  const selectedDriver = getDriver(selectedLoginDriverId);
  view.innerHTML = `
    <section class="work-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">快速登入</p>
          <h3>選擇司機</h3>
        </div>
      </div>
      <div class="driver-login-grid">
        ${state.drivers.map(renderDriverLoginCard).join("")}
      </div>
    </section>
    <section class="work-section pin-panel">
      <div>
        <p class="eyebrow">PIN</p>
        <h3>${selectedDriver ? escapeHTML(selectedDriver.name) : "請先選擇司機"}</h3>
      </div>
      <div class="pin-display" aria-label="PIN 輸入">${pinInput ? "●".repeat(pinInput.length) : "----"}</div>
      <div class="keypad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => `<button type="button" data-key="${digit}">${digit}</button>`).join("")}
        <button type="button" data-key="clear">清除</button>
        <button type="button" data-key="0">0</button>
        <button type="button" data-key="back">退格</button>
      </div>
      ${pinMessage ? `<p class="subtext">${escapeHTML(pinMessage)}</p>` : ""}
    </section>
  `;

  view.addEventListener("click", handleDriverLoginClick);
}

function renderDriverLoginCard(driver) {
  const active = driver.id === selectedLoginDriverId ? "active" : "";
  return `
    <button class="driver-card ${active}" type="button" data-driver-id="${escapeHTML(driver.id)}">
      <span class="driver-badge">${escapeHTML(driver.routeLabel)}</span>
      <strong>${escapeHTML(driver.name)}</strong>
      <span class="subtext">車號 ${escapeHTML(driver.vehicleNo)}</span>
      <span class="subtext">${escapeHTML(driver.phone)}</span>
    </button>
  `;
}

function handleDriverLoginClick(event) {
  const driverButton = event.target.closest("[data-driver-id]");
  if (driverButton) {
    selectedLoginDriverId = driverButton.dataset.driverId;
    pinInput = "";
    pinMessage = "";
    renderDriverLogin();
    return;
  }

  const keyButton = event.target.closest("[data-key]");
  if (!keyButton || !selectedLoginDriverId) return;

  const key = keyButton.dataset.key;
  if (key === "clear") pinInput = "";
  if (key === "back") pinInput = pinInput.slice(0, -1);
  if (/^\d$/.test(key) && pinInput.length < 4) pinInput += key;

  if (pinInput.length === 4) {
    const driver = getDriver(selectedLoginDriverId);
    if (driver?.pin === pinInput) {
      activeDriverId = driver.id;
      pinInput = "";
      pinMessage = "";
      renderDriver();
      return;
    }
    pinMessage = "PIN 不符，請重新輸入。";
    pinInput = "";
  }

  renderDriverLogin();
}

function renderDriverWorkspace() {
  const driver = getDriver(activeDriverId);
  const view = document.getElementById("driverView");
  const tasks = todayTrips().filter((trip) => trip.driverId === activeDriverId);

  view.innerHTML = `
    <section class="driver-header">
      <div>
        <p>${escapeHTML(driver.routeLabel)} · ${escapeHTML(driver.vehicleNo)}</p>
        <h3>${escapeHTML(driver.name)} 今日接送</h3>
      </div>
      <button class="ghost-btn" type="button" id="driverLogoutBtn">登出</button>
    </section>
    <section class="driver-task-list">
      ${tasks.length ? tasks.map(renderDriverTask).join("") : '<div class="empty-state">目前沒有指派給你的接送班次。</div>'}
    </section>
  `;

  document.getElementById("driverLogoutBtn").addEventListener("click", () => {
    activeDriverId = "";
    selectedLoginDriverId = "";
    renderDriver();
  });

  view.addEventListener("click", handleDriverTaskClick);
}

function renderDriverTask(trip) {
  const person = getCase(trip.caseId);
  const status = getTripStatus(trip);
  const pickupDisabled = trip.pickupTime ? "disabled" : "";
  const dropoffDisabled = !trip.pickupTime || trip.dropoffTime ? "disabled" : "";
  const latestLocation = trip.dropoffLocation ?? trip.pickupLocation;

  return `
    <article class="driver-task">
      <div class="task-main">
        <div class="task-title-row">
          <div>
            <p class="eyebrow">${escapeHTML(trip.scheduledPickup)} 上車 · ${escapeHTML(trip.scheduledDropoff)} 送達</p>
            <h4>${escapeHTML(person?.name ?? "未知個案")}</h4>
          </div>
          <span class="status-pill ${escapeHTML(status)}">${escapeHTML(statusLabels[status])}</span>
        </div>
        <div class="address-grid">
          <div class="address-box">
            <span>上車地址</span>
            ${escapeHTML(person?.pickupAddress ?? "")}
          </div>
          <div class="address-box">
            <span>目的地</span>
            ${escapeHTML(person?.destinationAddress ?? "")}
          </div>
        </div>
        <p class="subtext">${escapeHTML(person?.mobility ?? "")} · ${escapeHTML(person?.note ?? "")}</p>
        <p class="subtext">接到 ${escapeHTML(trip.pickupTime || "--:--")} · 送達 ${escapeHTML(trip.dropoffTime || "--:--")}</p>
        <p class="location-note">定位：${escapeHTML(latestLocation ? formatCoordinate(latestLocation) : "按下打卡按鈕時自動記錄")}</p>
      </div>
      <div class="task-actions">
        <button class="primary-btn" type="button" data-action="pickup" data-trip-id="${escapeHTML(trip.id)}" ${pickupDisabled}>已接到個案</button>
        <button class="secondary-btn" type="button" data-action="dropoff" data-trip-id="${escapeHTML(trip.id)}" ${dropoffDisabled}>已送達目的地</button>
      </div>
    </article>
  `;
}

async function handleDriverTaskClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const trip = state.trips.find((item) => item.id === button.dataset.tripId);
  if (!trip || trip.driverId !== activeDriverId) return;

  if (button.dataset.action === "pickup" && !trip.pickupTime) {
    button.disabled = true;
    button.textContent = "定位中";
    const location = await captureDriverLocation(activeDriverId, trip.id, "pickup");
    if (dataMode === "supabase") {
      try {
        await apiAction("pickup", { tripId: trip.id, location });
        renderDriverWorkspace();
      } catch (error) {
        dataMessage = `打卡失敗：${error.message}`;
        renderDriverWorkspace();
      }
      return;
    }
    trip.pickupTime = localTime();
    trip.pickupAt = new Date().toISOString();
    trip.pickupLocation = location;
    trip.status = "picked_up";
    state.events.push({
      id: uid("event"),
      tripId: trip.id,
      driverId: activeDriverId,
      type: "pickup",
      occurredAt: trip.pickupAt,
      location,
    });
    updateDriverLocation(activeDriverId, trip.id, "pickup", trip.pickupAt, location);
  }

  if (button.dataset.action === "dropoff" && trip.pickupTime && !trip.dropoffTime) {
    button.disabled = true;
    button.textContent = "定位中";
    const location = await captureDriverLocation(activeDriverId, trip.id, "dropoff");
    if (dataMode === "supabase") {
      try {
        await apiAction("dropoff", { tripId: trip.id, location });
        renderDriverWorkspace();
      } catch (error) {
        dataMessage = `打卡失敗：${error.message}`;
        renderDriverWorkspace();
      }
      return;
    }
    trip.dropoffTime = localTime();
    trip.dropoffAt = new Date().toISOString();
    trip.dropoffLocation = location;
    trip.status = "completed";
    state.events.push({
      id: uid("event"),
      tripId: trip.id,
      driverId: activeDriverId,
      type: "dropoff",
      occurredAt: trip.dropoffAt,
      location,
    });
    updateDriverLocation(activeDriverId, trip.id, "dropoff", trip.dropoffAt, location);
  }

  saveState();
  renderDriverWorkspace();
}

function captureDriverLocation(driverId, tripId, eventType) {
  if (!navigator.geolocation) {
    return Promise.resolve({
      ...fallbackLocation(driverId, tripId + eventType),
      accuracy: 90,
      source: "demo",
    });
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (location) => {
      if (settled) return;
      settled = true;
      resolve(location);
    };

    const fallbackTimer = window.setTimeout(() => {
      finish({
        ...fallbackLocation(driverId, tripId + eventType),
        accuracy: 90,
        source: "demo",
      });
    }, 2800);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(fallbackTimer);
        finish({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
          source: "gps",
        });
      },
      () => {
        window.clearTimeout(fallbackTimer);
        finish({
          ...fallbackLocation(driverId, tripId + eventType),
          accuracy: 90,
          source: "demo",
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: 2500,
      },
    );
  });
}

function updateDriverLocation(driverId, tripId, eventType, updatedAt, location) {
  state.driverLocations[driverId] = {
    ...location,
    updatedAt,
    eventType,
    tripId,
  };
}

function renderSettings() {
  const host = document.getElementById("appView");
  host.replaceChildren(document.getElementById("settingsTemplate").content.cloneNode(true));

  document.getElementById("driverPinList").innerHTML = state.drivers
    .map((driver) => {
      return `
        <div class="pin-item">
          <div>
            <strong>${escapeHTML(driver.name)}</strong>
            <p class="subtext">${escapeHTML(driver.routeLabel)} · ${escapeHTML(driver.vehicleNo)}</p>
          </div>
          <code>${escapeHTML(driver.pin)}</code>
        </div>
      `;
    })
    .join("");
}

function updateClock() {
  document.getElementById("clock").textContent = localTime();
}

async function init() {
  document.getElementById("todayLabel").textContent = new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).format(new Date());

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      activeView = button.dataset.view;
      render();
    });
  });

  document.getElementById("resetDemoBtn").addEventListener("click", async () => {
    if (dataMode === "supabase") {
      try {
        await loadRemoteState();
        render();
      } catch (error) {
        dataMessage = `重新載入失敗：${error.message}`;
        render();
      }
      return;
    }

    state = defaultState();
    filters = { driver: "all", status: "all" };
    activeDriverId = "";
    selectedLoginDriverId = "";
    pinInput = "";
    pinMessage = "";
    saveState();
    render();
  });

  updateClock();
  setInterval(updateClock, 15_000);
  try {
    await loadRemoteState();
  } catch {
    dataMode = "local";
    dataMessage = "本機示範資料";
  }
  render();
}

init();
