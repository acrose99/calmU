<script>
import {fade} from 'svelte/transition';
    import {createEventDispatcher} from 'svelte';
    import {spring} from 'svelte/motion';
    import {onMount} from 'svelte';

    //asset imports
    import CalmusCity from 'images/Calmus/CalmusCity.png'
    import CalmusCoffee from 'images/Calmus/CalmusCoffee.png'
    import CalmusFire from 'images/Calmus/CalmusFire.png'
    import CalmusLibrary from 'images/Calmus/CalmusLibrary.png'
    import CalmusOcean from 'images/Calmus/CalmusOcean.png'
    import CalmusOffice from 'images/Calmus/CalmusOffice.png'
    import CalmusRain from 'images/Calmus/CalmusRain.png'
    import CalmusSpace from 'images/Calmus/CalmusSpace.png'
    import CalmusTrain from 'images/Calmus/CalmusTrain.png'
    import CalmusForest from 'images/Calmus/CalmusForest.png'
    import CalmusWhiteNoise from 'images/Calmus/CalmusWhiteNoise.png'
    import CalmusCityHP from 'images/CalmusHeadphones/CalmusCity.png'
    import CalmusCoffeeHP from 'images/CalmusHeadphones/CalmusCoffee.png'
    import CalmusFireHP from 'images/CalmusHeadphones/CalmusFire.png'
    import CalmusLibraryHP from 'images/CalmusHeadphones/CalmusLibrary.png'
    import CalmusOceanHP from 'images/CalmusHeadphones/CalmusOcean.png'
    import CalmusOfficeHP from 'images/CalmusHeadphones/CalmusOffice.png'
    import CalmusRainHP from 'images/CalmusHeadphones/CalmusRain.png'
    import CalmusSpaceHP from 'images/CalmusHeadphones/CalmusSpace.png'
    import CalmusTrainHP from 'images/CalmusHeadphones/CalmusTrain.png'
    import CalmusForestHP from 'images/CalmusHeadphones/CalmusForest.png'
    import CalmusWhiteNoiseHP from 'images/CalmusHeadphones/CalmusWhiteNoise.png'

    let audioObj;

    let volume = .5;

    function handleMessage(event) {
        alert(event.detail.text);
    }

    const dispatch = createEventDispatcher();
    let left = 0;
    let mid = 1;
    let right = 2;
    let playing = false;
    let Calmuses = [
        {
            calmusType: "Space", calmusIMG: CalmusSpace,
            calmusIMGHeadphones: CalmusSpaceHP
        },
        {
            calmusType: "Ocean", calmusIMG: CalmusOcean,
            calmusIMGHeadphones: CalmusOceanHP
        },
        {
            calmusType: "Forest", calmusIMG: CalmusForest,
            calmusIMGHeadphones: CalmusForestHP
        },
        {
            calmusType: "Rain", calmusIMG: CalmusRain,
            calmusIMGHeadphones: CalmusRainHP
        },
        {
            calmusType: "City", calmusIMG: CalmusCity,
            calmusIMGHeadphones: CalmusCityHP
        },
        {
            calmusType: "White Noise", calmusIMG: CalmusWhiteNoise,
            calmusIMGHeadphones: CalmusWhiteNoiseHP
        },
        {
            calmusType: "Coffee", calmusIMG: CalmusCoffee,
            calmusIMGHeadphones: CalmusCoffeeHP
        },
        {
            calmusType: "Office", calmusIMG: CalmusOffice,
            calmusIMGHeadphones: CalmusOfficeHP
        },
        {
            calmusType: "Library", calmusIMG: CalmusLibrary,
            calmusIMGHeadphones: CalmusLibraryHP
        },
        {
            calmusType: "Fire", calmusIMG: CalmusFire,
            calmusIMGHeadphones: CalmusFireHP
        },
        {
            calmusType: "Train", calmusIMG: CalmusTrain,
            calmusIMGHeadphones: CalmusTrainHP
        },
    ]

    function handleMousemoveLeft() {
        if (typeof audioObj.src != "undefined") {
            audioObj.src = "";
        }
        playing = false;
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
        if (typeof audioObj.src != "undefined") {
            audioObj.src = "";
        }
        // setTimeout(() => audioObj.pause(), 250)
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

    function chooseAudio() {
        if (Calmuses[mid].calmusType === 'Ocean' || Calmuses[mid].calmusType === 'Train') {
            audioObj = new Audio("../audio/furtado.mp3");
        }
        else if (Calmuses[mid].calmusType === 'Rain') {
            audioObj = new Audio("../audio/furtado.mp3");
        }
        else {
            audioObj = new Audio("../audio/furtado.mp3");
        }
        new Promise(() => {
            audioObj.volume = volume;
            audioObj.oncanplay = () => {
                audioObj.play();
            };
        })
    }
    function changeVolume() {
        console.log(volume);
        audioObj.volume = volume;
    }
    async function onClickPlay() {
        playing = playing !== true;
        console.log(playing);
        await chooseAudio();
        // if (Calmuses[mid].calmusType === 'Ocean') {
            // audioObj.src = '../audio/train.mp3';
    }
function onClickPause() {
    playing = false;
    audioObj.pause();
}
onMount(async () => {
        audioObj = new Audio("../audio/furtado.mp3");
});

</script>

<div>
    <img in:fade="{{delay: 4000, duration: 500}}" on:mouseenter={() => setTimeout(handleMousemoveLeft, 150)} style="left: 50px" class="smallCamus" alt="logo" src={Calmuses[left].calmusIMG}>
    {#if playing}
        <img on:click={() => onClickPause()}  id="bigCamusSpin" alt="logo" src={Calmuses[mid].calmusIMGHeadphones}>
    {:else}
        <img  on:mouseenter={() => setTimeout(handleMousemoveCenter, 150)}   on:click={() => onClickPlay()}  id="bigCamus" alt="logo" src={Calmuses[mid].calmusIMG}>
    {/if}
    <div in:fade="{{delay: 4000, duration: 500}}" on:mouseenter={() => setTimeout(handleMousemoveRight, 150)}>
        <img style="right: 50px" class="smallCamus" alt="logo" src={Calmuses[right].calmusIMG}>
<!--        src={Calmuses[right].calmusIMG}-->
    </div>
</div>

<label in:fade="{{delay: 4000, duration: 500}}">
    <h3>Volume ({volume})</h3>
    <input on:input={changeVolume} bind:value={volume} type="range" min="0" max="1" step="0.01">
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
