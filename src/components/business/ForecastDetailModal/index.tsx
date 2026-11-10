/**
 * @component ForecastDetailModal
 * @description 多日预报曲线详情弹窗，按列展示星期、日期、白天图标、温度曲线、夜间图标与风力风向
 * @author Weather Dashboard Team
 * @created 2026-11-10
 * @updated 2026-11-10
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { WeatherIcon } from '../../commons/WeatherIcon';
import { api } from '../../../utils/request';
import type { DailyItem } from '../../../types';
import './index.scss';

/** 每列宽度（px） */
const COLUMN_WIDTH = 84;

/** 温度曲线区域高度（px） */
const CHART_HEIGHT = 120;

/** 曲线顶部留白（px），用于放置最高温数值 */
const CHART_PADDING_TOP = 28;

/** 曲线底部留白（px），用于放置最低温数值 */
const CHART_PADDING_BOTTOM = 28;

/**
 * 风向关键字与箭头旋转角度映射
 * @description 箭头默认朝上（指向正北），角度表示风实际吹向的方向
 * @关键说明：先匹配“东北/东南/西北/西南”，再匹配单字方向，避免“西北风”被识别为“北风”
 */
const WIND_DIRECTION_ITEMS: Array<{ keyword: string; angle: number }> = [
  { keyword: '东北', angle: 225 },
  { keyword: '东南', angle: 315 },
  { keyword: '西北', angle: 135 },
  { keyword: '西南', angle: 45 },
  { keyword: '北', angle: 180 },
  { keyword: '东', angle: 270 },
  { keyword: '南', angle: 0 },
  { keyword: '西', angle: 90 },
];

/** 星期文案，索引与 Date.getDay() 对应 */
const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * ForecastDetailModal 组件 Props
 */
export interface ForecastDetailModalProps {
  /** 是否打开弹窗，必填，默认 false */
  open: boolean;
  /** 预报天数：10 | 15 | 30，必填 */
  days: number;
  /** 城市 LocationID，必填 */
  locationId: string;
  /** 关闭弹窗回调，必填 */
  onClose: () => void;
}

/**
 * 解析温度字符串为数值
 * @param value 温度字符串
 * @returns 温度数值；非法值返回 0
 */
