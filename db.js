// this module holds all the queries we'll be using to talk to our database

const spicedPg = require("spiced-pg");
const { dbUsername, dbPassword } = require("./secrets");
const db = spicedPg(
    `postgres:${dbUsername}:${dbPassword}@localhost:5432/petition`
);

// spicedPg ('WhoDoWeWantToTalkTo:whichUserShouldBeRunningOurQueries:whatPasswordDoesThisUserHave
// @WhereDoesThisCommunicationHappen:specifiedPortForCommunication/nameOfOurDataBase)

module.exports.insertSig = (signature) => {
    const q = `INSERT INTO signatures (signature) 
    VALUES ($1) RETURNING id`;
    const params = [signature];
    // console.log(params);

    return db.query(q, params);
};

module.exports.getAllSignatures = () => {
    const q = `SELECT first, last FROM users`;

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

module.exports.insertRegData = (first, last, email, hashedPw) => {
    const q = `INSERT INTO users (first, last, email, password) 
    VALUES ($1, $2, $3, $4) RETURNING id`;
    const params = [first, last, email, hashedPw];
    return db.query(q, params);
};

module.exports.getLoginData = (email) => {
    const q = `SELECT * FROM users WHERE email = $1`;
    const params = [email];
    return db.query(q, params);
};
