import { NextResponse } from "next/server";
import { testConnection } from "@/lib/supabase/setup";

export async function GET() {
  try {
    const result = await testConnection();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Supabase connection successful",
        timestamp: new Date().toISOString(),
        environment: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Connection failed",
          details: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Connection test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Connection test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
