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
import { cn } from "@filler-word-counter/lib/utils";
import { Button } from "@filler-word-counter/components/shadcn/button";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@filler-word-counter/components/shadcn/select";

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

interface SessionOption {
  label: string;
  timestamp: string;
}

export default function DashboardPage() {
  const [fillerData, setFillerData] = useState<FillerData[]>([]);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData | null>(
    null
  );
  const [selectedTimestamp, setSelectedTimestamp] = useState<string | null>(
    null
  );
  const [sessionOptions, setSessionOptions] = useState<SessionOption[]>([]);
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

        // After setting aggregatedData, create session options
        if (aggregatedData) {
          const options = aggregatedData.timeSeriesData
            .map((data: any) => ({
              label: format(new Date(data.timestamp), "MMM d, yyyy HH:mm"),
              timestamp: data.timestamp,
            }))
            .sort(
              (a: SessionOption, b: SessionOption) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            ); // Sort by most recent first

          setSessionOptions(options);
          // Set the most recent session as default selected
          if (options.length > 0) {
            setSelectedTimestamp(options[0].timestamp);
          }
        }
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
      {aggregatedData && aggregatedData.timeSeriesData.length > 0 && (
        <div className="max-w-7xl mx-auto mb-6">
          <Link href="/counter">
            <Button
              variant="outline"
              className="mb-4 text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              ← Back to Counter
            </Button>
          </Link>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8 text-center">
        Analytics Dashboard
      </h1>

      {!aggregatedData || aggregatedData.timeSeriesData.length === 0 ? (
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Welcome to Your Dashboard!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                You haven't recorded any sessions yet. Head over to the counter
                to start tracking your filler words!
              </p>
              <Link href="/counter">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Start Your First Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Timeline Section */}
          <div className="max-w-7xl mx-auto">
            <Card
              className={cn(
                "transition-all duration-300",
                "hover:shadow-md hover:border-blue-200"
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Your Filler Word Journey</span>
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
                        <stop
                          offset="5%"
                          stopColor="#2563eb"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2563eb"
                          stopOpacity={0.2}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `${Math.round(value)}%`} />
                    <Tooltip
                      formatter={(value: number) => [
                        `${Math.round(value)}%`,
                        "Filler Word %",
                      ]}
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
            <div className="relative mt-8">
              <Card
                className={cn(
                  "bg-white/80 backdrop-blur-sm",
                  "transition-all duration-300"
                )}
              >
                <CardHeader>
                  <CardTitle>
                    <Select
                      value={selectedTimestamp || ""}
                      onValueChange={setSelectedTimestamp}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select session" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessionOptions.map((option) => (
                          <SelectItem
                            key={option.timestamp}
                            value={option.timestamp}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={getDistributionData()}>
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
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
      )}
    </div>
  );
}
