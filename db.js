const spicedPg = require("spiced-pg");

let db;
if (process.env.DATABASE_URL) {
    // means we are in production on heroku
    db = spicedPg(process.env.DATABASE_URL);
} else {
    const { dbUsername, dbPassword } = require("./secrets");
    db = spicedPg(
        `postgres:${dbUsername}:${dbPassword}@localhost:5432/petition`
    );
}

module.exports.insertSig = (signature, userId) => {
    const q = `INSERT INTO signatures (signature, user_id) 
    VALUES ($1, $2) RETURNING id`;
    const params = [signature, userId];
    // console.log(params);

    return db.query(q, params);
};

module.exports.getAllSigners = () => {
    const q = `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url, signatures.signature FROM users
    JOIN user_profiles
    ON users.id = user_profiles.user_id
    JOIN signatures
    ON users.id = signatures.user_id`;

    return db.query(q); // db.query takes potentially 2 arguments the first being a query we want to run on our database
};

module.exports.getSignersByCity = (city) => {
    const q = `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url, signatures.signature FROM users
    JOIN user_profiles
    ON users.id = user_profiles.user_id
    JOIN signatures
    ON users.id = signatures.user_id
    WHERE LOWER(user_profiles.city) = LOWER($1)`;
    const params = [city];
    return db.query(q, params); // db.query takes potentially 2 arguments the first being a query we want to run on our database
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
    const q = `SELECT users.email, users.password, users.id, signatures.signature, signatures.id AS signatureid FROM users
    JOIN signatures 
    ON users.id = signatures.user_id
    WHERE email = $1`;
    const params = [email];
    return db.query(q, params);
};

module.exports.insertProfileData = (age, city, url, userId) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id) 
    VALUES ($1, $2, $3, $4) RETURNING id`;
    const params = [age, city, url, userId];
    return db.query(q, params);
};

module.exports.editProfile = (userId) => {
    const q = `SELECT users.id, users.first, users.last, users.email, user_profiles.age, user_profiles.city, user_profiles.url 
    FROM users 
    JOIN user_profiles
    ON users.id = user_profiles.user_id
    WHERE user_profiles.user_id = $1`;
    const params = [userId];
    return db.query(q, params);
};

module.exports.updateProfileWithPass = (userId, first, last, email, pass) => {
    const q = `UPDATE users
    SET first = $2, last = $3, email = $4, password = $5
    WHERE id = $1`;
    const params = [userId, first, last, email, pass];
    return db.query(q, params);
};

module.exports.updateProfileNoPass = (userId, first, last, email) => {
    const q = `UPDATE users
    SET first = $2, last = $3, email = $4
    WHERE id = $1`;
    const params = [userId, first, last, email];
    return db.query(q, params);
};

module.exports.upsertProfile = (age, city, url, userId) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    DO UPDATE SET age = $1, city = $2, url = $3`;
    const params = [age, city, url, userId];
    return db.query(q, params);
};

module.exports.deleteSignature = (userId) => {
    const q = `DELETE FROM signatures WHERE user_id = $1`;
    const params = [userId];
    return db.query(q, params);
};

// left join favours info from first table defined (first table we give to sql, 2nd table is right table)

// 3 // We want to use JOIN (users table and users profile table) like a tripple join
// have to join columns that have a link together like so:
// user_id INT REFERENCES users(id) NOT NULL UNIQUE (--unique means they can only have 1 row)
///// /dt lists all tables

// /d users displays the column setup of users table
// for login we can use JOIN to run only a query and not nested promises
