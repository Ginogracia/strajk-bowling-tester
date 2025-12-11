// user stories:
// - Booking date/time/people/lanes validation
// - Shoe size selection, matching people & shoes
// - Removing shoe fields
// - Completing booking, saving confirmation, navigating to confirmation

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { http, HttpResponse } from "msw";

import Booking from "../views/Booking";
import Confirmation from "../views/Confirmation";
import { server } from "../mocks/server";

const BOOKING_URL =
  "https://731xy9c2ak.execute-api.eu-north-1.amazonaws.com/booking";

// Helper: render Booking (and Confirmation) with routing
function renderWithRouter(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={<Booking />} />
        <Route path="/confirmation" element={<Confirmation />} />
      </Routes>
    </MemoryRouter>
  );
}

// Helper: find input by its label text, using your Input component structure
function getInputByLabel(labelRegex) {
  const label = screen.getByText(labelRegex);
  return label.parentElement.querySelector("input");
}

// Helper: fill booking form with valid base data
async function fillValidBookingForm() {
  const user = userEvent.setup();

  const dateInput = getInputByLabel(/date/i);
  const timeInput = getInputByLabel(/time/i);
  const peopleInput = getInputByLabel(/number of awesome bowlers/i);
  const lanesInput = getInputByLabel(/number of lanes/i);

  await user.type(dateInput, "2025-12-24");
  await user.type(timeInput, "18:00");
  await user.type(peopleInput, "4");
  await user.type(lanesInput, "1");
}

async function addShoeFields(count) {
  const user = userEvent.setup();
  const addButton = screen.getByRole("button", { name: "+" });

  for (let i = 0; i < count; i++) {
    await user.click(addButton);
  }
}

async function fillShoeSize(index, size) {
  const user = userEvent.setup();
  const input = getInputByLabel(
    new RegExp(`Shoe size / person ${index}`, "i")
  );
  await user.type(input, size);
}

test("shows error when trying to book with all fields empty", async () => {
  // Covers:
  // - If the user does not fill in date, time, players or lanes,
  //   system shows error message "Alla fälten måste vara ifyllda".

  const user = userEvent.setup();
  renderWithRouter("/");

  const submitButton = screen.getByRole("button", { name: /striiiiiike!/i });

  await user.click(submitButton);

  expect(
    screen.getByText(/alla fälten måste vara ifyllda/i)
  ).toBeInTheDocument();
});

test("shows error when one required field (lanes) is missing", async () => {
  // Covers:
  //   Error message for missing fields should appear for different field combinations,
  //   here: lanes missing but date, time and players are filled.

  const user = userEvent.setup();
  renderWithRouter("/");

  const dateInput = getInputByLabel(/date/i);
  const timeInput = getInputByLabel(/time/i);
  const peopleInput = getInputByLabel(/number of awesome bowlers/i);
  const lanesInput = getInputByLabel(/number of lanes/i);
  const submitButton = screen.getByRole("button", { name: /striiiiiike!/i });

  await user.type(dateInput, "2025-12-24");
  await user.type(timeInput, "18:00");
  await user.type(peopleInput, "4");

  await user.click(submitButton);

  expect(
    screen.getByText(/alla fälten måste vara ifyllda/i)
  ).toBeInTheDocument();
});

test("shows error when number of players and number of shoes do not match", async () => {
  // Covers:
  // - "Om antalet personer och skor inte matchas ska ett felmeddelande visas".

  const user = userEvent.setup();
  renderWithRouter("/");

  await fillValidBookingForm();

  // Set people = 2, but add only 1 shoe field
  const peopleInput = getInputByLabel(/number of awesome bowlers/i);
  await user.clear(peopleInput);
  await user.type(peopleInput, "2");

  await addShoeFields(1);
  await fillShoeSize(1, "42");

  const submitButton = screen.getByRole("button", { name: /striiiiiike!/i });
  await user.click(submitButton);

  expect(
    screen.getByText(/antalet skor måste stämma överens med antal spelare/i)
  ).toBeInTheDocument();
});

test("shows error when not all shoe sizes are filled", async () => {
  // Covers:
  // - "Om användaren försöker slutföra bokningen utan att ange skostorlek
  //    för en spelare som har valt att boka skor, ska ett felmeddelande visas."
  // - "Alla skor måste vara ifyllda".

  const user = userEvent.setup();
  renderWithRouter("/");

  // 2 players
  await fillValidBookingForm();
  const peopleInput = getInputByLabel(/number of awesome bowlers/i);
  await user.clear(peopleInput);
  await user.type(peopleInput, "2");

  // Add 2 shoe fields
  await addShoeFields(2);

  // Fill only the first shoe size
  await fillShoeSize(1, "42");
  // leave second empty

  const submitButton = screen.getByRole("button", { name: /striiiiiike!/i });
  await user.click(submitButton);

  expect(
    screen.getByText(/alla skor måste vara ifyllda/i)
  ).toBeInTheDocument();
});

test("shows error when there are more than 4 players per lane", async () => {
  // Covers:
  // - "Det får max vara 4 spelare per bana" -> show error if exceeded.

  const user = userEvent.setup();
  renderWithRouter("/");

  const dateInput = getInputByLabel(/date/i);
  const timeInput = getInputByLabel(/time/i);
  const peopleInput = getInputByLabel(/number of awesome bowlers/i);
  const lanesInput = getInputByLabel(/number of lanes/i);
  const submitButton = screen.getByRole("button", { name: /striiiiiike!/i });

  await user.type(dateInput, "2025-12-24");
  await user.type(timeInput, "18:00");

  await user.type(peopleInput, "5");
  await user.type(lanesInput, "1");

  await addShoeFields(5);
  for (let i = 1; i <= 5; i++) {
    await fillShoeSize(i, String(40 + i)); // "41", "42", ...
  }

  await user.click(submitButton);

  expect(
    screen.getByText(/det får max vara 4 spelare per bana/i)
  ).toBeInTheDocument();
});

