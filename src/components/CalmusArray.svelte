<script>
    import {fade, fly, crossfade, scale, slide} from 'svelte/transition';
    import {linear} from 'svelte/easing';
    import {tick} from 'svelte';
    import { spring } from 'svelte/motion';

    let coords = spring({ x: 50, y: 50 }, {
        stiffness: 0.5,
        damping: 0.8
    });
    let audioObj = new Audio("../audio/train1.mp3");

    function handleMessage(event) {
        alert(event.detail.text);
    }

    import {createEventDispatcher} from 'svelte';

    const dispatch = createEventDispatcher();
    let left = 0;
    let mid = 1;
    let right = 2;
    let playing = false;
    let Calmuses = [
        {
            calmusType: "Space", calmusIMG: "../images/Calmus/CalmusSpace.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusSpace.png"
        },
        {
            calmusType: "Ocean", calmusIMG: "../images/Calmus/CalmusOcean.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusOcean.png"
        },
        {
            calmusType: "Forest", calmusIMG: "../images/Calmus/CalmusForest.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusForest.png"
        },
        {
            calmusType: "Fan", calmusIMG: "../images/Calmus/CalmusDefault.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusDefault.png"
        },
        {
            calmusType: "City", calmusIMG: "../images/Calmus/CalmusCity.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusCity.png"
        },
        {
            calmusType: "White Noise", calmusIMG: "../images/Calmus/CalmusWhiteNoise.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusWhiteNoise.png"
        },
        {
            calmusType: "Coffee", calmusIMG: "../images/Calmus/CalmusCoffee.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusCoffee.png"
        },
        {
            calmusType: "Office", calmusIMG: "../images/Calmus/CalmusOffice.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusOffice.png"
        },
        {
            calmusType: "Library", calmusIMG: "../images/Calmus/CalmusLibrary.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusLibrary.png"
        },
        {
            calmusType: "Fire", calmusIMG: "../images/Calmus/CalmusFire.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusFire.png"
        },
        {
            calmusType: "Train", calmusIMG: "../images/Calmus/CalmusTrain.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusTrain.png"
        },
    ]

    function handleMousemoveLeft() {
        setTimeout(() => audioObj.pause(), 250)
        if (left === 0) { //Todo
            mid = 0;
            left = 10;
            right = 1;
        } else if (left === 10) {
            mid = 10;
            left = 9;
            right = 0;
        } else if (right === 0) {
            mid = 9;
            left = 8;
            right = 10;
        } else {
            left--;
            mid--;
            right--;
        }
        console.log("Right:" + right);
        console.log("Left:" + left);

        dispatch('notify', {
            type: Calmuses[mid].calmusType
        });
    }

    function handleMousemoveCenter() {
        // console.log("Help");
        dispatch('notify', {
            type: Calmuses[mid].calmusType
        });
    }

    function handleMousemoveRight() {
        setTimeout(() => audioObj.pause(), 250)
        playing = false;
        console.log("Right:" + right);
        console.log("Middle:" + mid);
        console.log("Left:" + left);
        if (right === 10) {
            left = 8;
            mid = 10;
            right = 0;
        } else if (mid === 10) {
            left = 10;
            mid = 0;
            right = 1;
        } else if (left === 10) {
            left = 0;
            mid = 1;
            right = 2;
        } else {
            left++;
            mid++;
            right++;
        }
        dispatch('notify', {
            type: Calmuses[mid].calmusType
        });
    }

    function onClick() {
        audioObj.volume = coords.stiffness;
        if (audioObj.paused === false) {
            setTimeout(() => audioObj.pause(), 250)
        } else if (audioObj.played === false) {
            setTimeout(() => audioObj.play(), 250)
        } else {
            audioObj.play();
        }
        playing = playing !== true;
    }

</script>

<div>
    <img in:fade="{{delay: 4000, duration: 500}}" on:mouseenter={() => setTimeout(handleMousemoveLeft, 150)} style="left: 50px" class="smallCamus" alt="logo" src={Calmuses[left].calmusIMG}>
    {#if playing}
        <img on:click={() => onClick()} id="bigCamusSpin" alt="logo" src={Calmuses[mid].calmusIMGHeadphones}>
    {:else}
        <img  on:mouseenter={() => setTimeout(handleMousemoveCenter, 150)}  on:click={() => onClick()} id="bigCamus" alt="logo" src={Calmuses[mid].calmusIMG}>
    {/if}
    <div in:fade="{{delay: 4000, duration: 500}}" on:mouseenter={() => setTimeout(handleMousemoveRight, 150)}>
        <img  style="right: 50px" class="smallCamus" alt="logo" src={Calmuses[right].calmusIMG}>
    </div>
</div>

<label>
    <h3>Volume ({coords.stiffness})</h3>
    <input bind:value={coords.stiffness} type="range" min="0" max="1" step="0.01">
</label>


<style>
    div {
        display: flex;
        align-self: center;
    }
    h1, h2, h3 {
        font-family: "Comfortaa", sans-serif;
    }
    .smallCamus {
            position: relative;
            margin: 0;
            padding: 0;
            align-self: center;
            max-height: 200px;
            max-width: 200px;
    }
    #bigCamus {
            z-index: 1;
            position: sticky;
            margin: 0;
            padding: 0;
            align-self: center;
            max-height: 375px;
            max-width: 375px;
    }
    #bigCamusSpin {
        z-index: 1;
        position: sticky;
        margin: 0;
        padding: 0;
        align-self: center;
        max-height: 375px;
        max-width: 375px;
        -webkit-animation-name: spin;
        -webkit-animation-duration: 10000ms;
        -webkit-animation-iteration-count: infinite;
        -webkit-animation-timing-function: linear;
        -moz-animation-name: spin;
        -moz-animation-duration: 10000ms;
        -moz-animation-iteration-count: infinite;
        -moz-animation-timing-function: linear;
        -ms-animation-name: spin;
        -ms-animation-duration: 10000ms;
        -ms-animation-iteration-count: infinite;
        -ms-animation-timing-function: linear;

        animation-name: spin;
        animation-duration: 10000ms;
        animation-iteration-count: infinite;
        animation-timing-function: linear;
    }
    @-ms-keyframes spin {
        from {
            -ms-transform: rotate(0deg);
        }

        to {
            -ms-transform: rotate(360deg);
        }
    }

    @-moz-keyframes spin {
        from {
            -moz-transform: rotate(0deg);
        }

        to {
            -moz-transform: rotate(360deg);
        }
    }

    @-webkit-keyframes spin {
        from {
            -webkit-transform: rotate(0deg);
        }

        to {
            -webkit-transform: rotate(360deg);
        }
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }

        to {
            transform: rotate(360deg);
        }
    }

</style>
