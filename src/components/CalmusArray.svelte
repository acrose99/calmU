<script>
    import MiniCalmus from "./MiniCalmus.svelte";
    import BigCalmus from "./BigCalmus.svelte";

    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    let left = 0;
    let mid = 1;
    let right = 2;

    let Calmuses = [
        {
            calmusType: "Cute", calmusIMG: "../images/Calmus/CalmusSpace.png"
        },
        {
            calmusType: "Bad", calmusIMG: "../images/Calmus/CalmusDefault.png"
        },
        {
            calmusType: "Ocean", calmusIMG: "../images/Calmus/CalmusOcean.png"
        },
        {
            calmusType: "City", calmusIMG: "../images/Calmus/CalmusCity.png"
        },
        {
            calmusType: "Forest", calmusIMG: "../images/Calmus/CalmusForest.png"
        },
        {
            calmusType: "White Noise", calmusIMG: "../images/Calmus/CalmusWhiteNoise.png"
        },
        {
            calmusType: "Coffee", calmusIMG: "../images/Calmus/CalmusCoffee.png"
        },
        {
            calmusType: "Office", calmusIMG: "../images/Calmus/CalmusOffice.png"
        },
        {
            calmusType: "Library", calmusIMG: "../images/Calmus/CalmusLibrary.png"
        },
        {
            calmusType: "Fire", calmusIMG: "../images/Calmus/CalmusFire.png"
        },
        {
            calmusType: "Train", calmusIMG: "../images/Calmus/CalmusTrain.png"
        },
    ]
    // let Calmuses = [
    //     {
    //         calmusType: "Space", calmusIMG: "../images/Calmus/CalmusSpace.png"
    //     },
    //     {
    //         calmusType: "Default", calmusIMG: "../images/Calmus/CalmusDefault.png"
    //     },
    //     {
    //         calmusType: "Ocean", calmusIMG: "../images/Calmus/CalmusOcean.png"
    //     },
    //     {
    //         calmusType: "City", calmusIMG: "../images/Calmus/CalmusCity.png"
    //     },
    //     {
    //         calmusType: "Forest", calmusIMG: "../images/Calmus/CalmusForest.png"
    //     },
    //     {
    //         calmusType: "White Noise", calmusIMG: "../images/Calmus/CalmusWhiteNoise.png"
    //     },
    //     {
    //         calmusType: "Coffee", calmusIMG: "../images/Calmus/CalmusCoffee.png"
    //     },
    //     {
    //         calmusType: "Office", calmusIMG: "../images/Calmus/CalmusOffice.png"
    //     },
    //     {
    //         calmusType: "Library", calmusIMG: "../images/Calmus/CalmusLibrary.png"
    //     },
    //     {
    //         calmusType: "Fire", calmusIMG: "../images/Calmus/CalmusFire.png"
    //     },
    //     {
    //         calmusType: "Train", calmusIMG: "../images/Calmus/CalmusTrain.png"
    //     },
    // ]
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

</script>

<div>
    <!--{#each {length: 1} as _, i}-->
<!--            <MiniCalmus Calmuses={Calmuses} direction="left" calmusType={Calmuses[0].calmusType} >-->

<!--            </MiniCalmus>-->
<!--            <BigCalmus on:notify Calmuses={Calmuses} calmusType={Calmuses[1].calmusType} >-->

<!--            </BigCalmus>-->
<!--            <MiniCalmus on:notify="{handleMessage}" Calmuses={Calmuses} direction="right" calmusType={Calmuses[2].calmusType} >-->

<!--            </MiniCalmus>-->
    <!--{/each}-->
        <img on:mouseenter={() => handleMousemoveLeft()} style="left: 50px" class="smallCamus" alt="logo" src={Calmuses[left].calmusIMG}>
        <img class="bigCamus" alt="logo" src={Calmuses[mid].calmusIMG}>
        <div on:mouseenter={() => handleMousemoveRight()}>
                <img  style="right: 50px" class="smallCamus" alt="logo" src={Calmuses[right].calmusIMG}>
        </div>
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
