const { TestScheduler } = require("jest");
const supertest = require("supertest");
const { app } = require("./server");
const cookieSession = require("cookie-session");

// console.log("app in server.test.js");

//test takes 2 arguments
// 1st arg string that describes the test we want to run
// 2nd arg is a callback function that contains the actual test

test("GET / register sends a 200 status code as a response", () => {
    return supertest(app)
        .get("/register")
        .then((res) => {
            // console.log("status code: ", res.statusCode);
            expect(res.statusCode).toBe(200);
        });
});

// test.only("POST / register redirects to /profile", () => {
//     return supertest(app)
//         .post("/register")
//         .then((res) => {
//             expect(res.statusCode).toBe(302);
//             expect(res.header.location).toBe("/profile");
//         });
// });
// NOT working for now

test("GET / petition sends 302 when there is no cookie", () => {
    cookieSession.mockSessionOnce({});

    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(302);
        });
});

test.only("GET / petition sends 200 if there is a cookie", () => {
    cookieSession.mockSessionOnce({
        userId: true,
        loggedIn: true,
        signatureId: true,
    });
    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(200);
        });
});
