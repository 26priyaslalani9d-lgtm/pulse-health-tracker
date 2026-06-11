/** Web version: pure SVG hourly bars (victory-native/Skia stays native-only). */

import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { PText } from '@/components/ui/PText';

interface HourlyBarsProps {
  values: number[];
  color: string;
  height?: number;
  accessibilitySummary: string;
}

export function HourlyBars({ values, color, height = 90, accessibilitySummary }: HourlyBarsProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const hours = Array.from({ length: 24 }, (_, h) => values[h] ?? 0);
  const max = Math.max(...hours, 1);
  const slot = width / 24;
  const barWidth = slot * 0.62;

  return (
    <View accessible accessibilityLabel={accessibilitySummary} onLayout={onLayout}>
      <Svg width={width || 1} height={height}>
        {width > 0
          ? hours.map((v, h) => {
              const barH = Math.max(1.5, (v / max) * (height - 4));
              return (
                <Rect
                  key={h}
                  x={h * slot + (slot - barWidth) / 2}
                  y={height - barH}
                  width={barWidth}
                  height={barH}
                  rx={2}
                  fill={color}
                  opacity={v > 0 ? 0.95 : 0.25}
                />
              );
            })
          : null}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        {['12am', '6am', '12pm', '6pm', '12am'].map((label, i) => (
          <PText key={`${label}-${i}`} variant="caption" tone="tertiary">
            {label}
          </PText>
        ))}
      </View>
    </View>
  );
}
