# 城市环境与天气大屏 — PRD 与接口文档

---

## 1. 文档信息

| 项目 | 内容 |
|------|------|
| 项目中文名 | 城市环境与天气大屏 |
| 项目英文名 | City Weather Dashboard |
| 文档版本 | v2.0 |
| 文档日期 | 2026-07-03 |
| 主数据源 | 和风天气 |
| 项目地址 | https://github.com/gouxinjie/weather-dashboard |
| 线上地址 | http://weather.gouxinjie.com |

---

## 2. 项目背景

城市天气类大屏常见问题是"展示效果强，但信息结构弱"。很多页面只展示实时温度和天气图标，缺少对未来趋势、空气质量、灾害预警和周期统计的统一组织，导致页面更像简单看板，而不是完整的数据产品。

本项目围绕单城市构建一个天气与环境大屏，在一个页面中同时回答以下问题：

- **现在**天气怎么样
- **接下来 24 小时**和**未来 7 天**会怎么变化
- **空气质量**是否健康
- 当前是否有**灾害预警**
- **近 7 天**和**近 30 天**的天气与降水有什么趋势

除主页面外，项目还提供城市选择抽屉和统计详情页，用于完成城市切换与长周期数据查看。

---

## 3. 产品目标

### 3.1 核心目标

打造一个以天气为视觉中心的城市环境可视化大屏，统一展示实时天气、未来趋势、空气质量、灾害预警、生活指数和日周月统计。

### 3.2 业务目标

- 形成一个完整、可持续更新的天气数据展示作品
- 提供一眼可读的城市天气状态总览
- 提供趋势型信息而不仅是单点实时数据
- 提供可演示、可部署、可扩展的前后端项目模板

### 3.3 成功标准

- 首页能够突出展示天气核心状态
- 能展示未来 24 小时与未来 7 天趋势
- 能展示 AQI 与预警信息
- 能展示周统计与月统计，并明确标记统计样本期
- 首次进入页面能够优先定位当前城市，失败时自动回退默认城市
- 能稳定使用和风天气免费接口完成 MVP

---

## 4. 目标用户

| 角色 | 关注点 |
|------|--------|
| 普通查看用户 | 当前天气、空气质量、出行建议 |
| 展示型用户 | 展厅、作品集、演示屏场景 |
| 管理视角用户 | 快速了解城市天气风险和环境状态 |

---

## 5. 产品范围

### 5.1 本期范围（已实现）

- 单城市天气与环境大屏首页
- 实时天气主模块
- 24 小时天气趋势
- 分钟级降水预报
- 7 天天气预报
- 实时空气质量
- 空气质量小时趋势
- 实时灾害预警
- 生活指数
- 周统计与月统计
- 当前月统计按"截至最新采样日"展示
- 首次进入页面自动定位当前城市
- 城市选择抽屉（搜索、热门、最近访问）
- 统计详情页（近 10 天温度/降水/AQI 趋势）

### 5.2 暂不纳入本期

- 多城市对比
- 多用户系统
- 登录与权限系统
- 精细 GIS 图层
- 多年历史气候分析
- 复杂后台管理系统

---

## 6. 数据源策略

### 6.1 主数据源

主数据源使用和风天气。通过单一数据源覆盖：

| 数据类型 | 和风天气 API |
|----------|-------------|
| 城市搜索 | `GeoAPI` |
| 实时天气 | `Weather Now` |
| 逐小时预报 | `Weather 24h` |
| 每日预报 | `Weather 7d` |
| 分钟级降水 | `Minutely Rain` |
| 空气质量实况 | `Air Now` |
| 空气质量预报 | `Air 5d` |
| 灾害预警 | `Warning Now` |
| 生活指数 | `Indices` |
| 最近 10 天历史 | `Historical` |

### 6.2 接口调用策略

