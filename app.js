const STORAGE_KEY = "ltc-community-transport-v1";
const COORDINATOR_SESSION_KEY = "ltc-coordinator-unlocked";
const COORDINATOR_PASSCODE_KEY = "ltc-coordinator-passcode";
const FONT_SCALE_KEY = "ltc-font-scale";
const COORDINATOR_PASSCODE = "2468";
const protectedViews = new Set(["dashboard", "cases", "drivers", "settings", "releases"]);
const coordinatorActions = new Set([
  "assign_driver",
  "create_case",
  "update_case",
  "toggle_case",
  "delete_case",
  "create_driver",
  "update_driver",
  "toggle_driver",
  "delete_driver",
  "create_trip",
]);

const viewTitles = {
  dashboard: "承辦人工作台",
  cases: "個案資料",
  drivers: "司機管理",
  driver: "司機入口",
  settings: "設定",
  releases: "版本更新紀錄",
  coordinatorGate: "承辦人登入",
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

const releaseNotes = [
  {
    version: "v0.6.4",
    date: "2026-05-21",
    items: ["新增返回首頁按鈕", "司機入口改為點選司機後彈出 PIN 視窗", "今日班表新增 Google Maps 路徑按鈕"],
  },
  {
    version: "v0.6.3",
    date: "2026-05-21",
    items: ["依使用情境調整介面：承辦人頁強化桌機工作台密度", "司機入口改為手機優先操作版型與大按鈕"],
  },
  {
    version: "v0.6.2",
    date: "2026-05-21",
    items: ["修正舊本機資料造成司機入口無法使用 6 碼 PIN 登入", "新增獨立設定頁", "移除重置示範資料按鈕", "將時間移至左側服務日期區塊"],
  },
  {
    version: "v0.6.1",
    date: "2026-05-20",
    items: ["司機資料新增身分證字號並移除路線輸入", "新增司機與個案重複檢查", "司機 PIN 改為 6 碼", "新增每位使用者獨立保存的文字大小設定"],
  },
  {
    version: "v0.6.0",
    date: "2026-05-20",
    items: ["新增承辦人解鎖畫面保護個管資料", "司機管理改為與個案資料一致的點選式操作", "個案資料欄位擴充並同步 Supabase schema"],
  },
  {
    version: "v0.5.2",
    date: "2026-05-20",
    items: ["個案頁新增按鈕開啟新增表單", "個案卡片改為點選後才顯示操作選項", "左側服務日期固定單行顯示"],
  },
  {
    version: "v0.5.1",
    date: "2026-05-20",
    items: ["修正刪除個案與司機後重新整理又出現示範資料的問題", "正式模式不再自動補回示範資料"],
  },
  {
    version: "v0.5.0",
    date: "2026-05-20",
    items: ["側邊選單支援收合", "新增個案與司機完整管理", "接送地圖顯示個案路徑", "Supabase 寫入流程補齊 CRUD"],
  },
  {
    version: "v0.4.0",
    date: "2026-05-20",
    items: ["承辦人地圖新增縮放與拖曳", "優化地圖控制介面"],
  },
  {
    version: "v0.3.0",
    date: "2026-05-20",
    items: ["新增 Vercel API 串接 Supabase", "打卡時間與定位寫入資料庫"],
  },
  {
    version: "v0.2.0",
    date: "2026-05-20",
    items: ["新增司機定位地圖", "司機接到與送達同步記錄座標"],
  },
  {
    version: "v0.1.0",
    date: "2026-05-20",
    items: ["建立承辦人工作台", "新增個案名冊與司機快速登入原型"],
  },
];

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
let sidebarCollapsed = localStorage.getItem("ltc-sidebar-collapsed") === "true";
let editingCaseId = "";
let selectedCaseId = "";
let caseFormOpen = false;
let editingDriverId = "";
let selectedDriverId = "";
let driverFormOpen = false;
let coordinatorPasscode = sessionStorage.getItem(COORDINATOR_PASSCODE_KEY) || "";
let coordinatorUnlocked = sessionStorage.getItem(COORDINATOR_SESSION_KEY) === "true" && Boolean(coordinatorPasscode);
let pendingProtectedView = "dashboard";
let fontScale = Number(localStorage.getItem(FONT_SCALE_KEY) || "100");
let mapView = {
  zoom: 1,
  panX: 0,
  panY: 0,
};
let mapDrag = null;
let dataMode = "local";
let dataMessage = "本機示範資料";

let state = normalizeState(loadState());
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
  const legacyPins = {
    "1357": "135790",
    "2468": "246802",
    "9753": "975310",
  };
  const hasDrivers = Array.isArray(value.drivers);
  const hasCases = Array.isArray(value.cases);
  const hasTrips = Array.isArray(value.trips);
  const next = {
    ...fresh,
    ...value,
    drivers: hasDrivers ? value.drivers : fresh.drivers,
    cases: hasCases ? value.cases : fresh.cases,
    trips: hasTrips ? value.trips : fresh.trips,
    events: Array.isArray(value.events) ? value.events : [],
    driverLocations: value.driverLocations && typeof value.driverLocations === "object" ? value.driverLocations : {},
  };

  next.drivers = next.drivers.map((driver) => {
    const fallback = fresh.drivers.find((item) => item.id === driver.id);
    return {
      ...fallback,
      ...driver,
      homeLocation: driver.homeLocation ?? fallback?.homeLocation ?? fallbackLocation(driver.id),
      routeLabel: "",
      pin: legacyPins[driver.pin] ?? driver.pin,
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
    drivers: Array.isArray(previous.drivers) ? previous.drivers : fresh.drivers,
    cases: Array.isArray(previous.cases) ? previous.cases : fresh.cases,
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
  const guardedPayload = coordinatorActions.has(action)
    ? { ...payload, coordinatorPasscode }
    : payload;

  const response = await fetch("/api/state", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ action, payload: guardedPayload }),
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
      identityNo: "A123456789",
      phone: "0912-118-205",
      vehicleNo: "KAA-1032",
      routeLabel: "",
      pin: "135790",
      homeLocation: { lat: 25.0409, lng: 121.5164 },
      active: true,
    },
    {
      id: "drv_wu",
      name: "吳佳玲",
      identityNo: "B223456789",
      phone: "0928-772-481",
      vehicleNo: "KAB-2210",
      routeLabel: "",
      pin: "246802",
      homeLocation: { lat: 25.0311, lng: 121.4978 },
      active: true,
    },
    {
      id: "drv_chen",
      name: "陳建宏",
      identityNo: "C323456789",
      phone: "0936-458-119",
      vehicleNo: "KAC-5198",
      routeLabel: "",
      pin: "975310",
      homeLocation: { lat: 25.064, lng: 121.5423 },
      active: true,
    },
  ];

  const cases = [
    {
      id: "case_001",
      caseNo: "LTC-001",
      name: "李美玉",
      identityNo: "A123456789",
      gender: "女",
      birthDate: "1943-04-12",
      phone: "02-2345-1101",
      emergencyContact: "李小姐",
      emergencyRelation: "女兒",
      emergencyPhone: "0910-552-001",
      careLevel: "長照2.0 4級",
      mobility: "輪椅",
      assistiveDevice: "標準輪椅",
      serviceArea: "中正區",
      careManager: "陳個管員",
      careManagerPhone: "02-2345-9901",
      pickupAddress: "台北市中正區和平西路一段 38 號",
      destinationAddress: "松柏日照中心",
      rideNote: "上車前請電話通知家屬，需協助輪椅固定。",
      note: "需協助輪椅固定，上車前請電話通知家屬。",
      active: true,
    },
    {
      id: "case_002",
      caseNo: "LTC-002",
      name: "王進財",
      identityNo: "B102938475",
      gender: "男",
      birthDate: "1939-11-20",
      phone: "02-2755-8020",
      emergencyContact: "王太太",
      emergencyRelation: "配偶",
      emergencyPhone: "0922-810-334",
      careLevel: "長照2.0 3級",
      mobility: "需攙扶",
      assistiveDevice: "手杖",
      serviceArea: "大安區",
      careManager: "林個管員",
      careManagerPhone: "02-2755-7120",
      pickupAddress: "台北市大安區信義路三段 91 巷 6 號",
      destinationAddress: "仁愛復能診所",
      rideNote: "聽力較弱，抵達時請慢慢說明。",
      note: "聽力較弱，抵達時請慢慢說明。",
      active: true,
    },
    {
      id: "case_003",
      caseNo: "LTC-003",
      name: "張阿月",
      identityNo: "C223344556",
      gender: "女",
      birthDate: "1941-08-06",
      phone: "02-2368-7712",
      emergencyContact: "張先生",
      emergencyRelation: "兒子",
      emergencyPhone: "0988-610-741",
      careLevel: "長照2.0 5級",
      mobility: "輪椅",
      assistiveDevice: "輪椅、陪同者",
      serviceArea: "萬華區",
      careManager: "黃個管員",
      careManagerPhone: "02-2368-6722",
      pickupAddress: "台北市萬華區西園路二段 122 號",
      destinationAddress: "和平醫院復健科",
      rideNote: "回程可能有藥袋，請提醒個案攜帶健保卡。",
      note: "回程可能有藥袋，請提醒個案攜帶健保卡。",
      active: true,
    },
    {
      id: "case_004",
      caseNo: "LTC-004",
      name: "周秀琴",
      identityNo: "D998877665",
      gender: "女",
      birthDate: "1948-02-15",
      phone: "02-2302-6168",
      emergencyContact: "周小姐",
      emergencyRelation: "女兒",
      emergencyPhone: "0963-215-618",
      careLevel: "長照2.0 2級",
      mobility: "可自行上下車",
      assistiveDevice: "無",
      serviceArea: "中山區",
      careManager: "吳個管員",
      careManagerPhone: "02-2302-7116",
      pickupAddress: "台北市中山區龍江路 55 巷 8 號",
      destinationAddress: "長青據點",
      rideNote: "固定週三參與據點課程。",
      note: "固定週三參與據點課程。",
      active: true,
    },
    {
      id: "case_005",
      caseNo: "LTC-005",
      name: "黃宗義",
      identityNo: "E112233445",
      gender: "男",
      birthDate: "1945-06-30",
      phone: "02-2558-9200",
      emergencyContact: "黃先生",
      emergencyRelation: "兒子",
      emergencyPhone: "0919-402-885",
      careLevel: "長照2.0 4級",
      mobility: "需攙扶",
      assistiveDevice: "助行器",
      serviceArea: "士林區",
      careManager: "蔡個管員",
      careManagerPhone: "02-2558-7168",
      pickupAddress: "台北市士林區文林路 320 號",
      destinationAddress: "陽明日照中心",
      rideNote: "上午血糖較低，請確認已用早餐。",
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
  applyFontScale();
  applySidebarState();
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === activeView);
  });
  const visibleView = protectedViews.has(activeView) && !coordinatorUnlocked ? "coordinatorGate" : activeView;
  document.body.dataset.view = visibleView;
  document.getElementById("viewTitle").textContent = viewTitles[visibleView];
  updateConnectionState();

  if (visibleView === "coordinatorGate") renderCoordinatorGate();
  if (visibleView === "dashboard") renderDashboard();
  if (visibleView === "cases") renderCases();
  if (visibleView === "drivers") renderDrivers();
  if (visibleView === "driver") renderDriver();
  if (visibleView === "settings") renderSettings();
  if (visibleView === "releases") renderReleases();
}

