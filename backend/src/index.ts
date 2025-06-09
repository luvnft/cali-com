import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import { CONSTANTS } from "./constant";
import axios from "axios";
import { paymentMiddleware, Network } from "x402-express";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(
  paymentMiddleware(
    (process.env.PUBLIC_ADDRESS as `0x${string}`) ??
      (() => {
        throw new Error(
          "PUBLIC_ADDRESS environment variable is required and must start with 0x"
        );
      })(),
    {
      "POST /book-meeting-x402": {
        price: "$0.001",
        network: "base-sepolia",
      },
    },
    { url: "https://x402.org/facilitator" }
  )
);

app.get("/health", (req, res) => {
  res.json({ message: "healthy" });
});

app.post("/get-slots", async (req: Request, res: Response) => {
  let { startTime, endTime } = req.body;
  const { username, duration } = req.body;
  if (!username) {
    res.status(400).json({ error: "username required" });
  }
  if (!startTime) {
    startTime = new Date().toISOString();
  }
  if (!endTime) {
    endTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }
  try {
    const response = await axios.get(
      `https://api.cal.com/v2/event-types?username=${username}`,
      {
        headers: {
          Authorization: process.env.CAL_COM_API_KEY as string,
          "cal-api-version": "2024-06-14",
        },
      }
    );
    const possibleMeetings = response.data.data;

    const filteredMeeting = possibleMeetings
      .filter((meeting: any) => meeting.lengthInMinutes >= duration)
      .map((meeting: any) => ({
        lengthInMinutes: meeting.lengthInMinutes,
        slug: meeting.slug,
      }));
    let possibleSlots = [];

    for (let i = 0; i < filteredMeeting.length; i++) {
      const key = filteredMeeting[i].lengthInMinutes;
      const slots = await axios.get(
        `https://api.cal.com/v2/slots?start=${startTime}&end=${endTime}&username=${username}&eventTypeSlug=${filteredMeeting[i].slug}`,
        {
          headers: {
            "cal-api-version": "2024-09-04",
          },
        }
      );

      const formattedSlots = Object.entries(slots.data.data).map(
        ([date, timeSlots]) => ({
          date,
          availability: (timeSlots as any[]).map((slot: any) => {
            const time = slot.start;
            return time;
          }),
        })
      );

      possibleSlots.push({
        duration: `${key} minutes`,
        eventSlug: filteredMeeting[i].slug,
        availability: formattedSlots,
      });
    }

    res.json({
      message: "Available slots retrieved successfully",
      data: possibleSlots,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch event types" });
    return;
  }
});

app.post("/book-meeting", async (req: Request, res: Response) => {
  const { attendeeName, attendeeEmail, startTime, username, eventTypeSlug } =
    req.body;

  if (
    !attendeeName ||
    !attendeeEmail ||
    !startTime ||
    !username ||
    !eventTypeSlug
  ) {
    res.status(400).json({
      error:
        "Missing required fields. Please provide attendeeName, attendeeEmail, startTime, username and eventTypeSlug",
    });
  }

  try {
    const response = await axios.post(
      "https://api.cal.com/v2/bookings",
      {
        attendee: {
          language: "en",
          name: attendeeName,
          timeZone: "America/New_York",
          email: attendeeEmail,
        },
        start: startTime,
        eventTypeSlug: eventTypeSlug,
        username: username,
      },
      {
        headers: {
          Authorization: process.env.CAL_COM_API_KEY as string,
          "Content-Type": "application/json",
          "cal-api-version": "2024-08-13",
        },
      }
    );

    res.json({
      message: "Meeting booked successfully",
      data: response.data,
    });
  } catch (error: any) {
    console.error(
      "Error booking meeting:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Failed to book meeting",
      details: error.response?.data || error.message,
    });
  }
});
app.post("/book-meeting-x402", async (req: Request, res: Response) => {
  const { attendeeName, attendeeEmail, startTime, username, eventTypeSlug } =
    req.body;

  if (
    !attendeeName ||
    !attendeeEmail ||
    !startTime ||
    !username ||
    !eventTypeSlug
  ) {
    res.status(400).json({
      error:
        "Missing required fields. Please provide attendeeName, attendeeEmail, startTime, username and eventTypeSlug",
    });
  }

  try {
    const response = await axios.post(
      "https://api.cal.com/v2/bookings",
      {
        attendee: {
          language: "en",
          name: attendeeName,
          timeZone: "America/New_York",
          email: attendeeEmail,
        },
        start: startTime,
        eventTypeSlug: eventTypeSlug,
        username: username,
      },
      {
        headers: {
          Authorization: process.env.CAL_COM_API_KEY as string,
          "Content-Type": "application/json",
          "cal-api-version": "2024-08-13",
        },
      }
    );

    res.json({
      message: "Meeting booked successfully",
      data: response.data,
    });
  } catch (error: any) {
    console.error(
      "Error booking meeting:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Failed to book meeting",
      details: error.response?.data || error.message,
    });
  }
});
app.listen(CONSTANTS.PORT, () => {
  console.log(`⚡ Server is running on localhost:${CONSTANTS.PORT}`);
});
