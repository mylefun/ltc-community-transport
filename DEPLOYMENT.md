# GitHub、Supabase、Vercel 部署教學

這個專案目前是純前端靜態原型，可直接部署到 Vercel。資料庫正式化時，先在 Supabase 建表，再把前端從 `localStorage` 改為呼叫 Supabase API / RPC。

## 1. 推到 GitHub

### 方法 A：用 GitHub 網頁建立 repo

1. 到 GitHub，按右上角 `+`，選 `New repository`。
2. Repository name 建議填：`ltc-community-transport`。
3. 先不要勾 `Add a README file`，因為本專案已經有 `README.md`。
4. 建立後，GitHub 會顯示 remote URL，例如：

```bash
https://github.com/YOUR_ACCOUNT/ltc-community-transport.git
```

5. 回到本機專案資料夾執行：

```bash
git init
git add .
git commit -m "Initial long-term care transport app"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/ltc-community-transport.git
git push -u origin main
```

### 方法 B：用 GitHub CLI

如果你已安裝並登入 `gh`：

```bash
git init
git add .
git commit -m "Initial long-term care transport app"
gh repo create ltc-community-transport --source=. --private --push
```

若要公開 repo，把 `--private` 改成 `--public`。

## 2. 設置 Supabase

1. 到 Supabase 建立新專案。
2. 進入專案後，打開 `SQL Editor`。
3. 複製本專案的 `supabase-schema.sql` 全部內容並執行。
4. 到 `Authentication` 建立使用者：
   - 承辦人帳號：角色設為 `coordinator` 或 `admin`。
   - 司機帳號：角色設為 `driver`，並在 `profiles.driver_id` 對應到 `drivers.id`。
5. 到 Project Settings 找到 API 設定，取得：
   - Project URL
   - anon / publishable key
6. 前端正式串接時，只能使用 anon / publishable key；不要把 `service_role` key 放到前端或 GitHub。

### 建議先建立測試資料

執行 schema 後，可先手動新增：

```sql
insert into public.drivers(display_name, phone, vehicle_no, route_label)
values
  ('林志明', '0912-118-205', 'KAA-1032', 'A 線'),
  ('吳佳玲', '0928-772-481', 'KAB-2210', 'B 線'),
  ('陳建宏', '0936-458-119', 'KAC-5198', 'C 線');
```

個案與每日班表可從 `cases`、`daily_rides` 表新增。

## 3. 設置 Vercel

1. 到 Vercel，選 `Add New` -> `Project`。
2. 選擇剛剛推上 GitHub 的 repository。
3. Framework Preset 選 `Other`。
4. Build Command 留空。
5. Output Directory 留空或使用預設。
6. 按 Deploy。

部署完成後，Vercel 會給你類似：

```text
https://ltc-community-transport.vercel.app
```

之後每次 `git push` 到 GitHub，Vercel 會自動重新部署。

## 4. Vercel 環境變數

如果後續把前端改成讀 Supabase，請在 Vercel 專案：

1. 進入 `Settings`。
2. 選 `Environment Variables`。
3. 新增：

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

目前這個純靜態版本尚未讀取 `.env`，因此部署原型時可以先不用設定環境變數。

## 5. 正式串接 Supabase 時的前端流程

司機按鈕應呼叫：

```js
await supabase.rpc("mark_ride_pickup", {
  p_ride_id: rideId,
  p_lat: latitude,
  p_lng: longitude,
  p_accuracy_meters: accuracy,
  p_location_source: "gps",
});

await supabase.rpc("mark_ride_dropoff", {
  p_ride_id: rideId,
  p_lat: latitude,
  p_lng: longitude,
  p_accuracy_meters: accuracy,
  p_location_source: "gps",
});
```

承辦人地圖可以讀：

```sql
select * from public.driver_location_board;
```

承辦人今日班表可以讀：

```sql
select * from public.daily_ride_board
where service_date = current_date
order by scheduled_pickup;
```

## 6. 上線前注意事項

- 不要把 `.env`、service role key、資料庫密碼推到 GitHub。
- 司機定位屬於個資與工作軌跡，正式上線前應告知司機定位用途與保存期間。
- 建議承辦人使用完整帳密登入；司機 PIN 可作為快速入口，但正式版仍應搭配 Supabase Auth。
- RLS 已在 `supabase-schema.sql` 開啟，正式資料請不要關閉 RLS。
