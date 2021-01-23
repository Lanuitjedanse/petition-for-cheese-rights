const bcrypt = require("bcryptjs");
let { genSalt, hash, compare } = bcrypt;
const { promisify } = require("util");

// promisified the functions
genSalt = promisify(genSalt);
hash = promisify(hash);
compare = promisify(compare);

// let salt; how to get out of scope issues

module.exports.compare = compare;
module.exports.hash = (plainTextPw) =>
    genSalt().then((salt) => hash(plainTextPw, salt)); // does the same as the demo just refactored

//// DEMO OF HOW BCRYPT WORKS
// genSalt generates a random string of characters that we refer to as a salt!
// genSalt()
//     .then((salt) => {
//         console.log("salt: ", salt);
//         // hash expects two parameters, first a clear text PW, second a salt.
//         return hash("123456", salt);
//     })
//     .then((hashedPw) => {
//         console.log("hashed Pw with salt is: ", hashedPw); // returns properly hashed PW
//         // compare expects two parameters, first a clear text password (the one the user claims to be correct), second
//         // a hashed PW to compare to, it returns to us a boolean value of whether
//         // or not clear PW and hash are a match
//         return compare("1234567", hashedPw); // (password not matching the first one so returns the value false)
//     })
//     .then((matchValueOfCompare) => {
//         console.log("do the passwords match :", matchValueOfCompare); // compare returns to
//         // us a boolean value of whether or not clear PW and hash are a match
//     });
