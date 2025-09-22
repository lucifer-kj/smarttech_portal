import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/client";

export async function GET() {
  try {
    // Test Supabase connection
    const supabase = createAdminClient();
    
    // Simple test query to check connection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("_supabase_migrations")
      .select("version")
      .limit(1);

    if (error) {
      console.error("Supabase connection error:", error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Database connection failed",
          details: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection successful",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Test connection error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Connection test failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
