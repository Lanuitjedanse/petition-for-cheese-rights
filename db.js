// this module holds all the queries we'll be using to talk to our database

const spicedPg = require("spiced-pg");
const { dbUsername, dbPassword } = require("./secrets");
const db = spicedPg(
    `postgres:${dbUsername}:${dbPassword}@localhost:5432/petition`
); // need to update databse

// spicedPg ('WhoDoWeWantToTalkTo:whichUserShouldBeRunningOurQueries:whatPasswordDoesThisUserHave
// @WhereDoesThisCommunicationHappen:specifiedPortForCommunication/nameOfOurDataBase)

// module.exports.getActors = () => {
//     const q = `SELECT * FROM actors`;
//     return db.query(q); // db.query takes potentially 2 arguments the first being a query we want to run on our database
// };

module.exports.getSignature = (firstName, lastName, signature) => {
    const q = `INSERT INTO signatures (first, last, signature) 
    VALUES ($1, $2, $3)`;
    const params = [firstName, lastName, signature];
    // console.log(params);

    return db.query(q, params);
};

module.exports.getAllSignatures = () => {
    const q = `SELECT first, last FROM signatures`;

    return db.query(q); // db.query takes potentially 2 arguments the first being a query we want to run on our database
};

module.exports.numSignatures = () => {
    const q = `SELECT COUNT(*) FROM signatures`;
    console.log(q);
    return db.query(q);
    // db.query takes potentially 2 arguments the first being a query we want to run on our database
};

// module.exports.addActor = (actorName, actorAge) => {
//     const q = `INSERT INTO actors (name, age)
//     VALUES ($1, $2)`;
//     const params = [actorName, actorAge];
//     return db.query(q, params);
// };

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
