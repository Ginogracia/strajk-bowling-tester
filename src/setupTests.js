// src/setupTests.js
import "@testing-library/jest-dom";
import { server } from "./mocks/server";

// Start/reset/stop MSW before all tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());