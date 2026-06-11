/** Web version: pure SVG line + zone bands (victory-native/Skia stays native-only). */

import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { PText } from '@/components/ui/PText';

export interface ZoneBand {
  from: number;
  to: number;
  color: string;
  label: string;
}

interface TrendLineProps {
  data: { x: number; y: number }[];
  color: string;
  height?: number;
  zones?: ZoneBand[];
  xLabels?: string[];
  accessibilitySummary: string;
}

export function TrendLine({
  data,
  color,
  height = 180,
  zones = [],
  xLabels = [],
  accessibilitySummary,
}: TrendLineProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  let path = '';
  let yOf: (v: number) => number = () => 0;
  if (data.length > 1 && width > 0) {
    const xs = data.map((d) => d.x);
    const ys = data.map((d) => d.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const pad = 12;
    yOf = (v: number) => height - pad - ((v - minY) / spanY) * (height - pad * 2);
    path = data
      .map((d, i) => {
        const px = ((d.x - minX) / spanX) * width;
        const py = yOf(d.y);
        return `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`;
      })
      .join(' ');
  }

  return (
    <View accessible accessibilityLabel={accessibilitySummary} onLayout={onLayout}>
      <Svg width={width || 1} height={height}>
        {width > 0
          ? zones.map((zone) => {
              const top = yOf(zone.to);
              const bottom = yOf(zone.from);
              return (
                <Rect
                  key={zone.label}
                  x={0}
                  y={Math.min(top, bottom)}
                  width={width}
                  height={Math.abs(bottom - top)}
                  fill={zone.color}
                  opacity={0.08}
                />
              );
            })
          : null}
        {path ? (
          <Path d={path} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
      </Svg>
      {xLabels.length > 0 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          {xLabels.map((label, i) => (
            <PText key={`${label}-${i}`} variant="caption" tone="tertiary">
              {label}
            </PText>
          ))}
        </View>
      ) : null}
    </View>
  );
}
