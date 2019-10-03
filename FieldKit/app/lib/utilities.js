export function hexStringToByteWiseString(str) {
    return str.split("").map((c,i) => {
        return (i+1) % 2 == 0 ? c + " " : c;
    }).join("");
}
