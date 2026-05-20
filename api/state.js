const DAY_MS = 24 * 60 * 60 * 1000;
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

function coordinatorPasscode() {
  return process.env.COORDINATOR_PIN || "2468";
}

function rootUrl() {
  const raw = process.env.SUPABASE_URL || "";
  return raw.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function apiKey() {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    ""
  );
}

function todayKey(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function localTime(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function addMinutes(minutes) {
  return localTime(new Date(Date.now() + minutes * 60_000));
}

function timeOnly(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function iso(value) {
  return value ? new Date(value).toISOString() : "";
}

async function supabase(path, options = {}) {
  const url = rootUrl();
  const key = apiKey();

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  }

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase ${response.status}: ${detail}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function rpc(name, body) {
  const url = rootUrl();
  const key = apiKey();

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  }

  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase RPC ${response.status}: ${detail}`);
  }

  return response.json();
}

function demoDrivers() {
  return [
    {
      display_name: "林志明",
      identity_no: "A123456789",
      phone: "0912-118-205",
      vehicle_no: "KAA-1032",
      quick_login_code_hash: "135790",
      active: true,
    },
    {
      display_name: "吳佳玲",
      identity_no: "B223456789",
      phone: "0928-772-481",
      vehicle_no: "KAB-2210",
      quick_login_code_hash: "246802",
      active: true,
    },
    {
      display_name: "陳建宏",
      identity_no: "C323456789",
      phone: "0936-458-119",
      vehicle_no: "KAC-5198",
      quick_login_code_hash: "975310",
      active: true,
    },
  ];
}

function demoCases() {
  return [
    {
      case_no: "LTC-001",
      full_name: "李美玉",
      phone: "02-2345-1101",
      emergency_contact: "李小姐",
      emergency_phone: "0910-552-001",
      care_level: "長照2.0 4級",
      mobility_type: "輪椅",
      pickup_address: "台北市中正區和平西路一段 38 號",
      default_destination: "松柏日照中心",
      notes: "需協助輪椅固定，上車前請電話通知家屬。",
      active: true,
    },
    {
      case_no: "LTC-002",
      full_name: "王進財",
      phone: "02-2755-8020",
      emergency_contact: "王太太",
      emergency_phone: "0922-810-334",
      care_level: "長照2.0 3級",
      mobility_type: "需攙扶",
      pickup_address: "台北市大安區信義路三段 91 巷 6 號",
      default_destination: "仁愛復能診所",
      notes: "聽力較弱，抵達時請慢慢說明。",
      active: true,
    },
    {
      case_no: "LTC-003",
      full_name: "張阿月",
      phone: "02-2368-7712",
      emergency_contact: "張先生",
      emergency_phone: "0988-610-741",
      care_level: "長照2.0 5級",
      mobility_type: "輪椅",
      pickup_address: "台北市萬華區西園路二段 122 號",
      default_destination: "和平醫院復健科",
      notes: "回程可能有藥袋，請提醒個案攜帶健保卡。",
      active: true,
    },
    {
      case_no: "LTC-004",
      full_name: "周秀琴",
      phone: "02-2302-6168",
      emergency_contact: "周小姐",
      emergency_phone: "0963-215-618",
      care_level: "長照2.0 2級",
      mobility_type: "可自行上下車",
      pickup_address: "台北市中山區龍江路 55 巷 8 號",
      default_destination: "長青據點",
      notes: "固定週三參與據點課程。",
      active: true,
    },
    {
      case_no: "LTC-005",
      full_name: "黃宗義",
      phone: "02-2558-9200",
      emergency_contact: "黃先生",
      emergency_phone: "0919-402-885",
      care_level: "長照2.0 4級",
      mobility_type: "需攙扶",
      pickup_address: "台北市士林區文林路 320 號",
      default_destination: "陽明日照中心",
      notes: "上午血糖較低，請確認已用早餐。",
      active: true,
    },
  ];
}

async function seedIfEmpty() {
  let drivers = await supabase("drivers?select=*&order=display_name.asc");
  let cases = await supabase("cases?select=*&order=case_no.asc");

  if (!drivers.length) {
    drivers = await supabase("drivers", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(demoDrivers()),
    });
  }

  if (!cases.length) {
    cases = await supabase("cases", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(demoCases()),
    });
  }

  const existingRides = await supabase(`daily_rides?select=id&service_date=eq.${todayKey()}&limit=1`);
  if (existingRides.length) return;

  const caseByNo = Object.fromEntries(cases.map((person) => [person.case_no, person]));
  const serviceDate = todayKey();

  const rides = [
    ridePayload(serviceDate, caseByNo["LTC-001"], drivers[0], addMinutes(-55), addMinutes(-25), "日照接送", {
      pickup_at: new Date(Date.now() - 50 * 60_000).toISOString(),
      dropoff_at: new Date(Date.now() - 24 * 60_000).toISOString(),
      pickup_lat: 25.0268,
      pickup_lng: 121.5199,
      dropoff_lat: 25.0362,
      dropoff_lng: 121.5278,
    }),
    ridePayload(serviceDate, caseByNo["LTC-002"], drivers[0], addMinutes(-15), addMinutes(12), "復健門診", {
      pickup_at: new Date(Date.now() - 10 * 60_000).toISOString(),
      pickup_lat: 25.0322,
      pickup_lng: 121.5397,
    }),
    ridePayload(serviceDate, caseByNo["LTC-003"], drivers[1], addMinutes(-18), addMinutes(12), "復健治療"),
    ridePayload(serviceDate, caseByNo["LTC-004"], drivers[2], addMinutes(18), addMinutes(46), "據點活動"),
    ridePayload(serviceDate, caseByNo["LTC-005"], drivers[1], addMinutes(35), addMinutes(68), "日照接送"),
  ];

  await supabase("daily_rides", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(rides),
  });
}

function ridePayload(serviceDate, person, driver, pickup, dropoff, purpose, overrides = {}) {
  return {
    service_date: serviceDate,
    case_id: person.id,
    driver_id: driver.id,
    scheduled_pickup: pickup,
    scheduled_dropoff: dropoff,
    pickup_address: person.pickup_address,
    destination_address: person.default_destination,
    purpose,
    ...overrides,
  };
}

async function readState() {
  if (process.env.DEMO_SEED_ENABLED === "true") {
    await seedIfEmpty();
  }

  const serviceDate = todayKey();
  const [drivers, cases, trips, locations] = await Promise.all([
    supabase("drivers?select=*&order=display_name.asc"),
    supabase("cases?select=*&order=case_no.asc"),
    supabase(`daily_rides?select=*&service_date=eq.${serviceDate}&order=scheduled_pickup.asc`),
    supabase("driver_locations?select=*"),
  ]);

  return {
    serviceDate,
    drivers: drivers.map(mapDriver),
    cases: cases.map(mapCase),
    trips: trips.map(mapTrip),
    driverLocations: mapLocations(locations),
    events: [],
    backend: "supabase",
  };
}

function mapDriver(driver) {
  return {
    id: driver.id,
    name: driver.display_name,
    identityNo: driver.identity_no || "",
    phone: driver.phone || "",
    vehicleNo: driver.vehicle_no,
    routeLabel: "",
    pin: driver.quick_login_code_hash || "",
    active: driver.active,
  };
}

function mapCase(person) {
  return {
    id: person.id,
    caseNo: person.case_no,
    name: person.full_name,
    identityNo: person.identity_no || "",
    gender: person.gender || "",
    birthDate: person.birth_date || "",
    phone: person.phone || "",
    emergencyContact: person.emergency_contact || "",
    emergencyRelation: person.emergency_relation || "",
    emergencyPhone: person.emergency_phone || "",
    careLevel: person.care_level || "",
    mobility: person.mobility_type || "",
    assistiveDevice: person.assistive_device || "",
    serviceArea: person.service_area || "",
    careManager: person.care_manager || "",
    careManagerPhone: person.care_manager_phone || "",
    pickupAddress: person.pickup_address,
    destinationAddress: person.default_destination,
    rideNote: person.ride_note || "",
    note: person.notes || "",
    active: person.active,
  };
}

function mapTrip(trip) {
  return {
    id: trip.id,
    serviceDate: trip.service_date,
    caseId: trip.case_id,
    driverId: trip.driver_id,
    scheduledPickup: timeOnly(trip.scheduled_pickup),
    scheduledDropoff: timeOnly(trip.scheduled_dropoff),
    pickupTime: trip.pickup_at ? localTime(new Date(trip.pickup_at)) : "",
    pickupAt: iso(trip.pickup_at),
    pickupLocation: trip.pickup_lat && trip.pickup_lng ? locationObject(trip.pickup_lat, trip.pickup_lng, "gps") : null,
    dropoffTime: trip.dropoff_at ? localTime(new Date(trip.dropoff_at)) : "",
    dropoffAt: iso(trip.dropoff_at),
    dropoffLocation: trip.dropoff_lat && trip.dropoff_lng ? locationObject(trip.dropoff_lat, trip.dropoff_lng, "gps") : null,
    purpose: trip.purpose || "",
    status: trip.status,
  };
}

function mapLocations(locations) {
  return locations.reduce((items, location) => {
    items[location.driver_id] = {
      lat: Number(location.latitude),
      lng: Number(location.longitude),
      accuracy: location.accuracy_meters || 0,
      source: location.location_source || "gps",
      updatedAt: iso(location.updated_at),
      eventType: location.event_type || "heartbeat",
      tripId: location.ride_id || "",
    };
    return items;
  }, {});
}

function locationObject(lat, lng, source, accuracy = 0) {
  return {
    lat: Number(lat),
    lng: Number(lng),
    accuracy,
    source,
  };
}

async function handleAction(action, payload = {}) {
  if (coordinatorActions.has(action) && payload.coordinatorPasscode !== coordinatorPasscode()) {
    throw new Error("Coordinator passcode required");
  }

  if (action === "assign_driver") {
    await supabase(`daily_rides?id=eq.${encodeURIComponent(payload.tripId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ driver_id: payload.driverId }),
    });
  }

  if (action === "create_case") {
    const duplicate = await findDuplicateCase(payload.case);
    if (duplicate) throw new Error(duplicate);
    const person = await supabase("cases", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(casePayload(payload.case)),
    });

    if (payload.trip) {
      await supabase("daily_rides", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          service_date: todayKey(),
          case_id: person[0].id,
          driver_id: payload.trip.driverId,
          scheduled_pickup: payload.trip.scheduledPickup,
          scheduled_dropoff: payload.trip.scheduledDropoff,
          pickup_address: payload.case.pickupAddress,
          destination_address: payload.case.destinationAddress,
          purpose: "日照接送",
        }),
      });
    }
  }

  if (action === "update_case") {
    const duplicate = await findDuplicateCase(payload.case, payload.case.id);
    if (duplicate) throw new Error(duplicate);
    await supabase(`cases?id=eq.${encodeURIComponent(payload.case.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(casePayload(payload.case)),
    });
  }

  if (action === "toggle_case") {
    await supabase(`cases?id=eq.${encodeURIComponent(payload.caseId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ active: payload.active }),
    });
  }

  if (action === "delete_case") {
    await supabase(`daily_rides?case_id=eq.${encodeURIComponent(payload.caseId)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
    await supabase(`cases?id=eq.${encodeURIComponent(payload.caseId)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
  }

  if (action === "create_driver") {
    const duplicate = await findDuplicateDriver(payload.driver);
    if (duplicate) throw new Error(duplicate);
    await supabase("drivers", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(driverPayload(payload.driver)),
    });
  }

  if (action === "update_driver") {
    const duplicate = await findDuplicateDriver(payload.driver, payload.driver.id);
    if (duplicate) throw new Error(duplicate);
    await supabase(`drivers?id=eq.${encodeURIComponent(payload.driver.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(driverPayload(payload.driver)),
    });
  }

  if (action === "toggle_driver") {
    await supabase(`drivers?id=eq.${encodeURIComponent(payload.driverId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ active: payload.active }),
    });
  }

  if (action === "delete_driver") {
    await supabase(`daily_rides?driver_id=eq.${encodeURIComponent(payload.driverId)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
    await supabase(`driver_locations?driver_id=eq.${encodeURIComponent(payload.driverId)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
    await supabase(`drivers?id=eq.${encodeURIComponent(payload.driverId)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
  }

  if (action === "create_trip") {
    const person = await supabase(`cases?select=*&id=eq.${encodeURIComponent(payload.caseId)}&limit=1`);
    if (!person[0]) throw new Error("Case not found");

    await supabase("daily_rides", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        service_date: todayKey(),
        case_id: person[0].id,
        driver_id: payload.driverId,
        scheduled_pickup: addMinutes(30),
        scheduled_dropoff: addMinutes(60),
        pickup_address: person[0].pickup_address,
        destination_address: person[0].default_destination,
        purpose: "臨時接送",
      }),
    });
  }

  if (action === "pickup") {
    await markRideEvent("pickup", payload);
  }

  if (action === "dropoff") {
    await markRideEvent("dropoff", payload);
  }

  return readState();
}

async function findDuplicateCase(person, editingId = "") {
  const filters = [`case_no=eq.${encodeURIComponent(person.caseNo)}`];
  if (person.identityNo) filters.push(`identity_no=eq.${encodeURIComponent(person.identityNo)}`);
  if (person.name && person.phone) {
    filters.push(`and(full_name.eq.${encodeURIComponent(person.name)},phone.eq.${encodeURIComponent(person.phone)})`);
  }

  const rows = await supabase(`cases?select=id,case_no,full_name,identity_no,phone&or=(${filters.join(",")})`);
  const duplicate = rows.find((row) => row.id !== editingId);
  if (!duplicate) return "";
  if (duplicate.case_no === person.caseNo) return `個案編號 ${person.caseNo} 已存在，請勿重複新增。`;
  if (person.identityNo && duplicate.identity_no === person.identityNo) return `身分證字號 ${person.identityNo} 已存在於 ${duplicate.full_name}。`;
  return `${person.name} 與電話 ${person.phone} 已存在，請確認是否為同一位個案。`;
}

async function findDuplicateDriver(driver, editingId = "") {
  const filters = [`vehicle_no=eq.${encodeURIComponent(driver.vehicleNo)}`];
  if (driver.identityNo) filters.push(`identity_no=eq.${encodeURIComponent(driver.identityNo)}`);
  if (driver.name && driver.phone) {
    filters.push(`and(display_name.eq.${encodeURIComponent(driver.name)},phone.eq.${encodeURIComponent(driver.phone)})`);
  }

  const rows = await supabase(`drivers?select=id,display_name,identity_no,phone,vehicle_no&or=(${filters.join(",")})`);
  const duplicate = rows.find((row) => row.id !== editingId);
  if (!duplicate) return "";
  if (driver.identityNo && duplicate.identity_no === driver.identityNo) return `司機身分證字號 ${driver.identityNo} 已存在於 ${duplicate.display_name}。`;
  if (duplicate.vehicle_no === driver.vehicleNo) return `車號 ${driver.vehicleNo} 已由 ${duplicate.display_name} 使用。`;
  return `${driver.name} 與電話 ${driver.phone} 已存在，請確認是否重複新增。`;
}

function casePayload(person) {
  return {
    case_no: person.caseNo,
    full_name: person.name,
    identity_no: person.identityNo || null,
    gender: person.gender || null,
    birth_date: person.birthDate || null,
    phone: person.phone,
    emergency_contact: person.emergencyContact || null,
    emergency_relation: person.emergencyRelation || null,
    emergency_phone: person.emergencyPhone || null,
    care_level: person.careLevel,
    mobility_type: person.mobility,
    assistive_device: person.assistiveDevice || null,
    service_area: person.serviceArea || null,
    care_manager: person.careManager || null,
    care_manager_phone: person.careManagerPhone || null,
    pickup_address: person.pickupAddress,
    default_destination: person.destinationAddress,
    ride_note: person.rideNote || null,
    notes: person.note || null,
    active: person.active ?? true,
  };
}

function driverPayload(driver) {
  return {
    display_name: driver.name,
    identity_no: driver.identityNo || null,
    phone: driver.phone,
    vehicle_no: driver.vehicleNo,
    route_label: null,
    quick_login_code_hash: driver.pin,
    active: driver.active ?? true,
  };
}

function rpcPayload(payload) {
  return {
    p_ride_id: payload.tripId,
    p_lat: payload.location?.lat ?? null,
    p_lng: payload.location?.lng ?? null,
    p_accuracy_meters: payload.location?.accuracy ?? null,
    p_location_source: payload.location?.source || "gps",
  };
}

async function markRideEvent(type, payload) {
  const rides = await supabase(`daily_rides?select=*&id=eq.${encodeURIComponent(payload.tripId)}&limit=1`);
  const ride = rides[0];
  if (!ride) throw new Error("Ride not found");

  if (type === "dropoff" && !ride.pickup_at) {
    throw new Error("請先紀錄接到個案時間");
  }

  const occurredAt = new Date().toISOString();
  const location = payload.location || {};
  const patch =
    type === "pickup"
      ? {
          pickup_at: ride.pickup_at || occurredAt,
          pickup_lat: location.lat ?? ride.pickup_lat ?? null,
          pickup_lng: location.lng ?? ride.pickup_lng ?? null,
        }
      : {
          dropoff_at: ride.dropoff_at || occurredAt,
          dropoff_lat: location.lat ?? ride.dropoff_lat ?? null,
          dropoff_lng: location.lng ?? ride.dropoff_lng ?? null,
        };

  const updated = await supabase(`daily_rides?id=eq.${encodeURIComponent(payload.tripId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });

  const nextRide = updated[0] || ride;
  const eventAt = type === "pickup" ? nextRide.pickup_at : nextRide.dropoff_at;

  await supabase("ride_events", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      ride_id: ride.id,
      driver_id: ride.driver_id,
      event_type: type,
      occurred_at: eventAt,
      latitude: location.lat ?? null,
      longitude: location.lng ?? null,
      accuracy_meters: location.accuracy ?? null,
      location_source: location.source || "gps",
    }),
  });

  if (location.lat && location.lng) {
    await supabase("driver_locations?on_conflict=driver_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        driver_id: ride.driver_id,
        ride_id: ride.id,
        latitude: location.lat,
        longitude: location.lng,
        accuracy_meters: location.accuracy ?? null,
        event_type: type,
        location_source: location.source || "gps",
        updated_at: eventAt,
      }),
    });
  }
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      res.status(200).json({ ok: true, state: await readState() });
      return;
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      res.status(200).json({ ok: true, state: await handleAction(body.action, body.payload) });
      return;
    }

    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}