- 前端**不直接调用**第三方接口
- Node.js 后端负责请求和风天气
- 后端统一字段命名与响应结构
- 后端负责缓存与聚合
- SQLite 负责存储每日快照与统计结果
- 对前端公开的业务接口统一使用 `locationId`
- 对第三方接口所需的坐标由服务端根据 `locationId` 自行解析
- 首次定位由浏览器提供坐标，后端负责解析为城市与 `locationId`

### 6.3 数据分层

```
第三方原始数据层    →  和风天气原始响应
       ↓
服务聚合层          →  后端转换后的统一业务对象 + 内存缓存
       ↓
本地快照层          →  SQLite 快照表（weather_now/air_now 等）
       ↓
本地统计层          →  SQLite 聚合表（按日/周/月聚合）
       ↓
前端展示层          →  页面组件直接消费统一接口
```

---

## 7. 页面结构

项目采用"**1 个主页面 + 1 个城市选择抽屉 + 1 个统计详情页**"的结构。

### 7.1 主页面（首页 `/`）

承载天气主模块、空气质量、预警、趋势和统计摘要，适合大屏展示与实时查看。

**布局**：顶部状态栏 + 中间天气主模块（视觉中心） + 两侧辅助模块 + 底部统计带

#### 7.1.1 顶部状态栏

| 显示项 | 说明 |
|--------|------|
| 城市名称 | 当前选中城市 |
| 当前日期时间 | 实时刷新 |
| 数据更新时间 | 最新数据采样时间 |
| 当前天气摘要 | 温度 + 天气文字 |
| 当前 AQI 等级 | 彩色标签 |
| 当前预警状态 | 有/无 + 最高等级 |

#### 7.1.2 中间天气主模块（视觉中心）

当前温度、体感温度、天气现象、高温/低温、风向风力、湿度、能见度、气压、当前降水量、紫外线强度。

#### 7.1.3 24 小时趋势

24 小时温度折线、降水概率柱图、天气现象变化、日出日落时间。

#### 7.1.4 7 天天气预报

日期、白天/夜间天气、最高温/最低温、日降水量、风力风向。

#### 7.1.5 空气质量模块

AQI、空气质量等级、首要污染物、PM2.5/PM10/NO₂/SO₂/O₃/CO、24 小时 AQI 趋势。

#### 7.1.6 预警模块

是否存在预警、预警类型、预警等级、发布时间、有效时间、说明、防护建议。

#### 7.1.7 生活指数模块

穿衣指数、洗车指数、运动指数、感冒指数、紫外线指数、出行建议。

#### 7.1.8 统计摘要带

| 统计项 | 说明 |
|--------|------|
| 本周平均气温 | 当前自然周 |
| 本周总降水 | 毫米 |
| 本周雨天数 | 天 |
| 本月平均气温 | 截至最新采样日 |
| 本月累计降水 | 毫米（截至最新采样日） |
| 本月天气类型占比 | 已采样天数范围内 |

### 7.2 城市选择抽屉

不单独占用页面路由，从主页面入口打开。用于城市搜索、切换、定位和默认城市设置。

**显示内容**：城市搜索框、当前定位城市、最近访问城市、热门城市（北上广深成杭）、默认城市设置入口。

**交互要求**：
- 点击主页面顶部城市名或定位图标后打开
- 支持搜索后直接切换城市
- 支持一键回到当前定位城市
- 切换成功后关闭抽屉并刷新主页面数据

### 7.3 统计详情页（`/stats`）

单独页面承载长周期统计和更高信息密度内容，作为主页面统计摘要的下钻页面。

**显示内容**：
- 近 10 天温度趋势
- 近 10 天降水趋势
- 近 10 天 AQI 趋势
- 近 10 天天气类型占比
- 周统计明细表格
- 月统计明细表格
- 样本期说明
- 数据更新时间与数据来源说明

**交互要求**：
- 由主页面统计摘要卡进入
- 页面顶部支持返回主页面
- 所有图表支持查看具体日期与指标值

### 7.4 首次进入定位规则

