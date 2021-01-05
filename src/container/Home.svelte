<script>
    let srcLogo = '../images/Homepage/Logo.svg'
    let srcCalmus = '../images/Calmus/CalmusOcean.png'
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';
    let typing = false;
    let typeDone = false;
    function typewriter(node, { speed = 100 }) {
        const valid = (
            node.childNodes.length === 1 &&
            node.childNodes[0].nodeType === Node.TEXT_NODE
        );

        if (!valid) {
            throw new Error(`This transition only works on elements with a single text node child`);
        }

        const text = node.textContent;
        const duration = text.length * speed;

        return {
            duration,
            tick: t => {
                const i = ~~(text.length * t);
                node.textContent = text.slice(0, i);
            }
        };
    }

    function setVisible() {
        typing = true;
    }
    function typeWriterMount() {
        typing = true;
    }

    function setTypingDone() {
        typeDone = true;
    }
    function fadeAsync() {
        typing = false;
        setTypingDone();
    }
    onMount(async () => {
        typeWriterMount();
        setInterval(fadeAsync, 6000);
    });
</script>

<div class="container">
    {#if typing}
        <img in:fade="{{delay: 800, duration: 400}}" class="logo"  alt="Logo" src={srcLogo} out:fade="{{delay: 1000, duration: 400}}">
        <h1 in:typewriter out:fade="{{delay: 800, duration: 400}}" >
            Calming Ambient Noise, for as long as you want.
        </h1>
    {/if}
    {#if typeDone}
        <img in:fade="{{delay: 1500, duration: 400}}" class="calmus"  alt="Logo" src={srcCalmus}>
        <h2 in:fade="{{delay: 1500, duration: 400}}">
            10 Ambient Backgrounds, one click away.
        </h2>
        <h1 style="color: #00f9ff; font-weight: bolder" transition:fade="{{delay: 1500, duration: 400}}">
            Mouse over Calmus to get started.
        </h1>
    {/if}
</div>

<style>
    .container {
        position: relative;
        display: flex;
        flex-direction: column;
        color: white;
        justify-content: center;
        text-align: center;
        height: 100%;
        background-color: #279DA4;
    }
    .logo {
        max-height: 690px;
        position: center;
    }
    .calmus {
        max-height: 400px;
        max-width: 400px;
        align-self: center;
    }
    h1 {
        color: white;
        font-family: "Comfortaa", sans-serif;
        font-size: 36px;
    }
</style>
