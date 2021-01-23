const express = require("express");
const app = express();
const db = require("./db");
const hb = require("express-handlebars");
const csurf = require("csurf");
const { sessionSecret } = require("./secrets");
const cookieSession = require(`cookie-session`);
const { hash, compare } = require("./bc");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(function (req, res, next) {
    res.setHeader("x-frame-options", "deny");
    next();
});

app.use(express.static("./public"));

app.use(
    cookieSession({
        maxAge: 1000 * 60 * 60 * 24 * 14,
        secret: sessionSecret,
    })
); // equals to 2 weeks
app.use(express.urlencoded({ extended: false }));

app.use(csurf()); // has to be after url encoded and cookie session

app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
}); // put underneath csurf middleware

app.use((req, res, next) => {
    if (req.url == "/petition" && !req.session.userId) {
        return res.redirect("/register");
    } else if (req.url == "/petition" && !req.session.loggedIn) {
        return res.redirect("/login");
    } else if (req.url == "/register" && req.session.userId) {
        return res.redirect("/login");
    }
    next();
});

// if (req.url == "/petition") {
//     if (!req.cookie.userId) {
//         next();
//     } else if (!req.cookie.loggedIn) {
//         next();
//     } else if (!req.cookie.signatureId) {
//         next();
//     } else {
//         res.redirect("/petition");
//     }
// }
// if (req.url == "/login") {
//     next();
// } else if (req.url == "/register") {
//     next();
// } else if (req.url == "/petition") {
//     next();
// } else {
//     if (req.session.signatureId) {
//         next();
//     } else if (req.session.userId) {
//         next();
//     } else if (req.session.loggedIn) {
//         next();
//     } else {
//         res.redirect("/register");
//     }
// }
// OLD VERSION
// app.use((req, res, next) => {
//     // console.log("req.sission middleware: ", req.session);
//     // req.session.name = "hello";
//     // return res.redirect(req.url);
//     if (req.url == "/petition") {
//         next();
//     } else {
//         if (req.session.signatureId) {
//             next();
//         } else {
//             res.redirect("/petition");
//         }
//     }
// });

app.get("/", (req, res) => {
    res.redirect("/register");
});

app.get("/register", (req, res) => {
    res.render("registration", {
        title: "Sign up",
        layout: "main",
    });
});

app.post("/register", (req, res) => {
    const { first, last, email, pass } = req.body;

    if (first && last && email && pass) {
        hash(pass)
            .then((hashedPw) => {
                console.log("hashed password: ", hashedPw);
                db.insertRegData(first, last, email, hashedPw)
                    .then(({ rows }) => {
                        req.session.userId = rows[0].id;

                        console.log("yay data in the database");
                        res.redirect("/petition"); // we have to change this
                    })
                    .catch((err) => {
                        console.log("err in insert data reg: ", err);
                    });
            })
            .catch((err) => {
                res.render("registration", {
                    title: "Sign up",
                    errorMessage: "Oops, something went wrong with DB!",
                });
                console.log("err in hashed pass:", err);
            });
    } else {
        res.render("registration", {
            title: "Sign up",
            errorMessage: "Oops, something went wrong!",
        });
    }
});

app.get("/login", (req, res) => {
    res.render("login", {
        title: "Please log in",
        layout: "main",
    });
});

app.post("/login", (req, res) => {
    const { email, pass } = req.body;

    if (email) {
        db.getLoginData(email)
            .then(({ rows }) => {
                const hashedPw = rows[0].password;
                compare(pass, hashedPw)
                    .then((match) => {
                        if (match) {
                            req.session.loggedIn = rows[0].id;
                            if (req.session.signatureId) {
                                res.redirect("/thanks");
                            } else {
                                res.redirect("/petition");
                            }
                        } else {
                            res.render("login", {
                                title: "Please log in",
                                errorMessage: "Oops, there was an error!",
                            });
                        }
                    })
                    .catch((err) => console.log("err in compare:", err));
            })
            .catch((err) => {
                console.log("err in getlogin data: ", err);
                res.render("login", {
                    title: "Please log in",
                    errorMessage: "Oops, something went wrong!",
                });
            });

        // you will get an actually hashed pw from you db ;)
    }
});

app.get("/petition", (req, res) => {
    // console.log("req session: ", req.session);

    if (req.session.signatureId) {
        return res.redirect("/thanks");
    } else {
        return res.render("petition", {
            title: "Petition Page",
            layout: "main",
        });
    }
});

app.post("/petition", (req, res) => {
    // console.log("Post petition request made!");
    const { signature } = req.body;

    if (req.session.userId || req.session.loggedIn) {
        if (signature) {
            if (req.session.userId) {
                db.insertSig(signature, req.session.userId)
                    .then(({ rows }) => {
                        req.session.signatureId = rows[0].id;
                        res.redirect("/thanks");
                        return;
                    })
                    .catch((err) => {
                        console.log("error in insertSig: ", err);
                    });
            } else {
                db.insertSig(signature, req.session.loggedIn)
                    .then(({ rows }) => {
                        req.session.signatureId = rows[0].id;
                        res.redirect("/thanks");
                        return;
                    })
                    .catch((err) => {
                        console.log("error in insertSig: ", err);
                    });
            }
        } else {
            res.render("petition", {
                title: "Petition Page",
                errorMessage:
                    "There was an error, please fill out every field!",
            });
        }
    }
});

app.get("/thanks", (req, res) => {
    if (req.session.signatureId) {
        const promiseArray = [
            db.pullSig(req.session.signatureId),
            db.numSignatures(),
        ];
        Promise.all(promiseArray)
            .then((results) => {
                let sigImg = results[0].rows[0].signature;
                let count = results[1].rows[0].count;

                return res.render("thanks", {
                    title: "Thanks Page",
                    sigImg,
                    count,
                });
            })
            .catch((err) => {
                console.log("err in pulling signature: ", err);
            });
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers", (req, res) => {
    if (req.session.signatureId) {
        db.getAllSignatures()
            .then(({ rows }) => {
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

app.listen(8080, () => {
    console.log("Petition Server listening...");
});
