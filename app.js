const STORAGE_KEY = "ltc-community-transport-v1";
const COORDINATOR_SESSION_KEY = "ltc-coordinator-unlocked";
const COORDINATOR_PASSCODE_KEY = "ltc-coordinator-passcode";
const FONT_SCALE_KEY = "ltc-font-scale";
const SERVICE_DATE_KEY = "ltc-service-date";
const COORDINATOR_PASSCODE = "2468";
const protectedViews = new Set(["dashboard", "cases", "drivers", "settings", "releases", "schedules", "reimbursements"]);
let notifications = [];
try {
  notifications = JSON.parse(localStorage.getItem("ltc-notifications") || "[]");
} catch (e) {
  notifications = [];
}
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
  "delete_trip",
  "create_schedule",
  "update_schedule",
  "delete_schedule",
  "toggle_schedule",
  "create_schedule_override",
  "delete_schedule_override",
]);

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

const weekdayLabels = ["日", "一", "二", "三", "四", "五", "六"];
const scheduleStatusLabels = {
  active: "啟用中",
  paused: "已暫停",
  stopped: "已停止",
};
const scheduleTypeLabels = {
  single: "單次",
  weekly: "週期",
};

const communitySites = [
  { name: "古亭社區", address: "壯圍鄉古亭路48-16號", lat: 24.77218, lng: 121.80029 },
  { name: "功勞社區", address: "壯圍鄉美功路一段 80 巷 21 號", lat: 24.77088, lng: 121.78335 },
  { name: "美城社區", address: "壯圍鄉永美路二段 121 號", lat: 24.77782, lng: 121.78892 },
  { name: "新社社區", address: "壯圍鄉新社路 54-3 號", lat: 24.78592, lng: 121.80945 },
  { name: "我們的家", address: "羅東鎮康莊路25號", lat: 24.66986, lng: 121.77691 },
  { name: "五結樂智", address: "五結鄉五結路二段360-1號", lat: 24.68547, lng: 121.79939 },
];

const releaseNotes = [
  {
    version: "v0.7.3",
    date: "2026-05-23",
    items: [
      "今日接送班表新增刪除個別或臨時接送班次功能",
      "修正異常回報視窗右上角關閉按鈕「X」的顯示問題",
      "修正未讀通知計數為 0 時，紅色通知角標能完全隱藏",
      "移除頂部導覽列頭像「LC」",
      "調整右下角「即時車隊狀態」面板至更精緻輕巧的版面",
    ],
  },
  {
    version: "v0.7.2",
    date: "2026-05-22",
    items: ["個案支援多位緊急聯絡人", "電話欄位新增一鍵撥打圖示", "新增常用目的地與社區據點欄位", "承辦人入口新增核銷清冊 Excel 匯出"],
  },
  {
    version: "v0.7.1",
    date: "2026-05-22",
    items: ["新增個案與司機儲存成功提示", "新增後即時以資料庫回傳資料更新名冊選取狀態", "修正名冊搜尋狀態下重新整理後的顯示同步"],
  },
  {
    version: "v0.7.0",
    date: "2026-05-21",
    items: ["新增主入口首頁，承辦人與司機依身分進入系統", "承辦人新增登出功能", "個案卡片新增 Google 地圖路徑按鈕並優化狀態顯示位置"],
  },
  {
    version: "v0.6.5",
    date: "2026-05-21",
    items: ["手機版新增下拉重新整理", "承辦人入口移至側邊導覽第一項", "個案管理與司機管理整合進承辦人入口"],
  },
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

let activeView = "home";
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
let editingScheduleId = "";
let selectedScheduleId = "";
let scheduleFormOpen = false;
let scheduleOverrideOpen = false;
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
let pullRefreshState = {
  active: false,
  startY: 0,
  distance: 0,
};
let dataMode = "local";
let dataMessage = "本機示範資料";
let flashMessage = "";
let flashTone = "success";
let flashScope = "global";

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

function normalizeBirthDate(value) {
  const raw = String(value || "").trim().replaceAll("/", "-");
  if (!raw) return "";
  const match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return "";
  const year = match[1];
  const month = String(Number(match[2])).padStart(2, "0");
  const day = String(Number(match[3])).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function escapeXML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d+#,;]/g, "");
}

function phoneKind(value) {
  const clean = normalizePhone(value);
  if (!clean) return "";
  return /^09\d{8}$/.test(clean) ? "手機" : "室內";
}

function splitPhoneByType(value) {
  const parts = String(value || "").match(/09\d{2}[-\s]?\d{3}[-\s]?\d{3}|0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{3,4}(?:#\d+)?/g) || [];
  return {
    mobile: parts.find((item) => phoneKind(item) === "手機") || "",
    landline: parts.find((item) => phoneKind(item) === "室內") || "",
  };
}

function renderPhoneLink(value, label = "") {
  const phone = String(value || "").trim();
  const href = normalizePhone(phone);
  if (!phone) return "";
  return `
    <a class="phone-link" href="tel:${escapeHTML(href)}" aria-label="撥打${escapeHTML(label || phone)}">
      <span class="material-symbols-outlined" aria-hidden="true">call</span>
      <span>${escapeHTML(label ? `${label} ${phone}` : phone)}</span>
    </a>
  `;
}

function uniqueItems(items, keyFn = (item) => item) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeEmergencyContacts(person) {
  const fromArray = Array.isArray(person.emergencyContacts) ? person.emergencyContacts : [];
  const primary = {
    name: person.emergencyContact || "",
    relation: person.emergencyRelation || "",
    phone: person.emergencyPhone || "",
  };
  return uniqueItems([...fromArray, primary], (item) => `${item.name || ""}|${item.phone || ""}`)
    .map((item) => ({
      name: String(item.name || "").trim(),
      relation: String(item.relation || "").trim(),
      phone: String(item.phone || "").trim(),
    }))
    .filter((item) => item.name || item.phone);
}

function contactsToText(contacts) {
  return normalizeEmergencyContacts({ emergencyContacts: contacts })
    .map((item) => [item.name, item.relation, item.phone].filter(Boolean).join("｜"))
    .join("\n");
}

function parseEmergencyContacts(text, fallback = {}) {
  const parsed = String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const phone = line.match(/09\d{2}[-\s]?\d{3}[-\s]?\d{3}|0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{3,4}(?:#\d+)?/)?.[0] || "";
      const chunks = line
        .replace(phone, "")
        .split(/[,\t|｜/]/)
        .map((part) => part.trim())
        .filter(Boolean);
      return { name: chunks[0] || "", relation: chunks[1] || "", phone };
    });
  return normalizeEmergencyContacts({
    emergencyContacts: parsed,
    emergencyContact: fallback.name,
    emergencyRelation: fallback.relation,
    emergencyPhone: fallback.phone,
  });
}

function normalizeDestinations(person) {
  const fromArray = Array.isArray(person.destinations) ? person.destinations : [];
  const primary = { name: person.destinationAddress || "", address: person.destinationAddress || "" };
  return uniqueItems([...fromArray, primary], (item) => `${item.name || ""}|${item.address || ""}`)
    .map((item) => ({
      name: String(item.name || item.address || "").trim(),
      address: String(item.address || item.name || "").trim(),
    }))
    .filter((item) => item.name || item.address);
}

function destinationsToText(destinations) {
  return normalizeDestinations({ destinations })
    .map((item) => (item.name === item.address ? item.name : `${item.name}｜${item.address}`))
    .join("\n");
}

function parseDestinations(text, fallback = "") {
  const parsed = String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, address] = line.split(/[|｜]/).map((part) => part.trim());
      return { name: name || address || "", address: address || name || "" };
    });
  return normalizeDestinations({ destinations: parsed, destinationAddress: fallback });
}

function normalizeDaysOfWeek(value) {
  const items = Array.isArray(value) ? value : [];
  return [...new Set(items.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item >= 0 && item <= 6))].sort(
    (a, b) => a - b,
  );
}

function normalizeScheduleOverrides(value) {
  return Array.isArray(value)
    ? value
        .map((item) => ({
          serviceDate: String(item.serviceDate || item.service_date || "").trim(),
          overrideDriverId: String(item.overrideDriverId || item.override_driver_id || "").trim(),
          overridePickupTime: String(item.overridePickupTime || item.override_pickup_time || "").trim(),
          overrideDropoffTime: String(item.overrideDropoffTime || item.override_dropoff_time || "").trim(),
          overrideDestinationAddress: String(item.overrideDestinationAddress || item.override_destination_address || "").trim(),
          overridePurpose: String(item.overridePurpose || item.override_purpose || "").trim(),
          specialRequirements: String(item.specialRequirements || item.special_requirements || "").trim(),
          cancelService: Boolean(item.cancelService ?? item.cancel_service ?? false),
          note: String(item.note || "").trim(),
        }))
        .filter((item) => item.serviceDate)
    : [];
}

function getScheduleOverride(schedule, serviceDate) {
  return (schedule.dateOverrides || []).find((item) => item.serviceDate === serviceDate) || null;
}

function weekdayIndex(dateString) {
  if (!dateString) return 0;
  const date = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(date.getTime()) ? 0 : date.getDay();
}

function scheduleMatchesDate(schedule, serviceDate) {
  if (!schedule || !serviceDate) return false;
  if (schedule.status !== "active") return false;
  if (schedule.scheduleType === "single") return schedule.serviceDate === serviceDate;

  if (schedule.startDate && serviceDate < schedule.startDate) return false;
  if (schedule.endDate && serviceDate > schedule.endDate) return false;
  return schedule.daysOfWeek.includes(weekdayIndex(serviceDate));
}

function scheduleSummary(schedule, serviceDate = state.serviceDate) {
  const datePart =
    schedule.scheduleType === "single"
      ? `單次 · ${schedule.serviceDate || "未定"}`
      : `每週 · ${schedule.daysOfWeek.map((day) => weekdayLabels[day]).join("、") || "未選"}${schedule.endDate ? ` 至 ${schedule.endDate}` : ""}`;
  const override = getScheduleOverride(schedule, serviceDate);
  const overrideText = override
    ? override.cancelService
      ? `當日已取消`
      : [
          override.overridePickupTime ? `上車 ${override.overridePickupTime}` : "",
          override.overrideDropoffTime ? `送達 ${override.overrideDropoffTime}` : "",
          override.overrideDestinationAddress ? `目的地已改` : "",
        ]
        .filter(Boolean)
        .join(" · ")
    : "";
  return [datePart, schedule.purpose || "未填項目", overrideText].filter(Boolean).join(" · ");
}

function scheduleStatusText(schedule) {
  return scheduleStatusLabels[schedule.status] || schedule.status || "啟用中";
}

function scheduleEffectiveFields(schedule, serviceDate) {
  const override = getScheduleOverride(schedule, serviceDate);
  if (override?.cancelService) return null;
  return {
    caseId: schedule.caseId,
    driverId: override?.overrideDriverId || schedule.driverId,
    scheduledPickup: override?.overridePickupTime || schedule.scheduledPickup,
    scheduledDropoff: override?.overrideDropoffTime || schedule.scheduledDropoff,
    pickupAddress: schedule.pickupAddress || getCase(schedule.caseId)?.pickupAddress || "",
    destinationAddress: override?.overrideDestinationAddress || schedule.destinationAddress || getCase(schedule.caseId)?.destinationAddress || "",
    purpose: override?.overridePurpose || schedule.purpose || "排程接送",
    specialRequirements: override?.specialRequirements || schedule.specialRequirements || "",
  };
}

function buildTripFromSchedule(schedule, serviceDate) {
  const fields = scheduleEffectiveFields(schedule, serviceDate);
  if (!fields) return null;
  const caseItem = getCase(fields.caseId);
  const driverItem = getDriver(fields.driverId);
  if (!caseItem || !driverItem) return null;

  return {
    id: uid(`trip_${schedule.id}`),
    serviceDate,
    caseId: fields.caseId,
    driverId: fields.driverId,
    scheduleId: schedule.id,
    scheduledPickup: fields.scheduledPickup,
    scheduledDropoff: fields.scheduledDropoff,
    pickupTime: "",
    pickupAt: "",
    pickupLocation: null,
    dropoffTime: "",
    dropoffAt: "",
    dropoffLocation: null,
    pickupAddress: fields.pickupAddress,
    destinationAddress: fields.destinationAddress,
    purpose: fields.purpose,
    status: "scheduled",
  };
}

