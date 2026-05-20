# 社區交通車每日接送系統

這是一個以長照社區交通車承辦人為核心的單頁應用程式原型。部署到 Vercel 後會優先透過 `/api/state` 連接 Supabase；若本機沒有 API，會自動使用瀏覽器 `localStorage` 保存示範資料。

## 主要角色

- 承辦人：管理個案、查看今日接送狀態、調整司機指派。
- 承辦人：在地圖上查看各司機最新定位與接送進度。
- 司機：快速登入後查看自己的班表，按一下紀錄「接到個案」與「送達目的地」時間與定位。

## 檔案

- `index.html`：應用程式入口。
- `styles.css`：介面樣式。
- `app.js`：互動邏輯、Supabase API 模式與本機示範資料 fallback。
- `api/state.js`：Vercel serverless API，負責讀寫 Supabase。
- `supabase-schema.sql`：Supabase 資料表、RLS、RPC 打卡函式。

## 本機開啟

直接用瀏覽器打開：

```text
/Users/mylefun/Documents/Codex/2026-05-20/1-2-3-4-5-supabase/index.html
```

示範 PIN：

- 林志明：`135790`
- 吳佳玲：`246802`
- 陳建宏：`975310`

## Supabase 落地方式

1. 在 Supabase 建立新專案。
2. 到 SQL Editor 執行 `supabase-schema.sql`。
3. 在 Vercel 設定 serverless API 所需環境變數：
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
   - `COORDINATOR_PIN`，預設承辦人密碼為 `2468`
4. 重新部署 Vercel。

## 資料設計重點

- `daily_rides.pickup_at` 與 `dropoff_at` 使用 `timestamptz`，保留實際時間與時區。
- 每次打卡會同步新增 `ride_events`，包含時間、座標、精準度與來源，方便稽核與追蹤。
- `driver_locations` 保存每位司機最新位置，承辦人地圖可以直接讀取。
- 司機只能讀取自己被指派的班次；承辦人可管理全部資料。
- 司機端透過 Vercel API 呼叫 Supabase RPC 函式打卡。
- `SUPABASE_SECRET_KEY` 只允許放在 Vercel 環境變數，不可放入前端或 GitHub。

## 定位測試

司機按「已接到個案」或「已送達目的地」時，瀏覽器會嘗試取得定位。若未允許定位、裝置不支援定位，或目前不是安全來源，原型會使用示範座標，仍可測試承辦人地圖與流程。
