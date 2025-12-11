import { http, HttpResponse } from "msw";

const BOOKING_URL =
  "https://731xy9c2ak.execute-api.eu-north-1.amazonaws.com/booking";

export const handlers = [
  http.post(BOOKING_URL, async ({ request }) => {
    const body = await request.json();


    const bookingDetails = {
      when: body.when,
      people: body.people,
      lanes: body.lanes,
      bookingId: "TEST-12345",
      price: 120 * Number(body.people) + 100 * Number(body.lanes),
    };

    return HttpResponse.json({ bookingDetails });
  }),
];