function syncLocalSchedulesForDate(serviceDate = state.serviceDate) {
  const existingManualTrips = state.trips.filter((trip) => !trip.scheduleId || trip.serviceDate !== serviceDate);
  const generatedTrips = [];

  state.schedules
    .filter((schedule) => scheduleMatchesDate(schedule, serviceDate))
    .forEach((schedule) => {
      const ride = buildTripFromSchedule(schedule, serviceDate);
      if (!ride) return;
      const override = getScheduleOverride(schedule, serviceDate);
      const rideId = `${schedule.id}_${serviceDate}`;
      const previous = state.trips.find((trip) => trip.scheduleId === schedule.id && trip.serviceDate === serviceDate);
      const nextRide = previous
        ? {
            ...previous,
            ...ride,
            id: previous.id,
            pickupTime: previous.pickupTime || "",
            pickupAt: previous.pickupAt || "",
            pickupLocation: previous.pickupLocation || null,
            dropoffTime: previous.dropoffTime || "",
            dropoffAt: previous.dropoffAt || "",
            dropoffLocation: previous.dropoffLocation || null,
          }
        : { ...ride, id: rideId };
      if (override?.cancelService) return;
      generatedTrips.push(nextRide);
    });

  state.trips = [...existingManualTrips, ...generatedTrips]
    .filter((trip) => trip.serviceDate === serviceDate || !trip.scheduleId)
    .sort((a, b) => a.scheduledPickup.localeCompare(b.scheduledPickup));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();

  try {
    const parsed = JSON.parse(raw);
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
  const hasSchedules = Array.isArray(value.schedules);
  const next = {
    ...fresh,
    ...value,
    drivers: hasDrivers ? value.drivers : fresh.drivers,
    cases: hasCases ? value.cases : fresh.cases,
    trips: hasTrips ? value.trips : fresh.trips,
    schedules: hasSchedules ? value.schedules : fresh.schedules,
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

  next.cases = next.cases.map((person) => {
    const fallback = fresh.cases.find((item) => item.id === person.id) || {};
    const phones = splitPhoneByType(person.phone);
    const landlinePhone = person.landlinePhone || phones.landline || "";
    const mobilePhone = person.mobilePhone || phones.mobile || "";
    const emergencyContacts = normalizeEmergencyContacts({ ...fallback, ...person });
    const destinations = normalizeDestinations({ ...fallback, ...person });
    return {
      ...fallback,
      ...person,
      phone: person.phone || mobilePhone || landlinePhone || fallback.phone || "",
      landlinePhone,
      mobilePhone,
      welfareStatus: person.welfareStatus || "",
      communitySite: person.communitySite || "",
      quotaNote: person.quotaNote || "",
      emergencyContacts,
      emergencyContact: emergencyContacts[0]?.name || person.emergencyContact || "",
      emergencyRelation: emergencyContacts[0]?.relation || person.emergencyRelation || "",
      emergencyPhone: emergencyContacts[0]?.phone || person.emergencyPhone || "",
      destinations,
      destinationAddress: person.destinationAddress || destinations[0]?.address || "",
    };
  });

  next.trips = next.trips.map((trip) => ({
    pickupLocation: null,
    dropoffLocation: null,
    ...trip,
    scheduleId: trip.scheduleId || trip.schedule_id || "",
    pickupAddress: trip.pickupAddress || trip.pickup_address || next.cases.find((person) => person.id === trip.caseId)?.pickupAddress || "",
    destinationAddress: trip.destinationAddress || trip.destination_address || next.cases.find((person) => person.id === trip.caseId)?.destinationAddress || "",
  }));

  next.schedules = next.schedules.map((schedule) => {
    const fallback = fresh.schedules.find((item) => item.id === schedule.id) || {};
    const dateOverrides = normalizeScheduleOverrides(schedule.dateOverrides || schedule.overrides || []);
    return {
      ...fallback,
      ...schedule,
      caseId: schedule.caseId || schedule.case_id || "",
      driverId: schedule.driverId || schedule.driver_id || "",
      scheduleType: schedule.scheduleType || schedule.schedule_type || "single",
      serviceDate: schedule.serviceDate || schedule.service_date || "",
      startDate: schedule.startDate || schedule.start_date || "",
      endDate: schedule.endDate || schedule.end_date || "",
      daysOfWeek: normalizeDaysOfWeek(schedule.daysOfWeek || schedule.days_of_week || []),
      scheduledPickup: schedule.scheduledPickup || schedule.scheduled_pickup || "",
      scheduledDropoff: schedule.scheduledDropoff || schedule.scheduled_dropoff || "",
      pickupAddress: schedule.pickupAddress || schedule.pickup_address || "",
      destinationAddress: schedule.destinationAddress || schedule.destination_address || "",
      purpose: schedule.purpose || "",
      specialRequirements: schedule.specialRequirements || schedule.special_requirements || "",
      status: schedule.status || "active",
      stopReason: schedule.stopReason || schedule.stop_reason || "",
      dateOverrides,
    };
  });

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
    schedules: Array.isArray(previous.schedules) ? previous.schedules : fresh.schedules,
    driverLocations: previous.driverLocations ?? fresh.driverLocations,
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function loadRemoteState(serviceDate = state.serviceDate || todayKey()) {
  const response = await fetch(`/api/state?serviceDate=${encodeURIComponent(serviceDate)}`, {
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
  dataMessage = "車隊動態同步中";
  saveState();
}

async function apiAction(action, payload = {}) {
  if (dataMode !== "supabase") return false;
  const guardedPayload = coordinatorActions.has(action)
    ? { ...payload, coordinatorPasscode, serviceDate: payload.serviceDate || state.serviceDate || todayKey() }
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
  const topTarget = document.getElementById("topbarConnection");
  const topDot = document.querySelector(".live-chip .dot");
  if (target) target.textContent = dataMessage;
  if (topTarget) topTarget.textContent = dataMessage;
  [dot, topDot].filter(Boolean).forEach((item) => {
    item.classList.toggle("online", dataMode === "supabase");
    item.classList.toggle("local", dataMode !== "supabase");
  });
}

async function setServiceDate(serviceDate) {
  const nextDate = serviceDate || todayKey();
  state.serviceDate = nextDate;
  localStorage.setItem(SERVICE_DATE_KEY, nextDate);
  if (dataMode === "supabase") {
    await loadRemoteState(nextDate);
    render();
    return;
  }
  syncLocalSchedulesForDate(nextDate);
  saveState();
  render();
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
    schedules: [],
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
  document.body.classList.toggle("coordinator-unlocked", coordinatorUnlocked);
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === activeView);
  });
  document.querySelectorAll(".topbar-management-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.topbarView === activeView);
  });
  const visibleView = protectedViews.has(activeView) && !coordinatorUnlocked ? "coordinatorGate" : activeView;
  document.body.dataset.view = visibleView;
  updateConnectionState();

  if (visibleView === "home") renderHome();
  if (visibleView === "coordinatorGate") renderCoordinatorGate();
  if (visibleView === "dashboard") renderDashboard();
  if (visibleView === "cases") renderCases();
  if (visibleView === "drivers") renderDrivers();
  if (visibleView === "driver") renderDriver();
  if (visibleView === "settings") renderSettings();
  if (visibleView === "releases") renderReleases();
  if (visibleView === "schedules") renderSchedules();
  if (visibleView === "reimbursements") renderReimbursements();
  renderFlash();
  updateNotificationCenter();
}

let selectedReimbursementMonth = todayKey().substring(0, 7);

function renderReimbursements(host = document.getElementById("appView")) {
  host.replaceChildren(document.getElementById("reimbursementsTemplate").content.cloneNode(true));

  const monthPicker = document.getElementById("reimbursementMonthPicker");
  if (monthPicker) {
    monthPicker.value = selectedReimbursementMonth;
    monthPicker.addEventListener("change", (e) => {
      selectedReimbursementMonth = e.target.value;
      updateReimbursementPreview();
    });
  }

  const exportBtn = document.getElementById("doExportReimbursementBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const rows = reimbursementRows(selectedReimbursementMonth);
      if (!rows.length) {
        setFlash(`${selectedReimbursementMonth} 月份目前沒有已完成的接送班次可匯出。`, "error");
        return;
      }
      downloadSpreadsheet(`社區交通車核銷月報表_${selectedReimbursementMonth}.csv`, rows);
      addNotification(`已成功匯出核銷月報表 CSV (${selectedReimbursementMonth})`, true);
    });
  }

  updateReimbursementPreview();
}

