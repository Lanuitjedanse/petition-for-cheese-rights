const express = require("express");
const app = express();
const db = require("./db");
const cookieSession = require(`cookie-session`);
const hb = require("express-handlebars"); // requiring the db module that holds all the db queries we want to run
const { sessionSecret } = require("./secrets");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(express.static("./public"));

app.use(
    cookieSession({
        maxAge: 1000 * 60 * 60 * 24 * 14,
        secret: sessionSecret,
        // secret: secret.sessionSecret;
    })
); // equals to 2 weeks
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
    //req.session.funkyChicken = "cookie name";
    // return res.redirect(req.url);
    if (req.url == "/petition") {
        next();
    } else {
        if (req.cookies.signatureId) {
            next();
        } else {
            res.redirect("/petition");
        }
    }
});

app.get("/petition", (req, res) => {
    if (!req.cookies.signatureId) {
        res.render("petition", {
            title: "Petition Page",
            layout: "main",
        });
    } else {
        res.redirect("/thanks");
    }
});

app.post("/petition", (req, res) => {
    // console.log("Post petition request made!");
    const { signatureId } = req.cookies;

    const { first, last, signature } = req.body;

    if (first && last && signature) {
        //req.session.funkyChicken = "cookie name";

        // res.cookie("signed", true);

        res.redirect("/thanks"); // redirect to thanks page
    } else {
        res.render("petition", {
            title: "Petition Page",
            errorMessage: "There was an error, please fill out every field!",
        });
    }

    db.getSignature(first, last, signature)
        .then(({ rows }) => {
            console.log("yay we got a signature");
            req.session.signatureId = rows[0].id;
        })
        .catch((err) => {
            console.log("error in getSignature: ", err);
        });
});

app.get("/thanks", (req, res) => {
    // req.session.discoDuck = "quack"; // we need this
    req.session.signatureId = req.session;
    if (req.cookies.signatureId) {
        db.numSignatures()
            .then(({ rows }) => {
                res.render("thanks", {
                    title: "Thanks Page",
                    layout: "main",
                    rows,
                });
            })
            .catch((err) => {
                console.log("error in getAllSignatures: ", err);
            });
    } else {
        res.redirect("/petition");
    }
});

// WORKING SIGNERS WITHOUT COUNT
app.get("/signers", (req, res) => {
    // console.log(req.session); to check the cookie info
    if (req.cookies.signatureId) {
        db.getAllSignatures()
            .then(({ rows }) => {
                // console.log("see results from getAllSignature: ", rows);
                res.render("signers", {
                    title: "Signers Page",
                    layout: "main",
                    rows,
                });
            })
            .catch((err) => {
                console.log("error in getAllSignatures: ", err);
            });
    } else {
        res.redirect("/petition");
    }
});

// app.get("/petition", (req,res) => {
//     const {cookies} = req.cookies; // to grab the value of the cookie

// });

// atob('cookievalue'); and it converts back to it was before
// new cookies method has to be set on req and not res

app.listen(8080, () => {
    console.log("Petition Server listening...");
});

// ALSO TRIED THIS WAY
// const express = require("express");
// const app = express();
// const db = require("./db");
// // const cookieParser = require("cookie-parser");
// const cookieSession = require("cookie-session");
// const { sessionSecret } = require("./secrets");
// const hb = require("express-handlebars");
// app.engine("handlebars", hb());
// app.set("view engine", "handlebars");
// app.use(express.static("./public"));
// // middleware
// app.use(
//     cookieSession({
//         maxAge: 1000 * 60 * 24 * 14,
//         secret: sessionSecret,
//     })
// );
// app.use(express.urlencoded({ extended: false }));
// app.use((req, res, next) => {
//     // const { signatureId } = req.cookies;
//     // console.log("req.cookies", req.cookies);
//     if (req.url == "/petition") {
//         next();
//     } else {
//         if (req.cookies.signatureId) {
//             next();
//         } else {
//             // res.redirect("/petition");
//             req.session.signatureId = "say hi";
//             return res.redirect("/petition");
//         }
//     }
// });
// app.get("/petition", (req, res) => {
//     if (!req.cookies.signatureId) {
//         res.render("petition", {
//             title: "petition",
//             layout: "main",
//             // signatureId,
//         });
//     } else {
//         res.redirect("/thanks");
//     }
// });
// app.post("/petition", (req, res) => {
//     // console.log("post to petition was made");
//     // console.log("req.body", req.body);
//     console.log("req.cookies", req.cookies);
//     const { first, last, signature } = req.body;
//     // console.log("req.body: ", req.body);
//     db.getSignature(first, last, signature)
//         .then(({ rows }) => {
//             // console.log("results from getSignature: ");
//             if (first && last && signature) {
//                 // const { signatureId } = req.cookies;
//                 req.session.signatureId = rows[0].id;
//                 // res.cookie("signatureId", true);
//                 // req.session.signatureId = results.rows[0].id;
//                 res.redirect("/thanks");
//             } else {
//                 res.render("petition", {
//                     title: "Petition Page",
//                     errorMessage:
//                         "There was an error, please fill out all forms",
//                 });
//             }
//         })
//         .catch((err) => {
//             console.log("err in dataBase: ", err);
//         });
// });
// app.get("/thanks", (req, res) => {
//     if (req.cookies.signatureId) {
//         res.session.signatureId = "signatureId";
//         res.sendStatus(200);
//         db.numSignatures()
//             .then(({ rows }) => {
//                 res.render("thanks", {
//                     title: "Thanks Page",
//                     layout: "main",
//                     rows,
//                 });
//             })
//             .catch((err) => {
//                 console.log("error in getAllSignatures: ", err);
//             });
//     } else {
//         res.redirect("/petition");
//     }
// });
// app.get("/signers", (req, res) => {
//     // console.log("req.session: ", req.session);
//     if (req.cookies.signatureId) {
//         db.getAllSignatures()
//             .then(({ rows }) => {
//                 // console.log("result.rows: ", rows);
//                 res.render("signers", {
//                     title: "signers",
//                     layout: "main",
//                     rows,
//                 });
//             })
//             .catch((err) => {
//                 console.log("error in getAllSignatures", err);
//             });
//     } else {
//         res.redirect("/petition");
//     }
// });
// app.listen(8080, () => {
//     console.log("petition server is listening...");
// });