1. 页面加载时读取本地缓存城市
2. 若存在缓存城市，则直接请求首页聚合接口
3. 若不存在缓存城市，则请求浏览器定位
4. 定位成功后调用"当前城市解析接口"
5. 后端返回 `locationId` 与城市基础信息
6. 前端调用首页聚合接口并缓存该城市
7. 若定位失败，则加载默认城市（上海）

---

## 8. UI 设计要求

### 8.1 风格定位

整体采用"**气象指挥台 + 城市报时牌**"风格，禁止使用蓝紫霓虹大屏模板。

### 8.2 视觉关键词

atmospheric / urban forecast / signal board / weather command

### 8.3 色彩系统

| 用途 | 色值 | 说明 |
|------|------|------|
| 背景 | `#0F1417` | 深色暗底 |
| 卡片底 | `#171D21` | 轻度提亮 |
| 分割线 | `#283138` | 弱分割 |
| 主文字 | `#F2E9D8` | 暖白 |
| 次文字 | `#9DA5A6` | 灰蓝 |
| 晴天高亮 | `#F4B942` | 金黄色 |
| 降雨高亮 | `#4FA3A5` | 青蓝色 |
| 风险高亮 | `#D96C3F` | 警示橙 |
| 正常状态 | `#88B04B` | 安抚绿 |

### 8.4 布局比例

| 区域 | 宽度 | 说明 |
|------|------|------|
| 左侧 | 24% | 统计摘要 + 7 天预报 |
| 中间 | 52% | 天气主模块（视觉重心） |
| 右侧 | 24% | 空气质量 + 预警 + 生活指数 |

---

## 9. 数据指标定义

### 9.1 实时天气指标

`current_temp` / `feels_like` / `weather_text` / `weather_icon` / `temp_max_today` / `temp_min_today` / `wind_dir` / `wind_scale` / `wind_speed` / `humidity` / `pressure` / `visibility` / `precipitation_now` / `uv_index`

### 9.2 空气质量指标

`aqi` / `category` / `primary_pollutant` / `pm2p5` / `pm10` / `so2` / `no2` / `o3` / `co`

### 9.3 日统计指标

`daily_max_temp` / `daily_min_temp` / `daily_avg_temp` / `daily_precipitation` / `daily_weather_type` / `daily_aqi_avg`

### 9.4 周统计指标

`weekly_avg_temp` / `weekly_total_precipitation` / `weekly_rainy_days` / `weekly_aqi_avg`

### 9.5 月统计指标

`monthly_avg_temp` / `monthly_total_precipitation` / `monthly_rainy_days` / `monthly_weather_type_ratio` / `monthly_sample_days` / `monthly_expected_days` / `monthly_stats_mode`

---

## 10. 数据口径

### 10.1 时间口径

| 统计维度 | 规则 |
|----------|------|
| 日统计 | 自然日 |
| 周统计 | 自然周，周一为起始 |
| 月统计 | 自然月 |
| 时区 | 统一使用系统配置时区 |

### 10.2 当前月统计口径

- 当前月统计默认展示"**截至最新采样日**"的月内累计结果，不宣称为完整自然月最终值
- 当前月接口必须返回 `sampleDays`、`expectedDays`、`isPartialMonth` 与 `statsMode`
- 当 `sampleDays < expectedDays` 时，前端必须显示"统计样本期不足"提示
- 若需要完整自然月报表，应在月结束后生成单独的封账统计，不与当前月累计混用

### 10.3 空气质量统计口径

- `daily_aqi_avg` 仅基于 `air_now_snapshots` 的实测 AQI 样本聚合，不混用空气质量预报值
- `weekly_aqi_avg` 与 `monthly_aqi_avg` 基于日级平均值继续聚合
- AQI 日均值使用当日有效样本的算术平均
- 若单日有效样本数低于预期样本数的 75%，则该日标记为 `partial`
- 周、月统计接口必须返回样本完整度字段，供前端提示数据可信度

---

## 11. 技术方案

