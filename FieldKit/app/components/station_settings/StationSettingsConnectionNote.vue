<template>
    <StackLayout class="p-20" :visibility="station.connected ? 'collapsed' : 'visible'">
        <Label
            class="size-18"
            lineHeight="4"
            horizontalAlignment="left"
            text="Note: You must be connected to the station to make this change."
            textWrap="true"
        ></Label>
    </StackLayout>
</template>

<script>
export default {
    data() {
        return {};
    },
    props: ["station"],
    methods: {},
};
</script>

<style scoped lang="scss"></style>
