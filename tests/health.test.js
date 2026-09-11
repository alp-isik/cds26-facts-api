const request = require("supertest");
const app = require("../src/app.js");

describe("GET /health", () => {
  it("responds with 200", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
  });
  it("responds with ok", async () => {
    const response = await request(app).get("/health");
    expect(response.body.status).toBe("ok");
  });
  it("reports the environment it was given", async () => {
    const response = await request(app).get("/health");
    expect(response.body.environment).not.toBe("default");
  });
});