test("allows adding a shoe field when clicking the + button", async () => {
  // Covers:
  // - "Användaren ska kunna ange skostorlek för varje spelare."
  // - Ability to add shoe inputs dynamically with the + button.

  const user = userEvent.setup();
  renderWithRouter("/");

  const addButton = screen.getByRole("button", { name: "+" });

  await user.click(addButton);

  expect(
    getInputByLabel(/shoe size \/ person 1/i)
  ).toBeInTheDocument();
});

test("allows removing a shoe field with the - button", async () => {
  // Covers:
  // - "Användaren ska kunna ta bort ett tidigare valt fält för skostorlek genom att klicka på en '-'-knapp."
  // - "Om användaren tar bort skostorleken ska systemet inte inkludera den spelaren i skorantalet."

  const user = userEvent.setup();
  renderWithRouter("/");

  // Add 1 shoe field
  await addShoeFields(1);
  const shoeField = getInputByLabel(/shoe size \/ person 1/i);
  expect(shoeField).toBeInTheDocument();

  // Click the corresponding "-" button
  const removeButton = screen.getByRole("button", { name: "-" });
  await user.click(removeButton);

  expect(
    screen.queryByText(/shoe size \/ person 1/i)
  ).not.toBeInTheDocument();
});

test("successful booking sends data, saves confirmation and navigates to confirmation view", async () => {
  // Covers:
  // - User can complete booking by clicking "strIIIIIike!"
  // - System generates booking number and total price (from mocked response).
  // - System navigates from booking view to confirmation view.
  // - Confirmation shows overview of when, who, lanes, booking number, and total.

  const user = userEvent.setup();
  sessionStorage.clear();

  renderWithRouter("/");

  await fillValidBookingForm();

  const peopleInput = getInputByLabel(/number of awesome bowlers/i);
  await user.clear(peopleInput);
  await user.type(peopleInput, "4");

  await addShoeFields(4);
  for (let i = 1; i <= 4; i++) {
    await fillShoeSize(i, String(40 + i)); 
  }

  const submitButton = screen.getByRole("button", { name: /striiiiiike!/i });
  await user.click(submitButton);

  await waitFor(() => {
    expect(screen.getByText(/booking number/i)).toBeInTheDocument();
  });

  const whenInput = getInputByLabel(/when/i);
  const whoInput = getInputByLabel(/who/i);
  const lanesInput = getInputByLabel(/lanes/i);
  const bookingNumberInput = getInputByLabel(/booking number/i);

  expect(whenInput).toHaveValue("2025-12-24 18:00");
  expect(whoInput).toHaveValue("4");
  expect(lanesInput).toHaveValue("1");
  expect(bookingNumberInput).toHaveValue("TEST-12345");

  expect(screen.getByText(/total:/i)).toBeInTheDocument();
  expect(screen.getByText(/580 sek/i)).toBeInTheDocument();

  const stored = JSON.parse(sessionStorage.getItem("confirmation"));
  expect(stored.when).toBe("2025-12-24T18:00");
  expect(stored.people).toBe("4");
  expect(stored.lanes).toBe("1");
  expect(stored.bookingId).toBe("TEST-12345");
});

test("removed shoe field is not included in the booking payload", async () => {
  // Covers:
  //   When a shoe field is removed, that player is not included in the shoes array
  //   sent to the server, and thus not part of the shoe count/price.

  const user = userEvent.setup();
  let lastRequestBody = null;

  server.use(
    http.post(BOOKING_URL, async ({ request }) => {
      const body = await request.json();
      lastRequestBody = body;
      const bookingDetails = {
        when: body.when,
        people: body.people,
        lanes: body.lanes,
        bookingId: "SHOES-TEST",
        price: 120 * Number(body.people) + 100 * Number(body.lanes),
      };
      return HttpResponse.json({ bookingDetails });
    })
  );

  renderWithRouter("/");

  await fillValidBookingForm();

  // People = 2
  const peopleInput = getInputByLabel(/number of awesome bowlers/i);
  await user.clear(peopleInput);
  await user.type(peopleInput, "2");

  // Add 2 shoes, then remove one
  await addShoeFields(2);

  // Fill only first shoe
  await fillShoeSize(1, "42");

  // Remove the second shoe field, so only one shoe is actually booked
  const removeButtons = screen.getAllByRole("button", { name: "-" });
  await user.click(removeButtons[1]);

  // avoid mismatch people vs shoes, adjust people to 1
  await user.clear(peopleInput);
  await user.type(peopleInput, "1");

  const submitButton = screen.getByRole("button", { name: /striiiiiike!/i });
  await user.click(submitButton);

  await waitFor(() => {
    expect(screen.getByText(/booking number/i)).toBeInTheDocument();
  });

  // only one shoe size is sent in the payload
  expect(lastRequestBody).not.toBeNull();
  expect(lastRequestBody.shoes).toHaveLength(1);
  expect(lastRequestBody.shoes[0]).toBe("42");
});
