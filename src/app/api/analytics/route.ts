import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

// Initialize Firebase Admin if it hasn't been initialized
const apps = getApps();
if (!apps.length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const userRef = db.collection(userId);
    const q = userRef.orderBy("timestamp", "asc");
    const querySnapshot = await q.get();

    const timeSeriesData = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        timestamp: data.timestamp,
        fillerPercentage: data.fillerPercentage || 0,
        fillerCount: {
          actually: data.fillerCount?.actually || 0,
          basically: data.fillerCount?.basically || 0,
          like: data.fillerCount?.like || 0,
          literally: data.fillerCount?.literally || 0,
          uh: data.fillerCount?.uh || 0,
          um: data.fillerCount?.um || 0,
        },
        totalWords: data.totalWords || 0,
        totalFillerWords: data.totalFillerWords || 0,
      };
    });

    // Calculate running totals and averages
    const aggregatedData = {
      totalSessions: timeSeriesData.length,
      timeSeriesData,
      overallStats: timeSeriesData.reduce(
        (acc, curr) => {
          return {
            totalWords: acc.totalWords + curr.totalWords,
            totalFillerWords: acc.totalFillerWords + curr.totalFillerWords,
            fillerCount: {
              actually: acc.fillerCount.actually + curr.fillerCount.actually,
              basically: acc.fillerCount.basically + curr.fillerCount.basically,
              like: acc.fillerCount.like + curr.fillerCount.like,
              literally: acc.fillerCount.literally + curr.fillerCount.literally,
              uh: acc.fillerCount.uh + curr.fillerCount.uh,
              um: acc.fillerCount.um + curr.fillerCount.um,
            },
          };
        },
        {
          totalWords: 0,
          totalFillerWords: 0,
          fillerCount: {
            actually: 0,
            basically: 0,
            like: 0,
            literally: 0,
            uh: 0,
            um: 0,
          },
        }
      ),
    };

    return NextResponse.json(aggregatedData);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