function applyFontScale() {
  const safeScale = Number.isFinite(fontScale) ? Math.min(125, Math.max(90, fontScale)) : 100;
  document.documentElement.style.setProperty("--user-font-scale", safeScale / 100);
}

function requestView(view) {
  activeView = view;
  if (protectedViews.has(view) && !coordinatorUnlocked) {
    pendingProtectedView = view;
  }
  render();
}

function applySidebarState() {
  document.body.classList.toggle("sidebar-collapsed", sidebarCollapsed);
  const toggle = document.getElementById("sidebarToggle");
  if (!toggle) return;
  toggle.textContent = sidebarCollapsed ? "›" : "‹";
  toggle.setAttribute("aria-label", sidebarCollapsed ? "展開側邊選單" : "收合側邊選單");
}

function renderCoordinatorGate() {
  const host = document.getElementById("appView");
  host.replaceChildren(document.getElementById("coordinatorGateTemplate").content.cloneNode(true));

  const form = document.getElementById("coordinatorGateForm");
  const message = document.getElementById("coordinatorGateMessage");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const passcode = String(new FormData(form).get("passcode") || "").trim();
    if (passcode !== COORDINATOR_PASSCODE) {
      message.textContent = "密碼不正確，請確認後再試一次。";
      return;
    }

    coordinatorUnlocked = true;
    coordinatorPasscode = passcode;
    sessionStorage.setItem(COORDINATOR_SESSION_KEY, "true");
    sessionStorage.setItem(COORDINATOR_PASSCODE_KEY, passcode);
    activeView = pendingProtectedView || "dashboard";
    render();
  });

  document.getElementById("goDriverPortalBtn").addEventListener("click", () => {
    requestView("driver");
  });
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
  setupMapControls();

  const driverFilter = document.getElementById("driverFilter");
  driverFilter.innerHTML = [
    '<option value="all">全部司機</option>',
    ...state.drivers.map((driver) => {
      return `<option value="${escapeHTML(driver.id)}">${escapeHTML(driver.name)} · ${escapeHTML(driver.vehicleNo)}</option>`;
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
  const routeLines = todayTrips()
    .filter((trip) => getTripStatus(trip) !== "completed")
    .map(renderMapRoute)
    .join("");

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
    <div class="map-controls" aria-label="地圖縮放控制">
      <button class="map-control-btn" type="button" data-map-action="zoom-out" aria-label="縮小地圖">−</button>
      <output class="map-zoom-label" aria-label="目前縮放倍率">${Math.round(mapView.zoom * 100)}%</output>
      <button class="map-control-btn" type="button" data-map-action="zoom-in" aria-label="放大地圖">+</button>
      <button class="map-reset-btn" type="button" data-map-action="reset">重設</button>
    </div>
    <div class="map-help">拖曳平移 · 滾輪縮放 · 縮小可看全體司機</div>
    <div
      class="map-canvas"
      style="transform: translate(${mapView.panX}px, ${mapView.panY}px) scale(${mapView.zoom})"
    >
      <div class="map-grid-lines" aria-hidden="true"></div>
      <svg class="map-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        ${routeLines}
      </svg>
      <div class="map-road horizontal road-a" aria-hidden="true"></div>
      <div class="map-road horizontal road-b" aria-hidden="true"></div>
      <div class="map-road vertical road-c" aria-hidden="true"></div>
      <div class="map-road vertical road-d" aria-hidden="true"></div>
      <span class="map-district district-north">士林 / 中山</span>
      <span class="map-district district-west">萬華 / 中正</span>
      <span class="map-district district-east">大安 / 信義</span>
      ${driverMarkers.join("")}
    </div>
  `;
}

function renderMapRoute(trip) {
  const person = getCase(trip.caseId);
  const driver = getDriver(trip.driverId);
  if (!person || !driver) return "";

  const pickup = trip.pickupLocation ?? caseCoordinate(trip.caseId, "pickup");
  const destination = trip.dropoffLocation ?? caseCoordinate(trip.caseId, "destination");
  const driverLocation = state.driverLocations[trip.driverId];
  const status = getTripStatus(trip);
  const start = status === "picked_up" && driverLocation ? driverLocation : pickup;
  const end = status === "picked_up" ? destination : destination;
  const mid = status === "picked_up" && driverLocation ? mapPoint(driverLocation) : null;
  const startPoint = mapPoint(start);
  const endPoint = mapPoint(end);
  const strokeClass = status === "picked_up" ? "active" : status === "late" ? "late" : "scheduled";
  const path = mid
    ? `M ${startPoint.x} ${startPoint.y} Q ${(startPoint.x + endPoint.x) / 2} ${Math.min(startPoint.y, endPoint.y) - 10} ${endPoint.x} ${endPoint.y}`
    : `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;

  return `
    <path class="route-line ${strokeClass}" d="${path}" />
    <circle class="route-dot start" cx="${startPoint.x}" cy="${startPoint.y}" r="1.35" />
    <circle class="route-dot end" cx="${endPoint.x}" cy="${endPoint.y}" r="1.35" />
    <text class="route-label" x="${(startPoint.x + endPoint.x) / 2}" y="${(startPoint.y + endPoint.y) / 2}">
      ${escapeHTML(driver.name.slice(0, 1))}-${escapeHTML(person.name.slice(0, 1))}
    </text>
  `;
}

function caseCoordinate(caseId, type) {
  const known = {
    case_001: { pickup: { lat: 25.0268, lng: 121.5199 }, destination: { lat: 25.0362, lng: 121.5278 } },
    case_002: { pickup: { lat: 25.0322, lng: 121.5397 }, destination: { lat: 25.0349, lng: 121.552 } },
    case_003: { pickup: { lat: 25.0302, lng: 121.509 }, destination: { lat: 25.0357, lng: 121.5062 } },
    case_004: { pickup: { lat: 25.064, lng: 121.5423 }, destination: { lat: 25.0691, lng: 121.5325 } },
    case_005: { pickup: { lat: 25.0875, lng: 121.5255 }, destination: { lat: 25.0976, lng: 121.532 } },
  };

  if (known[caseId]?.[type]) return known[caseId][type];
  const seed = [...`${caseId}-${type}`].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return {
    lat: Number((25.018 + (seed % 70) * 0.0011).toFixed(6)),
    lng: Number((121.49 + (seed % 85) * 0.0011).toFixed(6)),
  };
}

function setupMapControls() {
  const map = document.getElementById("liveMap");
  if (!map) return;

  map.addEventListener("click", (event) => {
    const action = event.target.closest("[data-map-action]")?.dataset.mapAction;
    if (!action) return;
    if (action === "zoom-in") setMapZoom(mapView.zoom + 0.25);
    if (action === "zoom-out") setMapZoom(mapView.zoom - 0.25);
    if (action === "reset") {
      mapView = { zoom: 1, panX: 0, panY: 0 };
      renderDashboard();
    }
  });

  map.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      setMapZoom(mapView.zoom + (event.deltaY < 0 ? 0.12 : -0.12));
    },
    { passive: false },
  );

  map.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    mapDrag = {
      startX: event.clientX,
      startY: event.clientY,
      panX: mapView.panX,
      panY: mapView.panY,
    };
    map.classList.add("dragging");
    map.setPointerCapture(event.pointerId);
  });

  map.addEventListener("pointermove", (event) => {
    if (!mapDrag) return;
    mapView.panX = clamp(mapDrag.panX + event.clientX - mapDrag.startX, -260, 260);
    mapView.panY = clamp(mapDrag.panY + event.clientY - mapDrag.startY, -210, 210);
    updateMapTransform();
  });

  map.addEventListener("pointerup", (event) => {
    mapDrag = null;
    map.classList.remove("dragging");
    try {
      map.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer may already be released by the browser.
    }
  });

  map.addEventListener("pointercancel", () => {
    mapDrag = null;
    map.classList.remove("dragging");
  });
}

