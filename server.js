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

// LATEST VERSION
// app.use((req, res, next) => {
//     if (req.url == "/petition" && !req.session.userId) {
//         return res.redirect("/register");
//     } else if (req.url == "/petition" && !req.session.loggedIn) {
//         return res.redirect("/login");
//     } else if (req.url == "/register" && req.session.userId) {
//         return res.redirect("/login");
//     }
//     next();
// });

app.get("/", (req, res) => {
    // const { email } = req.body;

    if (!req.session.userId) {
        // console.log("userId", req.session.userId);
        console.log("no user id - sign up");
        res.redirect("/register");
    } else if (!req.session.loggedIn && req.session.userId) {
        // console.log("userId", req.session.userId);
        console.log("cookie log in: ", req.session);
        console.log("not logged in - log in");
        res.redirect("/login");
    } else {
        console.log("go to petition");
        console.log("cookie log in: ", req.session);
        res.redirect("/petition");
    }
});

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
                    // console.log("i am logged in", req.session.loggedIn);
                    // console.log("cookie log in: ", req.session);
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
            res.render("profile", {
                title: "Profile page",
                layout: "main",
            });
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
                            console.log("cookie log in: ", req.session);
                            req.session.loggedIn = rows[0].id;
                            req.session.userId = rows[0].id;

                            if (req.session.signatureId) {
                                // on top of checking cookie, might be helpful to check with DB
                                // SELECT signature FROM signatures where id = $1
                                res.redirect("/thanks");
                                console.log("cookie log in: ", req.session);
                            } else {
                                res.redirect("/petition");
                                console.log("cookie log in: ", req.session);
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
    // console.log("req.session", req.session);

    if (!req.session.userId && !req.session.loggedIn) {
        res.redirect("/register");
    } else if (!req.session.loggedIn && req.session.userId) {
        res.redirect("/login");
    } else if (req.session.loggedIn) {
        console.log("cookie log in petition: ", req.session);
        if (req.session.signatureId) {
            res.redirect("/thanks");
        } else {
            res.render("petition", {
                title: "Petition Page",
                layout: "main",
            });
        }
    }
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
                    req.session.loggedIn = rows[0].id;

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

//OLD LOGIC
// app.post("/petition", (req, res) => {
//     // console.log("Post petition request made!");
//     const { signature } = req.body;

//     if (req.session.userId || req.session.loggedIn) {
//         if (signature) {
//             if (req.session.userId) {
//                 db.insertSig(signature, req.session.userId)
//                     .then(({ rows }) => {
//                         req.session.signatureId = rows[0].id;
//                         console.log("signature with userID in DB");
//                         res.redirect("/thanks");
//                         return;
//                     })
//                     .catch((err) => {
//                         console.log("error in insertSig: ", err);
//                     });
//             } else {
//                 db.insertSig(signature, req.session.loggedIn)
//                     .then(({ rows }) => {
//                         req.session.signatureId = rows[0].id;
//                         console.log("signature with loggedIn in DB");

//                         res.redirect("/thanks");
//                         return;
//                     })
//                     .catch((err) => {
//                         console.log("error in insertSig: ", err);
//                     });
//             }
//         } else {
//             res.render("petition", {
//                 title: "Petition Page",
//                 errorMessage:
//                     "There was an error, please fill out every field!",
//             });
//         }
//     }
// });

app.get("/thanks", (req, res) => {
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

app.get("/signers", (req, res) => {
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

    db.getSignersByCity(city)
        .then(({ rows }) => {
            console.log("filetered city result");
            console.log("rows: ", rows);
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

// app.get("/projects/:project", (req, res) => {
//     const { project } = req.params;

//     const selectedCity = projectsData.find(
//         (item) => item.dirName == project
//     );
//     console.log("selected project: ", selectedProject);
//     console.log("project: ", project);

//     if (!selectedProject) {
//         return res.sendStatus(404);
//     } else {
//         res.statusCode = 200;
//         res.render("description", {
//             title: "Description page",
//             layout: "main",
//             projectsData,
//             selectedProject,
//         });
//     }
// });

app.listen(8080, () => {
    console.log("Petition Server listening...");
});