### 11.1 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | React 18 |
| 构建工具 | Vite |
| 语言 | TypeScript（全栈） |
| 图表 | ECharts |
| 样式 | SCSS |
| 路由 | React Router |
| 状态管理 | Zustand |
| 后端框架 | Express |
| 数据库 | SQLite（better-sqlite3） |
| 部署 | Docker + Nginx + GitHub Actions |

### 11.2 后端分层架构

```
routes/          → 路由注册
controllers/     → 参数接收、调用 service、返回统一响应
services/        → 业务编排、第三方聚合、统计计算
repositories/    → 数据库访问（参数化查询）
integrations/    → 和风天气 API 客户端封装
utils/           → 缓存、日志、校验、响应工具
```

### 11.3 缓存与同步策略

| 数据类型 | 内存缓存 TTL | 说明 |
|----------|-------------|------|
| 实时天气 | 10 分钟 | 快照落库 |
| 24 小时趋势 | 30 分钟 | 快照落库 |
| 7 天预报 | 60 分钟 | 快照落库 |
| AQI | 15 分钟 | 快照落库 |
| 预警 | 5 分钟 | 快照落库 |
| 生活指数 | 每天刷新 | 快照落库 |
| 周/月统计 | 每日 00:10 聚合 | 基于日统计重算 |

**数据优先级**：内存缓存 → 数据库快照兜底 → 第三方实时请求（带超时和限流保护）

### 11.4 页面初始化流程

```
页面加载 → 读取本地缓存城市
         → 有缓存 → 直接请求首页聚合
         → 无缓存 → 请求浏览器定位
                  → 成功 → 调用"当前城市解析接口" → 获取 locationId → 请求聚合
                  → 失败 → 加载默认城市（上海）
```

### 11.5 路由设计

| 路径 | 页面 |
|------|------|
| `/` | 主页面大屏 |
| `/stats` | 统计详情页 |

---

## 12. 数据库设计

### 12.1 核心数据表

| 表名 | 类型 | 用途 |
|------|------|------|
| `cities` | 基础数据 | 城市信息缓存与 LocationID |
| `weather_now_snapshots` | 快照 | 实时天气时间序列 |
| `weather_hourly_snapshots` | 预报快照 | 逐小时天气预报 |
| `weather_daily_snapshots` | 预报快照 | 每日天气预报 |
| `minutely_precip_snapshots` | 预报快照 | 分钟级降水 |
| `air_now_snapshots` | 快照 | 实时空气质量时间序列 |
| `air_hourly_snapshots` | 预报快照 | 空气质量小时预报 |
| `weather_alerts` | 快照 | 当前及历史预警 |
| `weather_indices` | 快照 | 生活指数 |
| `weather_stats_daily` | 聚合 | 按日聚合统计 |
| `weather_stats_weekly` | 聚合 | 按周聚合统计 |
| `weather_stats_monthly` | 聚合 | 按月聚合统计 |
| `sync_logs` | 日志 | 数据同步记录 |
| `app_settings` | 配置 | KV 键值配置表 |

### 12.2 数据存储策略

- **快照型数据**（weather_now / air_now / alerts）：按时间持续新增，保留时间序列
- **预报型数据**（hourly / daily / air_hourly）：按抓取时间保存一份预测快照
- **聚合型数据**（stats_daily / weekly / monthly）：按统计周期更新或重算，月统计基于日级数据重新聚合
- **页面读取**："最新有效快照 + 本地聚合结果"，不直接读取第三方原始响应
- **数据库特性**：WAL 模式、外键约束、合理索引

---

## 13. 部署架构

### 13.1 部署拓扑

