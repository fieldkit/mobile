<template>
<Page @loaded="onLoaded" @unloaded="onUnloaded" >
	<GridLayout rows="auto, *" class="container">
		<StackLayout verticalAlign="center" class="bar-container" v-if="!done">
			<Label text="Upgrading station firmware. Thank you for your patience." textWrap="true" />
			<Progress :value="progress" scaleY="4" />
		</Stacklayout>

		<StackLayout verticalAlign="center" class="bar-container" v-if="done">
			<Label text="Upgrade done, your station is now restarting." textWrap="true" />
			<Button @tap="close">OK</Button>
		</Stacklayout>
	</GridLayout>
</Page>
</template>
<script>
import { serializePromiseChain, promiseAfter } from "../utilities";
import Services from "../services/services";

export default {
	data() {
		return {
			progress: 0,
			done: false,
		};
	},
	props: {
		station: {
			required: true,
			type: Object
		}
	},
	methods: {
		onLoaded() {
			const updateProgress = (progress) => {
				this.progress = progress.progress;
			};

			return Services.StationFirmware().upgradeStation(this.station.url, updateProgress).then(() => {
				this.done = true;
			}).catch(err => {
				this.done = true;
				console.log("error", err, err.stack);
			});
		},
		onUnloaded() {
			console.log('onUnloaded');
		},
		close() {
			console.log("Close");
			this.$modal.close(true);
		}
	}
}
</script>
<style scoped lang="scss">
@import "../app-variables";

.container {
	height: 20%;
}

.bar-container {
	margin: 20;
}
</style>
