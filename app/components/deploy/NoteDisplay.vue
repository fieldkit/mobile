<template>
    <GridLayout rows="auto,auto" columns="90*,10*" class="note-section" @tap="(ev) => $emit('open', note)">
        <Label row="0" col="0" :text="note.help.title" class="size-16 bold m-b-5" />

        <Label row="1" col="0" :text="note.body" class="size-14 m-b-10 darker" v-if="note.body && note.body.length > 0" />
        <Label row="1" col="0" :text="note.help.instructions" class="size-14 m-b-10 lighter" v-if="!note.body || note.body.length == 0" />

        <Image rowSpan="2" col="1" v-if="note.audio.length > 0" src="~/images/Icon_Mic.png" width="17" />
    </GridLayout>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
    props: {
        note: {
            type: Object,
            required: true,
        },
    },
    methods: {},
});
</script>
<style></style>
