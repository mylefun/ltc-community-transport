const STORAGE_KEY = "ltc-community-transport-v2";
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
  "import_schedules",
  "update_system_settings",
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
  { name: "心安居", address: "壯圍鄉中央路2段265號", lat: 24.757, lng: 121.785 },
];

const releaseNotes = [
  {
    version: "v0.9.2",
    date: "2026-05-28",
    items: [
      "調整地理圍欄自動打卡偵測半徑由 100 公尺擴大至 300 公尺，提升定位偵測靈敏度",
      "優化同日來回行程的自動上車判定：增設預定上車前 30 分鐘時間段過濾，防範早上去程送達時誤觸下午回程自動上車",
    ],
  },
  {
    version: "v0.9.1",
    date: "2026-05-26",
    items: [
      "新增即時接送地圖「全螢幕模式」（放大/縮回切換，並支援 Escape 鍵快速退出）",
      "新增同目的地個案「鏈式路徑串聯」（A案到B案再到共同目的地，並支援回程鏈式路徑）",
      "新增 OSRM 真實汽車道路路徑繪製，取代原先直線路徑，並提供本地快取機制",
      "修復個案定位偏差問題，新增日照據點「心安居」精確坐標，並引入 OSM Nominatim 漸進式地理解析與本地 localStorage 快取",
      "修復地圖標記文字截斷不完整問題，將目的地與別名字數限制擴展至 20 個字元，完整保留門牌與號碼",
    ],
  },
  {
    version: "v0.9.0",
    date: "2026-05-25",
    items: [
      "新增地理圍欄自動打卡（Geofencing）：司機靠近接送地點 100 公尺內時自動偵測並彈出確認通知",
      "地理圍欄確認通知顯示 5 秒倒數進度條，可選擇「立即確認」或「本次忽略」",
      "自動比對接送地址座標（優先使用社區據點精確座標），到達接送地點或目的地均可觸發",
      "司機登入後自動啟動 GPS 持續追蹤（watchPosition），登出後自動清除追蹤節省電量",
      "同一班次同一事件（接到/送達）僅觸發一次通知，避免重複打卡",
      "GPS 精度不足時（>200 公尺）跳過觸發，確保打卡準確性",
      "不支援 GPS 或拒絕定位授權時，系統維持原有手動按鈕操作，不影響使用",
    ],
  },
  {
    version: "v0.8.0",

    date: "2026-05-24",
    items: [
      "新增個案「開始服務日期」及「結案日期」欄位，並於個案卡片顯眼處直接顯示",
      "優化接送排程介面，動作按鈕改為純圖示（圖標式）並支援懸浮說明以防文字重疊擠壓",
      "接送排程移除未選取時的藍色膠囊提示，保持名冊介面清爽簡約",
      "接送排程類型支援「唯讀與自動判定」，直接依據填寫單次日期或週期欄位切換類型並重置非必要欄位",
      "每週週期性排程無結束日期時，介面文字自動以「(持續無特定結束日)」識別呈現",
      "每週週期性排程強制「每週星期幾」項目為必填以防欄位漏填",
      "解決 Supabase 因 ID 前綴 (如 sch_) 導致的 400 儲存錯誤，已於前後端全面落實 UUID 格式淨化機制 (cleanId)",
      "個案及排程表單之「啟用回程接送」加粗並設為醒目紅色以引導設定，必填欄位標註紅色星號並維持同列",
    ],
  },
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
let lastRenderedView = null;
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

let selectedCaseTimeout = null;
function startSelectedCaseTimeout() {
  if (selectedCaseTimeout) {
    clearTimeout(selectedCaseTimeout);
    selectedCaseTimeout = null;
  }
  if (selectedCaseId) {
    selectedCaseTimeout = setTimeout(() => {
      selectedCaseId = "";
      refreshCases();
    }, 5000);
  }
}
function clearSelectedCaseTimeout() {
  if (selectedCaseTimeout) {
    clearTimeout(selectedCaseTimeout);
    selectedCaseTimeout = null;
  }
}

let selectedDriverTimeout = null;
function startSelectedDriverTimeout() {
  if (selectedDriverTimeout) {
    clearTimeout(selectedDriverTimeout);
    selectedDriverTimeout = null;
  }
  if (selectedDriverId) {
    selectedDriverTimeout = setTimeout(() => {
      selectedDriverId = "";
      refreshDrivers();
    }, 5000);
  }
}
function clearSelectedDriverTimeout() {
  if (selectedDriverTimeout) {
    clearTimeout(selectedDriverTimeout);
    selectedDriverTimeout = null;
  }
}

let selectedScheduleTimeout = null;
function startSelectedScheduleTimeout() {
  if (selectedScheduleTimeout) {
    clearTimeout(selectedScheduleTimeout);
    selectedScheduleTimeout = null;
  }
  if (selectedScheduleId) {
    selectedScheduleTimeout = setTimeout(() => {
      selectedScheduleId = "";
      refreshSchedulesView();
    }, 5000);
  }
}
function clearSelectedScheduleTimeout() {
  if (selectedScheduleTimeout) {
    clearTimeout(selectedScheduleTimeout);
    selectedScheduleTimeout = null;
  }
}
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
let flashTimeout = null;

// === Geofence Auto Check-in State ===
let GEOFENCE_RADIUS_METERS = Number(localStorage.getItem("ltc-geofence-radius") || "300"); // 觸發圍欄半徑（公尺）
let GEOFENCE_PRE_ARRIVE_WINDOW_MINUTES = Number(localStorage.getItem("ltc-geofence-pre-arrive-window") || "30"); // 允許提前偵測上車的最大時間（分鐘）
let GOOGLE_MAPS_API_KEY = localStorage.getItem("ltc-google-maps-api-key") || ""; // Google Maps API 金鑰
const GEOFENCE_COUNTDOWN_SECONDS = 5; // 自動確認倒數秒數
let geofenceWatchId = null;        // watchPosition 的 ID，登出時清除
let geofenceAlerted = new Set();   // 已觸發通知的 tripId+type key，避免重複觸發
let geofenceCountdownTimer = null; // 倒數計時器
let geofencePendingAction = null;  // 待確認的打卡動作 { trip, type, confirmFn }
let currentDriverGps = null;       // 司機當前 GPS 位置 { lat, lng, accuracy, timestamp }


let state = normalizeState(loadState());
state.serviceDate = todayKey();
state = normalizeState(state);
saveState();


function todayKey(date = new Date()) {
  const taipeiTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return taipeiTime.toISOString().slice(0, 10);
}

function localTime(date = new Date()) {
  const taipeiTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const hours = String(taipeiTime.getUTCHours()).padStart(2, "0");
  const minutes = String(taipeiTime.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function addMinutes(minutes) {
  return localTime(new Date(Date.now() + minutes * 60_000));
}

function add30MinutesToTimeString(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return "";
  let hours = parseInt(parts[0], 10);
  let minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return "";
  
  minutes += 30;
  if (minutes >= 60) {
    minutes -= 60;
    hours = (hours + 1) % 24;
  }
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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
  if (typeof dataMode !== "undefined" && dataMode === "supabase") {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  }
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

function normalizeAddressForCompare(addr) {
  if (!addr) return "";
  return String(addr)
    .replace(/\s+/g, "")
    .replace(/[|｜].*$/, "") // Strip alias
    .replace(/台/g, "臺");   // Standardize characters
}

function getAddressAlias(val, caseIdOrObj = null) {
  if (!val) return "";
  const parts = val.split(/[|｜]/);
  if (parts.length > 1) {
    return parts[0].trim();
  }
  
  const cleanAddress = parts[0].trim();
  const normClean = normalizeAddressForCompare(cleanAddress);
  
  // 1. Try to find in centrally managed communitySites
  const site = communitySites.find(s => {
    const normSiteName = normalizeAddressForCompare(s.name);
    const normSiteAddr = normalizeAddressForCompare(s.address);
    return (
      normClean === normSiteName ||
      normClean.includes(normSiteName) ||
      normClean === normSiteAddr ||
      normClean.includes(normSiteAddr) ||
      normSiteAddr.includes(normClean)
    );
  });
  
  if (site) {
    return site.name;
  }
  
  // 2. Try to find if it's the home address
  if (caseIdOrObj) {
    const person = typeof caseIdOrObj === "object" ? caseIdOrObj : getCase(caseIdOrObj);
    if (person && person.pickupAddress) {
      const normHome = normalizeAddressForCompare(person.pickupAddress);
      if (normClean === normHome || normClean.includes(normHome) || normHome.includes(normClean)) {
        return "住家";
      }
    }
  }
  
  // 3. Fallback: return a shortened clean version of the address
  return cleanAddress.replace(/宜蘭縣|台北市|中正區|壯圍鄉|五結鄉/g, "").substring(0, 20);
}

function getAddressReal(val) {
  if (!val) return "";
  const parts = val.split(/[|｜]/);
  return (parts[1] || parts[0]).trim();
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
      : `每週 · ${schedule.daysOfWeek.map((day) => weekdayLabels[day]).join("、") || "未選"}${schedule.endDate ? ` 至 ${schedule.endDate}` : " (持續無特定結束日)"}`;
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

  next.trips = next.trips.map((trip) => {
    const cid = trip.caseId || trip.case_id || "";
    return {
      pickupLocation: null,
      dropoffLocation: null,
      ...trip,
      serviceDate: trip.serviceDate || trip.service_date || "",
      caseId: cid,
      driverId: trip.driverId || trip.driver_id || "",
      scheduleId: trip.scheduleId || trip.schedule_id || "",
      pickupAddress: trip.pickupAddress || trip.pickup_address || next.cases.find((person) => person.id === cid)?.pickupAddress || "",
      destinationAddress: trip.destinationAddress || trip.destination_address || next.cases.find((person) => person.id === cid)?.destinationAddress || "",
    };
  });

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

  // 同步地理圍欄系統參數至運行變數，實現全系統即時同步
  if (value.settings) {
    next.settings = {
      geofenceRadius: Number(value.settings.geofenceRadius || value.settings.geofence_radius || 300),
      preArriveWindow: Number(value.settings.preArriveWindow || value.settings.pre_arrive_window || 30),
      googleMapsApiKey: value.settings.googleMapsApiKey || value.settings.google_maps_api_key || ""
    };
    GEOFENCE_RADIUS_METERS = next.settings.geofenceRadius;
    GEOFENCE_PRE_ARRIVE_WINDOW_MINUTES = next.settings.preArriveWindow;
    GOOGLE_MAPS_API_KEY = next.settings.googleMapsApiKey;
  } else {
    next.settings = { geofenceRadius: 300, preArriveWindow: 30, googleMapsApiKey: "" };
  }

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

  const chipContainer = document.getElementById("liveChipContainer");
  if (chipContainer) chipContainer.setAttribute("title", dataMessage);

  const topIcon = document.querySelector(".live-chip .connection-icon");
  if (topIcon) {
    topIcon.textContent = dataMode === "supabase" ? "cloud_done" : "cloud_queue";
  }

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
      homeLocation: { lat: 24.757, lng: 121.785 },
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
      homeLocation: { lat: 24.757, lng: 121.785 },
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
      homeLocation: { lat: 24.757, lng: 121.785 },
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
      serviceArea: "壯圍鄉",
      careManager: "陳個管員",
      careManagerPhone: "02-2345-9901",
      pickupAddress: "宜蘭縣壯圍鄉古亭路48-16號",
      destinationAddress: "壯圍鄉中央路2段265號",
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
      serviceArea: "壯圍鄉",
      careManager: "林個管員",
      careManagerPhone: "02-2755-7120",
      pickupAddress: "宜蘭縣壯圍鄉美功路一段 80 巷 21 號",
      destinationAddress: "壯圍鄉中央路2段265號",
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
      serviceArea: "壯圍鄉",
      careManager: "黃個管員",
      careManagerPhone: "02-2368-6722",
      pickupAddress: "宜蘭縣壯圍鄉永美路二段 121 號",
      destinationAddress: "壯圍鄉中央路2段265號",
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
      serviceArea: "壯圍鄉",
      careManager: "吳個管員",
      careManagerPhone: "02-2302-7116",
      pickupAddress: "宜蘭縣壯圍鄉新社路 54-3 號",
      destinationAddress: "壯圍鄉中央路2段265號",
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
      serviceArea: "壯圍鄉",
      careManager: "蔡個管員",
      careManagerPhone: "02-2558-7168",
      pickupAddress: "壯圍鄉中央路2段265號",
      destinationAddress: "壯圍鄉中央路2段265號",
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
      pickupLocation: { lat: 24.77218, lng: 121.80029, accuracy: 24, source: "demo" },
      dropoffTime: addMinutes(-24),
      dropoffAt: new Date(Date.now() - 24 * 60_000).toISOString(),
      dropoffLocation: { lat: 24.757, lng: 121.785, accuracy: 22, source: "demo" },
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
      pickupLocation: { lat: 24.77088, lng: 121.78335, accuracy: 20, source: "demo" },
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
    settings: { geofenceRadius: 300, preArriveWindow: 30, googleMapsApiKey: "" },
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
  const base = { lat: 24.757, lng: 121.785 }; // 壯圍鄉中央路2段265號
  const seed = `${driverId}${tripId}${new Date().getMinutes()}`;
  const drift = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  let latOffset = ((drift % 15) - 7) * 0.0001;
  let lngOffset = ((drift % 11) - 5) * 0.0001;
  
  // 保證在上車 (pickup) 與送達 (dropoff) 模擬定位時，能拉開數百公尺的合理地理差距，以使地圖呈現更真實
  if (tripId.includes("pickup")) {
    latOffset += 0.006;  // 約往北 660 公尺
    lngOffset -= 0.006;  // 約往西 660 公尺
  } else if (tripId.includes("dropoff")) {
    latOffset -= 0.006;  // 約往南 660 公尺
    lngOffset += 0.006;  // 約往東 660 公尺
  }
  
  return {
    lat: Number((base.lat + latOffset).toFixed(6)),
    lng: Number((base.lng + lngOffset).toFixed(6)),
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
  if (trip.serviceDate < todayKey()) return true;
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

function getTripStatusLabel(trip) {
  const status = getTripStatus(trip);
  if (status === "late" && trip.serviceDate < todayKey()) {
    return "異常";
  }
  return statusLabels[status] || status;
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
  // Dynamic navigation list rendering
  const navList = document.querySelector(".nav-list");
  if (navList) {
    if (coordinatorUnlocked && activeView !== "home") {
      navList.innerHTML = `
        <button class="nav-item" data-view="dashboard" aria-label="即時動態">
          <span class="material-symbols-outlined" aria-hidden="true">dashboard</span>
          <b>即時動態</b>
        </button>
        <button class="nav-item" data-view="cases" aria-label="個案">
          <span class="material-symbols-outlined" aria-hidden="true">accessible_forward</span>
          <b>個案</b>
        </button>
        <button class="nav-item" data-view="drivers" aria-label="司機">
          <span class="material-symbols-outlined" aria-hidden="true">airport_shuttle</span>
          <b>司機</b>
        </button>
        <button class="nav-item" data-view="schedules" aria-label="排班">
          <span class="material-symbols-outlined" aria-hidden="true">event_repeat</span>
          <b>排班</b>
        </button>
        <button class="nav-item" data-view="reimbursements" aria-label="核銷">
          <span class="material-symbols-outlined" aria-hidden="true">payments</span>
          <b>核銷</b>
        </button>
      `;
    } else {
      navList.innerHTML = `
        <button class="nav-item" data-view="home" aria-label="主入口">
          <span class="material-symbols-outlined" aria-hidden="true">home</span>
          <b>主入口</b>
        </button>
        <button class="nav-item" data-view="dashboard" aria-label="承辦人入口">
          <span class="material-symbols-outlined" aria-hidden="true">dashboard</span>
          <b>承辦人入口</b>
        </button>
        <button class="nav-item" data-view="driver" aria-label="司機入口">
          <span class="material-symbols-outlined" aria-hidden="true">route</span>
          <b>司機入口</b>
        </button>
      `;
    }
    // Re-bind click event listeners to the dynamically generated navigation items
    navList.querySelectorAll(".nav-item").forEach((button) => {
      button.addEventListener("click", () => {
        requestView(button.dataset.view);
      });
    });
  }

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === activeView);
  });
  const visibleView = protectedViews.has(activeView) && !coordinatorUnlocked ? "coordinatorGate" : activeView;
  const viewChanged = (visibleView !== lastRenderedView);
  lastRenderedView = visibleView;

  const appView = document.getElementById("appView");
  if (appView && viewChanged) {
    appView.classList.remove("view-fade-in");
  }

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

  if (appView && viewChanged) {
    void appView.offsetWidth; // Force reflow
    appView.classList.add("view-fade-in");
  }
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

  const menuBadge = document.getElementById("topbarMenuBadge");
  if (menuBadge) {
    menuBadge.textContent = unreadCount;
    menuBadge.hidden = unreadCount === 0;
  }

  if (notifications.length === 0) {
    list.innerHTML = '<div class="empty-state">尚無系統通知紀錄。</div>';
    return;
  }

  list.innerHTML = notifications
    .map((n) => {
      const timeStr = new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
      const statusIcon = n.success ? "check_circle" : "cancel";
      const itemClass = n.success ? "success" : "failure";
      return `
        <div class="notification-item ${itemClass} ${n.read ? "read" : ""}" data-notification-id="${escapeHTML(n.id)}">
          <span class="material-symbols-outlined status-icon" aria-hidden="true">${statusIcon}</span>
          <div class="notif-content" style="flex: 1; display: flex; flex-direction: row; justify-content: space-between; align-items: flex-start; gap: 12px; min-width: 0;">
            <p class="notif-text" style="font-size: 13px; line-height: 1.4; color: var(--ink); margin: 0; min-width: 0; word-break: break-all;">${escapeHTML(n.text)}</p>
            <span class="notif-time" style="font-size: 11px; color: var(--muted); font-family: 'Hanken Grotesk', sans-serif; white-space: nowrap; flex-shrink: 0; margin-top: 2px;">${timeStr}</span>
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

  if (flashTimeout) {
    clearTimeout(flashTimeout);
  }
  if (message) {
    flashTimeout = setTimeout(() => {
      flashMessage = "";
      renderFlash();
    }, 3000);
  }
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
  clearSelectedCaseTimeout();
  clearSelectedDriverTimeout();
  clearSelectedScheduleTimeout();
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
    const deleteBtn = event.target.closest(".delete-trip-btn");
    if (deleteBtn) {
      const tripId = deleteBtn.dataset.tripId;
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
      return;
    }

    if (event.target.closest(".driver-select") || event.target.closest(".google-maps-link")) {
      return;
    }

    const row = event.target.closest(".ride-row");
    if (row) {
      const tripId = row.dataset.tripId;
      if (tripId) {
        showTripDetails(tripId);
      }
    }
  });
}

function scheduleDaysText(schedule) {
  if (schedule.scheduleType === "single") {
    return schedule.serviceDate ? `單次 · ${schedule.serviceDate}` : "單次 · 未定日期";
  }
  const days = (schedule.daysOfWeek || []).map((day) => weekdayLabels[day]).join("、") || "未選";
  const startPart = schedule.startDate ? ` · ${schedule.startDate}` : "";
  const endPart = schedule.endDate ? ` 至 ${schedule.endDate}` : " (持續無特定結束日)";
  return `每週 · ${days}${startPart}${endPart}`;
}

function scheduleCard(schedule) {
  const caseItem = getCase(schedule.caseId);
  const driverItem = getDriver(schedule.driverId);
  const selected = schedule.id === selectedScheduleId;
  const overrideCount = (schedule.dateOverrides || []).length;
  const statusClass = schedule.status === "paused" ? "waiting" : schedule.status === "stopped" ? "alert" : "done";

  const pickupAddr = schedule.pickupAddress || caseItem?.pickupAddress || "";
  const destAddr = schedule.destinationAddress || caseItem?.destinationAddress || caseItem?.pickupAddress || "";
  const routeParams = new URLSearchParams({ api: "1", travelmode: "driving" });
  if (pickupAddr) routeParams.set("origin", getAddressReal(pickupAddr));
  routeParams.set("destination", getAddressReal(destAddr || pickupAddr));
  const routeUrl = `https://www.google.com/maps/dir/?${routeParams.toString()}`;

  const actions = selected
    ? `
      <div class="task-actions case-actions-panel" aria-label="${escapeHTML(caseItem?.name || "排程")} 操作選項">
        <button class="primary-btn" type="button" data-schedule-action="edit" data-schedule-id="${escapeHTML(schedule.id)}" title="編輯排程" aria-label="編輯排程">
          <span class="material-symbols-outlined" aria-hidden="true">edit</span>
        </button>
        <button class="ghost-btn" type="button" data-schedule-action="toggle" data-schedule-id="${escapeHTML(schedule.id)}" title="${schedule.status === "active" ? "暫停排程" : "恢復排程"}" aria-label="${schedule.status === "active" ? "暫停排程" : "恢復排程"}">
          <span class="material-symbols-outlined" aria-hidden="true">${schedule.status === "active" ? "pause" : "play_arrow"}</span>
        </button>
        <button class="secondary-btn" type="button" data-schedule-action="override" data-schedule-id="${escapeHTML(schedule.id)}" title="例外變更" aria-label="例外變更">
          <span class="material-symbols-outlined" aria-hidden="true">rule</span>
        </button>
        <button class="danger-btn" type="button" data-schedule-action="stop" data-schedule-id="${escapeHTML(schedule.id)}" title="提前停止" aria-label="提前停止">
          <span class="material-symbols-outlined" aria-hidden="true">stop_circle</span>
        </button>
        <button class="danger-btn" type="button" data-schedule-action="delete" data-schedule-id="${escapeHTML(schedule.id)}" title="刪除排程" aria-label="刪除排程">
          <span class="material-symbols-outlined" aria-hidden="true">delete</span>
        </button>
      </div>
    `
    : ``;

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
        <p class="subtext case-address-line">目的地：<strong>${escapeHTML(getAddressAlias(schedule.destinationAddress || "", caseItem))}</strong>
          <a class="inline-map-btn" href="${escapeHTML(routeUrl)}" target="_blank" rel="noopener" aria-label="開啟 ${escapeHTML(caseItem?.name || "排程")} 接送路徑">
            <span class="material-symbols-outlined" aria-hidden="true">map</span>
          </a>
        </p>
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
  const singleLabel = form.elements.serviceDate?.closest("label");
  const startLabel = form.elements.startDate?.closest("label");
  const endLabel = form.elements.endDate?.closest("label");
  const weekdayFieldset = form.querySelector(".weekday-fieldset");
  if (singleLabel) singleLabel.hidden = false;
  if (startLabel) startLabel.hidden = false;
  if (endLabel) endLabel.hidden = false;
  if (weekdayFieldset) weekdayFieldset.hidden = false;
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
    form.elements.startDate.value = "";
    form.elements.endDate.value = "";
    [...form.querySelectorAll('input[name="daysOfWeek"]')].forEach((item) => {
      item.checked = false;
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
  const isWeekly = schedule.scheduleType === "weekly";
  form.elements.scheduleType.value = schedule.scheduleType || "single";
  form.elements.serviceDate.value = isWeekly ? "" : (schedule.serviceDate || state.serviceDate || todayKey());
  form.elements.startDate.value = isWeekly ? (schedule.startDate || state.serviceDate || todayKey()) : "";
  form.elements.endDate.value = isWeekly ? (schedule.endDate || "") : "";
  [...form.querySelectorAll('input[name="daysOfWeek"]')].forEach((item) => {
    item.checked = isWeekly ? (schedule.daysOfWeek || []).includes(Number(item.value)) : false;
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

function isSchedulePast(schedule) {
  const today = state.serviceDate || todayKey();
  if (schedule.scheduleType === "single") {
    return schedule.serviceDate && schedule.serviceDate < today;
  } else if (schedule.scheduleType === "weekly") {
    return schedule.endDate && schedule.endDate < today;
  }
  return false;
}

function renderScheduleManager() {
  const list = document.getElementById("scheduleList");
  if (!list) return;

  if (editingScheduleId && !state.schedules.some((item) => item.id === editingScheduleId)) {
    editingScheduleId = "";
  }
  if (selectedScheduleId && !state.schedules.some((item) => item.id === selectedScheduleId)) {
    selectedScheduleId = "";
    clearSelectedScheduleTimeout();
  }

  const activeSchedules = state.schedules.filter((s) => !isSchedulePast(s));
  document.getElementById("scheduleCount").textContent = `${activeSchedules.length} 筆排程`;
  list.innerHTML = activeSchedules.length
    ? activeSchedules.map(scheduleCard).join("")
    : '<div class="empty-state">目前還沒有進行中的排程，先新增單次或週期班次。</div>';

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

  const schedForm = document.getElementById("scheduleForm");
  if (schedForm) {
    const pickupInput = schedForm.elements.scheduledPickup;
    const dropoffInput = schedForm.elements.scheduledDropoff;
    if (pickupInput && dropoffInput) {
      pickupInput.addEventListener("input", (e) => {
        const val = e.target.value;
        if (val) {
          dropoffInput.value = add30MinutesToTimeString(val);
        }
      });
    }

    const pickupReturnInput = schedForm.elements.scheduledPickupReturn;
    const dropoffReturnInput = schedForm.elements.scheduledDropoffReturn;
    if (pickupReturnInput && dropoffReturnInput) {
      pickupReturnInput.addEventListener("input", (e) => {
        const val = e.target.value;
        if (val) {
          dropoffReturnInput.value = add30MinutesToTimeString(val);
        }
      });
    }
  }

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
    clearSelectedScheduleTimeout();
    refreshSchedulesView();
  });

  const importScheduleBtn = document.getElementById("importScheduleBtn");
  if (importScheduleBtn) {
    importScheduleBtn.addEventListener("click", () => {
      document.getElementById("csvImportPanel").hidden = false;
      document.getElementById("importPreviewContainer").style.display = "none";
      document.getElementById("csvFileInput").value = "";
    });
  }

  const csvImportCloseBtn = document.getElementById("csvImportCloseBtn");
  if (csvImportCloseBtn) {
    csvImportCloseBtn.addEventListener("click", () => {
      document.getElementById("csvImportPanel").hidden = true;
    });
  }

  const downloadTemplateBtn = document.getElementById("downloadTemplateBtn");
  if (downloadTemplateBtn) {
    downloadTemplateBtn.addEventListener("click", downloadCSVScheduleTemplate);
  }

  const selectCsvFileBtn = document.getElementById("selectCsvFileBtn");
  const csvFileInput = document.getElementById("csvFileInput");
  if (selectCsvFileBtn && csvFileInput) {
    selectCsvFileBtn.addEventListener("click", () => {
      csvFileInput.click();
    });
    csvFileInput.addEventListener("change", handleCsvFileSelect);
  }

  const confirmImportBtn = document.getElementById("confirmImportBtn");
  if (confirmImportBtn) {
    confirmImportBtn.addEventListener("click", handleConfirmImport);
  }

  const cancelImportBtn = document.getElementById("cancelImportBtn");
  if (cancelImportBtn) {
    cancelImportBtn.addEventListener("click", () => {
      document.getElementById("csvImportPanel").hidden = true;
    });
  }

  document.getElementById("scheduleForm").addEventListener("submit", handleScheduleSubmit);
  document.getElementById("scheduleCancelBtn").addEventListener("click", () => {
    editingScheduleId = "";
    scheduleFormOpen = false;
    refreshSchedulesView();
  });
  const scheduleTypeSelect = document.getElementById("scheduleTypeSelect");
  if (scheduleTypeSelect) {
    scheduleTypeSelect.addEventListener("change", updateScheduleFormMode);
  }

  // Auto-infer scheduleType based on Date inputs and Weekday selections
  const form = document.getElementById("scheduleForm");
  if (form) {
    const serviceDateInput = form.elements.serviceDate;
    const startDateInput = form.elements.startDate;
    const endDateInput = form.elements.endDate;
    const daysOfWeekCheckboxes = form.querySelectorAll('input[name="daysOfWeek"]');

    if (serviceDateInput) {
      serviceDateInput.addEventListener("input", () => {
        if (serviceDateInput.value) {
          if (scheduleTypeSelect) scheduleTypeSelect.value = "single";
          if (startDateInput) startDateInput.value = "";
          if (endDateInput) endDateInput.value = "";
          [...daysOfWeekCheckboxes].forEach(cb => cb.checked = false);
        }
      });
    }

    const handleWeeklyInteraction = () => {
      if (scheduleTypeSelect) scheduleTypeSelect.value = "weekly";
      if (serviceDateInput) serviceDateInput.value = "";
    };

    if (startDateInput) {
      startDateInput.addEventListener("input", handleWeeklyInteraction);
    }
    if (endDateInput) {
      endDateInput.addEventListener("input", handleWeeklyInteraction);
    }
    [...daysOfWeekCheckboxes].forEach(cb => {
      cb.addEventListener("change", handleWeeklyInteraction);
    });
  }
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
    scheduleType: document.getElementById("scheduleTypeSelect")?.value || String(form.get("scheduleType") || "single"),
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
  const errors = [];

  if (!schedule.caseId) {
    errors.push("【個案】為必填欄位：請點選下拉選單選擇一位服務個案。");
  }
  if (!schedule.driverId) {
    errors.push("【指派司機】為必填欄位：請點選下拉選單指派一位司機及車輛。");
  }

  if (schedule.scheduleType === "single") {
    if (!schedule.serviceDate) {
      errors.push("【單次日期】為必填欄位：因為排程類型是「單次」，請填寫具體的接送服務日期。");
    }
  } else if (schedule.scheduleType === "weekly") {
    if (!schedule.startDate) {
      errors.push("【起始日期】為必填欄位：因為排程類型是「每週週期」，請填寫排班何時開始生效。");
    }
    if (!schedule.daysOfWeek || schedule.daysOfWeek.length === 0) {
      errors.push("【每週星期】為必填欄位：因為排程類型是「每週週期」，請至少勾選一個重複的星期（例如星期一、星期三）。");
    }
  }

  if (!schedule.scheduledPickup) {
    errors.push("【預定上車時間】為必填欄位：請點選輸入預定接送上車的時間（例如 08:30）。");
  }
  if (!schedule.destinationAddress) {
    errors.push("【目的地】為必填欄位：請輸入送達地址或選擇一個社區據點。");
  }

  if (errors.length > 0) {
    return "💡 請檢查以下必填欄位尚未填寫：" + errors.map((err, i) => `${i + 1}. ${err}`).join("、");
  }

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

  // Create loading overlay in schedule form panel
  const card = document.querySelector("#scheduleFormPanel .modal-card");
  let loadingOverlay = null;
  if (card) {
    loadingOverlay = document.createElement("div");
    loadingOverlay.className = "form-loading-overlay";
    loadingOverlay.innerHTML = `
      <div class="loader-spinner"></div>
      <div class="loader-text">處理中，請稍候...</div>
    `;
    card.appendChild(loadingOverlay);
  }

  // Ensure beautiful processing animation is visible for at least 1 second
  await new Promise((resolve) => setTimeout(resolve, 1000));

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
      if (loadingOverlay) loadingOverlay.remove();
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
    startSelectedScheduleTimeout();
    return;
  }

  clearSelectedScheduleTimeout();
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

// Cache for OSRM road routes (key = "lng1,lat1;lng2,lat2;...")
const osrmRouteCache = new Map();

/**
 * Fetch a road route from OSRM public API.
 * Returns an array of [lat, lng] pairs, or null on failure.
 */
async function fetchOsrmRoute(waypoints) {
  // waypoints: array of {lat, lng}
  if (waypoints.length < 2) return null;
  const coords = waypoints.map((w) => `${Number(w.lng).toFixed(6)},${Number(w.lat).toFixed(6)}`).join(";");
  if (osrmRouteCache.has(coords)) return osrmRouteCache.get(coords);

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("OSRM no route");
    // GeoJSON coords are [lng, lat] — convert to [lat, lng] for Leaflet
    const latLngs = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    osrmRouteCache.set(coords, latLngs);
    return latLngs;
  } catch {
    osrmRouteCache.set(coords, null); // cache failure to avoid retries
    return null;
  }
}

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
      center: [24.757, 121.785],
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
  const isFullscreen = container.closest(".map-section")?.classList.contains("map-fullscreen");
  controlsDiv.innerHTML = `
    <button class="map-control-btn" type="button" data-map-action="zoom-out" aria-label="縮小地圖">−</button>
    <output class="map-zoom-label" aria-label="目前縮放倍率">${scalePct}%</output>
    <button class="map-control-btn" type="button" data-map-action="zoom-in" aria-label="放大地圖">+</button>
    <button class="map-reset-btn" type="button" data-map-action="reset">重設</button>
    <button class="map-control-btn map-fullscreen-btn" type="button" data-map-action="fullscreen" aria-label="${isFullscreen ? "縮回地圖" : "全螢幕地圖"}" title="${isFullscreen ? "縮回" : "全螢幕"}">
      <span class="material-symbols-outlined" style="font-size:18px;">${isFullscreen ? "close_fullscreen" : "open_in_full"}</span>
    </button>
  `;
  container.appendChild(controlsDiv);

  const helpDiv = document.createElement("div");
  helpDiv.className = "map-help";
  helpDiv.textContent = "拖曳平移 · 滾輪縮放 · 路徑顯示接送順序";
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
    } else if (action === "fullscreen") {
      toggleMapFullscreen();
    }
  });

  // Schedule size invalidation to run after the browser handles layout
  setTimeout(() => {
    leafletMapInstance.invalidateSize();
  }, 0);

  // Update data layers
  updateLeafletData();
}

function toggleMapFullscreen() {
  const container = document.getElementById("liveMap");
  if (!container) return;
  const mapSection = container.closest(".map-section");
  if (!mapSection) return;
  const isFullscreen = mapSection.classList.toggle("map-fullscreen");
  // Update the fullscreen button icon
  const btn = container.querySelector(".map-fullscreen-btn");
  if (btn) {
    const icon = btn.querySelector(".material-symbols-outlined");
    if (icon) icon.textContent = isFullscreen ? "close_fullscreen" : "open_in_full";
    btn.setAttribute("aria-label", isFullscreen ? "縮回地圖" : "全螢幕地圖");
    btn.setAttribute("title", isFullscreen ? "縮回" : "全螢幕");
  }
  // Ensure leaflet re-renders at new size
  setTimeout(() => {
    if (leafletMapInstance) leafletMapInstance.invalidateSize();
    fitAllMapBounds(true);
  }, 320);
}

async function updateLeafletData() {
  if (!leafletMapInstance) return;

  leafletMarkersGroup.clearLayers();
  leafletRoutesGroup.clearLayers();

  const allPoints = [];

  // Route color palette per driver index
  const routePalette = [
    { active: "#168052", scheduled: "#2764a5", late: "#be3f36" },
    { active: "#7B3FA0", scheduled: "#9C5BC4", late: "#be3f36" },
    { active: "#B85C00", scheduled: "#D98B3A", late: "#be3f36" },
    { active: "#0a6b7c", scheduled: "#1893a4", late: "#be3f36" },
    { active: "#5A7D10", scheduled: "#7FA820", late: "#be3f36" },
  ];

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

  // Helper: resolve a coordinate from trip/case data using real address
  function resolvePickupCoord(trip, idx, driverLocation, status) {
    if (idx === 0 && status === "picked_up" && driverLocation) return driverLocation;
    const person = getCase(trip.caseId);
    const addr = trip.pickupAddress || person?.pickupAddress || "";
    if (addr) return resolveCoordinate(addr, trip.caseId, "pickup");
    if (trip.pickupLocation?.lat) return trip.pickupLocation;
    return null;
  }

  function resolveDestCoord(trip) {
    const person = getCase(trip.caseId);
    const addr = trip.destinationAddress || person?.destinationAddress || "";
    if (addr) return resolveCoordinate(addr, trip.caseId, "destination");
    if (trip.dropoffLocation?.lat) return trip.dropoffLocation;
    return null;
  }

  // 2. Draw trip routes - grouped by driver to show A→B→C chained pickup paths
  const activeTrips = todayTrips().filter((trip) => getTripStatus(trip) !== "completed");

  // Pre-fetch/geocode any addresses that are not in cache or communitySites
  const pendingAddresses = new Set();
  todayTrips().forEach((trip) => {
    const person = getCase(trip.caseId);
    if (!person) return;
    const pickupAddr = trip.pickupAddress || person.pickupAddress || "";
    const destAddr = trip.destinationAddress || person.destinationAddress || "";
    if (pickupAddr) {
      const realPickup = getAddressReal(pickupAddr).trim();
      const hasSite = communitySites.some(s => 
        (s.name && realPickup.includes(s.name)) || 
        (s.address && realPickup.includes(s.address)) || 
        (s.address && s.address.includes(realPickup))
      );
      if (!hasSite && !geocodingCache[realPickup]) {
        pendingAddresses.add(pickupAddr);
      }
    }
    if (destAddr) {
      const realDest = getAddressReal(destAddr).trim();
      const hasSite = communitySites.some(s => 
        (s.name && realDest.includes(s.name)) || 
        (s.address && realDest.includes(s.address)) || 
        (s.address && s.address.includes(realDest))
      );
      if (!hasSite && !geocodingCache[realDest]) {
        pendingAddresses.add(destAddr);
      }
    }
  });

  if (pendingAddresses.size > 0) {
    (async () => {
      let resolvedAny = false;
      for (const addr of pendingAddresses) {
        const res = await geocodeAddress(addr);
        if (res) resolvedAny = true;
      }
      if (resolvedAny) {
        console.log("Geocoding cache updated, redrawing Leaflet map...");
        updateLeafletData();
      }
    })();
  }

  // Group trips by driverId, sorted by scheduledPickup time
  const tripsByDriver = {};
  activeTrips.forEach((trip) => {
    const driver = getDriver(trip.driverId);
    if (!driver) return;
    if (!tripsByDriver[driver.id]) tripsByDriver[driver.id] = [];
    tripsByDriver[driver.id].push(trip);
  });
  Object.values(tripsByDriver).forEach((trips) => {
    trips.sort((a, b) => a.scheduledPickup.localeCompare(b.scheduledPickup));
  });

  const driverIds = Object.keys(tripsByDriver);

  // Build all route groups first, then fetch OSRM routes in parallel
  const routeGroups = [];

  driverIds.forEach((driverId, driverIdx) => {
    const driver = getDriver(driverId);
    if (!driver) return;
    const trips = tripsByDriver[driverId];
    const palette = routePalette[driverIdx % routePalette.length];
    const driverLocation = state.driverLocations[driverId];

    // Group consecutive trips by destination address
    const destGroups = [];
    trips.forEach((trip) => {
      const destAddr = trip.destinationAddress || getCase(trip.caseId)?.destinationAddress || "";
      const last = destGroups[destGroups.length - 1];
      if (last && last.destAddr === destAddr) {
        last.trips.push(trip);
      } else {
        destGroups.push({ destAddr, trips: [trip] });
      }
    });

    destGroups.forEach((group) => {
      const groupTrips = group.trips;
      const waypoints = [];

      groupTrips.forEach((trip, idx) => {
        const person = getCase(trip.caseId);
        if (!person) return;
        const status = getTripStatus(trip);
        const coord = resolvePickupCoord(trip, idx, driverLocation, status);
        if (coord && coord.lat && coord.lng) {
          waypoints.push({
            latLng: [Number(coord.lat), Number(coord.lng)],
            coord: { lat: Number(coord.lat), lng: Number(coord.lng) },
            isPickup: true,
            trip,
            person,
            idx,
          });
          allPoints.push([Number(coord.lat), Number(coord.lng)]);
        }
      });

      const lastTrip = groupTrips[groupTrips.length - 1];
      const destCoord = resolveDestCoord(lastTrip);
      if (destCoord && destCoord.lat && destCoord.lng) {
        waypoints.push({
          latLng: [Number(destCoord.lat), Number(destCoord.lng)],
          coord: { lat: Number(destCoord.lat), lng: Number(destCoord.lng) },
          isPickup: false,
          trip: lastTrip,
          person: getCase(lastTrip.caseId),
          idx: groupTrips.length,
        });
        allPoints.push([Number(destCoord.lat), Number(destCoord.lng)]);
      }

      if (waypoints.length < 2) return;

      const hasActive = groupTrips.some((t) => getTripStatus(t) === "picked_up");
      const hasLate = groupTrips.some((t) => getTripStatus(t) === "late");

      routeGroups.push({ driver, groupTrips, waypoints, palette, hasActive, hasLate });
    });
  });

  // Fetch OSRM road routes for all groups in parallel
  await Promise.all(
    routeGroups.map(async (rg) => {
      rg.roadCoords = await fetchOsrmRoute(rg.waypoints.map((wp) => wp.coord));
    })
  );

  // Now draw all route groups
  routeGroups.forEach(({ driver, groupTrips, waypoints, palette, hasActive, hasLate, roadCoords }) => {
    const routeColor = hasLate ? palette.late : hasActive ? palette.active : palette.scheduled;
    const routeWeight = hasActive ? 4 : 3;
    const routeDash = hasActive ? null : "7, 5";

    // Draw polyline: use OSRM road geometry if available, else straight line
    const polylineCoords = roadCoords ?? waypoints.map((wp) => wp.latLng);
    const polyline = L.polyline(polylineCoords, {
      color: "#ff0000",      // 粗體紅色實線
      weight: 6,             // 粗體 (6px)
      dashArray: null,       // 實線
      opacity: 0.95,
      lineJoin: "round",
      lineCap: "round",
    });
    polyline.addTo(leafletRoutesGroup);

    // Draw stop markers
    waypoints.forEach((wp, wpIdx) => {
      const isLast = wpIdx === waypoints.length - 1;

      if (isLast) {
        const endDot = L.circleMarker(wp.latLng, {
          radius: 8,
          fillColor: "#fbc02d",
          fillOpacity: 1,
          color: "rgba(23,33,43,0.5)",
          weight: 2,
        });
        endDot.addTo(leafletRoutesGroup);

        const destName = (wp.trip.destinationAddress || getCase(wp.trip.caseId)?.destinationAddress || "目的地")
          .replace(/宜蘭縣|台北市|壯圍鄉|五結鄉|羅東鎮/g, "").substring(0, 20);
        const destLabelMarker = L.marker(wp.latLng, {
          icon: L.divIcon({
            className: "route-label-leaflet",
            html: `<div class="route-stop-label dest-label">🏁 ${escapeHTML(destName)}</div>`,
            iconSize: null,
            iconAnchor: [40, -6],
          }),
          interactive: false,
        });
        destLabelMarker.addTo(leafletRoutesGroup);
      } else {
        const stopColor = (wpIdx === 0 && hasActive) ? routeColor : "#ffffff";
        const startDot = L.circleMarker(wp.latLng, {
          radius: 8,
          fillColor: stopColor,
          fillOpacity: 1,
          color: routeColor,
          weight: 2.5,
        });
        startDot.addTo(leafletRoutesGroup);

        const stopLetter = groupTrips.length > 1 ? String.fromCharCode(65 + wpIdx) : "";
        const stopLabel = `${stopLetter ? stopLetter + ". " : ""}${(wp.person?.name || "").substring(0, 20)}`;
        const stopMarker = L.marker(wp.latLng, {
          icon: L.divIcon({
            className: "route-label-leaflet",
            html: `<div class="route-stop-label pickup-label" style="border-color:${routeColor};">${escapeHTML(stopLabel)}</div>`,
            iconSize: null,
            iconAnchor: [40, -6],
          }),
          interactive: false,
        });
        stopMarker.addTo(leafletRoutesGroup);
      }
    });

    // Mid-segment driver label tag
    for (let i = 0; i < waypoints.length - 1; i++) {
      const midLatLng = [
        (waypoints[i].latLng[0] + waypoints[i + 1].latLng[0]) / 2,
        (waypoints[i].latLng[1] + waypoints[i + 1].latLng[1]) / 2,
      ];
      const driverInitial = driver.name.slice(0, 1);
      const segLabel = groupTrips.length > 1
        ? `${driverInitial}→${String.fromCharCode(65 + (i + 1 < groupTrips.length ? i + 1 : groupTrips.length - 1))}`
        : driverInitial;
      L.marker(midLatLng, {
        icon: L.divIcon({
          className: "route-label-leaflet",
          html: `<span class="route-segment-tag" style="background:${routeColor}">${escapeHTML(segLabel)}</span>`,
          iconSize: null,
          iconAnchor: [14, 10],
        }),
        interactive: false,
      }).addTo(leafletRoutesGroup);
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
    const pickupAddr = trip.pickupAddress || person.pickupAddress || "";
    const destAddr = trip.destinationAddress || person.destinationAddress || "";
    const pickup = trip.pickupLocation ?? (pickupAddr ? resolveCoordinate(pickupAddr, trip.caseId, "pickup") : null);
    const destination = trip.dropoffLocation ?? (destAddr ? resolveCoordinate(destAddr, trip.caseId, "destination") : null);
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
    // Default fallback center to Zhuangwei
    leafletMapInstance.setView([24.757, 121.785], 12);
  }
}

function caseCoordinate(caseId, type) {
  const known = {
    case_001: { pickup: { lat: 24.77218, lng: 121.80029 }, destination: { lat: 24.757, lng: 121.785 } }, // 古亭社區 -> 心安居
    case_002: { pickup: { lat: 24.77088, lng: 121.78335 }, destination: { lat: 24.757, lng: 121.785 } }, // 功勞社區 -> 心安居
    case_003: { pickup: { lat: 24.77782, lng: 121.78892 }, destination: { lat: 24.757, lng: 121.785 } }, // 美城社區 -> 心安居
    case_004: { pickup: { lat: 24.78592, lng: 121.80945 }, destination: { lat: 24.757, lng: 121.785 } }, // 新社社區 -> 心安居
    case_005: { pickup: { lat: 24.757, lng: 121.785 }, destination: { lat: 24.757, lng: 121.785 } },     // 心安居 -> 心安居
  };

  if (known[caseId]?.[type]) return known[caseId][type];
  const seed = [...`${caseId}-${type}`].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return {
    lat: Number((24.75 + (seed % 50) * 0.0011).toFixed(6)),
    lng: Number((121.77 + (seed % 75) * 0.0011).toFixed(6)),
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

const geocodingCacheKey = "shuttle_geocoding_cache";
let geocodingCache = {};
try {
  const cached = localStorage.getItem(geocodingCacheKey);
  if (cached) geocodingCache = JSON.parse(cached);
} catch (e) {
  console.error("Failed to load geocoding cache", e);
}

let activeGeocodingRequests = new Set();

async function geocodeAddress(address) {
  const cleanAddr = getAddressReal(address).trim();
  if (!cleanAddr) return null;
  
  if (geocodingCache[cleanAddr]) return geocodingCache[cleanAddr];
  if (activeGeocodingRequests.has(cleanAddr)) return null;
  activeGeocodingRequests.add(cleanAddr);

  let result = null;

  // 1. 優先嘗試後端 API 進行高精度定位 (若配置了 GOOGLE_MAPS_API_KEY 會使用 Google Geocoding；否則由後端發送請求，避免瀏覽器 CORS/429 限制)
  try {
    const response = await fetch("/api/state", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "geocode",
        payload: { 
          address: cleanAddr,
          googleMapsApiKey: GOOGLE_MAPS_API_KEY
        }
      })
    });
    if (response.ok) {
      const resData = await response.json();
      const geoResult = resData.state;
      if (geoResult && geoResult.lat && geoResult.lng) {
        result = { lat: geoResult.lat, lng: geoResult.lng };
        console.log(`[Geocode] Successfully geocoded "${cleanAddr}" via server-side API:`, result);
      }
    }
  } catch (err) {
    console.warn("[Geocode] Server-side geocoding request failed, falling back to client-side OSM:", err.message);
  }

  // 2. 備用方案：若後端 API 定位失敗，則於瀏覽器前端使用 Nominatim OSM 逐級搜尋 (作為保底防護)
  if (!result) {
    let realAddr = cleanAddr.replace(/巿/g, "市");
    
    if ((realAddr.includes("壯圍") || realAddr.includes("五結") || realAddr.includes("羅東") || realAddr.includes("宜蘭")) && !realAddr.includes("宜蘭縣")) {
      realAddr = "宜蘭縣" + realAddr;
    }

    let townshipFallback = "";
    const match = realAddr.match(/^(宜蘭縣|台北市)?(壯圍鄉|五結鄉|羅東鎮|宜蘭市|礁溪鄉|員山鄉|三星鄉|冬山鄉|蘇澳鎮|頭城鎮)/);
    if (match) {
      const county = match[1] || "宜蘭縣";
      const township = match[2];
      townshipFallback = county + township;
    }

    const steps = [
      realAddr,
      realAddr.replace(/(號)[\d樓\-室\s\/A-Za-z]+.*$/, "$1"),
      realAddr.replace(/\d+號.*$/, ""),
      realAddr.replace(/\d+巷.*$/, ""),
      realAddr.replace(/[\u4e00-\u9fa5]+(村|里)/, ""),
      townshipFallback
    ];

    const uniqueSteps = [...new Set(steps.map(s => s.trim()).filter(s => s.length > 3))];

    for (const query of uniqueSteps) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'AntigravityShuttleApp/1.0'
          }
        });
        const data = await res.json();
        if (data && data.length > 0) {
          result = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
          break;
        }
      } catch (e) {
        console.error(`Geocoding error for query "${query}":`, e);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  activeGeocodingRequests.delete(cleanAddr);

  if (result) {
    geocodingCache[cleanAddr] = result;
    try {
      localStorage.setItem(geocodingCacheKey, JSON.stringify(geocodingCache));
    } catch (e) {
      console.error("Failed to save geocoding cache", e);
    }
    return result;
  }
  return null;
}

function resolveCoordinate(address, caseId, type) {
  const realAddress = getAddressReal(address).trim();
  if (!realAddress) {
    return { lat: 24.757, lng: 121.785 };
  }

  const site = communitySites.find(s => 
    (s.name && realAddress.includes(s.name)) || 
    (s.address && realAddress.includes(s.address)) || 
    (s.address && s.address.includes(realAddress))
  );
  if (site) return { lat: site.lat, lng: site.lng };

  if (geocodingCache[realAddress]) {
    return geocodingCache[realAddress];
  }

  const isTaipei = /台北|新北|板橋|三重|中和|蘆洲|新莊|五股|土城|汐止|樹林|鶯歌|三峽|淡水|瑞芳/.test(realAddress);
  const seed = [...(realAddress || `${caseId}-${type}`)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  if (isTaipei) {
    return {
      lat: Number((25.018 + (seed % 70) * 0.0011).toFixed(6)),
      lng: Number((121.49 + (seed % 85) * 0.0011).toFixed(6)),
    };
  } else {
    // 預設為主要營運區域（宜蘭壯圍一帶），避免本地街路名因未寫縣市名而被誤定位至台北，造成地圖畫線過長
    return {
      lat: Number((24.75 + (seed % 50) * 0.0011).toFixed(6)),
      lng: Number((121.77 + (seed % 75) * 0.0011).toFixed(6)),
    };
  }
}

function getLocationName(address, isHome, caseId = null) {
  if (address && (address.includes("｜") || address.includes("|"))) {
    return getAddressAlias(address);
  }
  const alias = getAddressAlias(address, caseId);
  if (alias && alias !== address && alias !== "住家" && !/^\d/.test(alias)) {
    return alias;
  }
  if (isHome) return "自宅";
  const site = communitySites.find(s => address.includes(s.name) || s.address.includes(address) || address.includes(s.address));
  if (site) return site.name;
  for (const s of communitySites) {
    if (address.includes(s.name)) return s.name;
  }
  return address.replace(/宜蘭縣|台北市|中正區|壯圍鄉|五結鄉/g, "").substring(0, 20);
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
        "BD03、DA01使用-出發地": getAddressReal(depAddress),
        "BD03、DA01使用-目的地": getAddressReal(arrAddress),
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
    <article class="ride-row ${escapeHTML(status)}" data-trip-id="${escapeHTML(trip.id)}">
      <!-- Column 1: Time & Status -->
      <div class="ride-time-status">
        <strong class="time-val" style="font-family: monospace;">${escapeHTML(trip.scheduledPickup)} ~ ${escapeHTML(trip.scheduledDropoff)}</strong>
        <span class="status-pill ${escapeHTML(status)}">${escapeHTML(getTripStatusLabel(trip))}</span>
      </div>

      <!-- Column 2: Case Details -->
      <div class="ride-person">
        <div class="person-name-row">
          <strong class="person-name">${escapeHTML(person?.name ?? "未知個案")}</strong>
          <span class="purpose-badge">${escapeHTML(trip.purpose)}</span>
        </div>
      </div>

      <!-- Column 3: Driver & Tracking -->
      <div class="ride-dispatch">
        <div class="driver-assign-row">
          <label>
            <span>指派司機</span>
            <select class="driver-select" data-trip-id="${escapeHTML(trip.id)}">${options}</select>
          </label>
        </div>
      </div>

      <!-- Column 4: Route -->
      <div class="ride-route simplified" style="justify-content: center;">
        <a class="route-icon-btn google-maps-link" href="${escapeHTML(googleMapsRouteUrl(trip))}" target="_blank" rel="noopener" aria-label="開啟 Google 地圖路徑" title="開啟 Google 地圖路徑" style="flex-shrink: 0; margin: 0 auto;">
          <span class="material-symbols-outlined" style="font-size: 20px;" aria-hidden="true">map</span>
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

  const pickup = getAddressReal(trip.pickupAddress || person?.pickupAddress || "");
  if (pickup) {
    params.set("waypoints", pickup);
  }

  params.set("destination", getAddressReal(trip.destinationAddress || person?.destinationAddress || person?.pickupAddress || ""));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function googleMapsCaseRouteUrl(person) {
  const params = new URLSearchParams({
    api: "1",
    travelmode: "driving",
  });
  params.set("origin", getAddressReal(person.pickupAddress || ""));
  params.set("destination", getAddressReal(person.destinationAddress || person.pickupAddress || ""));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function renderCases(host = document.getElementById("appView")) {
  host.replaceChildren(document.getElementById("casesTemplate").content.cloneNode(true));

  if (selectedCaseId && !state.cases.some((person) => person.id === selectedCaseId)) {
    selectedCaseId = "";
    clearSelectedCaseTimeout();
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
    form.elements.destinationAddress.value = `${site.name}｜${site.address}`;
    const current = parseDestinations(form.elements.destinationsText.value, form.elements.destinationAddress.value);
    form.elements.destinationsText.value = destinationsToText([...current, { name: site.name, address: site.address }]);
    form.elements.tripDestination.value = `${site.name}｜${site.address}`;
  });

  document.getElementById("openCaseFormBtn").addEventListener("click", () => {
    editingCaseId = "";
    selectedCaseId = "";
    clearSelectedCaseTimeout();
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
    .map((item) => `<span class="destination-chip">${escapeHTML(getAddressReal(item.address || item.name))}</span>`)
    .join("");
  const actions = isSelected
    ? `
      <div class="task-actions case-actions-panel" aria-label="${escapeHTML(person.name)} 操作選項">
        <button class="primary-btn" type="button" data-action="edit" data-case-id="${escapeHTML(person.id)}" title="編輯個案" aria-label="編輯個案">
          <span class="material-symbols-outlined" aria-hidden="true">edit</span>
        </button>
        <button class="secondary-btn" type="button" data-action="schedule-manage" data-case-id="${escapeHTML(person.id)}" title="排班設定" aria-label="排班設定">
          <span class="material-symbols-outlined" aria-hidden="true">event_repeat</span>
        </button>
        <button class="ghost-btn" type="button" data-action="toggle" data-case-id="${escapeHTML(person.id)}" title="${person.active ? "停用個案" : "恢復服務"}" aria-label="${person.active ? "停用個案" : "恢復服務"}">
          <span class="material-symbols-outlined" aria-hidden="true">${person.active ? "pause" : "play_arrow"}</span>
        </button>
        <button class="danger-btn" type="button" data-action="delete" data-case-id="${escapeHTML(person.id)}" title="刪除個案" aria-label="刪除個案">
          <span class="material-symbols-outlined" aria-hidden="true">delete</span>
        </button>
      </div>
    `
    : ``;



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
        ${(person.serviceStartDate || person.serviceEndDate) ? `<p class="subtext" style="color: var(--brand-dark); font-weight: 600;">📅 ${escapeHTML(person.serviceStartDate ? `開服：${person.serviceStartDate}` : "")}${person.serviceStartDate && person.serviceEndDate ? " · " : ""}${escapeHTML(person.serviceEndDate ? `結案：${person.serviceEndDate}` : "")}</p>` : ""}
        <p class="subtext">服務區域：${escapeHTML(person.serviceArea || "未填")} · 福利身分：${escapeHTML(person.welfareStatus || "未填")} · 輔具：${escapeHTML(person.assistiveDevice || "未填")}</p>
        <div class="contact-block">
          <span class="subtext">緊急聯絡</span>
          <ul>${contactList}</ul>
        </div>
        <p class="subtext case-address-line">
          <span>上車：<strong>${escapeHTML(getAddressAlias(person.pickupAddress, person))}</strong></span>
        </p>
        <p class="subtext case-address-line">
          <span>目的地：<strong>${escapeHTML(getAddressAlias(person.destinationAddress, person))}</strong></span>
          <a class="inline-map-btn" href="${escapeHTML(routeUrl)}" target="_blank" rel="noopener" aria-label="開啟 ${escapeHTML(person.name)} 接送路徑">
            <span class="material-symbols-outlined" aria-hidden="true">map</span>
          </a>
        </p>
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
  form.elements.serviceStartDate.value = person.serviceStartDate || "";
  form.elements.serviceEndDate.value = person.serviceEndDate || "";
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
    serviceStartDate: String(form.get("serviceStartDate") || "").trim(),
    serviceEndDate: String(form.get("serviceEndDate") || "").trim(),
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
    startSelectedCaseTimeout();
    return;
  }

  clearSelectedCaseTimeout();
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
    clearSelectedDriverTimeout();
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
    clearSelectedDriverTimeout();
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
        <button class="primary-btn" type="button" data-action="edit" data-driver-id="${escapeHTML(driver.id)}" title="編輯司機" aria-label="編輯司機">
          <span class="material-symbols-outlined" aria-hidden="true">edit</span>
        </button>
        <button class="ghost-btn" type="button" data-action="toggle" data-driver-id="${escapeHTML(driver.id)}" title="${driver.active ? "停用司機" : "恢復服務"}" aria-label="${driver.active ? "停用司機" : "恢復服務"}">
          <span class="material-symbols-outlined" aria-hidden="true">${driver.active ? "pause" : "play_arrow"}</span>
        </button>
        <button class="danger-btn" type="button" data-action="delete" data-driver-id="${escapeHTML(driver.id)}" title="刪除司機" aria-label="刪除司機">
          <span class="material-symbols-outlined" aria-hidden="true">delete</span>
        </button>
      </div>
    `
    : ``;


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
    startSelectedDriverTimeout();
    return;
  }

  clearSelectedDriverTimeout();
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
        <h3>${escapeHTML(driver.name)} 今日接送 <span style="font-size: calc(15px * var(--user-font-scale)); opacity: 0.85; font-weight: normal; margin-left: 6px;">(${state.serviceDate || todayKey()})</span></h3>
      </div>
      <button class="ghost-btn" type="button" id="driverLogoutBtn" style="font-size: calc(14px * var(--user-font-scale));">登出</button>
    </section>
    
    <!-- GPS 診斷與模擬狀態卡片 -->
    ${renderGpsStatusCard()}

    <section class="driver-task-list">
      ${tasks.length ? tasks.map(renderDriverTask).join("") : '<div class="empty-state">目前沒有指派給你的接送班次。</div>'}
    </section>
  `;

  document.getElementById("driverLogoutBtn").addEventListener("click", () => {
    stopGeofenceWatcher();
    dismissGeofenceToast();
    activeDriverId = "";
    selectedLoginDriverId = "";
    renderDriver();
  });

  // 綁定 GPS 診斷卡片的事件監聽器
  const refreshBtn = document.getElementById("gpsRefreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", triggerGpsManualUpdate);
  }

  // 如果已經有全域 currentDriverGps 定位快取，立即將定位渲染到卡片中，讓司機有連貫感
  if (currentDriverGps) {
    updateGpsStatusCardDom(currentDriverGps.lat, currentDriverGps.lng, currentDriverGps.accuracy);
  }

  // 移除舊的監聽器再重新綁定，避免每次重渲染後累積多個 listener
  view.removeEventListener("click", handleDriverTaskClick);
  view.addEventListener("click", handleDriverTaskClick);

  // 啟動地理圍欄持續追蹤
  startGeofenceWatcher(activeDriverId);
}

function renderDriverTask(trip) {
  const person = getCase(trip.caseId);
  const status = getTripStatus(trip);
  const pickupDisabled = trip.pickupTime ? "disabled" : "";
  const dropoffDisabled = trip.dropoffTime ? "disabled" : "";

  const pickupAlias = getAddressAlias(trip.pickupAddress || person?.pickupAddress || "", person);
  const pickupReal = getAddressReal(trip.pickupAddress || person?.pickupAddress || "");
  const dropoffAlias = getAddressAlias(trip.destinationAddress || person?.destinationAddress || "", person);
  const dropoffReal = getAddressReal(trip.destinationAddress || person?.destinationAddress || "");

  const pickupActualText = trip.pickupTime ? ` (實際 ${trip.pickupTime})` : "";
  const dropoffActualText = trip.dropoffTime ? ` (實際 ${trip.dropoffTime})` : "";

  const mobilityText = person?.mobility ? `🏷️ ${person.mobility}` : "";
  const noteText = person?.note ? `📝 ${person.note}` : "";
  const badges = [mobilityText, noteText].filter(Boolean).join(" · ");

  return `
    <article class="driver-task">
      <div class="task-main">
        <div class="task-title-row">
          <div>
            <h4 style="font-size: 20px; font-weight: 800; color: var(--ink); margin-bottom: 4px;">${escapeHTML(person?.name ?? "未知個案")}</h4>
            ${badges ? `<p class="subtext" style="font-size: 13px; color: var(--muted); margin: 0;">${escapeHTML(badges)}</p>` : ""}
          </div>
          <span class="status-pill ${escapeHTML(status)}">${escapeHTML(getTripStatusLabel(trip))}</span>
        </div>
        
        <div class="route-timeline" style="display: grid; gap: 12px; margin: 8px 0; padding: 12px 14px; background: var(--surface-strong); border: 1px solid rgba(189, 201, 200, 0.4); border-radius: 14px; font-size: 14px;">
          
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%;">
            <div style="display: flex; align-items: flex-start; gap: 8px; flex: 1; min-width: 0;">
              <span style="color: var(--brand); font-weight: bold; font-size: 16px; margin-top: 1px;">•</span>
              <div style="flex: 1; min-width: 0;">
                <span style="font-weight: 800; color: var(--ink); display: block; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(trip.scheduledPickup)} ${escapeHTML(pickupAlias)}</span>
                ${pickupActualText ? `<span style="color: var(--brand); font-weight: 800; font-size: 12px; display: inline-block; margin-top: 2px;">已接 ${escapeHTML(trip.pickupTime)}</span>` : ""}
              </div>
            </div>
            <button class="primary-btn" type="button" data-action="pickup" data-trip-id="${escapeHTML(trip.id)}" ${pickupDisabled} style="padding: 6px 14px; min-height: 36px; height: 36px; border-radius: 18px; display: inline-flex; align-items: center; gap: 4px; box-shadow: none; flex-shrink: 0;" title="已接到個案" aria-label="已接到個案">
              <span class="material-symbols-outlined" style="font-size: 18px;">accessible_forward</span>
              <span style="font-size: 13px; font-weight: 800;">上車</span>
            </button>
          </div>
          
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%;">
            <div style="display: flex; align-items: flex-start; gap: 8px; flex: 1; min-width: 0;">
              <span style="color: var(--muted); font-weight: bold; font-size: 16px; margin-top: 1px;">▪</span>
              <div style="flex: 1; min-width: 0;">
                <span style="font-weight: 800; color: var(--ink); display: block; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(trip.scheduledDropoff)} ${escapeHTML(dropoffAlias)}</span>
                ${dropoffActualText ? `<span style="color: var(--green, #2e7d32); font-weight: 800; font-size: 12px; display: inline-block; margin-top: 2px;">已送達 ${escapeHTML(trip.dropoffTime)}</span>` : ""}
              </div>
            </div>
            <button class="secondary-btn" type="button" data-action="dropoff" data-trip-id="${escapeHTML(trip.id)}" ${dropoffDisabled} style="padding: 6px 14px; min-height: 36px; height: 36px; border-radius: 18px; display: inline-flex; align-items: center; gap: 4px; box-shadow: none; flex-shrink: 0;" title="已送達目的地" aria-label="已送達目的地">
              <span class="material-symbols-outlined" style="font-size: 18px;">check_circle</span>
              <span style="font-size: 13px; font-weight: 800;">送達</span>
            </button>
          </div>
          
        </div>
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
    button.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span><span style="font-size: 13px; font-weight: 800;">定位中</span>';
    const location = await captureDriverLocation(activeDriverId, trip.id, "pickup");
    if (dataMode === "supabase") {
      try {
        await apiAction("pickup", { tripId: trip.id, location, serviceDate: state.serviceDate });
        renderDriverWorkspace();
      } catch (error) {
        dataMessage = `打卡失敗：${error.message}`;
        addNotification(`接到打卡失敗：${error.message}`, false);
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

  if (button.dataset.action === "dropoff" && !trip.dropoffTime) {
    if (!trip.pickupTime) {
      showAutoPickupMakeupModal(trip, button);
      return;
    }
    button.disabled = true;
    button.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span><span style="font-size: 13px; font-weight: 800;">定位中</span>';
    const location = await captureDriverLocation(activeDriverId, trip.id, "dropoff");
    if (dataMode === "supabase") {
      try {
        await apiAction("dropoff", { tripId: trip.id, location, serviceDate: state.serviceDate });
        renderDriverWorkspace();
      } catch (error) {
        dataMessage = `打卡失敗：${error.message}`;
        addNotification(`送達打卡失敗：${error.message}`, false);
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

function getPlannedDurationMinutes(trip) {
  if (!trip.scheduledPickup || !trip.scheduledDropoff) return 30; // default to 30 mins
  const [p1, p2] = trip.scheduledPickup.split(":").map(Number);
  const [d1, d2] = trip.scheduledDropoff.split(":").map(Number);
  
  if (isNaN(p1) || isNaN(p2) || isNaN(d1) || isNaN(d2)) return 30;
  
  let duration = (d1 * 60 + d2) - (p1 * 60 + p2);
  if (duration <= 0) duration = 30; // fallback if invalid range
  return duration;
}

async function showAutoPickupMakeupModal(trip, button) {
  const plannedDuration = getPlannedDurationMinutes(trip);
  
  const now = new Date();
  const currentDropoffTimeStr = localTime(now);
  const estimatedPickupDate = new Date(now.getTime() - plannedDuration * 60 * 1000);
  let estimatedPickupTimeStr = localTime(estimatedPickupDate);
  
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "autoPickupModal";
  modal.style.zIndex = "2000";
  
  modal.innerHTML = `
    <div class="modal-card" style="max-width: 400px; width: 90%; text-align: center; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border: 1px solid var(--line, #e2e8f0); background: var(--surface, #ffffff);">
      <div class="modal-header" style="justify-content: center; border-bottom: none; padding-bottom: 0;">
        <span class="material-symbols-outlined" style="font-size: 48px; color: var(--brand-dark, #005a5a); margin-bottom: 12px;">warning</span>
      </div>
      <div class="modal-body" style="padding-top: 0; display: flex; flex-direction: column; gap: 16px;">
        <h3 style="margin: 0; color: var(--ink, #1e293b); font-size: 18px; font-weight: 800;">偵測到尚未紀錄上車時間</h3>
        <p style="margin: 0; color: var(--muted, #64748b); font-size: 14px; line-height: 1.5;">
          您已抵達目的地，系統已為您自動估算：
        </p>
        
        <div style="background: var(--surface, #f8fafc); border: 1px solid var(--line, #e2e8f0); border-radius: 12px; padding: 16px; text-align: left; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: var(--muted, #64748b); font-size: 14px;">預估上車時間</span>
            <strong id="autoPickupTimeLabel" style="color: var(--ink, #1e293b); font-size: 16px;">${estimatedPickupTimeStr}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: var(--muted, #64748b); font-size: 14px;">現在送達時間</span>
            <strong id="autoDropoffTimeLabel" style="color: var(--ink, #1e293b); font-size: 16px; font-weight: 800;">${currentDropoffTimeStr}</strong>
          </div>
        </div>
        
        <p style="margin: 0; color: var(--brand, #005a5a); font-size: 12px; font-weight: 600;">
          確認後系統將一鍵自動補齊上下車打卡！
        </p>
      </div>
      <div class="modal-footer" style="padding: 16px; border-top: none; display: flex; flex-direction: column; gap: 8px;">
        <button class="primary-btn" id="autoPickupConfirmBtn" style="width: 100%; min-height: 44px; font-weight: bold; justify-content: center;" type="button">確認一鍵補卡與送達</button>
        <button class="ghost-btn" id="autoPickupManualBtn" style="width: 100%; min-height: 44px; color: var(--muted, #64748b); justify-content: center;" type="button">手動修改上車時間</button>
        <button class="ghost-btn" id="autoPickupCancelBtn" style="width: 100%; min-height: 40px; color: var(--red, #ef4444); justify-content: center;" type="button">取消</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const confirmBtn = modal.querySelector("#autoPickupConfirmBtn");
  const manualBtn = modal.querySelector("#autoPickupManualBtn");
  const cancelBtn = modal.querySelector("#autoPickupCancelBtn");
  const timeLabel = modal.querySelector("#autoPickupTimeLabel");
  
  cancelBtn.addEventListener("click", () => {
    modal.remove();
  });
  
  manualBtn.addEventListener("click", () => {
    const inputTime = prompt("請輸入上車時間 (格式為 24小時制 HH:MM，如 10:15)：", estimatedPickupTimeStr);
    if (inputTime === null) return;
    
    const trimmed = inputTime.trim();
    const match = trimmed.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (!match) {
      alert("時間格式不正確，請輸入如 10:15 的 24 小時制時間。");
      return;
    }
    
    const formattedHour = String(match[1]).padStart(2, "0");
    const formattedMinute = String(match[2]).padStart(2, "0");
    estimatedPickupTimeStr = `${formattedHour}:${formattedMinute}`;
    timeLabel.textContent = estimatedPickupTimeStr;
  });
  
  confirmBtn.addEventListener("click", async () => {
    confirmBtn.disabled = true;
    manualBtn.disabled = true;
    cancelBtn.disabled = true;
    confirmBtn.textContent = "定位與補登中...";
    
    const serviceDate = state.serviceDate || todayKey();
    const pickupLocalIso = `${serviceDate}T${estimatedPickupTimeStr}:00+08:00`;
    const dropoffLocalIso = `${serviceDate}T${currentDropoffTimeStr}:00+08:00`;
    
    const pickupDate = new Date(pickupLocalIso);
    const dropoffDate = new Date(dropoffLocalIso);
    
    const pickupAtIso = isNaN(pickupDate.getTime()) ? new Date(now.getTime() - plannedDuration * 60 * 1000).toISOString() : pickupDate.toISOString();
    const dropoffAtIso = isNaN(dropoffDate.getTime()) ? now.toISOString() : dropoffDate.toISOString();
    
    const pickupLocation = await captureDriverLocation(activeDriverId, trip.id, "pickup");
    const dropoffLocation = await captureDriverLocation(activeDriverId, trip.id, "dropoff");
    
    if (dataMode === "supabase") {
      try {
        await apiAction("pickup", { 
          tripId: trip.id, 
          location: pickupLocation, 
          serviceDate: state.serviceDate,
          occurredAt: pickupAtIso
        });
        
        await apiAction("dropoff", { 
          tripId: trip.id, 
          location: dropoffLocation, 
          serviceDate: state.serviceDate,
          occurredAt: dropoffAtIso
        });
        
        addNotification(`已成功一鍵補登接送與送達！`, true);
      } catch (error) {
        dataMessage = `一鍵補登失敗：${error.message}`;
        addNotification(`一鍵補登失敗：${error.message}`, false);
      }
    } else {
      trip.pickupTime = estimatedPickupTimeStr;
      trip.pickupAt = pickupAtIso;
      trip.pickupLocation = pickupLocation;
      trip.status = "picked_up";
      
      state.events.push({
        id: uid("event"),
        tripId: trip.id,
        driverId: activeDriverId,
        type: "pickup",
        occurredAt: pickupAtIso,
        location: pickupLocation,
      });
      updateDriverLocation(activeDriverId, trip.id, "pickup", pickupAtIso, pickupLocation);
      
      trip.dropoffTime = currentDropoffTimeStr;
      trip.dropoffAt = dropoffAtIso;
      trip.dropoffLocation = dropoffLocation;
      trip.status = "completed";
      
      state.events.push({
        id: uid("event"),
        tripId: trip.id,
        driverId: activeDriverId,
        type: "dropoff",
        occurredAt: dropoffAtIso,
        location: dropoffLocation,
      });
      updateDriverLocation(activeDriverId, trip.id, "dropoff", dropoffAtIso, dropoffLocation);
      
      saveState();
      addNotification(`已成功一鍵補登接送與送達 (本機示範模式)！`, true);
    }
    
    modal.remove();
    renderDriverWorkspace();
  });
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

// ============================================================
// === 地理圍欄自動打卡（Geofencing Auto Check-in）          ===
// ============================================================

/**
 * 將地址解析為座標（公尺精度）
 * 優先查找 communitySites，其次用 resolveCoordinate 估算
 */
function resolveGeofenceCoord(address) {
  if (!address) return null;
  const realAddr = getAddressReal(address);
  // 1. 優先比對社區據點（有精確 lat/lng）
  const site = communitySites.find((s) => {
    const normSite = normalizeAddressForCompare(s.name);
    const normAddr = normalizeAddressForCompare(s.address);
    const normReal = normalizeAddressForCompare(realAddr);
    return (
      normReal === normSite ||
      normReal.includes(normSite) ||
      normReal === normAddr ||
      normReal.includes(normAddr) ||
      normAddr.includes(normReal)
    );
  });
  if (site) return { lat: site.lat, lng: site.lng };

  // 2. 嘗試用現有 resolveCoordinate 估算（適用住家地址）
  const estimated = resolveCoordinate(realAddr, "", "geofence");
  // 若估算結果明顯錯誤（零值），回傳 null
  if (!estimated || !estimated.lat || !estimated.lng) return null;
  return { lat: estimated.lat, lng: estimated.lng, estimated: true };
}

/**
 * 計算兩點之間的距離（單位：公尺）
 */
function haversineDistanceM(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6_371_000; // 地球半徑（公尺）
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * 預先背景解析司機今日行程之真實座標
 */
async function preloadDriverTripCoordinates(driverId) {
  if (!driverId) return;
  console.log(`[Geofence] Start preloading coordinates for driver ${driverId}`);
  const myTrips = todayTrips().filter((trip) => trip.driverId === driverId && getTripStatus(trip) !== "completed");
  
  for (const trip of myTrips) {
    const person = getCase(trip.caseId);
    if (!person) continue;
    const pickupAddr = trip.pickupAddress || person.pickupAddress || "";
    const destAddr = trip.destinationAddress || person.destinationAddress || "";
    
    if (pickupAddr) {
      const realPickup = getAddressReal(pickupAddr).trim();
      if (realPickup && !communitySites.some(s => realPickup.includes(s.name) || realPickup.includes(s.address)) && !geocodingCache[realPickup]) {
        console.log(`[Geofence] Geocoding pickup address: ${pickupAddr}`);
        await geocodeAddress(pickupAddr);
      }
    }
    if (destAddr) {
      const realDest = getAddressReal(destAddr).trim();
      if (realDest && !communitySites.some(s => realDest.includes(s.name) || realDest.includes(s.address)) && !geocodingCache[realDest]) {
        console.log(`[Geofence] Geocoding destination address: ${destAddr}`);
        await geocodeAddress(destAddr);
      }
    }
  }
  console.log(`[Geofence] Finished preloading coordinates for driver ${driverId}`);
  
  if (currentDriverGps) {
    updateGpsStatusCardDom(currentDriverGps.lat, currentDriverGps.lng, currentDriverGps.accuracy);
    checkGeofenceTriggers(currentDriverGps.lat, currentDriverGps.lng, driverId);
  }
}

/**
 * 繪製 GPS 定位狀態與診斷卡片 HTML
 */
function renderGpsStatusCard() {
  const driver = getDriver(activeDriverId);
  if (!driver) return "";

  return `
    <div class="gps-status-card" style="margin: 16px 0; padding: 16px; border-radius: 16px; background: var(--surface); border: 1px solid var(--line); display: flex; flex-direction: column; gap: 12px; box-shadow: var(--shadow-soft);">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="gps-status-dot pulse" id="gpsStatusDot" style="width: 10px; height: 10px; border-radius: 50%; background: #e2e8f0; display: inline-block;"></span>
          <strong style="font-size: 14px; color: var(--ink);">GPS 自動定位服務</strong>
        </div>
        <span id="gpsAccuracyLabel" style="font-size: 12px; color: var(--muted); font-weight: bold;">等待定位中...</span>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; border-top: 1px dashed var(--line); padding-top: 12px;">
        <div>
          <span style="color: var(--muted); display: block; margin-bottom: 2px;">目前經緯度</span>
          <span id="gpsCoordsText" style="font-family: monospace; font-weight: 800; color: var(--ink);">-</span>
        </div>
        <div>
          <span style="color: var(--muted); display: block; margin-bottom: 2px;">下個目標圍欄</span>
          <span id="gpsTargetName" style="font-weight: 800; color: var(--brand-dark); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">無進行中行程</span>
        </div>
        <div style="grid-column: span 2; display: flex; align-items: center; justify-content: space-between; background: var(--brand-soft); padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(0,90,90,0.06);">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="material-symbols-outlined" style="font-size: 16px; color: var(--brand);">near_me</span>
            <span style="color: var(--brand-dark); font-weight: 800;" id="gpsTargetDistanceText">距離目標：- 公尺</span>
          </div>
          <span id="gpsTargetTypeLabel" class="status-pill" style="font-size: 10px; padding: 2px 6px; font-weight: bold; background: rgba(0,0,0,0.05); color: var(--muted); height: auto; border: none;"></span>
        </div>
      </div>
      
      <div style="display: flex; gap: 8px; margin-top: 4px;">
        <button type="button" class="secondary-btn" id="gpsRefreshBtn" style="flex: 1; padding: 6px; font-size: 12px; min-height: 32px; height: 32px; justify-content: center; border-radius: 8px; box-shadow: none;">
          <span class="material-symbols-outlined" style="font-size: 16px;">refresh</span> 重新定位
        </button>
        <button type="button" class="primary-btn" id="gpsSimulateBtn" style="flex: 1; padding: 6px; font-size: 12px; min-height: 32px; height: 32px; justify-content: center; border-radius: 8px; box-shadow: none;" disabled>
          <span class="material-symbols-outlined" style="font-size: 16px;">gps_fixed</span> 模擬抵達圍欄
        </button>
      </div>
    </div>
  `;
}

/**
 * 局部更新 GPS 與地理圍欄狀態卡片 DOM 元素（以極佳效能局部更新，不干擾司機卡片表單與按鈕）
 */
function updateGpsStatusCardDom(lat, lng, accuracy) {
  const dot = document.getElementById("gpsStatusDot");
  const accuracyLabel = document.getElementById("gpsAccuracyLabel");
  const coordsText = document.getElementById("gpsCoordsText");
  const targetName = document.getElementById("gpsTargetName");
  const targetDistanceText = document.getElementById("gpsTargetDistanceText");
  const targetTypeLabel = document.getElementById("gpsTargetTypeLabel");
  const simulateBtn = document.getElementById("gpsSimulateBtn");

  if (!dot) return;

  if (accuracy <= 20) {
    dot.style.background = "#10b981";
    dot.className = "gps-status-dot pulse active-green";
    accuracyLabel.textContent = `精準定位 (±${Math.round(accuracy)}m)`;
    accuracyLabel.style.color = "#10b981";
  } else if (accuracy <= 200) {
    dot.style.background = "#f59e0b";
    dot.className = "gps-status-dot pulse active-orange";
    accuracyLabel.textContent = `一般定位 (±${Math.round(accuracy)}m)`;
    accuracyLabel.style.color = "#f59e0b";
  } else {
    dot.style.background = "#ef4444";
    dot.className = "gps-status-dot pulse active-red";
    accuracyLabel.textContent = `訊號不佳 (±${Math.round(accuracy)}m)`;
    accuracyLabel.style.color = "#ef4444";
  }

  coordsText.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  if (!activeDriverId) return;
  const myTrips = todayTrips().filter((trip) => trip.driverId === activeDriverId && getTripStatus(trip) !== "completed");
  
  let targetAddress = "";
  let targetLabel = "";
  let tripTarget = null;
  let targetEventType = "";

  for (const trip of myTrips) {
    const person = getCase(trip.caseId);
    const tripStatus = getTripStatus(trip);

    if (tripStatus === "scheduled" || tripStatus === "late") {
      if (!trip.pickupTime) {
        targetAddress = trip.pickupAddress || person?.pickupAddress || "";
        targetLabel = getAddressAlias(targetAddress, person) + " (上車)";
        tripTarget = trip;
        targetEventType = "pickup";
        break;
      }
    } else if (tripStatus === "picked_up") {
      if (!trip.dropoffTime) {
        targetAddress = trip.destinationAddress || person?.destinationAddress || "";
        targetLabel = getAddressAlias(targetAddress, person) + " (送達)";
        tripTarget = trip;
        targetEventType = "dropoff";
        break;
      }
    }
  }

  if (targetAddress && tripTarget) {
    targetName.textContent = targetLabel;
    const coord = resolveGeofenceCoord(targetAddress);
    
    if (coord) {
      if (coord.estimated) {
        targetTypeLabel.textContent = "估算座標";
        targetTypeLabel.style.background = "rgba(245, 158, 11, 0.1)";
        targetTypeLabel.style.color = "#d97706";
      } else {
        targetTypeLabel.textContent = "精確座標";
        targetTypeLabel.style.background = "rgba(16, 185, 129, 0.1)";
        targetTypeLabel.style.color = "#059669";
      }

      const distanceM = haversineDistanceM(lat, lng, coord.lat, coord.lng);
      targetDistanceText.textContent = `距離目標：${Math.round(distanceM)} 公尺`;
      
      simulateBtn.disabled = false;
      
      const newSimulateBtn = simulateBtn.cloneNode(true);
      simulateBtn.replaceWith(newSimulateBtn);
      newSimulateBtn.addEventListener("click", () => {
        console.log(`[Geofence] Simulating arrival at: ${coord.lat}, ${coord.lng}`);
        currentDriverGps = { lat: coord.lat, lng: coord.lng, accuracy: 10, timestamp: Date.now() };
        updateGpsStatusCardDom(coord.lat, coord.lng, 10);
        checkGeofenceTriggers(coord.lat, coord.lng, activeDriverId);
        addNotification(`模擬抵達成功：已定位至 ${targetLabel} 座標`, true);
      });
    } else {
      targetTypeLabel.textContent = "無法解析";
      targetTypeLabel.style.background = "rgba(239, 68, 68, 0.1)";
      targetTypeLabel.style.color = "#ef4444";
      targetDistanceText.textContent = "距離目標：無法計算";
      simulateBtn.disabled = true;
    }
  } else {
    targetName.textContent = "無進行中行程";
    targetDistanceText.textContent = "距離目標：- 公尺";
    targetTypeLabel.textContent = "";
    simulateBtn.disabled = true;
  }
}

/**
 * 手動更新高精度 GPS 位置
 */
function triggerGpsManualUpdate() {
  const refreshBtn = document.getElementById("gpsRefreshBtn");
  if (!refreshBtn) return;
  
  refreshBtn.innerHTML = '<span class="material-symbols-outlined animate-spin" style="font-size: 16px;">sync</span> 定位中...';
  refreshBtn.disabled = true;
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng, accuracy } = position.coords;
        currentDriverGps = { lat, lng, accuracy, timestamp: Date.now() };
        
        updateGpsStatusCardDom(lat, lng, accuracy);
        checkGeofenceTriggers(lat, lng, activeDriverId);
        
        refreshBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">refresh</span> 重新定位';
        refreshBtn.disabled = false;
        addNotification("GPS 定位更新成功！", true);
      },
      (error) => {
        refreshBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">refresh</span> 重新定位';
        refreshBtn.disabled = false;
        addNotification(`定位更新失敗：${error.message}`, false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  } else {
    refreshBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">refresh</span> 重新定位';
    refreshBtn.disabled = false;
    addNotification("瀏覽器不支援 GPS 定位", false);
  }
}

/**
 * 啟動 GPS 持續追蹤，司機登入時呼叫
 */
function startGeofenceWatcher(driverId) {
  if (!navigator.geolocation) return; // 瀏覽器不支援，靜默降級
  if (geofenceWatchId !== null) return; // 已在追蹤中，避免重複啟動

  // 背景非同步預先解析所有地址座標
  preloadDriverTripCoordinates(driverId);

  geofenceWatchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude: lat, longitude: lng, accuracy } = position.coords;
      currentDriverGps = { lat, lng, accuracy, timestamp: Date.now() };
      
      // 更新狀態診斷卡片
      updateGpsStatusCardDom(lat, lng, accuracy);
      
      // GPS 精度不足（>200m）時跳過，避免誤觸發
      if (accuracy > 200) return;
      checkGeofenceTriggers(lat, lng, driverId);
    },
    (error) => {
      console.warn("[Geofence] GPS error:", error.message);
      const dot = document.getElementById("gpsStatusDot");
      const label = document.getElementById("gpsAccuracyLabel");
      if (dot && label) {
        dot.style.background = "#ef4444";
        dot.className = "gps-status-dot pulse active-red";
        label.textContent = `定位失敗: ${error.message}`;
        label.style.color = "#ef4444";
      }
    },
    {
      enableHighAccuracy: true,
      maximumAge: 15_000,
      timeout: 10_000,
    }
  );
}

/**
 * 停止 GPS 持續追蹤，司機登出時呼叫
 */
function stopGeofenceWatcher() {
  if (geofenceWatchId !== null) {
    navigator.geolocation.clearWatch(geofenceWatchId);
    geofenceWatchId = null;
  }
  geofenceAlerted.clear();
}

/**
 * 檢查目前位置是否進入任一班次的地理圍欄
 */
function checkGeofenceTriggers(lat, lng, driverId) {
  if (!driverId) return;
  const myTrips = todayTrips().filter((trip) => trip.driverId === driverId);

  for (const trip of myTrips) {
    const person = getCase(trip.caseId);
    const tripStatus = getTripStatus(trip);

    // 班次已完成，跳過
    if (tripStatus === "completed") continue;

    // 決定比對目標
    let targetAddress = "";
    let eventType = "";

    if (tripStatus === "scheduled" || tripStatus === "late") {
      // 等待接客 → 比對上車地址
      if (!trip.pickupTime) {
        // 防誤觸同日來回之過早行程：若距離預定上車時間超過指定時間（限於預定上車時間正負閥值內），跳過自動上車偵測
        if (trip.scheduledPickup && trip.serviceDate) {
          const [year, month, day] = trip.serviceDate.split("-").map(Number);
          const [sHours, sMinutes] = trip.scheduledPickup.split(":").map(Number);
          const scheduledTime = new Date(year, month - 1, day, sHours, sMinutes, 0, 0);
          const timeDiffMinutes = (scheduledTime.getTime() - Date.now()) / (60 * 1000);
          if (Math.abs(timeDiffMinutes) > GEOFENCE_PRE_ARRIVE_WINDOW_MINUTES) {
            continue; // 還沒到合理的時間段或已過遲，跳過自動偵測
          }
        }
        targetAddress = trip.pickupAddress || person?.pickupAddress || "";
        eventType = "pickup";
      }
    } else if (tripStatus === "picked_up") {
      // 接送中 → 比對目的地
      if (!trip.dropoffTime) {
        // 限於預定送達時間正負閥值內觸發自動送達打卡
        if (trip.scheduledDropoff && trip.serviceDate) {
          const [year, month, day] = trip.serviceDate.split("-").map(Number);
          const [sHours, sMinutes] = trip.scheduledDropoff.split(":").map(Number);
          const scheduledTime = new Date(year, month - 1, day, sHours, sMinutes, 0, 0);
          const timeDiffMinutes = (scheduledTime.getTime() - Date.now()) / (60 * 1000);
          if (Math.abs(timeDiffMinutes) > GEOFENCE_PRE_ARRIVE_WINDOW_MINUTES) {
            continue; // 超過正負閥值，跳過自動送達偵測
          }
        }
      }
      targetAddress = trip.destinationAddress || person?.destinationAddress || "";
      eventType = "dropoff";
    }

    if (!targetAddress || !eventType) continue;

    const alertKey = `${trip.id}::${eventType}`;
    if (geofenceAlerted.has(alertKey)) continue; // 已觸發過，跳過

    const coord = resolveGeofenceCoord(targetAddress);
    if (!coord) continue;

    // 若座標是估算值（住家地址），使用較寬鬆的 300m 半徑
    const radius = coord.estimated ? 300 : GEOFENCE_RADIUS_METERS;
    const distanceM = haversineDistanceM(lat, lng, coord.lat, coord.lng);

    if (distanceM <= radius) {
      geofenceAlerted.add(alertKey); // 標記已觸發，避免重複
      const locLabel = getAddressAlias(targetAddress, person);
      showGeofenceToast(trip, person, eventType, locLabel, distanceM);
      break; // 一次只處理一個班次，避免同時彈多個
    }
  }
}

/**
 * 顯示地理圍欄確認通知（含倒數計時）
 */
function showGeofenceToast(trip, person, eventType, locLabel, distanceM) {
  // 如果已有待確認通知，先清除舊的
  dismissGeofenceToast();

  const toast = document.getElementById("geofenceToast");
  const eyebrow = document.getElementById("geofenceToastEyebrow");
  const title = document.getElementById("geofenceToastTitle");
  const sub = document.getElementById("geofenceToastSub");
  const fill = document.getElementById("geofenceCountdownFill");
  const countdownLabel = document.getElementById("geofenceCountdownLabel");
  const confirmBtn = document.getElementById("geofenceConfirmBtn");
  const dismissBtn = document.getElementById("geofenceDismissBtn");

  if (!toast) return;

  const isPickup = eventType === "pickup";
  eyebrow.textContent = isPickup ? "自動偵測：接到地點" : "自動偵測：送達地點";
  title.textContent = `已抵達 ${escapeHTML(locLabel)}`;
  sub.textContent = `${escapeHTML(person?.name ?? "個案")}｜距離 ${Math.round(distanceM)} 公尺`;
  countdownLabel.textContent = `${GEOFENCE_COUNTDOWN_SECONDS} 秒後自動確認打卡`;
  fill.style.width = "100%";
  fill.style.transition = "none";

  toast.hidden = false;
  // 強制 repaint 使 transition 生效
  void fill.offsetWidth;
  fill.style.transition = `width ${GEOFENCE_COUNTDOWN_SECONDS}s linear`;
  fill.style.width = "0%";

  let remaining = GEOFENCE_COUNTDOWN_SECONDS;

  function tick() {
    remaining -= 1;
    countdownLabel.textContent = `${remaining} 秒後自動確認打卡`;
    if (remaining <= 0) {
      performGeofenceCheckin(trip, eventType);
      dismissGeofenceToast();
    } else {
      geofenceCountdownTimer = window.setTimeout(tick, 1000);
    }
  }

  geofenceCountdownTimer = window.setTimeout(tick, 1000);
  geofencePendingAction = { trip, eventType };

  // 設定按鈕事件（先移除舊的以防重複綁定）
  const newConfirmBtn = confirmBtn.cloneNode(true);
  const newDismissBtn = dismissBtn.cloneNode(true);
  confirmBtn.replaceWith(newConfirmBtn);
  dismissBtn.replaceWith(newDismissBtn);

  newConfirmBtn.addEventListener("click", () => {
    if (geofencePendingAction) {
      performGeofenceCheckin(geofencePendingAction.trip, geofencePendingAction.eventType);
    }
    dismissGeofenceToast();
  });

  newDismissBtn.addEventListener("click", () => {
    // 忽略：不打卡但也不從 alerted 移除（本次行程不再提示）
    dismissGeofenceToast();
  });

  // 手機震動反饋（如果支援）
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
}

/**
 * 清除地理圍欄通知 toast
 */
function dismissGeofenceToast() {
  if (geofenceCountdownTimer !== null) {
    window.clearTimeout(geofenceCountdownTimer);
    geofenceCountdownTimer = null;
  }
  geofencePendingAction = null;
  const toast = document.getElementById("geofenceToast");
  if (toast) toast.hidden = true;
}

/**
 * 執行地理圍欄打卡（複用現有手動打卡邏輯）
 */
async function performGeofenceCheckin(trip, eventType) {
  if (!trip || !activeDriverId) return;
  if (trip.driverId !== activeDriverId) return;

  if (eventType === "pickup" && !trip.pickupTime) {
    const location = await captureDriverLocation(activeDriverId, trip.id, "pickup");
    if (dataMode === "supabase") {
      try {
        await apiAction("pickup", { tripId: trip.id, location, serviceDate: state.serviceDate });
      } catch (error) {
        console.error("[Geofence] 自動打卡失敗（pickup）:", error);
      }
    } else {
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
      saveState();
    }
    renderDriverWorkspace();
  } else if (eventType === "dropoff" && trip.pickupTime && !trip.dropoffTime) {
    const location = await captureDriverLocation(activeDriverId, trip.id, "dropoff");
    if (dataMode === "supabase") {
      try {
        await apiAction("dropoff", { tripId: trip.id, location, serviceDate: state.serviceDate });
      } catch (error) {
        console.error("[Geofence] 自動打卡失敗（dropoff）:", error);
      }
    } else {
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
      saveState();
    }
    renderDriverWorkspace();
  }
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

  // 承辦人專屬地理圍欄自訂打卡參數設定
  const geofencePanel = document.getElementById("geofenceSettingsPanel");
  if (geofencePanel) {
    if (coordinatorUnlocked) {
      geofencePanel.removeAttribute("hidden");

      const radiusRange = document.getElementById("geofenceRadiusRange");
      const radiusLabel = document.getElementById("geofenceRadiusLabel");
      const windowRange = document.getElementById("geofenceWindowRange");
      const windowLabel = document.getElementById("geofenceWindowLabel");

      radiusRange.value = String(GEOFENCE_RADIUS_METERS);
      radiusLabel.textContent = String(GEOFENCE_RADIUS_METERS);
      windowRange.value = String(GEOFENCE_PRE_ARRIVE_WINDOW_MINUTES);
      windowLabel.textContent = String(GEOFENCE_PRE_ARRIVE_WINDOW_MINUTES);

      const apiKeyInput = document.getElementById("googleMapsApiKeyInput");
      const toggleBtn = document.getElementById("toggleMapsApiKeyBtn");
      if (apiKeyInput && toggleBtn) {
        apiKeyInput.value = GOOGLE_MAPS_API_KEY || "";
        toggleBtn.addEventListener("click", () => {
          const icon = toggleBtn.querySelector("span");
          if (apiKeyInput.type === "password") {
            apiKeyInput.type = "text";
            icon.textContent = "visibility";
          } else {
            apiKeyInput.type = "password";
            icon.textContent = "visibility_off";
          }
        });
      }

      radiusRange.addEventListener("input", () => {
        radiusLabel.textContent = radiusRange.value;
      });

      windowRange.addEventListener("input", () => {
        windowLabel.textContent = windowRange.value;
      });

      document.getElementById("geofenceSettingsSaveBtn").addEventListener("click", async () => {
        GEOFENCE_RADIUS_METERS = Number(radiusRange.value);
        GEOFENCE_PRE_ARRIVE_WINDOW_MINUTES = Number(windowRange.value);
        GOOGLE_MAPS_API_KEY = apiKeyInput ? apiKeyInput.value.trim() : "";

        localStorage.setItem("ltc-geofence-radius", String(GEOFENCE_RADIUS_METERS));
        localStorage.setItem("ltc-geofence-pre-arrive-window", String(GEOFENCE_PRE_ARRIVE_WINDOW_MINUTES));
        localStorage.setItem("ltc-google-maps-api-key", GOOGLE_MAPS_API_KEY);

        // 每次金鑰或設定變更時，自動清空舊的經緯度快取，強制用新的 Google API 重新高精度解析
        localStorage.removeItem("shuttle_geocoding_cache");
        geocodingCache = {};

        state.settings = {
          geofenceRadius: GEOFENCE_RADIUS_METERS,
          preArriveWindow: GEOFENCE_PRE_ARRIVE_WINDOW_MINUTES,
          googleMapsApiKey: GOOGLE_MAPS_API_KEY
        };
        saveState();

        if (dataMode === "supabase") {
          try {
            await apiAction("update_system_settings", {
              radius: GEOFENCE_RADIUS_METERS,
              window: GEOFENCE_PRE_ARRIVE_WINDOW_MINUTES,
              googleMapsApiKey: GOOGLE_MAPS_API_KEY
            });
            setFlash("地理圍欄參數與 Google API 金鑰已成功同步至雲端，且地址快取已刷新！", "success");
          } catch (e) {
            console.error("Failed to sync settings to Supabase:", e);
            setFlash("參數已儲存至本機，但雲端同步失敗：" + e.message, "error");
          }
        } else {
          setFlash("地理圍欄自動打卡參數已儲存於本機，且地址快取已刷新！", "success");
        }
      });

      document.getElementById("geofenceSettingsResetBtn").addEventListener("click", async () => {
        GEOFENCE_RADIUS_METERS = 300;
        GEOFENCE_PRE_ARRIVE_WINDOW_MINUTES = 30;
        GOOGLE_MAPS_API_KEY = "";

        localStorage.removeItem("ltc-geofence-radius");
        localStorage.removeItem("ltc-geofence-pre-arrive-window");
        localStorage.removeItem("ltc-google-maps-api-key");
        
        // 恢復預設時，同步清空快取
        localStorage.removeItem("shuttle_geocoding_cache");
        geocodingCache = {};

        state.settings = {
          geofenceRadius: 300,
          preArriveWindow: 30,
          googleMapsApiKey: ""
        };
        saveState();

        radiusRange.value = "300";
        radiusLabel.textContent = "300";
        windowRange.value = "30";
        windowLabel.textContent = "30";
        if (apiKeyInput) apiKeyInput.value = "";

        if (dataMode === "supabase") {
          try {
            await apiAction("update_system_settings", {
              radius: 300,
              window: 30,
              googleMapsApiKey: ""
            });
            setFlash("地理圍欄自動打卡參數已恢復預設並同步！", "success");
          } catch (e) {
            console.error("Failed to reset settings in Supabase:", e);
            setFlash("已還原預設，但雲端同步失敗：" + e.message, "error");
          }
        } else {
          setFlash("地理圍欄自動打卡參數已恢復預設！", "success");
        }
      });
    } else {
      geofencePanel.setAttribute("hidden", "true");
    }
  }
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

// 全域快取，紀錄已順延過的行程與目標時間，防止重複發送通知與時間順延
const shiftedTripsCache = new Set();

async function checkAndShiftDelayedTrips() {
  let stateChanged = false;
  const today = todayKey();
  
  for (const trip of state.trips) {
    const tripDate = trip.serviceDate || trip.service_date || "";
    if (tripDate !== today) continue;
    if (trip.pickupTime || trip.status === "completed") continue;
    if (!trip.scheduledPickup) continue;
    
    const [hours, minutes] = trip.scheduledPickup.split(":").map(Number);
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);
    
    const diffMs = Date.now() - scheduledDate.getTime();
    if (diffMs > 10 * 60_000) {
      // Shift scheduledPickup by 10 minutes
      const newScheduledDate = new Date(scheduledDate.getTime() + 10 * 60_000);
      const newHours = String(newScheduledDate.getHours()).padStart(2, '0');
      const newMinutes = String(newScheduledDate.getMinutes()).padStart(2, '0');
      const nextTimeStr = `${newHours}:${newMinutes}`;
      const nextTimeFull = `${nextTimeStr}:00`;
      
      // 比對快取，如果此班次已經順延至該目標時間，則不再重複順延與發送通知
      const cacheKey = `${trip.id}-${nextTimeStr}`;
      if (shiftedTripsCache.has(cacheKey)) continue;

      const oldPickup = trip.scheduledPickup;
      let nextDropoffStr = trip.scheduledDropoff;
      let nextDropoffFull = null;

      if (trip.scheduledDropoff) {
        const [dHours, dMinutes] = trip.scheduledDropoff.split(":").map(Number);
        const dropoffDate = new Date();
        dropoffDate.setHours(dHours, dMinutes, 0, 0);
        const newDropoffDate = new Date(dropoffDate.getTime() + 10 * 60_000);
        const newDHours = String(newDropoffDate.getHours()).padStart(2, '0');
        const newDMinutes = String(newDropoffDate.getMinutes()).padStart(2, '0');
        nextDropoffStr = `${newDHours}:${newDMinutes}`;
        nextDropoffFull = `${nextDropoffStr}:00`;
      }
      
      if (dataMode === "supabase") {
        try {
          // 只有在 Supabase API 成功更新後，我們才更新本地快取並渲染
          await apiAction("update_trip_time", {
            tripId: trip.id,
            scheduledPickup: nextTimeFull,
            scheduledDropoff: nextDropoffFull || null,
            serviceDate: today
          });
          
          shiftedTripsCache.add(cacheKey);
          console.log(`[Delay Shift] Trip ${trip.id} shifted successfully in Supabase to ${nextTimeStr}`);
          addNotification(`行程 ${trip.id} 發生延遲，預定接送時間已順延 10 分鐘至 ${nextTimeStr}`, true);
          stateChanged = true;
        } catch (e) {
          console.error("Failed to sync delayed trip shift to Supabase:", e);
          // 同步失敗，不加快取，本地狀態保持原樣，下一次 15 秒定時器可以無縫重試
        }
      } else {
        // 本地示範資料模式
        trip.scheduledPickup = nextTimeStr;
        trip.scheduledDropoff = nextDropoffStr;
        shiftedTripsCache.add(cacheKey);
        console.log(`[Delay Shift] Trip ${trip.id} shifted locally from ${oldPickup} to ${trip.scheduledPickup}`);
        addNotification(`行程 ${trip.id} 發生延遲，預定接送時間已順延 10 分鐘至 ${trip.scheduledPickup}`, true);
        stateChanged = true;
      }
    }
  }
  
  if (stateChanged) {
    saveState();
    render();
  }
}

function updateClock() {
  const time = localTime();
  const dateStr = new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).format(new Date());
  
  const target = document.getElementById("todayLabel");
  if (target) {
    target.textContent = `${dateStr} ${time}`;
  }

  checkAndShiftDelayedTrips().catch((err) => console.error("Error in checkAndShiftDelayedTrips:", err));
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

function simplifyAddress(addr) {
  if (!addr) return "";
  let clean = addr.replace(/^(台灣|台灣省|台灣省宜蘭縣|宜蘭縣|宜蘭市|台北市|新北市|萬華區|中正區)/g, "");
  const match = clean.match(/^[^路街段巷村]+[路街段巷村]/);
  if (match) return match[0];
  return clean.substring(0, 8) + (clean.length > 8 ? "..." : "");
}

function showTripDetails(tripId) {
  const trip = state.trips.find((item) => item.id === tripId);
  if (!trip) return;

  const person = getCase(trip.caseId);
  const driver = getDriver(trip.driverId);
  const status = getTripStatus(trip);

  const panel = document.getElementById("tripDetailPanel");
  const body = document.getElementById("tripDetailBody");
  if (!panel || !body) return;

  const destination = trip.destinationAddress || person?.destinationAddress || "";
  const pickup = trip.pickupAddress || person?.pickupAddress || "";

  body.innerHTML = `
    <div class="trip-detail-content" style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Time & Status Card -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px; background: var(--brand-soft); border-radius: 14px; border: 1px solid rgba(0, 90, 90, 0.1);">
        <div>
          <span style="font-size: 12px; color: var(--muted); display: block;">預定接送時間</span>
          <strong style="font-size: 20px; color: var(--brand-dark); font-family: monospace;">${escapeHTML(trip.scheduledPickup)} - ${escapeHTML(trip.scheduledDropoff)}</strong>
        </div>
        <span class="status-pill ${escapeHTML(status)}" style="font-size: 14px; padding: 6px 12px;">${escapeHTML(getTripStatusLabel(trip))}</span>
      </div>

      <!-- Case Info section -->
      <div style="padding: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 16px; display: flex; flex-direction: column; gap: 8px;">
        <h4 style="margin: 0 0 6px; font-size: 16px; color: var(--ink); display: flex; align-items: center; gap: 6px;">
          <span class="material-symbols-outlined" style="font-size: 18px; color: var(--brand);">accessible_forward</span>
          個案基本資料
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
          <div><strong style="color: var(--muted);">個案姓名：</strong>${escapeHTML(person?.name ?? "未知個案")}</div>
          <div><strong style="color: var(--muted);">福利身分：</strong>${escapeHTML(person?.welfareStatus ?? "一般戶")}</div>
          <div><strong style="color: var(--muted);">個案編號：</strong>${escapeHTML(person?.caseNo ?? "無")}</div>
          <div><strong style="color: var(--muted);">照顧等級：</strong>${escapeHTML(person?.careLevel ?? "無")}</div>
          <div style="grid-column: span 2;"><strong style="color: var(--muted);">行動狀態：</strong>${escapeHTML(person?.mobility ?? "無")}</div>
          <div style="grid-column: span 2;"><strong style="color: var(--muted);">輔具/需求：</strong>${escapeHTML(person?.assistiveDevice ?? "無")}</div>
          <div style="grid-column: span 2;"><strong style="color: var(--muted);">聯絡電話：</strong><a href="tel:${escapeHTML(person?.phone ?? "")}" style="color: var(--brand); font-weight: 700;">${escapeHTML(person?.phone ?? "無")}</a></div>
        </div>
      </div>

      <!-- Route info -->
      <div style="padding: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 16px; display: flex; flex-direction: column; gap: 10px;">
        <h4 style="margin: 0; font-size: 16px; color: var(--ink); display: flex; align-items: center; gap: 6px;">
          <span class="material-symbols-outlined" style="font-size: 18px; color: var(--brand);">map</span>
          接送路線規劃
        </h4>
        <div style="display: flex; flex-direction: column; gap: 10px; font-size: 14px;">
          <div style="display: flex; gap: 8px; align-items: flex-start;">
            <span style="color: var(--brand); font-size: 16px; margin-top: 2px;">●</span>
            <div>
              <strong style="color: var(--muted); font-size: 12px; display: block;">起點上車地址</strong>
              <span><strong>${escapeHTML(getAddressAlias(pickup, person))}</strong><span style="color: var(--muted); font-size: 13px; margin-left: 6px;">${escapeHTML(getAddressReal(pickup))}</span></span>
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getAddressReal(pickup))}" target="_blank" style="margin-left: 8px; color: var(--brand); font-size: 12px; text-decoration: underline;">地圖檢視</a>
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: flex-start;">
            <span style="color: var(--amber); font-size: 16px; margin-top: 2px;">▼</span>
            <div>
              <strong style="color: var(--muted); font-size: 12px; display: block;">終點送達目的地</strong>
              <span><strong>${escapeHTML(getAddressAlias(destination, person))}</strong><span style="color: var(--muted); font-size: 13px; margin-left: 6px;">${escapeHTML(getAddressReal(destination))}</span></span>
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getAddressReal(destination))}" target="_blank" style="margin-left: 8px; color: var(--brand); font-size: 12px; text-decoration: underline;">地圖檢視</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Driver assignment & tracking -->
      <div style="padding: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 16px; display: flex; flex-direction: column; gap: 8px;">
        <h4 style="margin: 0 0 6px; font-size: 16px; color: var(--ink); display: flex; align-items: center; gap: 6px;">
          <span class="material-symbols-outlined" style="font-size: 18px; color: var(--brand);">airport_shuttle</span>
          指派司機與派遣日誌
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px;">
          <div><strong style="color: var(--muted);">司機姓名：</strong>${escapeHTML(driver?.name ?? "未指派")}</div>
          <div><strong style="color: var(--muted);">指派車號：</strong>${escapeHTML(driver?.vehicleNo ?? "無")}</div>
          <div><strong style="color: var(--muted);">實際接到：</strong>${escapeHTML(trip.pickupTime || "--:--")}</div>
          <div><strong style="color: var(--muted);">實際送達：</strong>${escapeHTML(trip.dropoffTime || "--:--")}</div>
          <div style="grid-column: span 2; display: flex; align-items: center; gap: 4px;">
            <strong style="color: var(--muted);">最新 GPS 定位時間：</strong>
            <span>${escapeHTML(formatEventTime(state.driverLocations[trip.driverId]?.updatedAt) || "無")}</span>
          </div>
        </div>
      </div>

      <!-- Ride Note -->
      ${trip.purpose || person?.rideNote ? `
        <div style="padding: 12px; background: #fffde7; border: 1px solid #fff59d; border-radius: 12px; font-size: 13px; color: #5d4037; line-height: 1.5;">
          ${trip.purpose ? `<strong>接送備註：</strong>${escapeHTML(trip.purpose)}` : ""}
          ${person?.rideNote ? `<br><strong>注意事項：</strong>${escapeHTML(person.rideNote)}` : ""}
        </div>
      ` : ""}
    </div>
  `;

  panel.hidden = false;
}
// --- CSV Import Helper Functions ---
let pendingImportSchedules = [];

function parseCSV(text) {
  const lines = [];
  let row = [""];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push('');
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== '') {
    lines.push(row);
  }
  return lines;
}

function downloadCSVScheduleTemplate() {
  const CSV_HEADER = "個案姓名或編號,司機姓名或車號,排程類型(單次/週期),單次日期(YYYY-MM-DD),起始日期(YYYY-MM-DD),結束日期(YYYY-MM-DD),\"重複星期(日到六以半形逗號分隔，如：1,3,5)\",預定上車時間(HH:MM),預定送達時間(HH:MM),上車地址,目的地,服務項目,特殊需求,是否啟用回程(是/否),回程預定上車時間(HH:MM),回程預定送達時間(HH:MM),回程指派司機(姓名或車號),回程服務項目";
  const CSV_ROW_1 = "林塗桂美,林文欽,週期,,2026-05-24,2026-06-24,\"1,3,5\",08:00,08:30,宜蘭縣壯圍鄉中央路2段265號,社照會長照中心,日照接送,輪椅,是,16:00,16:30,林文欽,回程接送";
  const CSV_ROW_2 = "陳好,吳佳玲,單次,2026-05-25,,,,09:15,09:45,宜蘭市壯五路100號,陽明交通大學附設醫院,復健門診,陪同,否,,,,";
  const csvContent = "\uFEFF" + [CSV_HEADER, CSV_ROW_1, CSV_ROW_2].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "接送排程匯入範本.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function findCaseByMatch(matchText) {
  const query = String(matchText || "").trim().toLowerCase();
  if (!query) return null;
  return state.cases.find(c => 
    c.name.toLowerCase() === query || 
    c.caseNo.toLowerCase() === query ||
    c.name.toLowerCase().includes(query) ||
    c.caseNo.toLowerCase().includes(query)
  );
}

function findDriverByMatch(matchText) {
  const query = String(matchText || "").trim().toLowerCase();
  if (!query) return null;
  return state.drivers.find(d => 
    d.name.toLowerCase() === query || 
    d.vehicleNo.toLowerCase().replace("-", "").includes(query.replace("-", "")) ||
    d.name.toLowerCase().includes(query)
  );
}

function parseDaysOfWeek(value) {
  if (!value) return [];
  const parts = String(value).split(/[,，\s]+/);
  const result = [];
  const chnMap = { "日": 0, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6 };
  parts.forEach(p => {
    const trimmed = p.trim();
    if (chnMap[trimmed] !== undefined) {
      result.push(chnMap[trimmed]);
    }
  });
  return [...new Set(result)].sort((a, b) => a - b);
}

function parseDateString(value) {
  if (!value) return "";
  let clean = String(value).trim().replace(/\//g, "-");
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  const parts = clean.split("-");
  if (parts.length === 3) {
    let y = parts[0];
    let m = parts[1].padStart(2, "0");
    let d = parts[2].padStart(2, "0");
    if (y.length === 3) {
      y = String(Number(y) + 1911);
    }
    if (y.length === 4) {
      return `${y}-${m}-${d}`;
    }
  }
  return "";
}

function parseTimeString(value) {
  if (!value) return "08:00";
  let clean = String(value).trim();
  if (/^\d{2}:\d{2}$/.test(clean)) return clean;
  const parts = clean.split(":");
  if (parts.length >= 2) {
    const h = parts[0].padStart(2, "0");
    const m = parts[1].padStart(2, "0");
    return `${h}:${m}`;
  }
  return "08:00";
}

function parseAndPreviewCsv(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) {
    addNotification("CSV 檔案內容為空或格式不正確", false);
    return;
  }

  // Filter out header and empty lines
  const dataRows = rows.slice(1).filter(r => r.length > 0 && r.some(cell => cell.trim().length > 0));
  
  pendingImportSchedules = dataRows.map(row => {
    const caseMatch = findCaseByMatch(row[0]);
    const driverMatch = findDriverByMatch(row[1]);
    const scheduleType = String(row[2] || "").trim().includes("週期") ? "weekly" : "single";
    const serviceDate = scheduleType === "single" ? parseDateString(row[3]) : "";
    const startDate = scheduleType === "weekly" ? parseDateString(row[4]) : "";
    const endDate = scheduleType === "weekly" ? parseDateString(row[5]) : "";
    const daysOfWeek = scheduleType === "weekly" ? parseDaysOfWeek(row[6]) : [];
    const scheduledPickup = parseTimeString(row[7]);
    const scheduledDropoff = parseTimeString(row[8]);
    const pickupAddress = String(row[9] || "").trim() || (caseMatch ? caseMatch.pickupAddress : "");
    const destinationAddress = String(row[10] || "").trim() || (caseMatch ? caseMatch.destinationAddress : "");
    const purpose = String(row[11] || "").trim() || "日照接送";
    const specialRequirements = String(row[12] || "").trim();

    // Return trip columns
    const hasReturnTrip = String(row[13] || "").trim() === "是";
    const scheduledPickupReturn = hasReturnTrip ? parseTimeString(row[14]) : "";
    const scheduledDropoffReturn = hasReturnTrip ? parseTimeString(row[15]) : "";
    const driverMatchReturn = hasReturnTrip ? findDriverByMatch(row[16]) : null;
    const purposeReturn = hasReturnTrip ? (String(row[17] || "").trim() || "回程接送") : "";

    const errors = [];
    if (!caseMatch) errors.push(`找不到匹配的個案「${row[0] || "空白"}」`);
    if (!driverMatch) errors.push(`找不到匹配的司機「${row[1] || "空白"}」`);
    if (scheduleType === "single" && !serviceDate) errors.push("單次排程缺少日期或格式錯誤");
    if (scheduleType === "weekly" && !startDate) errors.push("週期排程缺少起始日期或格式錯誤");
    if (scheduleType === "weekly" && daysOfWeek.length === 0) errors.push("週期排程缺少重複星期設定");
    if (!pickupAddress) errors.push("缺少上車地址");
    if (!destinationAddress) errors.push("缺少目的地");

    // Validate return trip details if enabled
    if (hasReturnTrip) {
      if (!scheduledPickupReturn) errors.push("已啟用回程，但缺少回程預定上車時間");
      if (!driverMatchReturn) errors.push(`已啟用回程，但找不到匹配的回程司機「${row[16] || "空白"}」`);
    }

    return {
      caseId: caseMatch ? caseMatch.id : "",
      caseName: caseMatch ? caseMatch.name : (row[0] || "未知個案"),
      driverId: driverMatch ? driverMatch.id : "",
      driverName: driverMatch ? driverMatch.name : (row[1] || "未知司機"),
      scheduleType,
      serviceDate,
      startDate,
      endDate,
      daysOfWeek,
      scheduledPickup,
      scheduledDropoff,
      pickupAddress,
      destinationAddress,
      purpose,
      specialRequirements,
      
      // Return trip properties
      hasReturnTrip,
      scheduledPickupReturn,
      scheduledDropoffReturn,
      driverIdReturn: driverMatchReturn ? driverMatchReturn.id : "",
      driverNameReturn: driverMatchReturn ? driverMatchReturn.name : (row[16] || ""),
      purposeReturn,

      errors
    };
  });

  const previewList = document.getElementById("importPreviewList");
  if (!previewList) return;

  let validCount = 0;
  let invalidCount = 0;

  previewList.innerHTML = pendingImportSchedules.map((item, idx) => {
    const hasErrors = item.errors.length > 0;
    if (hasErrors) {
      invalidCount++;
    } else {
      validCount++;
    }
    
    const statusHtml = hasErrors 
      ? `<span style="color: var(--red); font-weight: bold; font-size: 12px;">❌ 錯誤 (將忽略)</span>` 
      : `<span style="color: var(--brand); font-weight: bold; font-size: 12px;">✅ 正常</span>`;
      
    const errorsHtml = hasErrors
      ? `<div style="color: var(--red); font-size: 12px; margin-top: 4px; padding-left: 10px; border-left: 2px solid var(--red);">${item.errors.map(e => `• ${e}`).join("<br>")}</div>`
      : "";

    const weekdaysStr = item.daysOfWeek.map(d => ["日", "一", "二", "三", "四", "五", "六"][d]).join(",");
    const timeStr = `${item.scheduledPickup} ~ ${item.scheduledDropoff}`;
    const endPart = item.endDate ? ` 至 ${item.endDate}` : " (持續無特定結束日)";
    const typeStr = item.scheduleType === "single" ? `單次 (${item.serviceDate})` : `每週 (${weekdaysStr}) 自 ${item.startDate}${endPart}`;
    
    const returnHtml = item.hasReturnTrip
      ? `<div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed rgba(0,0,0,0.06); color: #047857;">
          <strong>🔄 包含回程：</strong>時間：${item.scheduledPickupReturn} ~ ${item.scheduledDropoffReturn} · 司機：${escapeHTML(item.driverNameReturn)}
         </div>`
      : "";

    return `
      <div style="padding: 8px 10px; border-radius: 8px; border: 1px solid ${hasErrors ? 'var(--red-soft)' : 'rgba(0,90,90,0.12)'}; background: ${hasErrors ? '#fffbfa' : '#ffffff'};">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px;">
          <strong style="font-size: 13px;">#${idx + 1} 個案：${escapeHTML(item.caseName)} ➔ 司機：${escapeHTML(item.driverName)}</strong>
          ${statusHtml}
        </div>
        <div style="font-size: 12px; color: var(--muted); margin-top: 2px; line-height: 1.4;">
          類型：${typeStr} · 時間：${timeStr}<br>
          起點：<strong>${escapeHTML(getAddressAlias(item.pickupAddress, item.caseId))}</strong><span style="font-size: 11px; color: var(--muted); margin-left: 4px;">(${escapeHTML(getAddressReal(item.pickupAddress))})</span> ➔ 終點：<strong>${escapeHTML(getAddressAlias(item.destinationAddress, item.caseId))}</strong><span style="font-size: 11px; color: var(--muted); margin-left: 4px;">(${escapeHTML(getAddressReal(item.destinationAddress))})</span>
        </div>
        ${returnHtml}
        ${errorsHtml}
      </div>
    `;
  }).join("");

  document.getElementById("importPreviewCount").textContent = pendingImportSchedules.length;
  document.getElementById("importPreviewContainer").style.display = "flex";
  
  const confirmBtn = document.getElementById("confirmImportBtn");
  if (confirmBtn) {
    confirmBtn.disabled = validCount === 0;
    confirmBtn.textContent = `確認匯入 (${validCount} 筆)`;
  }
}

async function handleCsvFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    parseAndPreviewCsv(text);
  };
  reader.readAsText(file, "UTF-8");
}

