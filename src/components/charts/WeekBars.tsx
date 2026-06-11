import { View } from 'react-native';
import { CartesianChart, Bar } from 'victory-native';

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
  /** spoken summary for screen readers */
  accessibilitySummary: string;
}

/** 7-day bar chart with today highlighted (victory-native, Skia-rendered). */
export function WeekBars({ data, color, height = 150, accessibilitySummary }: WeekBarsProps) {
  const chartData = data.map((d, i) => ({
    x: i,
    rest: d.isToday ? null : d.value,
    today: d.isToday ? d.value : null,
  }));

  return (
    <View accessible accessibilityLabel={accessibilitySummary}>
      <View style={{ height }}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={['rest', 'today']}
          domain={{ y: [0] }}
          domainPadding={{ left: 18, right: 18, top: 8 }}
        >
          {({ points, chartBounds }) => (
            <>
              <Bar
                points={points.rest}
                chartBounds={chartBounds}
                color={`${color}55`}
                innerPadding={0.45}
                roundedCorners={{ topLeft: 5, topRight: 5 }}
              />
              <Bar
                points={points.today}
                chartBounds={chartBounds}
                color={color}
                innerPadding={0.45}
                roundedCorners={{ topLeft: 5, topRight: 5 }}
              />
            </>
          )}
        </CartesianChart>
      </View>
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