function updateReimbursementPreview() {
  const previewList = document.getElementById("reimbursementPreviewList");
  const countPill = document.getElementById("reimbursementCount");
  if (!previewList) return;

  const rows = reimbursementRows(selectedReimbursementMonth);
  if (countPill) countPill.textContent = `${rows.length} 筆已完成`;

  if (!rows.length) {
    previewList.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; color: var(--muted); background: var(--surface); border: 1px dashed var(--line); border-radius: 16px; text-align: center; gap: 12px;">
        <span class="material-symbols-outlined" style="font-size: 48px; color: var(--line);">info</span>
        <strong>此月份目前無已完成的接送班次</strong>
        <p class="subtext" style="margin: 0; font-size: 14px;">請先在司機端完成該月份的打卡接送，或切換其他月份查詢。</p>
      </div>
    `;
    return;
  }

  const cardsHtml = rows.map((row) => {
    return `
      <article class="case-card" style="grid-template-columns: 1.2fr 2fr 1.2fr; border-left: 4px solid var(--brand); cursor: default;">
        <div>
          <strong class="person-name" style="font-size: 16px; display: block; margin-bottom: 4px;">${escapeHTML(row._caseName || row["身分證字號"])}</strong>
          <span style="font-size: 13px; color: var(--muted); font-family: monospace;">${escapeHTML(row["身分證字號"])}</span>
        </div>
        <div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; margin-bottom: 4px;">
            <span style="color: var(--brand); font-weight: 700;">${escapeHTML(row["備註"])}</span>
            <span class="count-pill" style="font-size: 11px; padding: 2px 6px;">${escapeHTML(row["BD03、DA01使用-里程數(公里)"])} km</span>
          </div>
          <p style="margin: 0; font-size: 12px; color: var(--muted); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHTML(row["BD03、DA01使用-出發地"])} ➔ ${escapeHTML(row["BD03、DA01使用-目的地"])}">
            ${escapeHTML(row["BD03、DA01使用-出發地"])} ➔ ${escapeHTML(row["BD03、DA01使用-目的地"])}
          </p>
        </div>
        <div style="text-align: right; display: flex; flex-direction: column; justify-content: center; align-items: flex-end;">
          <strong style="color: var(--brand-dark); font-size: 15px;">${escapeHTML(row["服務日期(請輸入7碼)"].substring(0, 3))}年${escapeHTML(row["服務日期(請輸入7碼)"].substring(3, 5))}月${escapeHTML(row["服務日期(請輸入7碼)"].substring(5, 7))}日</strong>
          <span style="font-size: 12px; color: var(--muted); font-family: monospace; display: block; margin-top: 2px;">
            ${String(row["起始時段-小時\n(24小時制)"]).padStart(2, "0")}:${String(row["起始時段-分鐘"]).padStart(2, "0")} - ${String(row["結束時段-小時\n(24小時制)"]).padStart(2, "0")}:${String(row["結束時段-分鐘"]).padStart(2, "0")}
          </span>
        </div>
      </article>
    `;
  }).join("");

  previewList.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${cardsHtml}
    </div>
  `;
}

function renderSchedules(host = document.getElementById("appView")) {
  host.replaceChildren(document.getElementById("schedulesTemplate").content.cloneNode(true));
  renderScheduleManager();
}

function refreshCases() {
  renderCases();
}

function refreshDrivers() {
  renderDrivers();
}

function addNotification(text, success = true) {
  const item = {
    id: uid("notif"),
    text,
    success,
    timestamp: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(item);
  if (notifications.length > 50) {
    notifications = notifications.slice(0, 50);
  }
  try {
    localStorage.setItem("ltc-notifications", JSON.stringify(notifications));
  } catch (e) {
    // Ignore storage quota errors
  }
  setFlash(text, success ? "success" : "error");
  updateNotificationCenter();
}

function updateNotificationCenter() {
  const badge = document.getElementById("notificationBadge");
  const list = document.getElementById("notificationList");
  if (!badge || !list) return;

  const unreadCount = notifications.filter((n) => !n.read).length;
  badge.textContent = unreadCount;
  badge.hidden = unreadCount === 0;

  if (notifications.length === 0) {
    list.innerHTML = '<div class="empty-state">尚無系統通知紀錄。</div>';
    return;
  }

  list.innerHTML = notifications
    .map((n) => {
      const timeStr = new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const statusIcon = n.success ? "check_circle" : "cancel";
      const itemClass = n.success ? "success" : "failure";
      return `
        <div class="notification-item ${itemClass} ${n.read ? "read" : ""}" data-notification-id="${escapeHTML(n.id)}">
          <span class="material-symbols-outlined notification-item-icon" aria-hidden="true">${statusIcon}</span>
          <div class="notification-item-content">
            <p class="notification-item-text">${escapeHTML(n.text)}</p>
            <span class="notification-item-time">${timeStr}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function initNotificationCenter() {
  const bellBtn = document.getElementById("notificationBellBtn");
  const dropdown = document.getElementById("notificationDropdown");
  const clearBtn = document.getElementById("clearAllNotificationsBtn");

  if (!bellBtn || !dropdown || !clearBtn) return;

  bellBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = dropdown.hidden;
    dropdown.hidden = !isHidden;

    if (isHidden) {
      notifications.forEach((n) => {
        n.read = true;
      });
      try {
        localStorage.setItem("ltc-notifications", JSON.stringify(notifications));
      } catch (err) {}
      updateNotificationCenter();
    }
  });

  clearBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    notifications = [];
    try {
      localStorage.setItem("ltc-notifications", JSON.stringify(notifications));
    } catch (err) {}
    updateNotificationCenter();
    dropdown.hidden = true;
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.hidden && !dropdown.contains(e.target) && e.target !== bellBtn && !bellBtn.contains(e.target)) {
      dropdown.hidden = true;
    }
  });
}

function setFlash(message, tone = "success", scope = "global") {
  flashMessage = message;
  flashTone = tone;
  flashScope = scope;
  renderFlash();
}

function renderFlash() {
  const toast = document.getElementById("appToast");
  if (toast) {
    toast.hidden = !flashMessage;
    toast.textContent = flashMessage;
    toast.className = `app-toast ${flashTone}`;
  }
  renderInlineNotice("caseNotice");
  renderInlineNotice("driverNotice");
}

function renderInlineNotice(id) {
  const notice = document.getElementById(id);
  if (!notice) return;
  const noticeScope = id === "caseNotice" ? "cases" : "drivers";
  const visible = Boolean(flashMessage) && (flashScope === "global" || flashScope === noticeScope);
  notice.hidden = !visible;
  notice.textContent = flashMessage;
  notice.className = `inline-notice ${flashTone}`;
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

function renderHome() {
  const host = document.getElementById("appView");
  host.replaceChildren(document.getElementById("homeTemplate").content.cloneNode(true));

  document.getElementById("openCoordinatorEntryBtn").addEventListener("click", () => {
    requestView("dashboard");
  });
  document.getElementById("openDriverEntryBtn").addEventListener("click", () => {
    requestView("driver");
  });
}

function logoutCoordinator() {
  coordinatorUnlocked = false;
  coordinatorPasscode = "";
  pendingProtectedView = "";
  sessionStorage.removeItem(COORDINATOR_SESSION_KEY);
  sessionStorage.removeItem(COORDINATOR_PASSCODE_KEY);
  activeView = "home";
  addNotification("承辦人已登出", true);
  render();
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
      addNotification("承辦人登入失敗：密碼錯誤", false);
      return;
    }

    coordinatorUnlocked = true;
    coordinatorPasscode = passcode;
    sessionStorage.setItem(COORDINATOR_SESSION_KEY, "true");
    sessionStorage.setItem(COORDINATOR_PASSCODE_KEY, passcode);
    activeView = pendingProtectedView || "dashboard";
    addNotification("承辦人登入成功", true);
    render();
  });

  document.getElementById("goDriverPortalBtn").addEventListener("click", () => {
    requestView("driver");
  });
}

function renderDashboard() {
  const host = document.getElementById("appView");
  host.replaceChildren(document.getElementById("dashboardTemplate").content.cloneNode(true));

  if (dataMode !== "supabase") {
    syncLocalSchedulesForDate(state.serviceDate);
  }

  const trips = todayTrips();
  const stats = {
    total: trips.length,
    scheduled: trips.filter((trip) => getTripStatus(trip) === "scheduled").length,
    picked_up: trips.filter((trip) => getTripStatus(trip) === "picked_up").length,
    completed: trips.filter((trip) => getTripStatus(trip) === "completed").length,
    late: trips.filter((trip) => getTripStatus(trip) === "late").length,
  };

  document.getElementById("summaryGrid").innerHTML = [
    summaryCard("班表接送", stats.total, "全部班次", "", "event_available"),
    summaryCard("待接", stats.scheduled, "尚未上車", "waiting", "pending_actions"),
    summaryCard("接送中", stats.picked_up, "已接到未送達", "moving", "directions_car"),
    summaryCard("可能延遲", stats.late, "逾預定 10 分鐘", "alert", "warning"),
  ].join("");

  const serviceDatePicker = document.getElementById("serviceDatePicker");
  serviceDatePicker.value = state.serviceDate || todayKey();
  serviceDatePicker.addEventListener("change", (event) => {
    setServiceDate(event.target.value);
  });

  document.getElementById("mapDriverCount").textContent = `${state.drivers.length} 位司機`;
  initOrUpdateLeafletMap();

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

  board.addEventListener("click", (event) => {
    const btn = event.target.closest(".delete-trip-btn");
    if (!btn) return;
    const tripId = btn.dataset.tripId;
    const trip = state.trips.find((item) => item.id === tripId);
    if (!trip) return;
    const person = getCase(trip.caseId);
    const caseName = person ? person.name : "此接送";
    if (!window.confirm(`確定刪除個案「${caseName}」今日的這筆接送班次？`)) return;

    if (dataMode === "supabase") {
      apiAction("delete_trip", { tripId })
        .then(() => {
          addNotification(`已刪除「${caseName}」今日的接送班次`, true);
          renderDashboard();
        })
        .catch((error) => {
          dataMessage = `刪除失敗：${error.message}`;
          addNotification(`刪除失敗：${error.message}`, false);
          renderDashboard();
        });
      return;
    }
    state.trips = state.trips.filter((item) => item.id !== tripId);
    saveState();
    addNotification(`已刪除「${caseName}」今日的接送班次`, true);
    renderDashboard();
  });
}

function scheduleDaysText(schedule) {
  if (schedule.scheduleType === "single") {
    return schedule.serviceDate ? `單次 · ${schedule.serviceDate}` : "單次 · 未定日期";
  }
  const days = (schedule.daysOfWeek || []).map((day) => weekdayLabels[day]).join("、") || "未選";
  return `每週 · ${days}${schedule.startDate ? ` · ${schedule.startDate}` : ""}${schedule.endDate ? ` 至 ${schedule.endDate}` : ""}`;
}

function scheduleCard(schedule) {
  const caseItem = getCase(schedule.caseId);
  const driverItem = getDriver(schedule.driverId);
  const selected = schedule.id === selectedScheduleId;
  const overrideCount = (schedule.dateOverrides || []).length;
  const statusClass = schedule.status === "paused" ? "waiting" : schedule.status === "stopped" ? "alert" : "done";
  const actions = selected
    ? `
      <div class="task-actions case-actions-panel" aria-label="${escapeHTML(caseItem?.name || "排程")} 操作選項">
        <button class="primary-btn" type="button" data-schedule-action="edit" data-schedule-id="${escapeHTML(schedule.id)}">
          <span class="material-symbols-outlined" aria-hidden="true">edit</span>
          編輯
        </button>
        <button class="ghost-btn" type="button" data-schedule-action="toggle" data-schedule-id="${escapeHTML(schedule.id)}">
          <span class="material-symbols-outlined" aria-hidden="true">${schedule.status === "active" ? "pause" : "play_arrow"}</span>
          ${schedule.status === "active" ? "暫停" : "恢復"}
        </button>
        <button class="secondary-btn" type="button" data-schedule-action="override" data-schedule-id="${escapeHTML(schedule.id)}">
          <span class="material-symbols-outlined" aria-hidden="true">rule</span>
          例外變更
        </button>
        <button class="danger-btn" type="button" data-schedule-action="stop" data-schedule-id="${escapeHTML(schedule.id)}">
          <span class="material-symbols-outlined" aria-hidden="true">stop_circle</span>
          提前停止
        </button>
        <button class="danger-btn" type="button" data-schedule-action="delete" data-schedule-id="${escapeHTML(schedule.id)}">
          <span class="material-symbols-outlined" aria-hidden="true">delete</span>
          刪除
        </button>
      </div>
    `
    : `
      <div class="case-card-hint">點選排程顯示操作</div>
    `;

  return `
    <article class="case-card ${selected ? "selected" : ""}" data-schedule-id="${escapeHTML(schedule.id)}" tabindex="0">
      <div>
        <div class="case-title-row">
          <strong>${escapeHTML(caseItem?.name || "未選個案")}</strong>
          <span class="status-pill ${statusClass}">${escapeHTML(scheduleStatusText(schedule))}</span>
        </div>
        <p class="subtext">${escapeHTML(scheduleDaysText(schedule))}</p>
        <p class="subtext">司機：${escapeHTML(driverItem?.name || "未選")} · ${escapeHTML(driverItem?.vehicleNo || "")}</p>
        <p class="subtext">上車 ${escapeHTML(schedule.scheduledPickup)} · 送達 ${escapeHTML(schedule.scheduledDropoff)}</p>
      </div>
      <div>
        <p class="subtext">目的地：${escapeHTML(schedule.destinationAddress || "未填")}</p>
        <p class="subtext">服務項目：${escapeHTML(schedule.purpose || "未填")}</p>
        <p class="subtext">特殊需求：${escapeHTML(schedule.specialRequirements || "無")}</p>
        <p class="subtext">例外變更：${overrideCount} 筆</p>
      </div>
      ${actions}
    </article>
  `;
}

function updateScheduleFormMode() {
  const form = document.getElementById("scheduleForm");
  if (!form) return;
  const scheduleType = form.elements.scheduleType?.value || "single";
  const singleLabel = form.elements.serviceDate?.closest("label");
  const startLabel = form.elements.startDate?.closest("label");
  const endLabel = form.elements.endDate?.closest("label");
  const weekdayFieldset = form.querySelector(".weekday-fieldset");
  if (singleLabel) singleLabel.hidden = scheduleType !== "single";
  if (startLabel) startLabel.hidden = scheduleType !== "weekly";
  if (endLabel) endLabel.hidden = scheduleType !== "weekly";
  if (weekdayFieldset) weekdayFieldset.hidden = scheduleType !== "weekly";
}

function fillScheduleForm(scheduleId = "", defaultCaseId = "") {
  const schedule = state.schedules.find((item) => item.id === scheduleId);
  const form = document.getElementById("scheduleForm");
  if (!form) return;
  if (!schedule) {
    form.reset();
    form.elements.id.value = "";
    form.elements.scheduleType.value = "single";
    form.elements.serviceDate.value = state.serviceDate || todayKey();
    form.elements.startDate.value = state.serviceDate || todayKey();
    form.elements.endDate.value = "";
    [...form.querySelectorAll('input[name="daysOfWeek"]')].forEach((item) => {
      const val = Number(item.value);
      item.checked = val >= 1 && val <= 5;
    });
    form.elements.scheduledPickup.value = "07:00";
    form.elements.scheduledDropoff.value = "07:30";
    form.elements.caseId.value = defaultCaseId || "";
    form.elements.driverId.value = "";
    const currentCaseId = form.elements.caseId.value;
    const caseObj = state.cases.find((c) => c.id === currentCaseId);
    if (caseObj) {
      form.elements.pickupAddress.value = caseObj.pickupAddress || "";
      form.elements.destinationAddress.value = caseObj.destinationAddress || "";
    } else {
      form.elements.pickupAddress.value = "";
      form.elements.destinationAddress.value = "";
    }
    form.elements.purpose.value = "";
    form.elements.specialRequirements.value = "";
    document.getElementById("scheduleFormMode").textContent = "新增排程";
    document.getElementById("scheduleSubmitBtn").textContent = "＋ 新增排程";
    updateScheduleFormMode();
    return;
  }

  form.elements.id.value = schedule.id;
  form.elements.caseId.value = schedule.caseId;
  form.elements.driverId.value = schedule.driverId;
  form.elements.scheduleType.value = schedule.scheduleType || "single";
  form.elements.serviceDate.value = schedule.serviceDate || state.serviceDate || todayKey();
  form.elements.startDate.value = schedule.startDate || state.serviceDate || todayKey();
  form.elements.endDate.value = schedule.endDate || "";
  [...form.querySelectorAll('input[name="daysOfWeek"]')].forEach((item) => {
    item.checked = (schedule.daysOfWeek || []).includes(Number(item.value));
  });
  form.elements.scheduledPickup.value = schedule.scheduledPickup || "09:00";
  form.elements.scheduledDropoff.value = schedule.scheduledDropoff || "09:30";
  form.elements.pickupAddress.value = schedule.pickupAddress || "";
  form.elements.destinationAddress.value = schedule.destinationAddress || "";
  form.elements.purpose.value = schedule.purpose || "";
  form.elements.specialRequirements.value = schedule.specialRequirements || "";
  document.getElementById("scheduleFormMode").textContent = "編輯排程";
  document.getElementById("scheduleSubmitBtn").textContent = "💾 儲存排程";
  updateScheduleFormMode();
}

function fillScheduleOverrideForm(scheduleId = "") {
  const schedule = state.schedules.find((item) => item.id === scheduleId) || state.schedules.find((item) => item.id === selectedScheduleId);
  const form = document.getElementById("scheduleOverrideForm");
  if (!form) return;
  if (!schedule) {
    form.reset();
    form.elements.scheduleId.value = "";
    form.elements.serviceDate.value = state.serviceDate || todayKey();
    form.elements.overrideDriverId.value = "";
    form.elements.overridePickupTime.value = "";
    form.elements.overrideDropoffTime.value = "";
    form.elements.overrideDestinationAddress.value = "";
    form.elements.overridePurpose.value = "";
    form.elements.specialRequirements.value = "";
    form.elements.cancelService.checked = false;
    document.getElementById("scheduleOverrideMode").textContent = "例外變更";
    return;
  }

  form.elements.scheduleId.value = schedule.id;
  const currentOverride = getScheduleOverride(schedule, state.serviceDate || todayKey());
  form.elements.serviceDate.value = currentOverride?.serviceDate || state.serviceDate || todayKey();
  form.elements.overrideDriverId.value = currentOverride?.overrideDriverId || schedule.driverId || "";
  form.elements.overridePickupTime.value = currentOverride?.overridePickupTime || schedule.scheduledPickup || "";
  form.elements.overrideDropoffTime.value = currentOverride?.overrideDropoffTime || schedule.scheduledDropoff || "";
  form.elements.overrideDestinationAddress.value = currentOverride?.overrideDestinationAddress || schedule.destinationAddress || "";
  form.elements.overridePurpose.value = currentOverride?.overridePurpose || schedule.purpose || "";
  form.elements.specialRequirements.value = currentOverride?.specialRequirements || schedule.specialRequirements || "";
  form.elements.cancelService.checked = Boolean(currentOverride?.cancelService);
  document.getElementById("scheduleOverrideMode").textContent = `${schedule.caseId ? getCase(schedule.caseId)?.name || "排程" : "排程"} 的例外變更`;
}

function renderScheduleManager() {
  const list = document.getElementById("scheduleList");
  if (!list) return;

  if (editingScheduleId && !state.schedules.some((item) => item.id === editingScheduleId)) {
    editingScheduleId = "";
  }
  if (selectedScheduleId && !state.schedules.some((item) => item.id === selectedScheduleId)) {
    selectedScheduleId = "";
  }

  document.getElementById("scheduleCount").textContent = `${state.schedules.length} 筆排程`;
  list.innerHTML = state.schedules.length
    ? state.schedules.map(scheduleCard).join("")
    : '<div class="empty-state">目前還沒有排程，先新增單次或週期班次。</div>';

  const caseSelect = document.getElementById("scheduleCaseSelect");
  const driverSelect = document.getElementById("scheduleDriverSelect");
  const overrideDriverSelect = document.getElementById("scheduleOverrideDriverSelect");
  const caseOptions = `<option value="">-- 請選擇個案 --</option>` + state.cases
    .filter((person) => person.active)
    .map((person) => `<option value="${escapeHTML(person.id)}">${escapeHTML(person.name)} · ${escapeHTML(person.caseNo)}</option>`)
    .join("");
  const driverOptions = `<option value="">-- 請選擇司機 --</option>` + state.drivers
    .filter((driver) => driver.active)
    .map((driver) => `<option value="${escapeHTML(driver.id)}">${escapeHTML(driver.name)} · ${escapeHTML(driver.vehicleNo)}</option>`)
    .join("");
  if (caseSelect) {
    caseSelect.innerHTML = caseOptions;
    caseSelect.addEventListener("change", (e) => {
      if (!editingScheduleId) {
        const selectedCaseId = e.target.value;
        const caseObj = state.cases.find((c) => c.id === selectedCaseId);
        const form = document.getElementById("scheduleForm");
        if (form) {
          if (caseObj) {
            form.elements.pickupAddress.value = caseObj.pickupAddress || "";
            form.elements.destinationAddress.value = caseObj.destinationAddress || "";
          } else {
            form.elements.pickupAddress.value = "";
            form.elements.destinationAddress.value = "";
          }
        }
      }
    });
  }
  if (driverSelect) driverSelect.innerHTML = driverOptions;
  if (overrideDriverSelect) overrideDriverSelect.innerHTML = `<option value="">不變更</option>${driverOptions}`;
  
  const driverSelectReturn = document.getElementById("scheduleDriverSelectReturn");
  if (driverSelectReturn) driverSelectReturn.innerHTML = driverOptions;

  const hasReturnTripCheckbox = document.getElementById("hasReturnTripCheckbox");
  if (hasReturnTripCheckbox) {
    hasReturnTripCheckbox.addEventListener("change", (e) => {
      const returnFields = document.getElementById("scheduleReturnFields");
      if (returnFields) {
        returnFields.style.display = e.target.checked ? "grid" : "none";
      }
    });
  }

  const enableReturnTripRow = document.getElementById("enableReturnTripRow");
  if (enableReturnTripRow) {
    enableReturnTripRow.style.display = editingScheduleId ? "none" : "flex";
  }

  if (editingScheduleId) {
    if (hasReturnTripCheckbox) hasReturnTripCheckbox.checked = false;
    const returnFields = document.getElementById("scheduleReturnFields");
    if (returnFields) returnFields.style.display = "none";
  } else {
    // When creating a new schedule, make sure fields are initialized properly
    if (hasReturnTripCheckbox && !hasReturnTripCheckbox.checked) {
      const returnFields = document.getElementById("scheduleReturnFields");
      if (returnFields) returnFields.style.display = "none";
    }
  }

  const formPanel = document.getElementById("scheduleFormPanel");
  const overridePanel = document.getElementById("scheduleOverridePanel");
  const isScheduleFormOpen = scheduleFormOpen || Boolean(editingScheduleId);
  formPanel.hidden = !isScheduleFormOpen;
  overridePanel.hidden = !scheduleOverrideOpen;
  if (editingScheduleId) fillScheduleForm(editingScheduleId);
  if (selectedScheduleId) fillScheduleOverrideForm(selectedScheduleId);
  if (!editingScheduleId && !scheduleFormOpen) fillScheduleForm("");
  if (!selectedScheduleId) fillScheduleOverrideForm("");

  document.getElementById("openScheduleFormBtn").addEventListener("click", () => {
    editingScheduleId = "";
    scheduleFormOpen = true;
    selectedScheduleId = "";
    refreshSchedulesView();
  });

  document.getElementById("scheduleForm").addEventListener("submit", handleScheduleSubmit);
  document.getElementById("scheduleCancelBtn").addEventListener("click", () => {
    editingScheduleId = "";
    scheduleFormOpen = false;
    refreshSchedulesView();
  });
  document.getElementById("scheduleTypeSelect").addEventListener("change", updateScheduleFormMode);
  document.getElementById("scheduleList").addEventListener("click", handleScheduleAction);
  document.getElementById("scheduleOverrideForm").addEventListener("submit", handleScheduleOverrideSubmit);
  document.getElementById("scheduleOverrideCancelBtn").addEventListener("click", () => {
    scheduleOverrideOpen = false;
    selectedScheduleId = "";
    refreshSchedulesView();
  });

  const scheduleFormCloseBtn = document.getElementById("scheduleFormCloseBtn");
  if (scheduleFormCloseBtn) {
    scheduleFormCloseBtn.addEventListener("click", () => {
      document.getElementById("scheduleCancelBtn").click();
    });
  }

  const scheduleOverrideCloseBtn = document.getElementById("scheduleOverrideCloseBtn");
  if (scheduleOverrideCloseBtn) {
    scheduleOverrideCloseBtn.addEventListener("click", () => {
      document.getElementById("scheduleOverrideCancelBtn").click();
    });
  }
}

function scheduleFormPayload(form) {
  const daysOfWeek = [...new Set(form.getAll("daysOfWeek").map((value) => Number(value)).filter((value) => Number.isInteger(value)))].sort((a, b) => a - b);
  return {
    id: String(form.get("id") || "").trim(),
    caseId: String(form.get("caseId") || "").trim(),
    driverId: String(form.get("driverId") || "").trim(),
    scheduleType: String(form.get("scheduleType") || "single"),
    serviceDate: String(form.get("serviceDate") || "").trim(),
    startDate: String(form.get("startDate") || "").trim(),
    endDate: String(form.get("endDate") || "").trim(),
    daysOfWeek,
    scheduledPickup: String(form.get("scheduledPickup") || "").trim(),
    scheduledDropoff: String(form.get("scheduledDropoff") || "").trim(),
    pickupAddress: String(form.get("pickupAddress") || "").trim(),
    destinationAddress: String(form.get("destinationAddress") || "").trim(),
    purpose: String(form.get("purpose") || "").trim(),
    specialRequirements: String(form.get("specialRequirements") || "").trim(),
    status: "active",
    stopReason: "",
    dateOverrides: state.schedules.find((item) => item.id === String(form.get("id") || "").trim())?.dateOverrides || [],
  };
}

function validateSchedulePayload(schedule) {
  if (!schedule.caseId || !schedule.driverId) return "請先選擇個案與司機。";
  if (schedule.scheduleType === "single" && !schedule.serviceDate) return "單次排程請填單次日期。";
  if (schedule.scheduleType === "weekly" && !schedule.daysOfWeek.length) return "週期排程至少要選一個星期。";
  if (schedule.scheduleType === "weekly" && !schedule.startDate) return "週期排程請填起始日期。";
  if (!schedule.scheduledPickup) return "請填預定上車時間。";
  if (!schedule.destinationAddress) return "請填目的地。";
  return "";
}

async function handleScheduleSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const schedule = scheduleFormPayload(form);
  const editingId = schedule.id;
  const nextScheduleId = editingId || uid("sch");
  const duplicate = validateSchedulePayload(schedule);
  if (duplicate) {
    addNotification(`排程儲存失敗：${duplicate}`, false);
    return;
  }

  if (dataMode === "supabase") {
    try {
      await apiAction(editingId ? "update_schedule" : "create_schedule", {
        schedule: { ...schedule, id: nextScheduleId },
        serviceDate: state.serviceDate,
      });

      if (!editingId && form.get("hasReturnTrip")) {
        const nextScheduleReturnId = uid("sch");
        const nextScheduleReturn = {
          id: nextScheduleReturnId,
          caseId: schedule.caseId,
          driverId: String(form.get("driverIdReturn")) || schedule.driverId,
          scheduleType: schedule.scheduleType,
          serviceDate: schedule.serviceDate,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          daysOfWeek: schedule.daysOfWeek,
          scheduledPickup: String(form.get("scheduledPickupReturn")) || "16:00",
          scheduledDropoff: String(form.get("scheduledDropoffReturn")) || "16:30",
          pickupAddress: schedule.destinationAddress || getCase(schedule.caseId)?.destinationAddress || "",
          destinationAddress: schedule.pickupAddress || getCase(schedule.caseId)?.pickupAddress || "",
          purpose: String(form.get("purposeReturn")) || "回程接送",
          specialRequirements: schedule.specialRequirements,
          status: "active",
          stopReason: "",
          dateOverrides: [],
        };
        await apiAction("create_schedule", {
          schedule: nextScheduleReturn,
          serviceDate: state.serviceDate,
        });
      }

      editingScheduleId = "";
      scheduleFormOpen = false;
      selectedScheduleId = nextScheduleId;
      addNotification(`${editingId ? "已更新" : "已新增"}排程成功`, true);
      refreshDashboardAfterScheduleChange();
    } catch (error) {
      addNotification(`排程儲存失敗：${error.message}`, false);
    }
    return;
  }

  const nextSchedule = {
    ...schedule,
    id: nextScheduleId,
  };
  if (editingId) {
    state.schedules = state.schedules.map((item) => (item.id === editingId ? nextSchedule : item));
  } else {
    state.schedules.push(nextSchedule);

    if (form.get("hasReturnTrip")) {
      const nextScheduleReturn = {
        id: uid("sch"),
        caseId: schedule.caseId,
        driverId: String(form.get("driverIdReturn")) || schedule.driverId,
        scheduleType: schedule.scheduleType,
        serviceDate: schedule.serviceDate,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        daysOfWeek: schedule.daysOfWeek,
        scheduledPickup: String(form.get("scheduledPickupReturn")) || "16:00",
        scheduledDropoff: String(form.get("scheduledDropoffReturn")) || "16:30",
        pickupAddress: schedule.destinationAddress || getCase(schedule.caseId)?.destinationAddress || "",
        destinationAddress: schedule.pickupAddress || getCase(schedule.caseId)?.pickupAddress || "",
        purpose: String(form.get("purposeReturn")) || "回程接送",
        specialRequirements: schedule.specialRequirements,
        status: "active",
        stopReason: "",
        dateOverrides: [],
      };
      state.schedules.push(nextScheduleReturn);
    }
  }
  editingScheduleId = "";
  scheduleFormOpen = false;
  selectedScheduleId = nextSchedule.id;
  syncLocalSchedulesForDate(state.serviceDate);
  saveState();
  addNotification(`${editingId ? "已更新" : "已新增"}排程成功`, true);
  refreshSchedulesView();
}

function refreshSchedulesView() {
  if (activeView === "schedules") {
    renderSchedules();
  } else {
    renderDashboard();
  }
}

function refreshDashboardAfterScheduleChange() {
  if (dataMode !== "supabase") {
    syncLocalSchedulesForDate(state.serviceDate);
    saveState();
  }
  refreshSchedulesView();
}

function scheduleOverridePayload(form) {
  return {
    scheduleId: String(form.get("scheduleId") || "").trim(),
    serviceDate: String(form.get("serviceDate") || "").trim(),
    overrideDriverId: String(form.get("overrideDriverId") || "").trim(),
    overridePickupTime: String(form.get("overridePickupTime") || "").trim(),
    overrideDropoffTime: String(form.get("overrideDropoffTime") || "").trim(),
    overrideDestinationAddress: String(form.get("overrideDestinationAddress") || "").trim(),
    overridePurpose: String(form.get("overridePurpose") || "").trim(),
    specialRequirements: String(form.get("specialRequirements") || "").trim(),
    cancelService: Boolean(form.get("cancelService")),
    note: "",
  };
}

async function handleScheduleOverrideSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const override = scheduleOverridePayload(form);
  if (!override.scheduleId || !override.serviceDate) {
    addNotification("例外變更失敗：請先選擇排程與日期。", false);
    return;
  }

  if (dataMode === "supabase") {
    try {
      await apiAction("create_schedule_override", {
        scheduleId: override.scheduleId,
        override,
        serviceDate: state.serviceDate,
      });
      selectedScheduleId = override.scheduleId;
      scheduleOverrideOpen = true;
      addNotification("已儲存例外變更", true);
      refreshDashboardAfterScheduleChange();
    } catch (error) {
      addNotification(`例外變更失敗：${error.message}`, false);
    }
    return;
  }

  const schedule = state.schedules.find((item) => item.id === override.scheduleId);
  if (!schedule) return;
  const nextOverride = {
    serviceDate: override.serviceDate,
    overrideDriverId: override.overrideDriverId,
    overridePickupTime: override.overridePickupTime,
    overrideDropoffTime: override.overrideDropoffTime,
    overrideDestinationAddress: override.overrideDestinationAddress,
    overridePurpose: override.overridePurpose,
    specialRequirements: override.specialRequirements,
    cancelService: override.cancelService,
    note: override.note || "",
  };
  schedule.dateOverrides = normalizeScheduleOverrides([...(schedule.dateOverrides || []).filter((item) => item.serviceDate !== override.serviceDate), nextOverride]);
  selectedScheduleId = schedule.id;
  scheduleOverrideOpen = true;
  syncLocalSchedulesForDate(state.serviceDate);
  saveState();
  addNotification("已儲存例外變更", true);
  refreshSchedulesView();
}

async function handleScheduleAction(event) {
  if (event.target.closest("a")) return;
  const button = event.target.closest("button[data-schedule-action]");
  if (!button) {
    const card = event.target.closest(".case-card[data-schedule-id]");
    if (!card) return;
    selectedScheduleId = card.dataset.scheduleId === selectedScheduleId ? "" : card.dataset.scheduleId;
    editingScheduleId = "";
    scheduleFormOpen = false;
    scheduleOverrideOpen = false;
    refreshSchedulesView();
    return;
  }

  const schedule = state.schedules.find((item) => item.id === button.dataset.scheduleId);
  if (!schedule) return;
  selectedScheduleId = schedule.id;

  if (button.dataset.scheduleAction === "edit") {
    editingScheduleId = schedule.id;
    scheduleFormOpen = true;
    scheduleOverrideOpen = false;
    refreshSchedulesView();
    return;
  }

  if (button.dataset.scheduleAction === "override") {
    scheduleOverrideOpen = true;
    refreshSchedulesView();
    return;
  }

  if (button.dataset.scheduleAction === "toggle") {
    const nextStatus = schedule.status === "active" ? "paused" : "active";
    if (dataMode === "supabase") {
      try {
        await apiAction("toggle_schedule", {
          scheduleId: schedule.id,
          status: nextStatus,
          endDate: nextStatus === "active" ? "" : schedule.endDate || "",
          serviceDate: state.serviceDate,
        });
        addNotification(`排程狀態已切換為 ${nextStatus === "active" ? "啟用中" : "已暫停"}`, true);
        refreshDashboardAfterScheduleChange();
      } catch (error) {
        addNotification(`排程狀態切換失敗：${error.message}`, false);
      }
      return;
    }
    schedule.status = nextStatus;
    if (nextStatus === "active") {
      schedule.endDate = "";
      schedule.stopReason = "";
    }
    syncLocalSchedulesForDate(state.serviceDate);
    saveState();
    addNotification(`排程狀態已切換為 ${nextStatus === "active" ? "啟用中" : "已暫停"}`, true);
    refreshSchedulesView();
    return;
  }

  if (button.dataset.scheduleAction === "stop") {
    if (!window.confirm(`確定提前停止 ${getCase(schedule.caseId)?.name || "這筆排程"}？`)) return;
    const nextEndDate = state.serviceDate || todayKey();
    if (dataMode === "supabase") {
      try {
        await apiAction("toggle_schedule", { scheduleId: schedule.id, status: "stopped", endDate: nextEndDate, serviceDate: state.serviceDate });
        addNotification("排程已提前停止", true);
        refreshDashboardAfterScheduleChange();
      } catch (error) {
        addNotification(`排程提前停止失敗：${error.message}`, false);
      }
      return;
    }
    schedule.status = "stopped";
    schedule.endDate = nextEndDate;
    syncLocalSchedulesForDate(state.serviceDate);
    saveState();
    addNotification("排程已提前停止", true);
    refreshSchedulesView();
    return;
  }

  if (button.dataset.scheduleAction === "delete") {
    if (!window.confirm("確定刪除這筆排程？")) return;
    if (dataMode === "supabase") {
      try {
        await apiAction("delete_schedule", { scheduleId: schedule.id, serviceDate: state.serviceDate });
        selectedScheduleId = "";
        scheduleOverrideOpen = false;
        addNotification("排程已刪除", true);
        refreshDashboardAfterScheduleChange();
      } catch (error) {
        addNotification(`排程刪除失敗：${error.message}`, false);
      }
      return;
    }
    state.schedules = state.schedules.filter((item) => item.id !== schedule.id);
    state.trips = state.trips.filter((trip) => trip.scheduleId !== schedule.id);
    selectedScheduleId = "";
    scheduleOverrideOpen = false;
    saveState();
    addNotification("排程已刪除", true);
    refreshSchedulesView();
  }
}

// Persistent Leaflet map variables to survive dashboard DOM replacement
let leafletMapInstance = null;
let leafletMapCanvas = null;
let leafletMarkersGroup = null;
let leafletRoutesGroup = null;
let hasInitialFit = false;

// We hook requestView to reset hasInitialFit so when they switch views and come back, we fit bounds again
const originalRequestView = requestView;
requestView = function(view) {
  if (view !== "dashboard") {
    hasInitialFit = false;
  }
  originalRequestView(view);
};

function initOrUpdateLeafletMap() {
  const container = document.getElementById("liveMap");
  if (!container) return;

  // Initialize leaflet components if not done yet
  if (!leafletMapInstance) {
    leafletMapCanvas = document.createElement("div");
    leafletMapCanvas.id = "leafletMapCanvas";
    leafletMapCanvas.style.width = "100%";
    leafletMapCanvas.style.height = "100%";
    leafletMapCanvas.style.position = "absolute";
    leafletMapCanvas.style.inset = "0";
    leafletMapCanvas.style.zIndex = "1";

    // Create Leaflet instance
    leafletMapInstance = L.map(leafletMapCanvas, {
      zoomControl: false,
      attributionControl: false,
      center: [25.0394, 121.5205],
      zoom: 12
    });

    // Use Google Maps tile layer
    L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"]
    }).addTo(leafletMapInstance);

    leafletMarkersGroup = L.layerGroup().addTo(leafletMapInstance);
    leafletRoutesGroup = L.layerGroup().addTo(leafletMapInstance);

    // Update custom zoom controls scale percentage when map zoom changes
    leafletMapInstance.on("zoomend", () => {
      const zoomLabel = document.querySelector(".map-zoom-label");
      if (zoomLabel) {
        const scalePct = Math.round((leafletMapInstance.getZoom() / 12) * 100);
        zoomLabel.textContent = `${scalePct}%`;
      }
    });

    // Automatically adjust map rendering size whenever its container resizes (e.g. during sidebar toggle animations)
    const resizeObserver = new ResizeObserver(() => {
      if (leafletMapInstance) {
        leafletMapInstance.invalidateSize();
      }
    });
    resizeObserver.observe(leafletMapCanvas);
  }

  // Clear container and append the map canvas
  container.innerHTML = "";
  container.appendChild(leafletMapCanvas);

  // Add the controls & help HTML
  const controlsDiv = document.createElement("div");
  controlsDiv.className = "map-controls";
  controlsDiv.setAttribute("aria-label", "地圖縮放控制");
  
  const scalePct = Math.round((leafletMapInstance.getZoom() / 12) * 100);
  controlsDiv.innerHTML = `
    <button class="map-control-btn" type="button" data-map-action="zoom-out" aria-label="縮小地圖">−</button>
    <output class="map-zoom-label" aria-label="目前縮放倍率">${scalePct}%</output>
    <button class="map-control-btn" type="button" data-map-action="zoom-in" aria-label="放大地圖">+</button>
    <button class="map-reset-btn" type="button" data-map-action="reset">重設</button>
  `;
  container.appendChild(controlsDiv);

  const helpDiv = document.createElement("div");
  helpDiv.className = "map-help";
  helpDiv.textContent = "拖曳平移 · 滾輪縮放 · 縮小可看全體司機";
  container.appendChild(helpDiv);

  // Bind controls event listeners
  controlsDiv.addEventListener("click", (event) => {
    const action = event.target.closest("[data-map-action]")?.dataset.mapAction;
    if (!action) return;
    if (action === "zoom-in") {
      leafletMapInstance.zoomIn();
    } else if (action === "zoom-out") {
      leafletMapInstance.zoomOut();
    } else if (action === "reset") {
      fitAllMapBounds(true);
    }
  });

  // Schedule size invalidation to run after the browser handles layout
  setTimeout(() => {
    leafletMapInstance.invalidateSize();
  }, 0);

  // Update data layers
  updateLeafletData();
}

function updateLeafletData() {
  if (!leafletMapInstance) return;

  leafletMarkersGroup.clearLayers();
  leafletRoutesGroup.clearLayers();

  const allPoints = [];

  // 1. Draw driver markers
  state.drivers.forEach((driver) => {
    const location = state.driverLocations[driver.id] ?? {
      ...driver.homeLocation,
      updatedAt: "",
      eventType: "heartbeat",
    };
    if (location && location.lat && location.lng) {
      const latVal = Number(location.lat);
      const lngVal = Number(location.lng);
      allPoints.push([latVal, lngVal]);

      const status = getDriverLiveStatus(driver.id);
      const html = `
        <div class="driver-marker-leaflet-inner">
          <button
            class="map-marker ${escapeHTML(status)}"
            type="button"
            title="${escapeHTML(driver.name)} ${escapeHTML(formatCoordinate(location))}"
          >
            <span>${escapeHTML(driver.name.slice(0, 1))}</span>
          </button>
          <div class="map-label">
            <strong>${escapeHTML(driver.name)}</strong>
            <span>${escapeHTML(eventLabels[location.eventType] ?? "目前位置")} · ${escapeHTML(formatEventTime(location.updatedAt))}</span>
          </div>
        </div>
      `;

      const marker = L.marker([latVal, lngVal], {
        icon: L.divIcon({
          className: "driver-marker-leaflet",
          html: html,
          iconSize: [42, 42],
          iconAnchor: [21, 21]
        })
      });
      marker.addTo(leafletMarkersGroup);
    }
  });

  // 2. Draw trip routes
  const activeTrips = todayTrips().filter((trip) => getTripStatus(trip) !== "completed");
  activeTrips.forEach((trip) => {
    const person = getCase(trip.caseId);
    const driver = getDriver(trip.driverId);
    if (!person || !driver) return;

    const pickup = trip.pickupLocation ?? caseCoordinate(trip.caseId, "pickup");
    const destination = trip.dropoffLocation ?? caseCoordinate(trip.caseId, "destination");
    const driverLocation = state.driverLocations[trip.driverId];
    const status = getTripStatus(trip);

    const start = status === "picked_up" && driverLocation ? driverLocation : pickup;
    const end = destination;

    if (start && start.lat && start.lng && end && end.lat && end.lng) {
      const startLatLng = [Number(start.lat), Number(start.lng)];
      const endLatLng = [Number(end.lat), Number(end.lng)];

      allPoints.push(startLatLng);
      allPoints.push(endLatLng);

      const strokeClass = status === "picked_up" ? "active" : status === "late" ? "late" : "scheduled";

      // Draw polyline
      const polyline = L.polyline([startLatLng, endLatLng], {
        className: `route-line ${strokeClass}`,
        color: status === "picked_up" ? "#168052" : status === "late" ? "#be3f36" : "#2764a5",
        weight: status === "picked_up" ? 3.5 : 2.5,
        dashArray: status === "picked_up" ? null : "4, 4"
      });
      polyline.addTo(leafletRoutesGroup);

      // Draw start circle marker
      const startDot = L.circleMarker(startLatLng, {
        className: "route-dot start",
        radius: 5.5,
        fillColor: "#ffffff",
        fillOpacity: 1,
        color: "rgba(23, 33, 43, 0.4)",
        weight: 1.5
      });
      startDot.addTo(leafletRoutesGroup);

      // Draw end circle marker
      const endDot = L.circleMarker(endLatLng, {
        className: "route-dot end",
        radius: 5.5,
        fillColor: "#fbc02d",
        fillOpacity: 1,
        color: "rgba(23, 33, 43, 0.4)",
        weight: 1.5
      });
      endDot.addTo(leafletRoutesGroup);

      // Draw midpoint route label
      const midLatLng = [
        (Number(start.lat) + Number(end.lat)) / 2,
        (Number(start.lng) + Number(end.lng)) / 2
      ];
      const labelText = `${driver.name.slice(0, 1)}-${person.name.slice(0, 1)}`;
      const routeLabelMarker = L.marker(midLatLng, {
        icon: L.divIcon({
          className: "route-label-leaflet",
          html: `<span>${escapeHTML(labelText)}</span>`,
          iconSize: null,
          iconAnchor: [20, 10]
        }),
        interactive: false
      });
      routeLabelMarker.addTo(leafletRoutesGroup);
    }
  });

  // Fit bounds on first render of the map
  if (!hasInitialFit && allPoints.length > 0) {
    fitAllMapBounds(false);
    hasInitialFit = true;
  }
}

function fitAllMapBounds(force = false) {
  if (!leafletMapInstance) return;

  const allPoints = [];

  // Collect driver locations
  state.drivers.forEach((driver) => {
    const location = state.driverLocations[driver.id] ?? driver.homeLocation;
    if (location && location.lat && location.lng) {
      allPoints.push([Number(location.lat), Number(location.lng)]);
    }
  });

  // Collect active routes pickup & dropoff locations
  const activeTrips = todayTrips().filter((trip) => getTripStatus(trip) !== "completed");
  activeTrips.forEach((trip) => {
    const person = getCase(trip.caseId);
    if (!person) return;
    const pickup = trip.pickupLocation ?? caseCoordinate(trip.caseId, "pickup");
    const destination = trip.dropoffLocation ?? caseCoordinate(trip.caseId, "destination");
    if (pickup && pickup.lat && pickup.lng) {
      allPoints.push([Number(pickup.lat), Number(pickup.lng)]);
    }
    if (destination && destination.lat && destination.lng) {
      allPoints.push([Number(destination.lat), Number(destination.lng)]);
    }
  });

  if (allPoints.length > 0) {
    const bounds = L.latLngBounds(allPoints);
    leafletMapInstance.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 15
    });
  } else {
    // Default fallback center to Taipei
    leafletMapInstance.setView([25.0394, 121.5205], 12);
  }
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

function summaryCard(label, value, hint, tone, icon = "analytics") {
  return `
    <article class="summary-card ${tone}">
      <span class="summary-icon material-symbols-outlined" aria-hidden="true">${escapeHTML(icon)}</span>
      <div>
        <p class="eyebrow">${escapeHTML(label)}</p>
        <strong>${escapeHTML(value)}</strong>
        <p class="subtext">${escapeHTML(hint)}</p>
      </div>
    </article>
  `;
}

function minguoDate(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  if (!year || !month || !day) return value || "";
  return `${year - 1911}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
}

function addressCity(address) {
  return String(address || "").match(/[\u4e00-\u9fa5]{2,3}[縣市]/)?.[0] || "未填";
}

function burdenRateFor(person) {
  const text = `${person?.welfareStatus || ""} ${person?.quotaNote || ""} ${person?.note || ""}`;
  if (/低收|第一類|一類/.test(text)) return 0;
  if (/中低|第二類|二類/.test(text)) return 0.05;
  return 0.16;
}

function minguoDate7(dateString) {
  const parts = String(dateString || "").split("-");
  if (parts.length < 3) return "";
  const year = Number(parts[0]) - 1911;
  const month = parts[1].padStart(2, "0");
  const day = parts[2].padStart(2, "0");
  return `${year}${month}${day}`;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 1.5;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const dist = R * c;
  return Number(Math.max(0.1, dist).toFixed(1));
}

function resolveCoordinate(address, caseId, type) {
  const site = communitySites.find(s => 
    (s.name && address.includes(s.name)) || 
    (s.address && address.includes(s.address)) || 
    (s.address && s.address.includes(address))
  );
  if (site) return { lat: site.lat, lng: site.lng };

  const isYilan = /宜蘭|壯圍|五結|羅東/.test(address);
  const seed = [...(address || `${caseId}-${type}`)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  if (isYilan) {
    return {
      lat: Number((24.75 + (seed % 50) * 0.0011).toFixed(6)),
      lng: Number((121.77 + (seed % 75) * 0.0011).toFixed(6)),
    };
  } else {
    return {
      lat: Number((25.018 + (seed % 70) * 0.0011).toFixed(6)),
      lng: Number((121.49 + (seed % 85) * 0.0011).toFixed(6)),
    };
  }
}

function getLocationName(address, isHome) {
  if (isHome) return "自宅";
  const site = communitySites.find(s => address.includes(s.name) || s.address.includes(address) || address.includes(s.address));
  if (site) return site.name;
  for (const s of communitySites) {
    if (address.includes(s.name)) return s.name;
  }
  return address.replace(/宜蘭縣|台北市|中正區|壯圍鄉|五結鄉/g, "").substring(0, 6);
}

function reimbursementRows(selectedMonth) {
  const price = 115;
  const list = [];

  state.trips
    .filter((trip) => trip.serviceDate.startsWith(selectedMonth) && getTripStatus(trip) === "completed")
    .forEach((trip) => {
      const person = getCase(trip.caseId);
      const driver = getDriver(trip.driverId);
      if (!person) return;

      const depAddress = trip.pickupAddress || person.pickupAddress || "";
      const arrAddress = trip.destinationAddress || person.destinationAddress || "";

      const depHome = depAddress === person.pickupAddress;
      const arrHome = arrAddress === person.pickupAddress;

      const depName = getLocationName(depAddress, depHome);
      const arrName = getLocationName(arrAddress, arrHome);

      const depCoord = trip.pickupLocation || resolveCoordinate(depAddress, person.id, "pickup");
      const arrCoord = trip.dropoffLocation || resolveCoordinate(arrAddress, person.id, "destination");

      const distance = haversineDistance(depCoord.lat, depCoord.lng, arrCoord.lat, arrCoord.lng);

      const [startH, startM] = (trip.pickupTime || trip.scheduledPickup || "09:00").split(":").map(Number);
      const [endH, endM] = (trip.dropoffTime || trip.scheduledDropoff || "09:30").split(":").map(Number);

      let serviceType = 2; // Default to community center
      const dest = trip.destinationAddress || person.destinationAddress || "";
      if (dest.includes("日照") || dest.includes("中心")) {
        serviceType = 1;
      } else if (dest.includes("據點") || dest.includes("社區")) {
        serviceType = 2;
      }

      list.push({
        _caseName: person.name || "",
        "身分證字號": person.identityNo || "",
        "服務日期(請輸入7碼)": minguoDate7(trip.serviceDate),
        "服務項目代碼": "BD03",
        "服務類別\n1.補助\n2.自費": 1,
        "數量\n(僅整數)": 1,
        "單價": price,
        "服務人員身分證": driver?.identityNo || "A123456789",
        "起始時段-小時\n(24小時制)": startH,
        "起始時段-分鐘": startM,
        "結束時段-小時\n(24小時制)": endH,
        "結束時段-分鐘": endM,
        "備註": `${depName}-${arrName}`,
        "服務人員身分證2": "",
        "服務人員身分證3": "",
        "服務人員身分證4": "",
        "服務人員身分證5": "",
        "不申報AA09填1": "",
        "訪視未遇填1": "",
        "C碼必填-復能目標達成情形\n1.尚未滿服務組數\n2.滿服務組數且已達復能目標\n3.滿服務組數但尚未達復能目標\n4.未滿服務組數已結案，且已達復能目標\n5.未滿服務組數已結案，但未達復能目標": "",
        "C碼必填-復能目標": "",
        "C碼必填-指導對象": "",
        "C碼必填-服務內容": "",
        "C碼必填-指導建議摘要": "",
        "OT01必填-餐別\n1.早餐\n2.午餐\n3.晚餐": "",
        "BD03、DA01使用-出發地": depAddress,
        "BD03、DA01使用-目的地": arrAddress,
        "BD03、DA01使用-出發地(緯度)": depCoord.lat,
        "BD03、DA01使用-出發地(經度)": depCoord.lng,
        "BD03、DA01使用-目的地(緯度)": arrCoord.lat,
        "BD03、DA01使用-目的地(經度)": arrCoord.lng,
        "BD03、DA01使用-里程數(公里)": distance,
        "BD03、DA01使用-車號": driver?.vehicleNo || "RFH-5153",
        "BD03必填-服務使用類型\n1.社區式長照機構\n2.社區服務據點(不含身障類)\n3.輔具中心\n4.身障日間照顧服務": serviceType,
      });
    });

  return list;
}

function downloadSpreadsheet(filename, rows) {
  if (!rows.length) {
    setFlash("目前沒有已完成的班次可匯出核銷清冊。", "error");
    return;
  }
  const headers = Object.keys(rows[0]).filter(k => !k.startsWith("_"));
  
  const escapeCSV = (val) => {
    const text = String(val ?? "");
    if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
      return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
  };

  const headerLine = headers.map(escapeCSV).join(",");
  const bodyLines = rows
    .map((row) => headers.map((header) => escapeCSV(row[header])).join(","))
    .join("\r\n");

  const csvContent = "\uFEFF" + headerLine + "\r\n" + bodyLines;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const finalFilename = filename.replace(/\.xls$/, ".csv");
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setFlash(`已匯出核銷清冊：${rows.length} 筆`, "success");
}

function exportReimbursementExcel() {
  downloadSpreadsheet(`社區交通車核銷清冊_${state.serviceDate}.csv`, reimbursementRows());
  addNotification(`已成功匯出核銷清冊 Excel (${state.serviceDate})`, true);
}

function renderRideRow(trip) {
  const person = getCase(trip.caseId);
  const driver = getDriver(trip.driverId);
  const status = getTripStatus(trip);
  const destination = trip.destinationAddress || person?.destinationAddress || "";
  const options = state.drivers
    .map((item) => {
      const selected = item.id === trip.driverId ? "selected" : "";
      return `<option value="${escapeHTML(item.id)}" ${selected}>${escapeHTML(item.name)} · ${escapeHTML(item.vehicleNo)}</option>`;
    })
    .join("");

  return `
    <article class="ride-row ${escapeHTML(status)}">
      <!-- Column 1: Time & Status -->
      <div class="ride-time-status">
        <div class="time-block">
          <div class="time-item">
            <span class="time-label">上車</span>
            <strong class="time-val">${escapeHTML(trip.scheduledPickup)}</strong>
          </div>
          <div class="time-divider">↓</div>
          <div class="time-item">
            <span class="time-label">送達</span>
            <strong class="time-val">${escapeHTML(trip.scheduledDropoff)}</strong>
          </div>
        </div>
        <span class="status-pill ${escapeHTML(status)}">${escapeHTML(statusLabels[status])}</span>
      </div>

      <!-- Column 2: Case Details -->
      <div class="ride-person">
        <div class="person-name-row">
          <strong class="person-name">${escapeHTML(person?.name ?? "未知個案")}</strong>
          <span class="purpose-badge">${escapeHTML(trip.purpose)}</span>
        </div>
        <p class="person-meta">${escapeHTML(person?.caseNo ?? "")} · ${escapeHTML(person?.careLevel ?? "")}</p>
        <p class="person-mobility">${escapeHTML(person?.mobility ?? "")}</p>
      </div>

      <!-- Column 3: Route -->
      <div class="ride-route">
        <div class="route-item pickup">
          <span class="route-dot-icon">●</span>
          <div class="route-details">
            <span class="route-label">上車：</span>
            <span class="route-address">${escapeHTML(trip.pickupAddress || person?.pickupAddress || "")}</span>
          </div>
        </div>
        <div class="route-item dropoff">
          <span class="route-dot-icon">▼</span>
          <div class="route-details">
            <span class="route-label">目的：</span>
            <span class="route-address">${escapeHTML(destination)}</span>
          </div>
        </div>
      </div>

      <!-- Column 4: Driver & Tracking -->
      <div class="ride-dispatch">
        <div class="driver-assign-row">
          <label>
            <span>指派司機</span>
            <select class="driver-select" data-trip-id="${escapeHTML(trip.id)}">${options}</select>
          </label>
          <a class="route-icon-btn" href="${escapeHTML(googleMapsRouteUrl(trip))}" target="_blank" rel="noopener" aria-label="開啟 ${escapeHTML(driver?.name ?? "司機")} 的 Google 地圖路徑" title="開啟 Google 地圖路徑">
            <span class="material-symbols-outlined" aria-hidden="true">map</span>
          </a>
          <button class="route-icon-btn delete-trip-btn" type="button" data-trip-id="${escapeHTML(trip.id)}" aria-label="刪除此班次" title="刪除此班次">
            <span class="material-symbols-outlined" aria-hidden="true">delete</span>
          </button>
        </div>
        <div class="dispatch-meta">
          <div class="dispatch-time">
            <span>接到 ${escapeHTML(trip.pickupTime || "--:--")}</span>
            <span class="dot-sep">·</span>
            <span>送達 ${escapeHTML(trip.dropoffTime || "--:--")}</span>
          </div>
          <div class="dispatch-loc">
            <span class="material-symbols-outlined loc-icon" aria-hidden="true">my_location</span>
            <span>定位 ${escapeHTML(formatEventTime(state.driverLocations[trip.driverId]?.updatedAt))}</span>
          </div>
        </div>
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

  const pickup = trip.pickupAddress || person?.pickupAddress || "";
  if (pickup) {
    params.set("waypoints", pickup);
  }

  params.set("destination", trip.destinationAddress || person?.destinationAddress || person?.pickupAddress || "");
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function googleMapsCaseRouteUrl(person) {
  const params = new URLSearchParams({
    api: "1",
    travelmode: "driving",
  });
  params.set("origin", person.pickupAddress || "");
  params.set("destination", person.destinationAddress || person.pickupAddress || "");
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function renderCases(host = document.getElementById("appView")) {
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
  const driverSelectReturn = document.getElementById("caseDriverSelectReturn");
  const driverOpts = state.drivers
    .filter((driver) => driver.active)
    .map((driver) => `<option value="${escapeHTML(driver.id)}">${escapeHTML(driver.name)} · ${escapeHTML(driver.vehicleNo)}</option>`)
    .join("");
  if (driverSelect) driverSelect.innerHTML = driverOpts;
  if (driverSelectReturn) driverSelectReturn.innerHTML = driverOpts;

  const createReturnTripCheckbox = document.getElementById("createReturnTripCheckbox");
  if (createReturnTripCheckbox) {
    createReturnTripCheckbox.addEventListener("change", (e) => {
      const returnFields = document.getElementById("caseReturnFields");
      if (returnFields) {
        returnFields.style.display = e.target.checked ? "grid" : "none";
      }
    });
  }

  const siteSelect = document.getElementById("communitySiteSelect");
  siteSelect.innerHTML = [
    '<option value="">自行輸入目的地</option>',
    ...communitySites.map((site) => `<option value="${escapeHTML(site.name)}">${escapeHTML(site.name)} · ${escapeHTML(site.address)}</option>`),
  ].join("");
  siteSelect.addEventListener("change", (event) => {
    const site = communitySites.find((item) => item.name === event.target.value);
    const form = document.getElementById("caseForm");
    if (!site || !form) return;
    form.elements.destinationAddress.value = site.address;
    const current = parseDestinations(form.elements.destinationsText.value, form.elements.destinationAddress.value);
    form.elements.destinationsText.value = destinationsToText([...current, { name: site.name, address: site.address }]);
    form.elements.tripDestination.value = site.address;
  });

  document.getElementById("openCaseFormBtn").addEventListener("click", () => {
    editingCaseId = "";
    selectedCaseId = "";
    caseFormOpen = true;
    refreshCases();
  });
  document.getElementById("caseForm").addEventListener("submit", handleCaseSubmit);
  document.getElementById("caseCancelBtn").addEventListener("click", () => {
    editingCaseId = "";
    caseFormOpen = false;
    refreshCases();
  });
  document.getElementById("caseList").addEventListener("click", handleCaseAction);
  const closeBtn = document.getElementById("caseFormCloseBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("caseCancelBtn").click();
    });
  }
  if (editingCaseId) {
    fillCaseForm(editingCaseId);
  } else {
    const form = document.getElementById("caseForm");
    if (form) {
      form.reset();
      form.elements.id.value = "";
      form.elements.createTrip.checked = true;
      form.elements.createTrip.disabled = false;
      if (form.elements.createReturnTrip) {
        form.elements.createReturnTrip.checked = false;
        form.elements.createReturnTrip.disabled = false;
      }
      const returnFields = document.getElementById("caseReturnFields");
      if (returnFields) returnFields.style.display = "none";
      document.getElementById("caseFormMode").textContent = "新增個案";
      document.getElementById("caseSubmitBtn").textContent = "＋ 新增個案";
    }
  }
  renderFlash();
}

function renderCaseCard(person) {
  const activeText = person.active ? "服務中" : "已停用";
  const activeClass = person.active ? "completed" : "scheduled";
  const hasTodayTrip = state.trips.some((trip) => trip.caseId === person.id && trip.serviceDate === state.serviceDate);
  const isSelected = selectedCaseId === person.id;
  const routeUrl = googleMapsCaseRouteUrl(person);
  const contacts = normalizeEmergencyContacts(person);
  const phoneLinks = uniqueItems(
    [
      person.phone ? { label: "主要", phone: person.phone } : null,
      person.landlinePhone ? { label: "室內", phone: person.landlinePhone } : null,
      person.mobilePhone ? { label: "手機", phone: person.mobilePhone } : null,
    ].filter(Boolean),
    (item) => normalizePhone(item.phone),
  )
    .map((item) => renderPhoneLink(item.phone, item.label))
    .join("");
  const contactList = contacts.length
    ? contacts
        .map((contact) => {
          return `
            <li>
              <span>${escapeHTML(contact.name || "未填姓名")} ${contact.relation ? `(${escapeHTML(contact.relation)})` : ""}</span>
              ${renderPhoneLink(contact.phone)}
            </li>
          `;
        })
        .join("")
    : "<li>未填</li>";
  const destinationList = normalizeDestinations(person)
    .slice(0, 4)
    .map((item) => `<span class="destination-chip">${escapeHTML(item.name)}${item.address && item.address !== item.name ? ` · ${escapeHTML(item.address)}` : ""}</span>`)
    .join("");
  const actions = isSelected
    ? `
      <div class="task-actions case-actions-panel" aria-label="${escapeHTML(person.name)} 操作選項">
        <button class="primary-btn" type="button" data-action="edit" data-case-id="${escapeHTML(person.id)}">
          <span class="material-symbols-outlined" aria-hidden="true">edit</span>
          編輯
        </button>
        <button class="secondary-btn" type="button" data-action="schedule-manage" data-case-id="${escapeHTML(person.id)}">
          <span class="material-symbols-outlined" aria-hidden="true">event_repeat</span>
          排班設定
        </button>
        <button class="ghost-btn" type="button" data-action="toggle" data-case-id="${escapeHTML(person.id)}">
          <span class="material-symbols-outlined" aria-hidden="true">${person.active ? "pause" : "play_arrow"}</span>
          ${person.active ? "停用個案" : "恢復服務"}
        </button>
        <button class="danger-btn" type="button" data-action="delete" data-case-id="${escapeHTML(person.id)}">
          <span class="material-symbols-outlined" aria-hidden="true">delete</span>
          刪除
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
        <div class="case-title-row">
          <strong>${escapeHTML(person.name)}</strong>
          <span class="status-pill ${activeClass}">${activeText}</span>
        </div>
        <p class="subtext">${escapeHTML(person.caseNo)} · ${escapeHTML(person.gender || "未填性別")} · ${escapeHTML(person.careLevel)}</p>
        <div class="phone-list">${phoneLinks || renderPhoneLink(person.phone)}</div>
      </div>
      <div>
        <p class="subtext">個管員：${escapeHTML(person.careManager || "未填")} ${person.careManagerPhone ? renderPhoneLink(person.careManagerPhone) : ""}</p>
        <p class="subtext">服務區域：${escapeHTML(person.serviceArea || "未填")} · 福利身分：${escapeHTML(person.welfareStatus || "未填")} · 輔具：${escapeHTML(person.assistiveDevice || "未填")}</p>
        <div class="contact-block">
          <span class="subtext">緊急聯絡</span>
          <ul>${contactList}</ul>
        </div>
        <p class="subtext case-address-line">
          <span>上車：${escapeHTML(person.pickupAddress)}</span>
        </p>
        <p class="subtext case-address-line">
          <span>目的地：${escapeHTML(person.destinationAddress)}</span>
          <a class="inline-map-btn" href="${escapeHTML(routeUrl)}" target="_blank" rel="noopener" aria-label="開啟 ${escapeHTML(person.name)} 接送路徑">
            <span class="material-symbols-outlined" aria-hidden="true">map</span>
          </a>
        </p>
        ${destinationList ? `<div class="destination-list">${destinationList}</div>` : ""}
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
  form.elements.welfareStatus.value = person.welfareStatus || "";
  form.elements.phone.value = person.phone;
  form.elements.landlinePhone.value = person.landlinePhone || "";
  form.elements.mobilePhone.value = person.mobilePhone || "";
  form.elements.emergencyContact.value = person.emergencyContact || "";
  form.elements.emergencyRelation.value = person.emergencyRelation || "";
  form.elements.emergencyPhone.value = person.emergencyPhone || "";
  form.elements.emergencyContactsText.value = contactsToText(person.emergencyContacts || []);
  form.elements.careLevel.value = person.careLevel;
  form.elements.mobility.value = person.mobility;
  form.elements.assistiveDevice.value = person.assistiveDevice || "";
  form.elements.serviceArea.value = person.serviceArea || "";
  form.elements.careManager.value = person.careManager || "";
  form.elements.careManagerPhone.value = person.careManagerPhone || "";
  form.elements.pickupAddress.value = person.pickupAddress;
  form.elements.destinationAddress.value = person.destinationAddress;
  form.elements.communitySite.value = person.communitySite || "";
  form.elements.quotaNote.value = person.quotaNote || "";
  form.elements.destinationsText.value = destinationsToText(person.destinations || []);
  form.elements.tripDestination.value = "";
  form.elements.rideNote.value = person.rideNote || "";
  form.elements.note.value = person.note || "";
  form.elements.createTrip.checked = false;
  form.elements.createTrip.disabled = true;
  if (form.elements.createReturnTrip) {
    form.elements.createReturnTrip.checked = false;
    form.elements.createReturnTrip.disabled = true;
  }
  const returnFields = document.getElementById("caseReturnFields");
  if (returnFields) returnFields.style.display = "none";
  document.getElementById("caseFormMode").textContent = "編輯個案";
  document.getElementById("caseSubmitBtn").textContent = "💾 儲存個案";
}

async function handleCaseSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const editingId = String(form.get("id") || "").trim();
  const existingCase = editingId ? getCase(editingId) : null;
  const primaryEmergency = {
    name: String(form.get("emergencyContact")).trim(),
    relation: String(form.get("emergencyRelation")).trim(),
    phone: String(form.get("emergencyPhone")).trim(),
  };
  const birthDate = normalizeBirthDate(String(form.get("birthDate") || ""));
  if (form.get("birthDate") && !birthDate) {
    setFlash("出生日期請填西元年 4 碼，例如 1943-04-12。", "error", "cases");
    addNotification("個案儲存失敗：出生日期格式錯誤", false);
    return;
  }
  const emergencyContacts = parseEmergencyContacts(String(form.get("emergencyContactsText") || ""), primaryEmergency);
  const destinations = parseDestinations(String(form.get("destinationsText") || ""), String(form.get("destinationAddress")).trim());
  const newCase = {
    id: editingId || uid("case"),
    caseNo: String(form.get("caseNo")).trim(),
    name: String(form.get("name")).trim(),
    identityNo: String(form.get("identityNo")).trim(),
    gender: String(form.get("gender")).trim(),
    birthDate,
    welfareStatus: String(form.get("welfareStatus")).trim(),
    phone: String(form.get("phone")).trim(),
    landlinePhone: String(form.get("landlinePhone")).trim(),
    mobilePhone: String(form.get("mobilePhone")).trim(),
    emergencyContacts,
    emergencyContact: emergencyContacts[0]?.name || primaryEmergency.name,
    emergencyRelation: emergencyContacts[0]?.relation || primaryEmergency.relation,
    emergencyPhone: emergencyContacts[0]?.phone || primaryEmergency.phone,
    careLevel: String(form.get("careLevel")),
    mobility: String(form.get("mobility")),
    assistiveDevice: String(form.get("assistiveDevice")).trim(),
    serviceArea: String(form.get("serviceArea")).trim(),
    careManager: String(form.get("careManager")).trim(),
    careManagerPhone: String(form.get("careManagerPhone")).trim(),
    pickupAddress: String(form.get("pickupAddress")).trim(),
    destinationAddress: String(form.get("destinationAddress")).trim(),
    communitySite: String(form.get("communitySite")).trim(),
    quotaNote: String(form.get("quotaNote")).trim(),
    destinations,
    rideNote: String(form.get("rideNote")).trim(),
    note: String(form.get("note")).trim(),
    active: existingCase?.active ?? true,
  };

  const duplicate = findDuplicateCase(newCase, editingId);
  if (duplicate) {
    dataMessage = duplicate;
    setFlash(duplicate, "error", "cases");
    addNotification(`個案儲存失敗：${duplicate}`, false);
    refreshCases();
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
              destinationAddress: String(form.get("tripDestination")).trim() || String(form.get("destinationAddress")).trim(),
            }
          : null,
        tripReturn: form.get("createReturnTrip")
          ? {
              driverId: String(form.get("driverIdReturn")),
              scheduledPickup: String(form.get("scheduledPickupReturn")),
              scheduledDropoff: String(form.get("scheduledDropoffReturn")),
              pickupAddress: String(form.get("tripDestination")).trim() || String(form.get("destinationAddress")).trim(),
              destinationAddress: String(form.get("pickupAddress")).trim(),
            }
          : null,
      });
      const savedCase = findSavedCase(newCase, editingId);
      editingCaseId = "";
      selectedCaseId = savedCase?.id || "";
      caseFormOpen = false;
      setFlash(`${editingId ? "已更新" : "已新增"}個案：${savedCase?.name || newCase.name}`, "success", "cases");
      addNotification(`${editingId ? "已更新" : "已新增"}個案「${savedCase?.name || newCase.name}」成功`, true);
      refreshCases();
    } catch (error) {
      dataMessage = `個案資料儲存失敗：${error.message}`;
      setFlash(dataMessage, "error", "cases");
      addNotification(`個案「${newCase.name}」儲存失敗：${error.message}`, false);
      refreshCases();
    }
    return;
  }

  if (editingId) {
    state.cases = state.cases.map((person) => (person.id === editingId ? newCase : person));
    editingCaseId = "";
    selectedCaseId = newCase.id;
    caseFormOpen = false;
    saveState();
    setFlash(`已更新個案：${newCase.name}`, "success", "cases");
    addNotification(`已更新個案「${newCase.name}」成功`, true);
    refreshCases();
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
      pickupAddress: newCase.pickupAddress,
      destinationAddress: String(form.get("tripDestination")).trim() || newCase.destinationAddress,
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

  if (form.get("createReturnTrip")) {
    state.trips.push({
      id: uid("trip"),
      serviceDate: state.serviceDate,
      caseId: newCase.id,
      driverId: String(form.get("driverIdReturn")),
      scheduledPickup: String(form.get("scheduledPickupReturn")),
      scheduledDropoff: String(form.get("scheduledDropoffReturn")),
      pickupAddress: String(form.get("tripDestination")).trim() || newCase.destinationAddress,
      destinationAddress: newCase.pickupAddress,
      pickupTime: "",
      pickupAt: "",
      pickupLocation: null,
      dropoffTime: "",
      dropoffAt: "",
      dropoffLocation: null,
      purpose: "回程接送",
      status: "scheduled",
    });
  }

  saveState();
  selectedCaseId = newCase.id;
  caseFormOpen = false;
  setFlash(`已新增個案：${newCase.name}`, "success", "cases");
  addNotification(`已新增個案「${newCase.name}」成功`, true);
  refreshCases();
}

async function handleCaseAction(event) {
  if (event.target.closest("a")) return;
  const button = event.target.closest("button[data-action]");
  if (!button) {
    const card = event.target.closest(".case-card[data-case-id]");
    if (!card) return;
    selectedCaseId = card.dataset.caseId === selectedCaseId ? "" : card.dataset.caseId;
    editingCaseId = "";
    caseFormOpen = false;
    refreshCases();
    return;
  }

  const person = state.cases.find((item) => item.id === button.dataset.caseId);
  if (!person) return;
  selectedCaseId = person.id;

  if (button.dataset.action === "schedule-manage") {
    requestView("schedules");
    editingScheduleId = "";
    scheduleFormOpen = true;
    selectedScheduleId = "";
    refreshSchedulesView();
    fillScheduleForm("", person.id);
    return;
  }

  if (button.dataset.action === "edit") {
    editingCaseId = person.id;
    caseFormOpen = true;
    refreshCases();
    return;
  }

  if (button.dataset.action === "delete" && !window.confirm(`確定刪除 ${person.name}？相關今日班表也會移除。`)) {
    return;
  }

  if (dataMode === "supabase") {
    try {
      if (button.dataset.action === "toggle") {
        await apiAction("toggle_case", { caseId: person.id, active: !person.active });
        addNotification(`個案「${person.name}」狀態已切換為 ${!person.active ? "服務中" : "已停用"}`, true);
      }

      if (button.dataset.action === "trip") {
        await apiAction("create_trip", {
          caseId: person.id,
          driverId: state.drivers[0]?.id ?? "",
        });
        addNotification(`已為個案「${person.name}」新增今日接送`, true);
      }

      if (button.dataset.action === "delete") {
        await apiAction("delete_case", { caseId: person.id });
        selectedCaseId = "";
        addNotification(`個案「${person.name}」已刪除`, true);
      }
      editingCaseId = "";
      caseFormOpen = false;
      refreshCases();
    } catch (error) {
      dataMessage = `更新失敗：${error.message}`;
      addNotification(`個案操作失敗：${error.message}`, false);
      refreshCases();
    }
    return;
  }

  if (button.dataset.action === "toggle") {
    person.active = !person.active;
    addNotification(`個案「${person.name}」狀態已切換為 ${person.active ? "服務中" : "已停用"}`, true);
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
    addNotification(`已為個案「${person.name}」新增今日接送`, true);
  }

  if (button.dataset.action === "delete") {
    const relatedScheduleIds = new Set(state.schedules.filter((schedule) => schedule.caseId === person.id).map((schedule) => schedule.id));
    state.trips = state.trips.filter((trip) => trip.caseId !== person.id);
    state.trips = state.trips.filter((trip) => !relatedScheduleIds.has(trip.scheduleId));
    state.schedules = state.schedules.filter((schedule) => schedule.caseId !== person.id);
    state.cases = state.cases.filter((item) => item.id !== person.id);
    selectedScheduleId = "";
    editingCaseId = "";
    selectedCaseId = "";
    caseFormOpen = false;
    scheduleFormOpen = false;
    scheduleOverrideOpen = false;
    addNotification(`個案「${person.name}」已刪除`, true);
  }

  saveState();
  refreshCases();
}

function renderDrivers(host = document.getElementById("appView")) {
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
    refreshDrivers();
  });
  document.getElementById("driverForm").addEventListener("submit", handleDriverSubmit);
  document.getElementById("driverCancelBtn").addEventListener("click", () => {
    editingDriverId = "";
    driverFormOpen = false;
    refreshDrivers();
  });
  document.getElementById("driverList").addEventListener("click", handleDriverManageAction);
  const closeBtn = document.getElementById("driverFormCloseBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("driverCancelBtn").click();
    });
  }
  if (editingDriverId) fillDriverForm(editingDriverId);
  renderFlash();
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

