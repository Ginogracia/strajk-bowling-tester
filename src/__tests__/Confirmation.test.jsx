// Covers user story:
// - Navigate to confirmation view and see booking if it exists (from state or sessionStorage).
// - If no booking exists, show "Inga bokning gjord!".

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Confirmation from "../views/Confirmation";

const sampleConfirmation = {
  when: "2025-12-24T18:00",
  people: 4,
  lanes: 1,
  bookingId: "CONF-123",
  price: 580,
};

// Helper: find input by its label text, using your Input component structure
function getInputByLabel(labelRegex) {
  const label = screen.getByText(labelRegex);
  return label.parentElement.querySelector("input");
}

test("shows confirmation details when booking is provided via router state", () => {
  // Covers:
  // - "Användaren ska kunna navigera från bokningsvyn till bekräftelsevyn när bokningen är klar."
  // - "Systemet ska generera ett bokningsnummer och visa detta."
  // - "Systemet ska beräkna och visa den totala summan."

  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/confirmation",
          state: { confirmationDetails: sampleConfirmation },
        },
      ]}
    >
      <Routes>
        <Route path="/confirmation" element={<Confirmation />} />
      </Routes>
    </MemoryRouter>
  );

  const whenInput = getInputByLabel(/when/i);
  const whoInput = getInputByLabel(/who/i);
  const lanesInput = getInputByLabel(/lanes/i);
  const bookingNumberInput = getInputByLabel(/booking number/i);

  expect(whenInput).toHaveValue("2025-12-24 18:00");
  expect(whoInput).toHaveValue("4");
  expect(lanesInput).toHaveValue("1");
  expect(bookingNumberInput).toHaveValue("CONF-123");
  expect(screen.getByText(/total:/i)).toBeInTheDocument();
  expect(screen.getByText(/580 sek/i)).toBeInTheDocument();
});

test("reads confirmation from sessionStorage when no state is provided", () => {
  // Cover:
  // - "Om användaren navigerar till bekräftelsevyn och det finns en bokning sparad
  //    i session storage ska denna visas."

  sessionStorage.setItem("confirmation", JSON.stringify(sampleConfirmation));

  render(
    <MemoryRouter initialEntries={["/confirmation"]}>
      <Routes>
        <Route path="/confirmation" element={<Confirmation />} />
      </Routes>
    </MemoryRouter>
  );

  const whenInput = getInputByLabel(/when/i);
  const whoInput = getInputByLabel(/who/i);
  const lanesInput = getInputByLabel(/lanes/i);
  const bookingNumberInput = getInputByLabel(/booking number/i);

  expect(whenInput).toHaveValue("2025-12-24 18:00");
  expect(whoInput).toHaveValue("4");
  expect(lanesInput).toHaveValue("1");
  expect(bookingNumberInput).toHaveValue("CONF-123");
  expect(screen.getByText(/580 sek/i)).toBeInTheDocument();
});

test("shows 'Inga bokning gjord!' when there is no booking in state or sessionStorage", () => {
  // Covers :
  // - "Om användaren navigerar till bekräftelsevyn och ingen bokning är gjord
  //    eller finns i session storage ska texten 'Ingen bokning gjord' visas."
  //   (implementation text is 'Inga bokning gjord!', we test what the code renders.)

  sessionStorage.clear();

  render(
    <MemoryRouter initialEntries={["/confirmation"]}>
      <Routes>
        <Route path="/confirmation" element={<Confirmation />} />
      </Routes>
    </MemoryRouter>
  );

  expect(
    screen.getByText(/inga bokning gjord!/i)
  ).toBeInTheDocument();
});
