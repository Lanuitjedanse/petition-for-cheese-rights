const supertest = require("supertest");
const { app } = require("./server");
const cookieSession = require("cookie-session");

// console.log("app in server.test.js");

//test takes 2 arguments
// 1st arg string that describes the test we want to run
// 2nd arg is a callback function that contains the actual test

// test("GET / register sends a 200 status code as a response", () => {
//     return supertest(app)
//         .get("/register")
//         .then((res) => {
//             // console.log("status code: ", res.statusCode);
//             expect(res.statusCode).toBe(200);
//         });
// });

// test.only("POST / register redirects to /profile", () => {
//     return supertest(app)
//         .post("/register")
//         .then((res) => {
//             expect(res.statusCode).toBe(302);
//             expect(res.header.location).toBe("/profile");
//         });
// });
// NOT working for now

// test("GET / petition sends 302 when there is no cookie", () => {
//     cookieSession.mockSessionOnce({});

//     return supertest(app)
//         .get("/petition")
//         .then((res) => {
//             expect(res.statusCode).toBe(302);
//         });
// });

// test("GET / petition sends 200 if there is a cookie", () => {
//     cookieSession.mockSessionOnce({
//         userId: true,
//         loggedIn: true,
//         signatureId: true,
//     });
//     return supertest(app)
//         .get("/petition")
//         .then((res) => {
//             expect(res.statusCode).toBe(200);
//         });
// });

test("Logged out users redirected to register when they attempt to go to petition", () => {
    cookieSession.mockSessionOnce({
        userId: false,
        loggedIn: false,
    });

    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.header.location).toBe("/register");
        });
});

test("logged in users redirected to petition when they attempt to go to register or login", () => {
    cookieSession.mockSessionOnce({
        userId: true,
        loggedIn: true,
    });

    return supertest(app)
        .get("/register", "/login")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.header.location).toBe("/petition");
        });
});

test("users logged in that signed are redirected to thanks when they try to access petition or submit signature", () => {
    cookieSession.mockSessionOnce({
        signatureId: true,
        userId: true,
        loggedIn: true,
    });

    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.header.location).toBe("/thanks");
        });
});

test("Users who are logged in and have not signed the petition are redirected to the petition page when they attempt to go to either the thank you page or the signers page", () => {
    cookieSession.mockSessionOnce({
        signatureId: false,
        userId: true,
        loggedIn: true,
    });

    return supertest(app)
        .get("/thanks", "/signers")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.header.location).toBe("/petition");
        });
});
