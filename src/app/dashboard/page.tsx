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

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>
              Filler Word Percentage Over Time
              {selectedTimestamp && (
                <span className="text-sm font-normal ml-2">
                  (Click to view distribution)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={timeSeriesChartData}
                onClick={handleTimeSeriesClick}
              >
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#2563eb"
                  name="Filler Word %"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>
              Filler Words Distribution
              {selectedTimestamp && (
                <span className="text-sm font-normal ml-2">
                  ({format(new Date(selectedTimestamp), "MMM d, yyyy HH:mm")})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={getDistributionData()}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
