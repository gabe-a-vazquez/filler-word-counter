// import { db } from "@filler-word-counter/lib/firebase/config";
// import { collection, getDocs, query, orderBy } from "firebase/firestore";
// import { NextResponse } from "next/server";

// export async function GET(request: Request) {
//   const url = new URL(request.url);
//   const userId = url.searchParams.get("userId");

//   if (!userId) {
//     return NextResponse.json({ error: "User ID is required" }, { status: 400 });
//   }

//   try {
//     const userRef = collection(db, userId);
//     const q = query(userRef, orderBy("timestamp", "asc"));
//     const querySnapshot = await getDocs(q);

//     const timeSeriesData = querySnapshot.docs.map((doc) => {
//       const data = doc.data();
//       return {
//         timestamp: data.timestamp,
//         fillerPercentage: data.fillerPercentage || 0,
//         fillerCount: {
//           actually: data.fillerCount?.actually || 0,
//           basically: data.fillerCount?.basically || 0,
//           like: data.fillerCount?.like || 0,
//           literally: data.fillerCount?.literally || 0,
//         },
//         totalWords: data.totalWords || 0,
//         totalFillerWords: data.totalFillerWords || 0,
//       };
//     });

//     // Calculate running totals and averages
//     const aggregatedData = {
//       totalSessions: timeSeriesData.length,
//       timeSeriesData,
//       overallStats: timeSeriesData.reduce(
//         (acc, curr) => {
//           return {
//             totalWords: acc.totalWords + curr.totalWords,
//             totalFillerWords: acc.totalFillerWords + curr.totalFillerWords,
//             fillerCount: {
//               actually: acc.fillerCount.actually + curr.fillerCount.actually,
//               basically: acc.fillerCount.basically + curr.fillerCount.basically,
//               like: acc.fillerCount.like + curr.fillerCount.like,
//               literally: acc.fillerCount.literally + curr.fillerCount.literally,
//             },
//           };
//         },
//         {
//           totalWords: 0,
//           totalFillerWords: 0,
//           fillerCount: { actually: 0, basically: 0, like: 0, literally: 0 },
//         }
//       ),
//     };

//     return NextResponse.json(aggregatedData);
//   } catch (error) {
//     console.error("Error fetching analytics:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch analytics" },
//       { status: 500 }
//     );
//   }
// }
