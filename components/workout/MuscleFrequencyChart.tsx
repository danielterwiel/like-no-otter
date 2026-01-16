import * as React from "react";
import { View, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import type { MuscleFrequencyData, MuscleFrequencyPoint } from "@/lib/db/queries/workouts";

// Victory Native module references (loaded dynamically on native)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let VictoryNativeModule: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SkiaModule: any = null;

interface MuscleFrequencyChartProps {
  data: MuscleFrequencyData | null;
  isLoading: boolean;
}

interface ChartData {
  label: string;
  sets: number;
  color: string;
}

export function MuscleFrequencyChart({ data, isLoading }: MuscleFrequencyChartProps) {
  const [chartModulesLoaded, setChartModulesLoaded] = React.useState(false);
  const [selectedBar, setSelectedBar] = React.useState<MuscleFrequencyPoint | null>(null);

  // Load Victory Native modules dynamically (only on native)
  React.useEffect(() => {
    if (Platform.OS === "web") {
      setChartModulesLoaded(true);
      return;
    }

    async function loadModules() {
      try {
        const [victoryNative, skia] = await Promise.all([
          import("victory-native"),
          import("@shopify/react-native-skia"),
        ]);

        VictoryNativeModule = victoryNative;
        SkiaModule = skia;

        setChartModulesLoaded(true);
      } catch (error) {
        console.error("Failed to load chart modules:", error);
        setChartModulesLoaded(true);
      }
    }
    loadModules();
  }, []);

  // Transform data for chart
  const chartData: ChartData[] = React.useMemo(() => {
    if (!data?.points?.length) return [];
    return data.points.map((point) => ({
      label: point.label,
      sets: point.sets,
      color: point.color,
    }));
  }, [data]);

  // Calculate Y-axis domain
  const yDomain: [number, number] = React.useMemo(() => {
    if (!chartData.length) return [0, 10];
    const maxSets = Math.max(...chartData.map((d) => d.sets));
    // Round up to nearest 5 for nice axis
    const max = Math.max(10, Math.ceil(maxSets / 5) * 5 + 5);
    return [0, max];
  }, [chartData]);

  const hasData = data?.hasData ?? false;

  return (
    <Card testID="muscle-frequency-chart">
      <CardHeader className="flex-row items-center gap-3 pb-2">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
          <Ionicons name="bar-chart-outline" size={20} color="#22c55e" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-medium text-muted-foreground">Muscle Frequency</Text>
          <Text className="text-xs text-muted-foreground">Last 4 weeks</Text>
        </View>
        {selectedBar && (
          <View className="items-end">
            <Text className="text-lg font-bold">{selectedBar.sets} sets</Text>
            <Text className="text-xs text-muted-foreground">{selectedBar.label}</Text>
          </View>
        )}
      </CardHeader>
      <CardContent>
        {isLoading || !chartModulesLoaded ? (
          <View testID="muscle-frequency-loading" className="h-48 justify-end gap-2 pb-4">
            <View className="flex-row items-end justify-around">
              <Skeleton width={20} height={80} />
              <Skeleton width={20} height={120} />
              <Skeleton width={20} height={60} />
              <Skeleton width={20} height={100} />
              <Skeleton width={20} height={40} />
              <Skeleton width={20} height={90} />
              <Skeleton width={20} height={70} />
              <Skeleton width={20} height={50} />
              <Skeleton width={20} height={110} />
              <Skeleton width={20} height={30} />
            </View>
            <Skeleton width="100%" height={14} className="mt-2" />
          </View>
        ) : !hasData ? (
          <View testID="muscle-frequency-empty" className="h-48 items-center justify-center">
            <Ionicons name="barbell-outline" size={40} color="#d1d5db" />
            <Text className="mt-3 text-muted-foreground">No workout data</Text>
            <Text className="text-sm text-muted-foreground">
              Complete workouts to see muscle balance
            </Text>
          </View>
        ) : Platform.OS === "web" ? (
          <View testID="muscle-frequency-web" className="h-48 items-center justify-center">
            <Text className="text-muted-foreground">Chart available on iOS</Text>
          </View>
        ) : (
          <ChartContent
            chartData={chartData}
            yDomain={yDomain}
            points={data?.points ?? []}
            onBarSelect={setSelectedBar}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Separate component to use hooks after modules are loaded
function ChartContent({
  chartData,
  yDomain,
  points,
  onBarSelect,
}: {
  chartData: ChartData[];
  yDomain: [number, number];
  points: MuscleFrequencyPoint[];
  onBarSelect: (point: MuscleFrequencyPoint | null) => void;
}) {
  // Get components from modules
  const CartesianChart = VictoryNativeModule?.CartesianChart;
  const Bar = VictoryNativeModule?.Bar;
  const useChartPressState = VictoryNativeModule?.useChartPressState;
  const useFont = SkiaModule?.useFont;

  // Use system font as fallback (null font will use default)
  const font = useFont ? useFont(null, 10) : null;

  // Create press state for interactivity
  const chartPressState = useChartPressState ? useChartPressState({ x: "", y: { sets: 0 } }) : null;

  // Handle press state changes to update selected bar
  const previousXRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!chartPressState?.state) return;

    const interval = setInterval(() => {
      const state = chartPressState.state;
      const xValue = state?.x?.value?.value;

      if (xValue && xValue !== previousXRef.current) {
        previousXRef.current = xValue;
        const found = points.find((p) => p.label === xValue);
        if (found) {
          onBarSelect(found);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [chartPressState, points, onBarSelect]);

  if (!CartesianChart || !Bar) {
    return null;
  }

  return (
    <View className="h-48">
      <CartesianChart
        data={chartData}
        xKey="label"
        yKeys={["sets"]}
        xAxis={{
          font,
          tickCount: chartData.length,
          formatXLabel: (value: string) => value,
          labelRotation: -45,
        }}
        yAxis={[
          {
            font,
            domain: yDomain,
          },
        ]}
        chartPressState={chartPressState?.state}
        domainPadding={{ left: 20, right: 20 }}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {({ points: barPoints, chartBounds }: any) => (
          <Bar
            points={barPoints.sets}
            chartBounds={chartBounds}
            color="#22c55e"
            roundedCorners={{ topLeft: 4, topRight: 4 }}
            barWidth={16}
          />
        )}
      </CartesianChart>
    </View>
  );
}
