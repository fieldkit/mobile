export default {
    data() {
        return {};
    },
    props: {
        child: {
            required: true,
        },
    },
    errorCaptured(err, vm, info) {
        console.log(`error captured: ${err.toString()} info: ${info}`);
        return false;
    },
    render(h) {
        return h(this.child);
    },
};
