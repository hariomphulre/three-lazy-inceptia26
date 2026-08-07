import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { pool } from "@/lib/db";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  try {
    console.log("📥 UPLOAD API HIT");

    // 1️⃣ sessionId (UUID) from header
    const sessionId = req.headers.get("x-session-id");
    console.log("🆔 sessionId (UUID):", sessionId);

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400 }
      );
    }

    // 2️⃣ Read formData (ONLY ONCE)
    const formData = await req.formData();
    console.log("📦 formData keys:", [...formData.keys()]);

    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 }
      );
    }

    // 3️⃣ Convert file → buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 4️⃣ Upload to Cloudinary
    const uploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "neurobloom/videos",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const videoUrl = uploadResult.secure_url;
    console.log("☁️ Cloudinary URL:", videoUrl);

    // 5️⃣ Update DB (UUID → UUID, NO conversion)
    const result = await pool.query(
      `
      UPDATE child_assessment_features
      SET video_link = $1
      WHERE id = $2
      `,
      [videoUrl, sessionId]
    );

    console.log("✅ Rows updated:", result.rowCount);

    return NextResponse.json({
      success: true,
      video_link: videoUrl,
    });

  } catch (err) {
    console.error("❌ VIDEO UPLOAD ERROR:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