function parseTemperature(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * 解析日期文本为星期文案
 * @param value 日期文本（YYYY-MM-DD）
 * @returns 星期文案；非法日期返回空字符串
 */
function formatWeekLabel(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return WEEK_LABELS[date.getDay()] || '';
}

/**
 * 提取 MM/DD 日期文本
 * @param value 日期文本（YYYY-MM-DD）
 * @returns MM/DD 文本
 */
function formatMonthDay(value: string): string {
  return value.slice(5).replace('-', '/');
}

/**
 * 解析风向对应的箭头角度
 * @param direction 风向文字，如“西北风”
 * @returns 箭头旋转角度；无法识别时返回 null
 */
function resolveWindAngle(direction: string): number | null {
  const matched = WIND_DIRECTION_ITEMS.find((item) => direction.includes(item.keyword));
  return matched ? matched.angle : null;
}

/**
 * 温度曲线组件 Props
 */
interface TemperatureCurveProps {
  /** 每日预报列表，必填 */
  list: DailyItem[];
}

/**
 * 温度曲线
 * @description 以 SVG 绘制最高温与最低温折线，并在点外侧标注温度数值
 */
function TemperatureCurve({ list }: TemperatureCurveProps): JSX.Element {
  const chartWidth = Math.max(COLUMN_WIDTH, list.length * COLUMN_WIDTH);
  const innerHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

  const { minValue, maxValue } = useMemo(() => {
    const temps = list.flatMap((item) => [
      parseTemperature(item.tempMax),
      parseTemperature(item.tempMin),
    ]);

    return {
      minValue: Math.min(...temps),
      maxValue: Math.max(...temps),
    };
  }, [list]);

  /** 温度差，避免全部温度相同时除以 0 */
  const tempSpan = Math.max(1, maxValue - minValue);

  /**
   * 计算温度对应的纵坐标
   * @param temp 温度值
   * @returns 纵坐标
   */
  const toY = (temp: number): number =>
    CHART_PADDING_TOP + ((maxValue - temp) / tempSpan) * innerHeight;

  /**
   * 计算日期对应的横坐标
   * @param index 列索引
   * @returns 横坐标
   */
  const toX = (index: number): number => index * COLUMN_WIDTH + COLUMN_WIDTH / 2;

  const maxPoints = list.map((item, index) => ({
    x: toX(index),
    y: toY(parseTemperature(item.tempMax)),
    value: parseTemperature(item.tempMax),
  }));
  const minPoints = list.map((item, index) => ({
    x: toX(index),
    y: toY(parseTemperature(item.tempMin)),
    value: parseTemperature(item.tempMin),
  }));

  const maxPolyline = maxPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const minPolyline = minPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPolygon = [
    ...maxPoints.map((point) => `${point.x},${point.y}`),
    ...minPoints
      .slice()
      .reverse()
      .map((point) => `${point.x},${point.y}`),
  ].join(' ');

  return (
    <svg
      aria-hidden="true"
      className="forecast-detail__curve"
      height={CHART_HEIGHT}
      viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
      width={chartWidth}
    >
      <defs>
        <linearGradient id="forecast-detail-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(255, 177, 55, 0.24)" />
          <stop offset="100%" stopColor="rgba(125, 212, 213, 0.08)" />
        </linearGradient>
      </defs>

      <polygon fill="url(#forecast-detail-area)" points={areaPolygon} />
      <polyline
        className="forecast-detail__curve-line forecast-detail__curve-line--max"
        fill="none"
        points={maxPolyline}
      />
      <polyline
        className="forecast-detail__curve-line forecast-detail__curve-line--min"
        fill="none"
        points={minPolyline}
      />

      {maxPoints.map((point, index) => (
        <g key={`max-${list[index].fxDate}`}>
          <circle
            className="forecast-detail__curve-dot forecast-detail__curve-dot--max"
            cx={point.x}
            cy={point.y}
            r={3}
          />
          <text
            className="forecast-detail__curve-text forecast-detail__curve-text--max"
            textAnchor="middle"
            x={point.x}
            y={point.y - 9}
          >
            {Math.round(point.value)}°
          </text>
        </g>
      ))}

      {minPoints.map((point, index) => (
        <g key={`min-${list[index].fxDate}`}>
          <circle
            className="forecast-detail__curve-dot forecast-detail__curve-dot--min"
            cx={point.x}
            cy={point.y}
            r={3}
          />
          <text
            className="forecast-detail__curve-text forecast-detail__curve-text--min"
            textAnchor="middle"
            x={point.x}
            y={point.y + 16}
          >
            {Math.round(point.value)}°
          </text>
        </g>
      ))}
    </svg>
  );
}

/**
 * 多日预报曲线详情弹窗
 * @description 点击 10d/15d/30d 按钮后打开，横向滚动查看每日天气明细与温度曲线
 */
export function ForecastDetailModal(props: ForecastDetailModalProps): JSX.Element | null {
  const { open, days, locationId, onClose } = props;
  const [list, setList] = useState<DailyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // 打开弹窗时按天数拉取预报数据，关闭或天数变化时重新请求
  useEffect(() => {
    if (!open || !locationId) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .getDaily(locationId, days)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setList(result.list);
        setLoading(false);
      })
      .catch((fetchError: unknown) => {
        if (cancelled) {
          return;
        }

        setList([]);
        setError(fetchError instanceof Error ? fetchError.message : '预报数据加载失败');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [days, locationId, open]);

  // 弹窗打开期间锁定页面滚动，并支持 ESC 关闭
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    /**
     * 处理键盘事件
     * @param event 键盘事件
     */
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => modalRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const gridWidth = Math.max(COLUMN_WIDTH, list.length * COLUMN_WIDTH);

  return (
    <div className="forecast-detail-backdrop" onClick={onClose} role="presentation">
      <div
        aria-labelledby="forecast-detail-title"
        aria-modal="true"
        className="forecast-detail"
        onClick={(event) => event.stopPropagation()}
        ref={modalRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="forecast-detail__head">
          <div className="forecast-detail__title">
            <h2 id="forecast-detail-title">{days} 天预报曲线</h2>
            <span>白天图标 / 温度曲线 / 夜间图标 / 风力风向</span>
          </div>
          <button
            aria-label="关闭预报曲线详情"
            className="forecast-detail__close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="forecast-detail__body">
          {loading && <p className="forecast-detail__state">预报数据加载中…</p>}

          {!loading && error && <p className="forecast-detail__state forecast-detail__state--error">{error}</p>}

          {!loading && !error && list.length === 0 && (
            <p className="forecast-detail__state">暂无预报数据</p>
          )}

          {!loading && !error && list.length > 0 && (
            <div className="forecast-detail__scroll">
              <div className="forecast-detail__grid" style={{ width: gridWidth }}>
                <div
                  className="forecast-detail__row forecast-detail__row--week"
                  style={{ gridTemplateColumns: `repeat(${list.length}, ${COLUMN_WIDTH}px)` }}
                >
                  {list.map((item) => (
                    <span key={`week-${item.fxDate}`}>{formatWeekLabel(item.fxDate)}</span>
                  ))}
                </div>

                <div
                  className="forecast-detail__row forecast-detail__row--date"
                  style={{ gridTemplateColumns: `repeat(${list.length}, ${COLUMN_WIDTH}px)` }}
                >
                  {list.map((item) => (
                    <span key={`date-${item.fxDate}`}>{formatMonthDay(item.fxDate)}</span>
                  ))}
                </div>

                <div
                  className="forecast-detail__row forecast-detail__row--icon"
                  style={{ gridTemplateColumns: `repeat(${list.length}, ${COLUMN_WIDTH}px)` }}
                >
                  {list.map((item) => (
                    <WeatherIcon
                      className="forecast-detail__day-icon"
                      code={item.iconDay}
                      key={`day-${item.fxDate}`}
                      label={item.textDay}
                    />
                  ))}
                </div>

                <div className="forecast-detail__row forecast-detail__row--curve">
                  <TemperatureCurve list={list} />
                </div>

                <div
                  className="forecast-detail__row forecast-detail__row--icon"
                  style={{ gridTemplateColumns: `repeat(${list.length}, ${COLUMN_WIDTH}px)` }}
                >
                  {list.map((item) => (
                    <WeatherIcon
                      className="forecast-detail__night-icon"
                      code={item.iconNight}
                      key={`night-${item.fxDate}`}
                      label={item.textNight}
                    />
                  ))}
                </div>

                <div
                  className="forecast-detail__row forecast-detail__row--wind"
                  style={{ gridTemplateColumns: `repeat(${list.length}, ${COLUMN_WIDTH}px)` }}
                >
                  {list.map((item) => {
                    const angle = resolveWindAngle(item.windDirDay);

                    return (
                      <span className="forecast-detail__wind" key={`wind-${item.fxDate}`}>
                        {angle !== null ? (
                          <svg
                            aria-label={item.windDirDay}
                            className="forecast-detail__wind-arrow"
                            role="img"
                            style={{ transform: `rotate(${angle}deg)` }}
                            viewBox="0 0 16 16"
                          >
                            <path d="M8 2.6 L11.6 12.4 L8 10.2 L4.4 12.4 Z" />
                          </svg>
                        ) : (
                          <span className="forecast-detail__wind-none">{item.windDirDay || '无'}</span>
                        )}
                        <em>{item.windScaleDay || '--'}级</em>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