```
                     HTTP 请求
                         │
                    ┌────▼────┐
                    │ ECS 宿主 │
                    │ Nginx:80│
                    │         │
                    │  ├─ _ (default_server) → /var/www/blog
                    │  └─ weather.gouxinjie.com → 127.0.0.1:3200
                    └────┬────┘
                         │
              ┌──────────▼──────────┐
              │  Docker Compose     │
              │                     │
              │  ┌─ weather-frontend (Nginx:80 容器内)  │
              │  │  ├─ /       → 静态页面                │
              │  │  └─ /api/*  → proxy_pass backend:3201 │
              │  │              port 3200                │
              │  │                                       │
              │  └─ weather-backend (Express:3201 容器内) │
              │     └─ /app/data → Volume (SQLite)       │
              └──────────────────────────────────────────┘
```

### 13.2 端口规划

| 端口 | 归属 | 说明 |
|------|------|------|
| 80 | 宿主 Nginx | 对外统一入口，按域名分流 |
| 3200 | weather-frontend | Docker 宿主机映射端口 |
| 3201 | weather-backend | Docker 内网，不对外暴露 |

### 13.3 CI/CD 流程

```
Git Push (main) → GitHub Actions
                    ├─ 构建后端 Docker 镜像
                    ├─ 构建前端 Docker 镜像
                    ├─ 导出 tar.gz → SCP 上传 ECS
                    └─ ECS 端：
                         ├─ docker load 载入镜像
                         ├─ docker compose down 停止旧容器
                         ├─ docker compose up -d 启动新容器
                         └─ 打印健康检查状态
```

### 13.4 容器健康检查

```
weather-backend:  curl -f http://localhost:3201/ → 200 OK
weather-frontend: depends_on backend (service_healthy)
```

---

## 14. 统一响应格式

### 14.1 成功响应

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

### 14.2 失败响应

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "错误描述（中文）",
  "data": null
}
```

### 14.3 错误码

| 错误码 | 含义 |
|--------|------|
| `CITY_NOT_FOUND` | 城市未找到 |
| `LOCATION_RESOLVE_FAILED` | 定位解析失败 |
| `INVALID_LOCATION_ID` | 无效的 LocationID |
| `INVALID_COORDINATES` | 无效坐标 |
| `THIRD_PARTY_API_ERROR` | 第三方 API 错误 |
| `THIRD_PARTY_RATE_LIMITED` | 第三方 API 限流 |
| `CACHE_MISS` | 缓存未命中 |
| `STATS_NOT_READY` | 统计数据未就绪 |
| `INTERNAL_SERVER_ERROR` | 服务器内部错误 |

### 14.4 鉴权说明

- 当前 MVP 为单用户本地部署版本
- 公开业务接口不要求传递 `userId`
- 城市、数据源密钥、默认城市等配置由服务端环境变量管理
- 前台使用 `locationId` 作为城市主键

---

## 15. 接口文档

> **说明**：以下接口均为已实现的后端 API，基础路径为容器内 `http://backend:3201`，对外通过宿主 Nginx 反代。

### 15.1 健康检查

```
GET /
```

**说明**：Docker 健康检查用，返回服务存活状态。

**返回示例**：
```json
{ "success": true, "message": "服务正常运行" }
```

---

### 15.2 城市搜索

```
GET /api/cities/search
```

**说明**：根据城市关键字搜索城市并返回和风天气 LocationID。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `keyword` | `string` | 是 | 城市关键字 |

**返回字段**：`id` / `name` / `adm1` / `adm2` / `country` / `lat` / `lon` / `tz` / `utcOffset` / `type`