function findSavedCase(person, editingId = "") {
  if (editingId) return state.cases.find((item) => item.id === editingId);
  return (
    state.cases.find((item) => sameText(item.caseNo, person.caseNo)) ||
    state.cases.find((item) => person.identityNo && sameText(item.identityNo, person.identityNo)) ||
    state.cases.find((item) => sameText(item.name, person.name) && sameText(item.phone, person.phone))
  );
}

function findSavedDriver(driver, editingId = "") {
  if (editingId) return state.drivers.find((item) => item.id === editingId);
  return (
    state.drivers.find((item) => sameText(item.vehicleNo, driver.vehicleNo)) ||
    state.drivers.find((item) => driver.identityNo && sameText(item.identityNo, driver.identityNo)) ||
    state.drivers.find((item) => sameText(item.name, driver.name) && sameText(item.phone, driver.phone))
  );
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
        <button class="primary-btn" type="button" data-action="edit" data-driver-id="${escapeHTML(driver.id)}">
          <span class="material-symbols-outlined" aria-hidden="true">edit</span>
          編輯
        </button>
        <button class="ghost-btn" type="button" data-action="toggle" data-driver-id="${escapeHTML(driver.id)}">
          <span class="material-symbols-outlined" aria-hidden="true">${driver.active ? "pause" : "play_arrow"}</span>
          ${driver.active ? "停用司機" : "恢復服務"}
        </button>
        <button class="danger-btn" type="button" data-action="delete" data-driver-id="${escapeHTML(driver.id)}">
          <span class="material-symbols-outlined" aria-hidden="true">delete</span>
          刪除
        </button>
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
        <p class="subtext">電話：${driver.phone ? renderPhoneLink(driver.phone) : "未填電話"}</p>
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
    setFlash(duplicate, "error", "drivers");
    addNotification(`司機儲存失敗：${duplicate}`, false);
    refreshDrivers();
    return;
  }

  if (!/^\d{6}$/.test(driver.pin)) {
    dataMessage = "司機 PIN 必須是 6 位數字。";
    setFlash(dataMessage, "error", "drivers");
    addNotification("司機儲存失敗：PIN 碼格式錯誤", false);
    refreshDrivers();
    return;
  }

  if (dataMode === "supabase") {
    try {
      await apiAction(editingId ? "update_driver" : "create_driver", { driver });
      const savedDriver = findSavedDriver(driver, editingId);
      editingDriverId = "";
      selectedDriverId = savedDriver?.id || "";
      driverFormOpen = false;
      setFlash(`${editingId ? "已更新" : "已新增"}司機：${savedDriver?.name || driver.name}`, "success", "drivers");
      addNotification(`${editingId ? "已更新" : "已新增"}司機「${savedDriver?.name || driver.name}」成功`, true);
      refreshDrivers();
    } catch (error) {
      dataMessage = `司機資料儲存失敗：${error.message}`;
      setFlash(dataMessage, "error", "drivers");
      addNotification(`司機「${driver.name}」儲存失敗：${error.message}`, false);
      refreshDrivers();
    }
    return;
  }

  if (editingId) {
    state.drivers = state.drivers.map((item) => (item.id === editingId ? { ...item, ...driver } : item));
    addNotification(`已更新司機「${driver.name}」成功`, true);
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
    addNotification(`已新增司機「${driver.name}」成功`, true);
  }
  editingDriverId = "";
  selectedDriverId = driver.id;
  driverFormOpen = false;
  saveState();
  setFlash(`${editingId ? "已更新" : "已新增"}司機：${driver.name}`, "success", "drivers");
  refreshDrivers();
}

