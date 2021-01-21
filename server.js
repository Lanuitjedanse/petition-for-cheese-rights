const express = require("express");
const app = express();
const db = require("./db");
const hb = require("express-handlebars");
const csurf = require("csurf");
const { sessionSecret } = require("./secrets");
const cookieSession = require(`cookie-session`);
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
    const { first, last, signature } = req.body;

    if (first && last && signature) {
        //req.session.funkyChicken = "cookie name";
        // res.cookie("signed", true);
        db.getSignature(first, last, signature)
            .then(({ rows }) => {
                // console.log("yay we got a signature");
                req.session.signatureId = rows[0].id;
                // console.log("signatureId: ", req.session);
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("error in getSignature: ", err);
            });
        // redirect to thanks page
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
    // console.log(req.session); to check the cookie info
    if (req.session.signatureId) {
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