**返回示例**：

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": "101010100",
        "name": "北京",
        "adm1": "北京市",
        "adm2": "北京",
        "country": "中国",
        "lat": "39.90499",
        "lon": "116.40529",
        "tz": "Asia/Shanghai",
        "utcOffset": "+08:00",
        "type": "city"
      }
    ]
  }
}
```

---

### 15.3 当前城市定位解析

```
POST /api/location/resolve-current
```

**说明**：根据浏览器返回的坐标解析当前城市，并返回城市基础信息与 `locationId`。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `lat` | `string` | 是 | 纬度 |
| `lon` | `string` | 是 | 经度 |

**返回字段**：同 15.2 城市搜索。

---

### 15.4 首页聚合接口（推荐首屏唯一接口）

```
GET /api/screen/home
```

**说明**：首页一次性拉取所有模块关键数据，减少前端首屏并发请求。内部并行调用 10 个子模块，单模块失败不影响其他模块。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `locationId` | `string` | 是 | 城市 LocationID |

**返回结构**：

```json
{
  "overview": { /* 首页概览，见 15.5 */ },
  "hourly": { /* 24 小时趋势，见 15.6 */ },
  "minutely": { /* 分钟级降水，见 15.7 */ },
  "daily": { /* 7 天预报，见 15.8 */ },
  "airNow": { /* 空气质量，见 15.9 */ },
  "airHourly": { /* 空气趋势，见 15.10 */ },
  "alerts": { /* 预警，见 15.11 */ },
  "indices": { /* 生活指数，见 15.12 */ },
  "weeklyStats": { /* 周统计，见 15.13 */ },
  "monthlyStats": { /* 月统计，见 15.14 */ }
}
```

---

### 15.5 首页概览

```
GET /api/screen/overview
```

**说明**：返回首页首屏所需的聚合数据，包括城市信息、实时天气、今日摘要、实时空气质量和预警摘要。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `locationId` | `string` | 是 | 城市 LocationID |

**返回字段**：

**location**：`id` / `name` / `adm1` / `adm2` / `lat` / `lon` / `tz`

**weatherNow**：
`obsTime` / `temp` / `feelsLike` / `icon` / `text` / `windDir` / `windScale` / `windSpeed` / `humidity` / `precip` / `pressure` / `vis` / `cloud`

**todaySummary**：
`tempMax` / `tempMin` / `uvIndex` / `sunrise` / `sunset` / `statsMode`

**airNow**：
`aqi` / `category` / `primaryPollutant` / `pm2p5` / `pm10` / `no2` / `so2` / `o3` / `co`

**alertSummary**：
`hasAlert` / `count` / `highestSeverity`

**返回示例**：

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {
    "location": {
      "id": "101010100",
      "name": "北京",
      "adm1": "北京市",
      "adm2": "北京",
      "lat": "39.90499",
      "lon": "116.40529",
      "tz": "Asia/Shanghai"
    },
    "weatherNow": {
      "obsTime": "2026-07-03T10:10+08:00",
      "temp": "28",
      "feelsLike": "30",
      "icon": "101",
      "text": "多云",
      "windDir": "东南风",
      "windScale": "3",
      "windSpeed": "18",
      "humidity": "62",
      "precip": "0.0",
      "pressure": "1004",
      "vis": "12",
      "cloud": "55"
    },
    "todaySummary": {
      "tempMax": "31",
      "tempMin": "21",
      "uvIndex": "6",
      "sunrise": "04:46",
      "sunset": "19:42",
      "statsMode": "current_day_summary"
    },
    "airNow": {
      "aqi": "72",
      "category": "良",
      "primaryPollutant": "PM2.5",
      "pm2p5": "52",
      "pm10": "76",
      "no2": "18",
      "so2": "5",
      "o3": "92",
      "co": "0.7"
    },
    "alertSummary": {
      "hasAlert": false,
      "count": 0,
      "highestSeverity": null
    }
  }
}
```

---

### 15.6 24 小时天气趋势

```
GET /api/screen/hourly
```

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `locationId` | `string` | 是 | 城市 LocationID |

**返回字段**：`fxTime` / `temp` / `icon` / `text` / `pop` / `windDir` / `windScale` / `windSpeed` / `humidity` / `pressure` / `cloud`

