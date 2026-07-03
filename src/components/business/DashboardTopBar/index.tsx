/**
 * @component DashboardTopBar
 * @description 共享顶部状态栏组件，供首页和统计详情页复用
 * @author Weather Dashboard Team
 * @created 2026-07-03
 * @updated 2026-07-03
 */

import type { CSSProperties } from 'react';
import { BrandMark } from '../../commons/BrandMark';
import { WeatherIcon } from '../../commons/WeatherIcon';
import type { HomeData } from '../../../types';
import './index.scss';

/** 时间元信息 */
export interface TimeMeta {
  dateText: string;
  timeText: string;
  weekText: string;
  lunarText: string;
}

/**
 * DashboardTopBar 组件 Props
 */
export interface DashboardTopBarProps {
  /** 显示模式：'home' 显示城市选择按钮，'stats' 显示返回大屏按钮 */
  mode: 'home' | 'stats';
  /** 首页聚合数据，必填 */
  homeData: HomeData;
  /** 时间元信息，必填 */
  timeMeta: TimeMeta;
  /** AQI 数字颜色，必填 */
  aqiColor: string;
  /** AQI 标签背景色 CSS 变量，必填 */
  aqiBadgeCssVar: string;
  /** 是否有预警，必填 */
  hasAlert: boolean;
  /** 预警状态圆点颜色 CSS 变量，必填 */
  alertIconCssVar: string;
  /** 预警显示文本，必填 */
  alertText: string;
  /** 数据更新时间（格式：HH:mm），必填 */
  updateTime: string;
  /** 城市名称（Stats 模式使用，来自 store），Home 模式可传 undefined 则从 homeData 取 */
  cityName?: string;
  /** 城市选择按钮回调（Home 模式），可选 */
  onDrawerOpen?: () => void;
  /** 返回大屏按钮回调（Stats 模式），可选 */
  onBackClick?: () => void;
}

/**
 * 共享顶部状态栏组件
 * @description 包含品牌标识、城市信息、时间、数据更新、天气摘要、AQI、预警状态和操作按钮
 */
export function DashboardTopBar(props: DashboardTopBarProps): JSX.Element {
  const {
    mode,
    homeData,
    timeMeta,
    aqiColor,
    aqiBadgeCssVar,
    hasAlert,
    alertIconCssVar,
    alertText,
    updateTime,
    cityName,
    onDrawerOpen,
    onBackClick,
  } = props;

  const badgeStyle: CSSProperties = { '--db-topbar-badge-rgb': aqiBadgeCssVar } as CSSProperties;
  const iconStyle: CSSProperties = { '--db-topbar-alert-rgb': alertIconCssVar } as CSSProperties;

  const cityDisplayName = cityName !== undefined ? cityName : `${homeData.overview.location.name}市`;

  return (
    <header className="db-topbar">
      {/* 品牌标识 */}
      <div className="db-topbar__brand">
        <BrandMark className="db-topbar__brand-mark" />
        <div className="db-topbar__brand-copy">
          <h1 className="db-topbar__brand-title">城市环境与天气大屏</h1>
          <span className="db-topbar__brand-subtitle">STORM LEDGER</span>
        </div>
      </div>

      {/* 城市信息 */}
      <div className="db-topbar__card db-topbar__card--city">
        <span className="db-topbar__pin" aria-hidden="true" />
        <div className="db-topbar__stack">
          <strong>{cityDisplayName}</strong>
          <span>{homeData.overview.location.adm1} {homeData.overview.location.adm2}</span>
        </div>
      </div>

      {/* 时间 */}
      <div className="db-topbar__card db-topbar__card--time">
        <div className="db-topbar__time-block">
          <div className="db-topbar__time-row">
            <strong>
              {timeMeta.dateText} {timeMeta.timeText}
            </strong>
          </div>
          <div className="db-topbar__time-meta">
            <span>{timeMeta.weekText}</span>
            <em>{timeMeta.lunarText}</em>
          </div>
        </div>
      </div>

      {/* 数据更新时间 */}
      <div className="db-topbar__card db-topbar__card--updated">
        <div className="db-topbar__stack">
          <span>数据更新时间</span>
          <strong>{updateTime}</strong>
        </div>
      </div>

      {/* 天气摘要 */}
      <div className="db-topbar__card db-topbar__card--weather">
        <div className="db-topbar__stack">
          <span>{mode === 'home' ? '天气摘要' : '当前天气'}</span>
          <div className="db-topbar__value-row">
            <WeatherIcon
              code={homeData.overview.weatherNow.icon}
              className="db-topbar__weather-icon"
              label={homeData.overview.weatherNow.text}
            />
            <strong>
              {homeData.overview.weatherNow.text}
              {mode === 'stats' && homeData.overview.weatherNow.temp
                ? ` ${homeData.overview.weatherNow.temp}°C`
                : ''}
            </strong>
          </div>
        </div>
      </div>

      {/* AQI */}
      <div className="db-topbar__card db-topbar__card--aqi">
        <div className="db-topbar__stack">
          <div className="db-topbar__value-line">
            <div className="db-topbar__value-row">
              <span>AQI</span>
              <strong style={{ color: aqiColor }}>{homeData.airNow.aqi}</strong>
            </div>
            <em className="db-topbar__badge" style={badgeStyle}>
              {homeData.airNow.category}
            </em>
          </div>
        </div>
      </div>

      {/* 预警状态 */}
      <div className="db-topbar__card db-topbar__card--alert">
        <div className="db-topbar__stack db-topbar__stack--alert">
          <span>预警状态</span>
          <div
            className={`db-topbar__status db-topbar__status--${hasAlert ? 'warning' : 'safe'}`}
            style={iconStyle}
          >
            <span className="db-topbar__status-icon" aria-hidden="true">
              {hasAlert ? (
                <svg viewBox="0 0 16 18" focusable="false">
                  <path
                    d="M8 1.5 13 3.2v4.6c0 3.1-1.85 5.93-5 7.8-3.15-1.87-5-4.7-5-7.8V3.2L8 1.5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 5.1v4.4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <circle cx="8" cy="12.25" r="1" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 18" focusable="false">
                  <path
                    d="M8 1.5 13 3.2v4.6c0 3.1-1.85 5.93-5 7.8-3.15-1.87-5-4.7-5-7.8V3.2L8 1.5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m5.2 8.9 1.9 1.9 3.7-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <strong>{alertText}</strong>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      {mode === 'home' ? (
        <button
          className="db-topbar__action"
          onClick={onDrawerOpen}
          type="button"
        >
          <span>城市选择</span>
          <strong aria-hidden="true" />
        </button>
      ) : (
        <button
          className="db-topbar__action db-topbar__action--back"
          onClick={onBackClick}
          type="button"
        >
          <span aria-hidden="true">←</span>
          返回大屏
        </button>
      )}
    </header>
  );
}
