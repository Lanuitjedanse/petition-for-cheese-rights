// this module holds all the queries we'll be using to talk to our database

const spicedPg = require("spiced-pg");
const { dbUsername, dbPassword } = require("./secrets");
const db = spicedPg(
    `postgres:${dbUsername}:${dbPassword}@localhost:5432/petition`
);

// spicedPg ('WhoDoWeWantToTalkTo:whichUserShouldBeRunningOurQueries:whatPasswordDoesThisUserHave
// @WhereDoesThisCommunicationHappen:specifiedPortForCommunication/nameOfOurDataBase)

module.exports.getSignature = (firstName, lastName, signature) => {
    const q = `INSERT INTO signatures (first, last, signature) 
    VALUES ($1, $2, $3) RETURNING id`;
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

module.exports.pullSig = (signature) => {
    const q = `SELECT signature FROM signatures WHERE id = $1`;
    const params = [signature];
    return db.query(q, params);
};