async function handleDriverManageAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    const card = event.target.closest(".case-card[data-driver-id]");
    if (!card) return;
    selectedDriverId = card.dataset.driverId === selectedDriverId ? "" : card.dataset.driverId;
    editingDriverId = "";
    driverFormOpen = false;
    refreshDrivers();
    return;
  }

  const driver = state.drivers.find((item) => item.id === button.dataset.driverId);
  if (!driver) return;
  selectedDriverId = driver.id;

  if (button.dataset.action === "edit") {
    editingDriverId = driver.id;
    driverFormOpen = true;
    refreshDrivers();
    return;
  }

  if (button.dataset.action === "delete" && !window.confirm(`確定刪除 ${driver.name}？已有歷史班表時系統會改為停用。`)) {
    return;
  }

  if (dataMode === "supabase") {
    try {
      if (button.dataset.action === "toggle") {
        await apiAction("toggle_driver", { driverId: driver.id, active: !driver.active });
        addNotification(`司機「${driver.name}」狀態已切換為 ${!driver.active ? "服務中" : "已停用"}`, true);
      }
      if (button.dataset.action === "delete") {
        await apiAction("delete_driver", { driverId: driver.id });
        selectedDriverId = "";
        addNotification(`司機「${driver.name}」已刪除`, true);
      }
      editingDriverId = "";
      driverFormOpen = false;
      refreshDrivers();
    } catch (error) {
      dataMessage = `司機資料更新失敗：${error.message}`;
      addNotification(`司機操作失敗：${error.message}`, false);
      refreshDrivers();
    }
    return;
  }

  if (button.dataset.action === "toggle") {
    driver.active = !driver.active;
    addNotification(`司機「${driver.name}」狀態已切換為 ${driver.active ? "服務中" : "已停用"}`, true);
  }
  if (button.dataset.action === "delete") {
    const relatedScheduleIds = new Set(state.schedules.filter((schedule) => schedule.driverId === driver.id).map((schedule) => schedule.id));
    state.trips = state.trips.filter((trip) => trip.driverId !== driver.id);
    state.trips = state.trips.filter((trip) => !relatedScheduleIds.has(trip.scheduleId));
    state.schedules = state.schedules.filter((schedule) => schedule.driverId !== driver.id);
    delete state.driverLocations[driver.id];
    state.drivers = state.drivers.filter((item) => item.id !== driver.id);
    selectedScheduleId = "";
    selectedDriverId = "";
    addNotification(`司機「${driver.name}」已刪除`, true);
  }
  editingDriverId = "";
  driverFormOpen = false;
  saveState();
  refreshDrivers();
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
            ${escapeHTML(trip.pickupAddress || person?.pickupAddress || "")}
          </div>
          <div class="address-box">
            <span>目的地</span>
            ${escapeHTML(trip.destinationAddress || person?.destinationAddress || "")}
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
  const time = localTime();
  if (target) target.textContent = time;
}