function setMapZoom(nextZoom) {
  mapView.zoom = clamp(Number(nextZoom.toFixed(2)), 0.65, 2.5);
  mapView.panX = clamp(mapView.panX, -260, 260);
  mapView.panY = clamp(mapView.panY, -210, 210);
  updateMapTransform();
}

function updateMapTransform() {
  const canvas = document.querySelector(".map-canvas");
  const label = document.querySelector(".map-zoom-label");
  if (canvas) {
    canvas.style.transform = `translate(${mapView.panX}px, ${mapView.panY}px) scale(${mapView.zoom})`;
  }
  if (label) {
    label.textContent = `${Math.round(mapView.zoom * 100)}%`;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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
            <p class="subtext">${escapeHTML(driver.vehicleNo)}</p>
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
        <a class="route-icon-btn" href="${escapeHTML(googleMapsRouteUrl(trip))}" target="_blank" rel="noopener" aria-label="開啟 ${escapeHTML(driver?.name ?? "司機")} 的 Google 地圖路徑" title="開啟 Google 地圖路徑">
          🗺️
        </a>
      </div>
    </article>
  `;
}

function googleMapsRouteUrl(trip) {
  const person = getCase(trip.caseId);
  const location = state.driverLocations[trip.driverId];
  const params = new URLSearchParams({
    api: "1",
    travelmode: "driving",
  });

  if (location?.lat && location?.lng) {
    params.set("origin", `${Number(location.lat).toFixed(6)},${Number(location.lng).toFixed(6)}`);
  }

  if (person?.pickupAddress) {
    params.set("waypoints", person.pickupAddress);
  }

  params.set("destination", person?.destinationAddress || trip.destinationAddress || person?.pickupAddress || "");
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function renderCases() {
  const host = document.getElementById("appView");
  host.replaceChildren(document.getElementById("casesTemplate").content.cloneNode(true));

  if (selectedCaseId && !state.cases.some((person) => person.id === selectedCaseId)) {
    selectedCaseId = "";
  }

  const formPanel = document.getElementById("caseFormPanel");
  const workspace = document.getElementById("caseWorkspace");
  const isFormOpen = caseFormOpen || Boolean(editingCaseId);
  formPanel.hidden = !isFormOpen;
  workspace.classList.toggle("form-open", isFormOpen);

  document.getElementById("caseCount").textContent = `${state.cases.length} 位個案`;
  document.getElementById("caseList").innerHTML = state.cases.map(renderCaseCard).join("");

  const driverSelect = document.getElementById("caseDriverSelect");
  driverSelect.innerHTML = state.drivers
    .filter((driver) => driver.active)
    .map((driver) => `<option value="${escapeHTML(driver.id)}">${escapeHTML(driver.name)} · ${escapeHTML(driver.vehicleNo)}</option>`)
    .join("");

  document.getElementById("openCaseFormBtn").addEventListener("click", () => {
    editingCaseId = "";
    selectedCaseId = "";
    caseFormOpen = true;
    renderCases();
  });
  document.getElementById("caseForm").addEventListener("submit", handleCaseSubmit);
  document.getElementById("caseCancelBtn").addEventListener("click", () => {
    editingCaseId = "";
    caseFormOpen = false;
    renderCases();
  });
  document.getElementById("caseList").addEventListener("click", handleCaseAction);
  if (editingCaseId) fillCaseForm(editingCaseId);
}

function renderCaseCard(person) {
  const activeText = person.active ? "服務中" : "已停用";
  const activeClass = person.active ? "completed" : "scheduled";
  const hasTodayTrip = state.trips.some((trip) => trip.caseId === person.id && trip.serviceDate === state.serviceDate);
  const isSelected = selectedCaseId === person.id;
  const actions = isSelected
    ? `
      <div class="task-actions case-actions-panel" aria-label="${escapeHTML(person.name)} 操作選項">
        <button class="primary-btn" type="button" data-action="edit" data-case-id="${escapeHTML(person.id)}">
          ✏️ 編輯
        </button>
        <button class="secondary-btn" type="button" data-action="trip" data-case-id="${escapeHTML(person.id)}" ${hasTodayTrip ? "disabled" : ""}>
          ${hasTodayTrip ? "✅ 已在今日班表" : "📅 加入今日班表"}
        </button>
        <button class="ghost-btn" type="button" data-action="toggle" data-case-id="${escapeHTML(person.id)}">
          ${person.active ? "⏸️ 停用個案" : "▶️ 恢復服務"}
        </button>
        <button class="danger-btn" type="button" data-action="delete" data-case-id="${escapeHTML(person.id)}">
          🗑️ 刪除
        </button>
      </div>
    `
    : `
      <div class="case-card-hint">
        點選個案顯示操作
      </div>
    `;

  return `
    <article class="case-card ${isSelected ? "selected" : ""}" data-case-id="${escapeHTML(person.id)}" tabindex="0">
      <div>
        <strong>${escapeHTML(person.name)}</strong>
        <p class="subtext">${escapeHTML(person.caseNo)} · ${escapeHTML(person.gender || "未填性別")} · ${escapeHTML(person.careLevel)}</p>
        <p class="subtext">${escapeHTML(person.phone)}</p>
        <span class="status-pill ${activeClass}">${activeText}</span>
      </div>
      <div>
        <p class="subtext">個管員：${escapeHTML(person.careManager || "未填")} ${person.careManagerPhone ? `· ${escapeHTML(person.careManagerPhone)}` : ""}</p>
        <p class="subtext">服務區域：${escapeHTML(person.serviceArea || "未填")} · 輔具：${escapeHTML(person.assistiveDevice || "未填")}</p>
        <p class="subtext">緊急聯絡：${escapeHTML(person.emergencyContact || "未填")} ${person.emergencyRelation ? `(${escapeHTML(person.emergencyRelation)})` : ""}</p>
        <p class="subtext">上車：${escapeHTML(person.pickupAddress)}</p>
        <p class="subtext">目的地：${escapeHTML(person.destinationAddress)}</p>
        <p class="subtext">行動：${escapeHTML(person.mobility)}</p>
        <p class="subtext">接送注意：${escapeHTML(person.rideNote || person.note || "無")}</p>
      </div>
      ${actions}
    </article>
  `;
}

function fillCaseForm(caseId) {
  const person = getCase(caseId);
  const form = document.getElementById("caseForm");
  if (!person || !form) return;

  form.elements.id.value = person.id;
  form.elements.name.value = person.name;
  form.elements.caseNo.value = person.caseNo;
  form.elements.identityNo.value = person.identityNo || "";
  form.elements.gender.value = person.gender || "";
  form.elements.birthDate.value = person.birthDate || "";
  form.elements.phone.value = person.phone;
  form.elements.emergencyContact.value = person.emergencyContact || "";
  form.elements.emergencyRelation.value = person.emergencyRelation || "";
  form.elements.emergencyPhone.value = person.emergencyPhone || "";
  form.elements.careLevel.value = person.careLevel;
  form.elements.mobility.value = person.mobility;
  form.elements.assistiveDevice.value = person.assistiveDevice || "";
  form.elements.serviceArea.value = person.serviceArea || "";
  form.elements.careManager.value = person.careManager || "";
  form.elements.careManagerPhone.value = person.careManagerPhone || "";
  form.elements.pickupAddress.value = person.pickupAddress;
  form.elements.destinationAddress.value = person.destinationAddress;
  form.elements.rideNote.value = person.rideNote || "";
  form.elements.note.value = person.note || "";
  form.elements.createTrip.checked = false;
  form.elements.createTrip.disabled = true;
  document.getElementById("caseFormMode").textContent = "編輯個案";
  document.getElementById("caseSubmitBtn").textContent = "💾 儲存個案";
}

async function handleCaseSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const editingId = String(form.get("id") || "").trim();
  const existingCase = editingId ? getCase(editingId) : null;
  const newCase = {
    id: editingId || uid("case"),
    caseNo: String(form.get("caseNo")).trim(),
    name: String(form.get("name")).trim(),
    identityNo: String(form.get("identityNo")).trim(),
    gender: String(form.get("gender")).trim(),
    birthDate: String(form.get("birthDate")).trim(),
    phone: String(form.get("phone")).trim(),
    emergencyContact: String(form.get("emergencyContact")).trim(),
    emergencyRelation: String(form.get("emergencyRelation")).trim(),
    emergencyPhone: String(form.get("emergencyPhone")).trim(),
    careLevel: String(form.get("careLevel")),
    mobility: String(form.get("mobility")),
    assistiveDevice: String(form.get("assistiveDevice")).trim(),
    serviceArea: String(form.get("serviceArea")).trim(),
    careManager: String(form.get("careManager")).trim(),
    careManagerPhone: String(form.get("careManagerPhone")).trim(),
    pickupAddress: String(form.get("pickupAddress")).trim(),
    destinationAddress: String(form.get("destinationAddress")).trim(),
    rideNote: String(form.get("rideNote")).trim(),
    note: String(form.get("note")).trim(),
    active: existingCase?.active ?? true,
  };

  const duplicate = findDuplicateCase(newCase, editingId);
  if (duplicate) {
    dataMessage = duplicate;
    renderCases();
    return;
  }

  if (dataMode === "supabase") {
    try {
      await apiAction(editingId ? "update_case" : "create_case", {
        case: newCase,
        trip: form.get("createTrip")
          ? {
              driverId: String(form.get("driverId")),
              scheduledPickup: String(form.get("scheduledPickup")),
              scheduledDropoff: String(form.get("scheduledDropoff")),
            }
          : null,
      });
      editingCaseId = "";
      selectedCaseId = newCase.id;
      caseFormOpen = false;
      renderCases();
    } catch (error) {
      dataMessage = `新增失敗：${error.message}`;
      renderCases();
    }
    return;
  }

  if (editingId) {
    state.cases = state.cases.map((person) => (person.id === editingId ? newCase : person));
    editingCaseId = "";
    selectedCaseId = newCase.id;
    caseFormOpen = false;
    saveState();
    renderCases();
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
  selectedCaseId = newCase.id;
  caseFormOpen = false;
  renderCases();
}

async function handleCaseAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    const card = event.target.closest(".case-card[data-case-id]");
    if (!card) return;
    selectedCaseId = card.dataset.caseId === selectedCaseId ? "" : card.dataset.caseId;
    editingCaseId = "";
    caseFormOpen = false;
    renderCases();
    return;
  }

  const person = state.cases.find((item) => item.id === button.dataset.caseId);
  if (!person) return;
  selectedCaseId = person.id;

  if (button.dataset.action === "edit") {
    editingCaseId = person.id;
    caseFormOpen = true;
    renderCases();
    return;
  }

  if (button.dataset.action === "delete" && !window.confirm(`確定刪除 ${person.name}？相關今日班表也會移除。`)) {
    return;
  }

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

      if (button.dataset.action === "delete") {
        await apiAction("delete_case", { caseId: person.id });
        selectedCaseId = "";
      }
      editingCaseId = "";
      caseFormOpen = false;
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

  if (button.dataset.action === "delete") {
    state.trips = state.trips.filter((trip) => trip.caseId !== person.id);
    state.cases = state.cases.filter((item) => item.id !== person.id);
    editingCaseId = "";
    selectedCaseId = "";
    caseFormOpen = false;
  }

  saveState();
  renderCases();
}

function renderDrivers() {
  const host = document.getElementById("appView");
  host.replaceChildren(document.getElementById("driversTemplate").content.cloneNode(true));

  if (selectedDriverId && !state.drivers.some((driver) => driver.id === selectedDriverId)) {
    selectedDriverId = "";
  }

  const formPanel = document.getElementById("driverFormPanel");
  const workspace = document.getElementById("driverWorkspace");
  const isFormOpen = driverFormOpen || Boolean(editingDriverId);
  formPanel.hidden = !isFormOpen;
  workspace.classList.toggle("form-open", isFormOpen);

  document.getElementById("driverCount").textContent = `${state.drivers.length} 位司機`;
  document.getElementById("driverList").innerHTML = state.drivers.map(renderDriverManageCard).join("");
  document.getElementById("openDriverFormBtn").addEventListener("click", () => {
    editingDriverId = "";
    selectedDriverId = "";
    driverFormOpen = true;
    renderDrivers();
  });
  document.getElementById("driverForm").addEventListener("submit", handleDriverSubmit);
  document.getElementById("driverCancelBtn").addEventListener("click", () => {
    editingDriverId = "";
    driverFormOpen = false;
    renderDrivers();
  });
  document.getElementById("driverList").addEventListener("click", handleDriverManageAction);
  if (editingDriverId) fillDriverForm(editingDriverId);
}

function sameText(left, right) {
  return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}

function findDuplicateCase(person, editingId = "") {
  const duplicate = state.cases.find((item) => {
    if (item.id === editingId) return false;
    return (
      sameText(item.caseNo, person.caseNo) ||
      (person.identityNo && sameText(item.identityNo, person.identityNo)) ||
      (person.phone && sameText(item.name, person.name) && sameText(item.phone, person.phone))
    );
  });

  if (!duplicate) return "";
  if (sameText(duplicate.caseNo, person.caseNo)) return `個案編號 ${person.caseNo} 已存在，請勿重複新增。`;
  if (person.identityNo && sameText(duplicate.identityNo, person.identityNo)) return `身分證字號 ${person.identityNo} 已存在於 ${duplicate.name}。`;
  return `${person.name} 與電話 ${person.phone} 已存在，請確認是否為同一位個案。`;
}

function findDuplicateDriver(driver, editingId = "") {
  const duplicate = state.drivers.find((item) => {
    if (item.id === editingId) return false;
    return (
      (driver.identityNo && sameText(item.identityNo, driver.identityNo)) ||
      sameText(item.vehicleNo, driver.vehicleNo) ||
      (driver.phone && sameText(item.name, driver.name) && sameText(item.phone, driver.phone))
    );
  });

  if (!duplicate) return "";
  if (driver.identityNo && sameText(duplicate.identityNo, driver.identityNo)) return `司機身分證字號 ${driver.identityNo} 已存在於 ${duplicate.name}。`;
  if (sameText(duplicate.vehicleNo, driver.vehicleNo)) return `車號 ${driver.vehicleNo} 已由 ${duplicate.name} 使用。`;
  return `${driver.name} 與電話 ${driver.phone} 已存在，請確認是否重複新增。`;
}

function maskIdentity(value) {
  const text = String(value || "").trim();
  if (!text) return "未填";
  if (text.length <= 4) return text;
  return `${text.slice(0, 2)}${"*".repeat(Math.max(0, text.length - 4))}${text.slice(-2)}`;
}

function renderDriverManageCard(driver) {
  const activeText = driver.active ? "服務中" : "已停用";
  const activeClass = driver.active ? "completed" : "scheduled";
  const isSelected = selectedDriverId === driver.id;
  const actions = isSelected
    ? `
      <div class="task-actions case-actions-panel" aria-label="${escapeHTML(driver.name)} 操作選項">
        <button class="primary-btn" type="button" data-action="edit" data-driver-id="${escapeHTML(driver.id)}">✏️ 編輯</button>
        <button class="ghost-btn" type="button" data-action="toggle" data-driver-id="${escapeHTML(driver.id)}">
          ${driver.active ? "⏸️ 停用司機" : "▶️ 恢復服務"}
        </button>
        <button class="danger-btn" type="button" data-action="delete" data-driver-id="${escapeHTML(driver.id)}">🗑️ 刪除</button>
      </div>
    `
    : `
      <div class="case-card-hint">
        點選司機顯示操作
      </div>
    `;

  return `
    <article class="case-card ${isSelected ? "selected" : ""}" data-driver-id="${escapeHTML(driver.id)}" tabindex="0">
      <div>
        <strong>${escapeHTML(driver.name)}</strong>
        <p class="subtext">車號 ${escapeHTML(driver.vehicleNo)}</p>
        <p class="subtext">${escapeHTML(driver.phone || "未填電話")}</p>
        <span class="status-pill ${activeClass}">${activeText}</span>
      </div>
      <div>
        <p class="subtext">身分證字號：${escapeHTML(maskIdentity(driver.identityNo))}</p>
        <p class="subtext">快速登入 PIN：${escapeHTML(driver.pin || "未設定")}</p>
        <p class="subtext">最新定位：${escapeHTML(formatCoordinate(state.driverLocations[driver.id]))}</p>
        <p class="subtext">更新時間：${escapeHTML(formatEventTime(state.driverLocations[driver.id]?.updatedAt))}</p>
      </div>
      ${actions}
    </article>
  `;
}

function fillDriverForm(driverId) {
  const driver = getDriver(driverId);
  const form = document.getElementById("driverForm");
  if (!driver || !form) return;

  form.elements.id.value = driver.id;
  form.elements.name.value = driver.name;
  form.elements.identityNo.value = driver.identityNo || "";
  form.elements.phone.value = driver.phone || "";
  form.elements.vehicleNo.value = driver.vehicleNo;
  form.elements.pin.value = driver.pin || "";
  form.elements.active.value = String(Boolean(driver.active));
  document.getElementById("driverFormMode").textContent = "編輯司機";
  document.getElementById("driverSubmitBtn").textContent = "💾 儲存司機";
}

async function handleDriverSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const editingId = String(form.get("id") || "").trim();
  const driver = {
    id: editingId || uid("drv"),
    name: String(form.get("name")).trim(),
    identityNo: String(form.get("identityNo")).trim(),
    phone: String(form.get("phone")).trim(),
    vehicleNo: String(form.get("vehicleNo")).trim(),
    routeLabel: "",
    pin: String(form.get("pin")).trim(),
    active: String(form.get("active")) === "true",
  };

  const duplicate = findDuplicateDriver(driver, editingId);
  if (duplicate) {
    dataMessage = duplicate;
    renderDrivers();
    return;
  }

  if (!/^\d{6}$/.test(driver.pin)) {
    dataMessage = "司機 PIN 必須是 6 位數字。";
    renderDrivers();
    return;
  }

  if (dataMode === "supabase") {
    try {
      await apiAction(editingId ? "update_driver" : "create_driver", { driver });
      editingDriverId = "";
      selectedDriverId = driver.id;
      driverFormOpen = false;
      renderDrivers();
    } catch (error) {
      dataMessage = `司機資料儲存失敗：${error.message}`;
      renderDrivers();
    }
    return;
  }

  if (editingId) {
    state.drivers = state.drivers.map((item) => (item.id === editingId ? { ...item, ...driver } : item));
  } else {
    state.drivers.push({ ...driver, homeLocation: fallbackLocation(driver.id) });
    state.driverLocations[driver.id] = {
      ...fallbackLocation(driver.id),
      accuracy: 80,
      source: "demo",
      updatedAt: new Date().toISOString(),
      eventType: "heartbeat",
      tripId: "",
    };
  }
  editingDriverId = "";
  selectedDriverId = driver.id;
  driverFormOpen = false;
  saveState();
  renderDrivers();
}

async function handleDriverManageAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    const card = event.target.closest(".case-card[data-driver-id]");
    if (!card) return;
    selectedDriverId = card.dataset.driverId === selectedDriverId ? "" : card.dataset.driverId;
    editingDriverId = "";
    driverFormOpen = false;
    renderDrivers();
    return;
  }

  const driver = state.drivers.find((item) => item.id === button.dataset.driverId);
  if (!driver) return;
  selectedDriverId = driver.id;

  if (button.dataset.action === "edit") {
    editingDriverId = driver.id;
    driverFormOpen = true;
    renderDrivers();
    return;
  }

  if (button.dataset.action === "delete" && !window.confirm(`確定刪除 ${driver.name}？已有歷史班表時系統會改為停用。`)) {
    return;
  }

  if (dataMode === "supabase") {
    try {
      if (button.dataset.action === "toggle") {
        await apiAction("toggle_driver", { driverId: driver.id, active: !driver.active });
      }
      if (button.dataset.action === "delete") {
        await apiAction("delete_driver", { driverId: driver.id });
        selectedDriverId = "";
      }
      editingDriverId = "";
      driverFormOpen = false;
      renderDrivers();
    } catch (error) {
      dataMessage = `司機資料更新失敗：${error.message}`;
      renderDrivers();
    }
    return;
  }

  if (button.dataset.action === "toggle") {
    driver.active = !driver.active;
  }
  if (button.dataset.action === "delete") {
    state.trips = state.trips.filter((trip) => trip.driverId !== driver.id);
    delete state.driverLocations[driver.id];
    state.drivers = state.drivers.filter((item) => item.id !== driver.id);
    selectedDriverId = "";
  }
  editingDriverId = "";
  driverFormOpen = false;
  saveState();
  renderDrivers();
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
        ${state.drivers.filter((driver) => driver.active).map(renderDriverLoginCard).join("")}
      </div>
    </section>
    ${selectedDriver ? renderPinDialog(selectedDriver) : ""}
  `;

  view.addEventListener("click", handleDriverLoginClick);
}

function renderPinDialog(driver) {
  return `
    <div class="pin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="pinDialogTitle">
      <section class="work-section pin-panel pin-dialog">
        <button class="modal-close-btn" type="button" data-pin-close aria-label="關閉 PIN 視窗">×</button>
        <div>
          <p class="eyebrow">PIN</p>
          <h3 id="pinDialogTitle">${escapeHTML(driver.name)}</h3>
          <p class="subtext">請輸入 6 碼快速登入 PIN</p>
        </div>
        <div class="pin-display" aria-label="PIN 輸入">${pinInput ? "●".repeat(pinInput.length) : "------"}</div>
        <div class="keypad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => `<button type="button" data-key="${digit}">${digit}</button>`).join("")}
          <button type="button" data-key="clear">清除</button>
          <button type="button" data-key="0">0</button>
          <button type="button" data-key="back">退格</button>
        </div>
        ${pinMessage ? `<p class="subtext pin-message">${escapeHTML(pinMessage)}</p>` : ""}
      </section>
    </div>
  `;
}

function renderDriverLoginCard(driver) {
  const active = driver.id === selectedLoginDriverId ? "active" : "";
  return `
    <button class="driver-card ${active}" type="button" data-driver-id="${escapeHTML(driver.id)}">
      <span class="driver-badge">司機</span>
      <strong>${escapeHTML(driver.name)}</strong>
      <span class="subtext">車號 ${escapeHTML(driver.vehicleNo)}</span>
      <span class="subtext">${escapeHTML(driver.phone)}</span>
    </button>
  `;
}

function handleDriverLoginClick(event) {
  if (event.target.closest("[data-pin-close]")) {
    selectedLoginDriverId = "";
    pinInput = "";
    pinMessage = "";
    renderDriverLogin();
    return;
  }

  if (event.target.classList.contains("pin-modal-backdrop")) {
    selectedLoginDriverId = "";
    pinInput = "";
    pinMessage = "";
    renderDriverLogin();
    return;
  }

  const driverButton = event.target.closest("[data-driver-id]");
  if (driverButton) {
    selectedLoginDriverId = driverButton.dataset.driverId;
    pinInput = "";
    pinMessage = "";
    renderDriverLogin();
    window.setTimeout(() => {
      document.querySelector(".pin-dialog [data-key]")?.focus();
    }, 0);
    return;
  }

  const keyButton = event.target.closest("[data-key]");
  if (!keyButton || !selectedLoginDriverId) return;

  const key = keyButton.dataset.key;
  if (key === "clear") pinInput = "";
  if (key === "back") pinInput = pinInput.slice(0, -1);
  if (/^\d$/.test(key) && pinInput.length < 6) pinInput += key;

  if (pinInput.length === 6) {
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
        <p>${escapeHTML(driver.vehicleNo)}</p>
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

  const range = document.getElementById("fontSizeRange");
  const label = document.getElementById("fontSizeLabel");
  range.value = String(fontScale);
  label.textContent = `${fontScale}%`;
  range.addEventListener("input", () => {
    fontScale = Number(range.value);
    localStorage.setItem(FONT_SCALE_KEY, String(fontScale));
    label.textContent = `${fontScale}%`;
    applyFontScale();
  });
  document.getElementById("fontSizeResetBtn").addEventListener("click", () => {
    fontScale = 100;
    localStorage.setItem(FONT_SCALE_KEY, "100");
    range.value = "100";
    label.textContent = "100%";
    applyFontScale();
  });
}

function renderReleases() {
  const host = document.getElementById("appView");
  host.replaceChildren(document.getElementById("releasesTemplate").content.cloneNode(true));
  document.getElementById("releaseList").innerHTML = releaseNotes
    .map((release) => {
      return `
        <article class="release-item">
          <div>
            <strong>${escapeHTML(release.version)}</strong>
            <p class="subtext">${escapeHTML(release.date)}</p>
          </div>
          <ul>
            ${release.items.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}
          </ul>
        </article>
      `;
    })
    .join("");
}

function updateClock() {
  const target = document.getElementById("clock");
  if (target) target.textContent = localTime();
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
      requestView(button.dataset.view);
    });
  });

  document.getElementById("sidebarToggle").addEventListener("click", () => {
    sidebarCollapsed = !sidebarCollapsed;
    localStorage.setItem("ltc-sidebar-collapsed", String(sidebarCollapsed));
    render();
  });

  document.getElementById("homeBtn").addEventListener("click", () => {
    activeDriverId = "";
    selectedLoginDriverId = "";
    pinInput = "";
    pinMessage = "";
    requestView("dashboard");
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