async function handleConfirmImport() {
  const validSchedules = [];
  
  pendingImportSchedules
    .filter(item => item.errors.length === 0)
    .forEach(item => {
      // 1. Outbound schedule
      validSchedules.push({
        id: uid("sch"),
        caseId: item.caseId,
        driverId: item.driverId,
        scheduleType: item.scheduleType,
        serviceDate: item.serviceDate,
        startDate: item.startDate,
        endDate: item.endDate,
        daysOfWeek: item.daysOfWeek,
        scheduledPickup: item.scheduledPickup,
        scheduledDropoff: item.scheduledDropoff,
        pickupAddress: item.pickupAddress,
        destinationAddress: item.destinationAddress,
        purpose: item.purpose,
        specialRequirements: item.specialRequirements,
        status: "active",
        stopReason: "",
        dateOverrides: [],
      });

      // 2. Return schedule
      if (item.hasReturnTrip) {
        validSchedules.push({
          id: uid("sch"),
          caseId: item.caseId,
          driverId: item.driverIdReturn,
          scheduleType: item.scheduleType,
          serviceDate: item.serviceDate,
          startDate: item.startDate,
          endDate: item.endDate,
          daysOfWeek: item.daysOfWeek,
          scheduledPickup: item.scheduledPickupReturn,
          scheduledDropoff: item.scheduledDropoffReturn,
          pickupAddress: item.destinationAddress, // swapped
          destinationAddress: item.pickupAddress,
          purpose: item.purposeReturn,
          specialRequirements: item.specialRequirements,
          status: "active",
          stopReason: "",
          dateOverrides: [],
        });
      }
    });

  if (validSchedules.length === 0) return;

  if (dataMode === "supabase") {
    try {
      await apiAction("import_schedules", { schedules: validSchedules });
      addNotification(`成功匯入 ${validSchedules.length} 筆接送排程`, true);
      document.getElementById("csvImportPanel").hidden = true;
      refreshDashboardAfterScheduleChange();
    } catch (error) {
      addNotification(`匯入失敗：${error.message}`, false);
    }
    return;
  }

  state.schedules.push(...validSchedules);
  saveState();
  addNotification(`成功匯入 ${validSchedules.length} 筆接送排程`, true);
  document.getElementById("csvImportPanel").hidden = true;
  refreshDashboardAfterScheduleChange();
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

  // Trip detail modal close binding
  const detailPanel = document.getElementById("tripDetailPanel");
  const detailCloseBtn = document.getElementById("tripDetailCloseBtn");
  if (detailCloseBtn && detailPanel) {
    detailCloseBtn.addEventListener("click", () => {
      detailPanel.hidden = true;
    });
    detailPanel.addEventListener("click", (e) => {
      if (e.target === detailPanel) {
        detailPanel.hidden = true;
      }
    });
  }

  const menuToggleBtn = document.getElementById("topbarMenuToggleBtn");
  const actionsWrapper = document.getElementById("topbarActionsWrapper");
  if (menuToggleBtn && actionsWrapper) {
    menuToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      actionsWrapper.classList.toggle("open");
    });
    document.addEventListener("click", (e) => {
      if (!actionsWrapper.contains(e.target) && e.target !== menuToggleBtn) {
        actionsWrapper.classList.remove("open");
      }
    });
  }

  initNotificationCenter();
  setupPullToRefresh();
  updateClock();
  setInterval(updateClock, 15_000);

  // Escape key exits fullscreen map
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const mapSection = document.querySelector(".map-section.map-fullscreen");
      if (mapSection) toggleMapFullscreen();
    }
  });

  try {
    await loadRemoteState();
  } catch (error) {
    console.error("Supabase connection failed, falling back to local storage:", error);
    dataMode = "local";
    dataMessage = "本機示範資料";
  }
  render();
}

init();
