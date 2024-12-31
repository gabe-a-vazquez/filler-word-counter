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
} from "@filler-word-counter/components/shadcn/recharts";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "@filler-word-counter/lib/firebase/config";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

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

export default function DashboardPage() {
  const [fillerData, setFillerData] = useState<FillerData[]>([]);
  const [user] = useAuthState(auth);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Get user's collection
        const userRef = collection(db, user.uid);
        const q = query(userRef, orderBy("timestamp", "desc"), limit(10));

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => {
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

        setFillerData(data);
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

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Filler Word Percentage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {latestData.fillerPercentage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Filler Words</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {latestData.totalFillerWords}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Words</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{latestData.totalWords}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Filler Words Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={fillerWordsData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="value" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
