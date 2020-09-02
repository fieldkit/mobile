/**
 * NativeScript requires this to wire up the JS context in this thread.
 */
require("globals");

const context: Worker = self as any;

context.onmessage = (message) => {
    console.log(`worker:received: ${JSON.stringify(message)}`);
    context.postMessage({ message: "world" });
};

context.onerror = (e) => {
    console.log(`worker:error ${e}`);
    return true;
};

console.log("worker:started");
