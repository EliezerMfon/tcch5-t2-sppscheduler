import { schedulePickup } from "../../../../lib/scheduler"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const result = await schedulePickup(body)

    return Response.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error.message
      },
      { status: 400 }
    )
  }
}