<script>
    import CalmusArray from "../components/CalmusArray.svelte";
    import {fade, fly, crossfade, scale, slide} from 'svelte/transition';
    import {onMount} from 'svelte';

    let srcLogo = '../images/Homepage/Logo.svg'
    let srcCalmus = '../images/Calmus/CalmusOcean.png'

    let type = "None";
    let typing = false;
    let visible = false;
    let typeDone = true;
    let mousedOver = false;

    function typewriter(node, {speed = 100}) {
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

    function changeBackground(type) {
        console.log("Parsed type:" + type);
        //toggles everything off first to avoid bugs, wish Svelte handled alot of this stuff better, oh well.
        if (window.document.body.classList.contains('blue-mode')) {
            window.document.body.classList.toggle('blue-mode');
        }
        if (window.document.body.classList.contains('city-mode')) {
            window.document.body.classList.toggle('city-mode');
        }
        if (window.document.body.classList.contains('fire-mode')) {
            window.document.body.classList.toggle('fire-mode');
        }

        if (window.document.body.classList.contains('forest-mode')) {
            window.document.body.classList.toggle('forest-mode');
        }
        if (window.document.body.classList.contains('coffee-mode')) {
            window.document.body.classList.toggle('coffee-mode');
        }
        if (window.document.body.classList.contains('whiteNoise-mode')) {
            window.document.body.classList.toggle('whiteNoise-mode');
        }

        if (type === "None" || "Default" || "Space" || "Ocean" || "Office" || "Library" || "Train") {
            window.document.body.classList.toggle('blue-mode');
        }
        if (type === "City") {
            window.document.body.classList.toggle('city-mode');
        }
        if (type === "Forest") {
            window.document.body.classList.toggle('forest-mode');
        }
        if (type === "Fire") {
            window.document.body.classList.toggle('fire-mode');
        }
        if (type === "Coffee") {
            window.document.body.classList.toggle('coffee-mode');
        }
        if (type === "White Noise") {
            window.document.body.classList.toggle('whiteNoise-mode');
        }
    }

    function handleMessage(event) {
        type = event.detail.type;
        console.log("Type: " + type);
        changeBackground(type)
        mousedOver = true;
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
        changeBackground(type);
        typeWriterMount();
        setInterval(fadeAsync, 6000);
    });
</script>

<div id="container">
    <!--{#if typing}-->
    <!--    <img in:fade="{{delay: 200, duration: 400}}" class="logo" alt="Logo" src={srcLogo}-->
    <!--         out:fade="{{delay: 1000, duration: 400}}">-->
    <!--    <h1 in:typewriter out:fade="{{delay: 1000, duration: 400}}">-->
    <!--        Calming Ambient Noise, for as long as you want.-->
    <!--    </h1>-->
    <!--{/if}-->

    {#if typeDone}
        <CalmusArray on:notify={handleMessage}/>
        <h1>Ambience Selected: {type}</h1>
        {#if !mousedOver}
            <h2 in:fade="{{delay: 1500, duration: 400}}" out:fly="{{x: 300, duration: 3000}}" >
                10 Ambient Backgrounds, one click away.
            </h2>
            <h2 style="font-weight: bolder" out:fly="{{x: 300, duration: 3000}}">
                Mouse over Calmus to get started.
            </h2>
            <h2 style="font-weight: bolder" out:fly="{{x: 300, duration: 3000}}">
                Click to play and pause, scroll to change ambience.
            </h2>
        {/if}
    {/if}
</div>

<style>
    #container {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
        height: 100%;
    }

    h1 {
        font-family: "Comfortaa", sans-serif;
        font-size: 36px;
    }

    h2 {
        font-family: "Comfortaa", sans-serif;
    }

    :global(body.blue-mode) {
        background: linear-gradient(180deg, #39B8BF 0%, #006A71 100%);
        color: white;
    }

    :global(body.fire-mode) {
        background: linear-gradient(180deg, rgba(255, 135, 65, 0.71) 0%, rgba(155, 0, 0, 0.67) 100%);
        color: #2d1a06;
    }

    :global(body.city-mode) {
        background: linear-gradient(180deg, #757575 0%, rgba(0, 110, 117, 0.73) 100%);
        color: white;
    }

    :global(body.forest-mode) {
        background: linear-gradient(180deg, #45E176 0%, #04875F 92.71%);
        color: #45E176;
    }

    :global(body.coffee-mode) {
        background: linear-gradient(180deg, #E4B267 0%, #6B4308 100%);
        color: burlywood;
    }
    :global(body.whiteNoise-mode) {
        background: linear-gradient(180deg, #FCFCFC 0%, #000000 100%);
        color: white;
    }
</style>
