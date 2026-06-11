/** Web version: pure SVG bars (victory-native/Skia stays native-only). */

import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { PText } from '@/components/ui/PText';

export interface WeekBarDatum {
  label: string;
  value: number;
  isToday: boolean;
}

interface WeekBarsProps {
  data: WeekBarDatum[];
  color: string;
  height?: number;
  accessibilitySummary: string;
}

export function WeekBars({ data, color, height = 150, accessibilitySummary }: WeekBarsProps) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const max = Math.max(...data.map((d) => d.value), 1);
  const slot = width / Math.max(data.length, 1);
  const barWidth = slot * 0.55;

  return (
    <View accessible accessibilityLabel={accessibilitySummary} onLayout={onLayout}>
      <Svg width={width || 1} height={height}>
        {width > 0
          ? data.map((d, i) => {
              const h = Math.max(2, (d.value / max) * (height - 8));
              return (
                <Rect
                  key={d.label + i}
                  x={i * slot + (slot - barWidth) / 2}
                  y={height - h}
                  width={barWidth}
                  height={h}
                  rx={5}
                  fill={color}
                  opacity={d.isToday ? 1 : 0.4}
                />
              );
            })
          : null}
      </Svg>
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        {data.map((d) => (
          <View key={d.label} style={{ flex: 1, alignItems: 'center' }}>
            <PText
              variant="caption"
              tone={d.isToday ? 'primary' : 'tertiary'}
              color={d.isToday ? color : undefined}
            >
              {d.label}
            </PText>
          </View>
        ))}
      </View>
    </View>
  );
}