async function refreshCurrentData() {
  const indicator = document.getElementById("pullRefresh");
  indicator.textContent = "正在重新整理...";
  document.body.classList.add("refreshing");

  if (dataMode === "supabase") {
    await loadRemoteState();
  } else {
    state = normalizeState(loadState());
    dataMessage = "本機示範資料已更新";
  }

  render();
  window.setTimeout(() => {
    document.body.classList.remove("pulling", "refreshing");
    document.documentElement.style.setProperty("--pull-distance", "0px");
    const nextIndicator = document.getElementById("pullRefresh");
    if (nextIndicator) nextIndicator.textContent = "下拉重新整理";
  }, 300);
}

function setupPullToRefresh() {
  const isMobileWidth = () => window.matchMedia("(max-width: 860px)").matches;

  window.addEventListener(
    "touchstart",
    (event) => {
      if (!isMobileWidth() || window.scrollY > 0 || event.touches.length !== 1) return;
      pullRefreshState = {
        active: true,
        startY: event.touches[0].clientY,
        distance: 0,
      };
    },
    { passive: true },
  );

  window.addEventListener(
    "touchmove",
    (event) => {
      if (!pullRefreshState.active || !isMobileWidth()) return;
      const distance = Math.max(0, event.touches[0].clientY - pullRefreshState.startY);
      if (distance < 8) return;
      event.preventDefault();
      pullRefreshState.distance = Math.min(120, distance * 0.55);
      document.body.classList.add("pulling");
      document.documentElement.style.setProperty("--pull-distance", `${pullRefreshState.distance}px`);
      const indicator = document.getElementById("pullRefresh");
      if (indicator) indicator.textContent = pullRefreshState.distance > 72 ? "放開重新整理" : "下拉重新整理";
    },
    { passive: false },
  );

  window.addEventListener("touchend", () => {
    if (!pullRefreshState.active) return;
    const shouldRefresh = pullRefreshState.distance > 72;
    pullRefreshState.active = false;
    pullRefreshState.distance = 0;

    if (shouldRefresh) {
      refreshCurrentData().catch((error) => {
        dataMessage = `重新整理失敗：${error.message}`;
        document.body.classList.remove("pulling", "refreshing");
        document.documentElement.style.setProperty("--pull-distance", "0px");
        render();
      });
      return;
    }

    document.body.classList.remove("pulling");
    document.documentElement.style.setProperty("--pull-distance", "0px");
  });
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

  document.querySelectorAll("[data-topbar-view]").forEach((button) => {
    button.addEventListener("click", () => {
      requestView(button.dataset.topbarView);
    });
  });

  document.getElementById("coordinatorLogoutBtn").addEventListener("click", logoutCoordinator);

  initNotificationCenter();
  setupPullToRefresh();
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
