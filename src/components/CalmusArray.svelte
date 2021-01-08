<script>
    import MiniCalmus from "./MiniCalmus.svelte";
    import BigCalmus from "./BigCalmus.svelte";
    import {fade, fly, crossfade, scale, slide} from 'svelte/transition';
    import { linear } from 'svelte/easing';

    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    let left = 0;
    let mid = 1;
    let right = 2;
    let playing = false;
    let Calmuses = [
        {
            calmusType: "Space", calmusIMG: "../images/Calmus/CalmusSpace.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusHPSpace.png"
        },
        {
            calmusType: "Random", calmusIMG: "../images/Calmus/CalmusDefault.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusHPDefault.png"
        },
        {
            calmusType: "Ocean", calmusIMG: "../images/Calmus/CalmusOcean.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusHPOcean.png"
        },
        {
            calmusType: "City", calmusIMG: "../images/Calmus/CalmusCity.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusHPCity.png"
        },
        {
            calmusType: "Forest", calmusIMG: "../images/Calmus/CalmusForest.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusHPForest.png"
        },
        {
            calmusType: "White Noise", calmusIMG: "../images/Calmus/CalmusWhiteNoise.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusHPWhite.png"
        },
        {
            calmusType: "Coffee", calmusIMG: "../images/Calmus/CalmusCoffee.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusHPCoffee.png"
        },
        {
            calmusType: "Office", calmusIMG: "../images/Calmus/CalmusOffice.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusHPOffice.png"
        },
        {
            calmusType: "Library", calmusIMG: "../images/Calmus/CalmusLibrary.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusHPLibrary.png"
        },
        {
            calmusType: "Fire", calmusIMG: "../images/Calmus/CalmusFire.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusHPFire.png"
        },
        {
            calmusType: "Train", calmusIMG: "../images/Calmus/CalmusTrain.png",
            calmusIMGHeadphones: "../images/CalmusHeadphones/CalmusHPTrain.png"
        },
    ]
    function handleMousemoveLeft() {
        if (left === 0) { //Todo
            mid = 0;
            left = 10;
            right = 1;
        }
        else if (left === 10) {
            mid = 10;
            left = 9;
            right = 0;
        }
        else if (right === 0) {
            mid = 9;
            left = 8;
            right = 10;
        }
        else {
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
    function spin(node, { duration }) {
        return {
            duration,
            css: t => {
                const eased = linear(t);

                return `
					transform: rotate(${eased * 1080}deg);`
            }
        };
    }

    function handleMousemoveRight() {
        console.log("Right:" + right);
        console.log("Left:" + left);
        if (right === 10) {
            left = 0;
            mid = 1;
            right = 2;
        }
        else {
            left++;
            mid++;
            right++;
        }
        dispatch('notify', {
            type: Calmuses[mid].calmusType
        });
    }
    function onClick() {
        playing = playing !== true;
    }

</script>

<div>
    {#if playing}
        <img on:mouseenter={() => handleMousemoveLeft()} style="left: 50px" class="smallCamus" alt="logo" src={Calmuses[left].calmusIMG}>
        <img in:spin="{{duration: 20000}}" on:click={() => onClick()} class="bigCamus" alt="logo" src={Calmuses[mid].calmusIMGHeadphones}>
        <div on:mouseenter={() => handleMousemoveRight()}>
            <img  style="right: 50px" class="smallCamus" alt="logo" src={Calmuses[right].calmusIMG}>
        </div>
    {:else}
        <img on:mouseenter={() => handleMousemoveLeft()} style="left: 50px" class="smallCamus" alt="logo" src={Calmuses[left].calmusIMG}>
        <img on:click={() => onClick()} class="bigCamus" alt="logo" src={Calmuses[mid].calmusIMG}>
        <div on:mouseenter={() => handleMousemoveRight()}>
                <img  style="right: 50px" class="smallCamus" alt="logo" src={Calmuses[right].calmusIMG}>
        </div>
    {/if}
</div>

<style>
    div {
        display: flex;
        align-self: center;
    }
    .smallCamus {
            position: relative;
            margin: 0;
            padding: 0;
            align-self: center;
            max-height: 200px;
            max-width: 200px;
    }
    .bigCamus {
            z-index: 1;
            position: sticky;
            margin: 0;
            padding: 0;
            align-self: center;
            max-height: 375px;
            max-width: 375px;
    }

</style>
