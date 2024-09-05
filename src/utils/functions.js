const getOrdinalSuffix = (n) => {
    const s = ["th", "st", "nd", "rd"],
          v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

const emojiForStatus = (status) => {
    if (status === "online") return ":green_circle:";
    if (status === "offline") return ":red_circle:";
    if (status === "dead") return ":skull:";

    return ":grey_question:"
}

module.exports = { getOrdinalSuffix, capitalizeFirstLetter, emojiForStatus }