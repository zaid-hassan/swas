import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const webhook = process.env.GOOGLE_SHEET_WEBHOOK!;

  await fetch(webhook,{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      type:"refund",
      refundId:`RF-${Date.now()}`,
      ...body,
      date:new Date().toLocaleString("en-IN")
    })
  });

  return NextResponse.json({
    success:true
  });
}