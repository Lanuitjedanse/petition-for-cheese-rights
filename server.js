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
    // console.log("req.sission middleware: ", req.session);
    // req.session.name = "hello";
    // return res.redirect(req.url);
    if (req.url == "/petition") {
        next();
    } else {
        if (req.session.signatureId) {
            next();
        } else {
            res.redirect("/petition");
        }
    }
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
                console.log("err in hashed pass:", err);
            });
    }
});

app.get("/login", (req, res) => {
    res.render("login", {
        title: "Log in",
        layout: "main",
    });
});

app.post("/login", (req, res) => {
    const { email, pass } = req.body;

    if (email) {
        db.getLoginData(email)
            .then(({ rows }) => {
                // const emailDB = rows[0].email;
                // console.log("email user: ", emailDB);
                // console.log("yay the email matches!");
                const hashedPw = rows[0].password;

                compare(pass, hashedPw)
                    .then((match) => {
                        if (hashedPw) {
                            req.session.loggedIn = rows[0].id;
                            console.log("password matched?: ", match);
                            // console.log("cookie loggedin: ", req.session.loggedIn);
                            res.redirect("/petition");
                        } else {
                            res.render("petition", {
                                title: "Petition Page",
                                errorMessage:
                                    "There was an error, please fill out every field!",
                            });
                        }
                    })
                    .catch((err) => console.log("err in compare:", err));
            })
            .catch((err) => {
                console.log("err in getlogin data: ", err);
            });

        // you will get an actually hashed pw from you db ;)
    }
});

app.get("/petition", (req, res) => {
    // console.log("req session: ", req.session);
    if (!req.session.signatureId) {
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
    const { signature } = req.body;

    if (signature) {
        db.insertSig(signature)
            .then(({ rows }) => {
                req.session.signatureId = rows[0].id;
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("error in insertSig: ", err);
            });
    } else {
        res.render("petition", {
            title: "Petition Page",
            errorMessage: "There was an error, please fill out every field!",
        });
    }
});

app.get("/thanks", (req, res, { rows }) => {
    if (req.session.signatureId) {
        const promiseArray = [
            db.pullSig(req.session.signatureId),
            db.numSignatures({ rows }),
        ];
        Promise.all(promiseArray)
            .then((results) => {
                let signature = results[0].rows[0].signature;
                let count = results[1].rows[0].count;

                return res.render("thanks", {
                    title: "Thanks Page",
                    layout: "main",
                    rows,
                    signature,
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
