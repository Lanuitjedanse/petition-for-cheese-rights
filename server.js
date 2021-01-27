const express = require("express");
const app = express();
exports.app = app;
const db = require("./db");
const hb = require("express-handlebars");
const csurf = require("csurf");

// const { sessionSecret } = require("./secrets");
const cookieSession = require(`cookie-session`);
const { hash, compare } = require("./bc");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
let cookie_sec;

if (process.env.sessionSecret) {
    //we are in production
    cookie_sec = process.env.sessionSecret;
} else {
    cookie_sec = require("./secrets").sessionSecret;
}

app.use(function (req, res, next) {
    res.setHeader("x-frame-options", "deny");
    next();
});

app.use(express.static("./public"));

app.use(
    cookieSession({
        maxAge: 1000 * 60 * 60 * 24 * 14,
        secret: cookie_sec,
    })
); // equals to 2 weeks
app.use(express.urlencoded({ extended: false }));

app.use(csurf()); // has to be after url encoded and cookie session

app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
}); // put underneath csurf middleware

app.use((req, res, next) => {
    if (!req.session.userId && req.url != "/register" && req.url != "/login") {
        return res.redirect("/register");
    } else {
        next();
    }
}); // runs for every single requests we receive

app.get("/register", (req, res) => {
    res.render("registration", {
        title: "Sign up",
        layout: "main",
    });
});

app.post("/register", (req, res) => {
    // console.log("i am post for register");
    const { first, last, email, pass } = req.body;
    if (first && last && email && pass) {
        hash(pass).then((hashedPw) => {
            db.insertRegData(first, last, email, hashedPw)
                .then(({ rows }) => {
                    req.session.userId = rows[0].id; // add register cookie to fix redirect issue
                    req.session.loggedIn = rows[0].id; // add login cookie

                    res.redirect("/profile");
                })
                .catch((err) => {
                    console.log("error in insert reg data", err);
                    res.render("registration", {
                        title: "Sign Up Page",
                        errorMessage: "Something went wrong in the DB.",
                    });
                });
        });
    } else {
        res.render("registration", {
            title: "Sign Up Page",
            errorMessage: "Something went wrong. Please fill out all fields",
        });
    }
});

app.get("/profile", (req, res) => {
    res.render("profile", {
        title: "Profile page",
        layout: "main",
    });
});

app.post("/profile", (req, res) => {
    let { age, city, url } = req.body;

    if (url.startsWith("http://") || url.startsWith("https://")) {
        url = req.body.url;
    } else {
        console.log("bad url dude");
        url = "";
    }

    db.insertProfileData(age, city, url, req.session.userId)
        .then(() => {
            console.log("yay data in the database");
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("err in insert profile data in DB: ", err);
            // res.render("profile", {
            //     title: "Profile page",
            //     layout: "main",
            // });
        });
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
                            console.log(
                                "cookie signature post login: ",
                                req.session.signatureId
                            );
                            req.session.signatureId = rows[0].signatureid;
                            req.session.userId = rows[0].id;
                            req.session.loggedIn = rows[0].id; // check if necessary

                            if (!req.session.signatureId) {
                                // on top of checking cookie, might be helpful to check with DB
                                // SELECT signature FROM signatures where id = $1
                                res.redirect("/petition");
                            } else {
                                res.redirect("/thanks");
                            }
                        } else {
                            res.render("login", {
                                title: "Please log in",
                                errorMessage:
                                    "Oops, there was an error, incorrect password",
                            });
                        }
                    })
                    .catch((err) => console.log("err in compare:", err));
            })
            .catch((err) => {
                console.log("err in getlogin data: ", err);
                res.render("login", {
                    title: "Please log in",
                    errorMessage:
                        "Oops, something went wrong, incorrect email!",
                });
            });
    }
});

app.get("/petition", (req, res) => {
    res.render("petition", {
        title: "Petition Page",
        layout: "main",
    });
});

app.post("/petition", (req, res) => {
    const { signature } = req.body;
    // const { first, last, signature } = req.body;
    if (req.session.userId && req.session.loggedIn) {
        console.log("cookie log in petition post: ", req.session);
        if (signature) {
            db.insertSig(signature, req.session.userId)
                .then(({ rows }) => {
                    req.session.signatureId = rows[0].id;
                    console.log(
                        "cookie signature post petition: ",
                        req.session.signatureId
                    );

                    // req.session.loggedIn = rows[0].user_id;

                    // console.log("rows[0].id", rows[0].id);
                    // console.log("req.session", req.session);
                    res.redirect("/thanks");
                })
                .catch((err) => {
                    console.log("err in dataBase: ", err);
                });
        } else {
            res.render("petition", {
                title: "Petition Page",
                errorMessage: "There was an error, please sign the petition!",
            });
        }
    }
});

