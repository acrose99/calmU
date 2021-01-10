<script>
    import { spring } from 'svelte/motion';

    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    let coords = spring({ x: 50, y: 50 }, {
        stiffness: 0.5,
        damping: 0.8
    });

    let volume = coords.stiffness;

    function changeVolume() {
        dispatch('message', {
            text: coords.stiffness
        });
    }

</script>

<style>

</style>

<div style="position: absolute; right: 1em;">
    <label>
        <h3>Volume ({coords.stiffness})</h3>
        <input on:change={changeVolume()} bind:value={coords.stiffness} type="range" min="0" max="1" step="0.01">
    </label>
</div>
