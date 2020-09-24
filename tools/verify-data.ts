import flowSchema from "../app/data/flow-schema";
import flows from "../app/data/flows.json";

console.log("verifying");

flowSchema
    .validate(flows)
    .then((valid) => {
        console.log("valid", valid);
    })
    .catch((err) => {
        console.log("error", err);
        process.exit(2);
    });
