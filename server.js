const express = require("express");
const app = express();
const db = require("./db");
const hb = require("express-handlebars"); // requiring the db module that holds all the db queries we want to run
// express.static to serve the files
const cookieParser = require("cookie-parser");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(express.static("./public"));

app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
    if (req.url == "/petition") {
        next();
    } else {
        if (req.cookies.signed) {
            next();
        } else {
            res.redirect("/petition");
        }
    }
});

app.get("/petition", (req, res) => {
    if (!req.cookies.signed) {
        res.render("petition", {
            title: "Petition Page",
            layout: "main",
        });
    } else {
        res.redirect("/thanks");
    }
});

app.post("/petition", (req, res) => {
    console.log("Post petition request made!");

    const { first, last, signature } = req.body;
    // console.log("req.body: ", signed);
    // const { fistName, lastName, signature } = req.body;

    if (first && last && signature) {
        res.cookie("signed", true);
        res.redirect("/thanks"); // redirect to thanks page
    } else {
        res.render("petition", {
            title: "Petition Page",
            errorMessage: "There was an error, please fill out every field!",
        });
    }

    db.getSignature(first, last, signature)
        .then(() => {
            console.log("yay we got a signature");
        })
        .catch((err) => {
            console.log("error in getSignature: ", err);
        });
});

app.get("/thanks", (req, res) => {
    if (req.cookies.signed) {
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
    if (req.cookies.signed) {
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

// getting information from our db

// app.get("/actors", (req, res) => {
//     db.getActors()
//         .then((results) => {
//             console.log("see results from getActors: ", results.rows);
//         })
//         .catch((err) => {
//             console.log("error in get actors: ", err);
//         });
// });

// // adding information to our db
// app.post("/add-actor", (req, res) => {
//     console.log("hit POST add-actor route");

//     // we have yet to create this db query

//     db.addActor("Janelle Monae", 35)
//         .then(() => {
//             console.log("yay it worked");
//         })
//         .catch((err) => {
//             console.log("error in add Actor: ", err);
//         });
// });

app.listen(8080, () => {
    console.log("Petition Server listening...");
});
