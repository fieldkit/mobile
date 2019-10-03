export function hex_string_to_byte_wise_string(str) {
    return str.split("").map((c,i) => {
        return (i+1) % 2 == 0 ? c + " " : c;
    }).join("");
}
