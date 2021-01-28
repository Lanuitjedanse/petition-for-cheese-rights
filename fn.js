module.exports.capitalizeLetters = (str) => {
    return str
        .toLowerCase()
        .split(" ")
        .map((word) => word[0].toUpperCase() + word.substring(1))
        .join(" ");
};
