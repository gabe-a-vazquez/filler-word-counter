"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@filler-word-counter/components/shadcn/card";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Tooltip,
  Legend,
  Cell,
} from "@filler-word-counter/components/shadcn/recharts";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "@filler-word-counter/lib/firebase/config";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { format } from "date-fns";

interface FillerData {
  actually: number;
  basically: number;
  like: number;
  literally: number;
  fillerPercentage: number;
  timestamp: string;
  totalFillerWords: number;
  totalWords: number;
}

interface TimeSeriesData {
  timestamp: string;
  fillerPercentage: number;
  fillerCount: {
    actually: number;
    basically: number;
    like: number;
    literally: number;
  };
  totalWords: number;
  totalFillerWords: number;
}

interface AggregatedData {
  totalSessions: number;
  timeSeriesData: TimeSeriesData[];
  overallStats: {
    totalWords: number;
    totalFillerWords: number;
    fillerCount: {
      actually: number;
      basically: number;
      like: number;
      literally: number;
    };
  };
}

export default function DashboardPage() {
  const [fillerData, setFillerData] = useState<FillerData[]>([]);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData | null>(
    null
  );
  const [selectedTimestamp, setSelectedTimestamp] = useState<string | null>(
    null
  );
  const [user] = useAuthState(auth);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Get user's collection
        const userRef = collection(db, user.uid);
        const q = query(userRef, orderBy("timestamp", "desc"), limit(10));

        const querySnapshot = await getDocs(q);
        const latestData = querySnapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            actually: docData.fillerCount?.actually || 0,
            basically: docData.fillerCount?.basically || 0,
            like: docData.fillerCount?.like || 0,
            literally: docData.fillerCount?.literally || 0,
            fillerPercentage: docData.fillerPercentage || 0,
            timestamp: docData.timestamp,
            totalFillerWords: docData.totalFillerWords || 0,
            totalWords: docData.totalWords || 0,
          } as FillerData;
        });

        setFillerData(latestData);

        // Fetch aggregated data
        const response = await fetch(`/api/analytics?userId=${user.uid}`);
        if (!response.ok) throw new Error("Failed to fetch analytics");
        const aggregatedData = await response.json();
        setAggregatedData(aggregatedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [user]);

  const latestData = fillerData[0] || {
    actually: 0,
    basically: 0,
    like: 0,
    literally: 0,
    fillerPercentage: 0,
    totalFillerWords: 0,
    totalWords: 0,
  };

  const fillerWordsData = [
    { name: "Actually", value: latestData.actually },
    { name: "Basically", value: latestData.basically },
    { name: "Like", value: latestData.like },
    { name: "Literally", value: latestData.literally },
  ];

  // Format time series data for the chart
  const timeSeriesChartData =
    aggregatedData?.timeSeriesData.map((data) => ({
      date: format(new Date(data.timestamp), "MMM d, yyyy HH:mm"),
      timestamp: data.timestamp, // Store full timestamp for matching
      percentage: data.fillerPercentage,
    })) || [];

  // Get the data for the distribution chart based on selection
  const getDistributionData = () => {
    if (selectedTimestamp && aggregatedData) {
      const selectedData = aggregatedData.timeSeriesData.find(
        (data) => data.timestamp === selectedTimestamp
      );
      if (selectedData) {
        return [
          { name: "Actually", value: selectedData.fillerCount.actually },
          { name: "Basically", value: selectedData.fillerCount.basically },
          { name: "Like", value: selectedData.fillerCount.like },
          { name: "Literally", value: selectedData.fillerCount.literally },
        ];
      }
    }
    // Fall back to latest data if no selection
    return [
      { name: "Actually", value: latestData.actually },
      { name: "Basically", value: latestData.basically },
      { name: "Like", value: latestData.like },
      { name: "Literally", value: latestData.literally },
    ];
  };

  // Handle click on the line chart
  const handleTimeSeriesClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedTimestamp = data.activePayload[0].payload.timestamp;
      setSelectedTimestamp(clickedTimestamp);
    }
  };

  // Get the latest timestamp from the data
  const latestTimestamp = aggregatedData?.timeSeriesData[0]?.timestamp || null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Analytics Dashboard
      </h1>

      {/* Timeline Section */}
      <div className="max-w-7xl mx-auto">
        <Card className="hover:shadow-xl transition-all duration-300 mb-12">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Filler Word Journey</span>
              <span className="text-sm font-normal text-blue-500 animate-bounce">
                ↓ Pick a moment in time ↓
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/10 pointer-events-none" />
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={timeSeriesChartData}
                onClick={handleTimeSeriesClick}
                className="cursor-pointer"
              >
                <defs>
                  <linearGradient
                    id="colorPercentage"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#2563eb"
                  name="Filler Word %"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 8,
                    fill: "#2563eb",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                  fill="url(#colorPercentage)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution Section with Animation */}
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 -top-6 flex flex-col items-center">
            <div className="w-0.5 h-12 bg-gradient-to-b from-blue-200 to-transparent" />
            <div className="animate-pulse">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="#93c5fd"
                className="transform -translate-y-4"
              >
                <polygon points="12 2 2 12 12 22 22 12" />
              </svg>
            </div>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Filler Words Breakdown</span>
                <span className="text-sm font-normal text-gray-600">
                  {format(
                    new Date(
                      selectedTimestamp || latestTimestamp || new Date()
                    ),
                    "MMM d, yyyy HH:mm"
                  )}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={getDistributionData()}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                    className="transition-all duration-300"
                  >
                    {/* Add hover animation to bars */}
                    {getDistributionData().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        className="hover:brightness-110 cursor-pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