**返回示例**：

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "fxTime": "2026-07-03T11:00+08:00",
        "temp": "29",
        "icon": "101",
        "text": "多云",
        "pop": "10",
        "windDir": "东南风",
        "windScale": "3",
        "windSpeed": "16",
        "humidity": "60",
        "pressure": "1003",
        "cloud": "58"
      }
    ]
  }
}
```

---

### 15.7 分钟级降水

```
GET /api/screen/minutely
```

**说明**：返回未来 2 小时分钟级降水预报。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `locationId` | `string` | 是 | 城市 LocationID |

**返回字段**：`summary` / `list[].fxTime` / `list[].precip` / `list[].type`

---

### 15.8 7 天天气预报

```
GET /api/screen/daily
```

**说明**：返回未来 7 天每日天气预报。

**请求参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `locationId` | `string` | 是 | — | 城市 LocationID |
| `days` | `number` | 否 | `7` | 预报天数 |

**返回字段**：`fxDate` / `sunrise` / `sunset` / `tempMax` / `tempMin` / `iconDay` / `textDay` / `iconNight` / `textNight` / `precip` / `humidity` / `pressure` / `uvIndex` / `windDirDay` / `windScaleDay`

---

### 15.9 实时空气质量

```
GET /api/screen/air/now
```

**说明**：返回实时空气质量数据。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `locationId` | `string` | 是 | 城市 LocationID |

**返回字段**：`pubTime` / `aqi` / `level` / `category` / `primaryPollutant` / `pm2p5` / `pm10` / `no2` / `so2` / `o3` / `co`

---

### 15.10 空气质量小时趋势

```
GET /api/screen/air/hourly
```

**说明**：返回未来 24 小时空气质量趋势。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `locationId` | `string` | 是 | 城市 LocationID |

**返回字段**：`fxTime` / `aqi` / `category` / `primaryPollutant`

---

### 15.11 预警信息

```
GET /api/screen/alerts
```

**说明**：返回当前城市所有生效中的气象预警。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `locationId` | `string` | 是 | 城市 LocationID |

**返回字段**：`id` / `senderName` / `publishedAt` / `effectiveTime` / `expireTime` / `eventType` / `severity` / `headline` / `description` / `instruction`

---

### 15.12 生活指数

```
GET /api/screen/indices
```

**说明**：返回生活指数列表（穿衣、洗车、运动、感冒、紫外线等）。

**请求参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `locationId` | `string` | 是 | — | 城市 LocationID |
| `days` | `string` | 否 | `1d` | 天数范围 |

**返回字段**：`date` / `type` / `name` / `level` / `category` / `text`

---

### 15.13 周统计

```
GET /api/screen/stats/weekly
```

**说明**：返回当前周聚合统计结果，由本地数据库聚合生成。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `locationId` | `string` | 是 | 城市 LocationID |

**返回字段**：`weekStart` / `weekEnd` / `avgTemp` / `totalPrecipitation` / `rainyDays` / `weatherTypeRatio` / `aqiAvg` / `sampleDays` / `expectedDays` / `statsStatus`

---

### 15.14 月统计

```
GET /api/screen/stats/monthly
```

**说明**：返回当前月聚合统计结果，由本地数据库聚合生成。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `locationId` | `string` | 是 | 城市 LocationID |

**返回字段**：`month` / `avgTemp` / `totalPrecipitation` / `rainyDays` / `weatherTypeRatio` / `aqiAvg` / `sampleDays` / `expectedDays` / `isPartialMonth` / `statsMode` / `statsStatus`

---

### 15.15 统计详情

```
GET /api/screen/stats/detail
```

**说明**：返回近 10 天完整统计详情（温度、降水、AQI 趋势 + 周/月明细 + 天气类型占比）。

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `locationId` | `string` | 是 | 城市 LocationID |

**返回字段**：`weeklyList` / `monthlyList` / `dailyTemps` / `dailyPrecip` / `dailyAqi` / `weatherDistribution`

---

## 16. 目录结构

### 16.1 前端 (`src/`)

```text
src/
├── components/
│   ├── business/
│   │   ├── CityDrawer/          # 城市选择抽屉
│   │   └── DashboardTopBar/     # 顶部状态栏
│   └── commons/
│       ├── BrandMark/           # 品牌标识
│       ├── DashboardChart/      # ECharts 图表封装
│       └── WeatherIcon/         # 天气图标
├── pages/
│   ├── Home/                    # 首页大屏
│   └── Stats/                   # 统计详情页
├── hooks/
│   ├── useHomeData.ts           # 首页数据获取
│   └── useLocation.ts           # 浏览器定位
├── stores/
│   └── cityStore.ts             # 城市状态 (Zustand)
├── utils/
│   ├── request.ts               # HTTP 请求封装
│   └── weatherIcon.ts           # 天气图标映射
├── types/
│   └── index.ts                 # 前端类型定义
├── constants/
│   └── index.ts                 # 常量（颜色、热门城市）
└── styles/
    └── global.scss              # 全局样式