app.get("/thanks", (req, res) => {
    console.log("cookie signature get thanks: ", req.session.signatureId);
    if (req.session.signatureId) {
        // check if signature is in DB to fix issue when previous user logins and don't have cookies anymore
        Promise.all([db.pullSig(req.session.signatureId), db.numSignatures()])
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

app.post("/thanks", (req, res) => {
    console.log("post request to delete signature was made");
    // const { signature } = req.body;
    // console.log("cookie userId: ", req.session.userId);
    // console.log("cookie userLoggedIn: ", req.session.loggedIn);
    console.log("cookie signature post thanks: ", req.session.signatureId);
    db.deleteSignature(req.session.userId)
        .then(() => {
            console.log("the signature was deleted");
            req.session.signatureId = null;
        })
        .then(() => {
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("err in deleteSignature: ", err);
        });
});

app.get("/signers", (req, res) => {
    console.log("cookie signature get signers: ", req.session.signatureId);
    if (req.session.signatureId) {
        // check also if signature is in DB to fix issue when user logins don't have cookie anymore
        db.getAllSigners()
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

app.get("/signers/:city", (req, res) => {
    const { city } = req.params;
    console.log("city: ", city);

    db.getSignersByCity(city)
        .then(({ rows }) => {
            console.log("city: ", city);
            console.log("filetered city result");
            res.render("city", {
                title: "Signers in your city",
                layout: "main",
                rows,
            });
        })
        .catch((err) => {
            console.log("err in filetering city: ", err);
        });
});

app.get("/edit", (req, res) => {
    // const selectedUser = editProfile.find((item) => item.userId == project);
    console.log("req reg cookie: ", req.session.userId);
    db.editProfile(req.session.userId)
        .then(({ rows }) => {
            console.log("rows: ", rows);
            // let firstName = results.rows[0].first;
            // console.log("firstname: ", firstName);
            res.render("edit", {
                title: "Update your profile",
                layout: "main",
                rows,
            });
        })
        .catch((err) => {
            console.log("There was an error in retrieving data from DB: ", err);
        });
});

app.post("/edit", (req, res) => {
    const { first, last, email, pass, age, city, url } = req.body;

    if (pass) {
        hash(pass)
            .then((hashedPw) => {
                db.updateProfileWithPass(
                    req.session.userId,
                    first,
                    last,
                    email,
                    hashedPw
                )
                    .then(() => {
                        db.upsertProfile(age, city, url, req.session.userId)
                            .then(() => {
                                // console.log("profile was updated with pass");
                                console.log("all data were updated in DB");
                                console.log(
                                    "cookie signature post edit: ",
                                    req.session.signatureId
                                );
                                if (req.session.signatureId) {
                                    res.redirect("/thanks");
                                } else {
                                    res.redirect("/petition");
                                }
                            })
                            .catch((err) => {
                                console.log("err in the upsert profile: ", err);
                            });
                    })
                    .catch((err) => {
                        console.log("err in updating profile data: ", err);
                    });
            })
            .catch((err) => {
                console.log("err in hashing pass: ", err);
            });
    } else {
        db.updateProfileNoPass(req.session.userId, first, last, email)
            .then(() => {
                db.upsertProfile(age, city, url, req.session.userId)
                    .then(() => {
                        // console.log("profile was updated with pass");
                        console.log("all data were updated in DB");
                        console.log(
                            "cookie signature post edit: ",
                            req.session.signatureId
                        );
                        if (req.session.signatureId) {
                            res.redirect("/thanks");
                        } else {
                            res.redirect("/petition");
                        }
                    })
                    .catch((err) => {
                        console.log("err in the upsert profile: ", err);
                    });
            })
            .catch((err) => {
                console.log("err in updating 3 datas: ", err);
            });
    }
});

if (require.main == module) {
    app.listen(process.env.PORT || 8080, () => {
        console.log("Petition Server listening...");
    });
}

// not allow loggedin user to register or login again because leads to bugs (should redirect to petition or thanks)
// we want to put the middleware functions in another files