```

### 16.2 后端 (`server/src/`)

```text
server/src/
├── app/
│   ├── index.ts                 # Express 应用入口
│   └── config.ts                # 环境变量配置
├── routes/
│   └── index.ts                 # 路由注册
├── controllers/
│   ├── cityController.ts        # 城市相关控制器
│   └── screenController.ts      # 大屏数据控制器
├── services/
│   ├── cityService.ts           # 城市搜索/定位服务
│   ├── weatherService.ts        # 天气数据获取与缓存
│   └── statsService.ts          # 统计聚合服务
├── repositories/
│   ├── cityRepository.ts        # 城市表 CRUD
│   ├── weatherRepository.ts     # 天气快照表 CRUD
│   └── statsRepository.ts       # 统计表 CRUD
├── integrations/
│   └── qweather/
│       ├── client.ts            # 和风天气 API 客户端
│       └── transform.ts         # 数据转换工具
├── db/
│   └── index.ts                 # 数据库初始化与连接
├── types/
│   └── index.ts                 # 后端类型定义
├── utils/
│   ├── cache.ts                 # 内存缓存
│   ├── logger.ts                # 日志工具
│   ├── response.ts              # 统一响应
│   └── validation.ts            # 参数校验
└── constants/
    └── index.ts                 # 缓存 TTL、阈值等常量
```

---

## 17. 风险与应对

| 风险 | 应对策略 |
|------|----------|
| 免费额度消耗过快 | 后端内存缓存 + 快照兜底，按数据类型区分 TTL |
| 月统计数据不足（新部署初期） | 前端提示"统计样本期不足"，月统计标记 `isPartialMonth` |
| 预警为空（常态） | 设计明确的空状态卡片 |
| 第三方 API 超时/失败 | 三层降级：内存缓存 → 数据库快照兜底 → 空数据标记 |
| ECS 端口冲突（80 被占用） | 前端容器使用 3200 端口，由宿主 Nginx 统一反代分流 |

---

## 18. 里程碑

| 阶段 | 内容 | 状态 |
|------|------|------|
| 第一阶段 | 搭建前后端工程，接入城市搜索、实时天气、逐小时、每日预报 | ✅ 已完成 |
| 第二阶段 | 接入 AQI、预警、生活指数，完成首页主体布局 | ✅ 已完成 |
| 第三阶段 | 完成周/月统计聚合，UI 细化与 ECharts 图表 | ✅ 已完成 |
| 第四阶段 | 统计详情页，城市选择抽屉 | ✅ 已完成 |
| 第五阶段 | Docker 容器化，GitHub Actions 自动部署，ECS 上线 | ✅ 已完成 |

---

## 19. 验收标准

- [x] 能展示当前天气核心信息
- [x] 能展示未来 24 小时趋势
- [x] 能展示未来 7 天预报
- [x] 能展示 AQI 与预警
- [x] 能展示周统计与月统计（含样本期提示）
- [x] 页面视觉中心明确为天气主模块
- [x] 首次进入自动定位当前城市，失败回退默认城市
- [x] 城市选择抽屉支持搜索、热门、最近访问
- [x] 统计详情页有温度/降水/AQI 趋势
- [x] Docker 一键部署通过健康检查
- [x] GitHub Actions 自动构建部署
