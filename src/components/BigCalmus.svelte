<script>
    import CalmusArray from './CalmusArray.svelte';

    export let noise = 'default';
    export let calmusType = 'default';
    // function handleMousemove(event) {
    //     console.log(event.detail.text);
    // }
    function handleMessage(event) {
        alert(event.detail.text);
    }
    let calmusIMG;
    if (calmusType === 'default' || calmusType === 'Default') {
        calmusIMG = "../images/Calmus/CalmusDefault.png"
    }
    else if (calmusType === 'Ocean' || calmusType === 'ocean') {
        calmusIMG = "../images/Calmus/CalmusOcean.png"
    }
    else if (calmusType === 'Space'|| calmusType === 'space') {
        calmusIMG = "../images/Calmus/CalmusSpace.png"
    }
    else if (calmusType === "City" || calmusType === "city") {
        calmusIMG = "../images/Calmus/CalmusCity.png"
    }
    else if (calmusType === "Forest" || calmusType === "forest") {
        calmusIMG = "../images/Calmus/CalmusForest.png"
    }
    else if (calmusType === "White Noise" || calmusType === "White noise" || calmusType === "white noise") {
        calmusIMG = "../images/Calmus/CalmusWhiteNouse.png"
    }
    else if (calmusType === "Coffee" || calmusType === "coffee") {
        calmusIMG = "../images/Calmus/CalmusCoffee.png"
    }
    else if (calmusType === "Office" || calmusType === "office") {
        calmusIMG = "../images/Calmus/CalmusOffice.png"
    }
    else if (calmusType === "Library" || calmusType === "library") {
        calmusIMG = "../images/Calmus/CalmusLibrary.png"
    }
    else if (calmusType === "Fire" || calmusType === "fire") {
        calmusIMG = "../images/Calmus/CalmusFire.png"
    }
    else if (calmusType === "Train" || calmusType === "train") {
        calmusIMG = "../images/Calmus/CalmusFire.png"
    }

    function recalculateImg(type) {
        if (type === 'default' || type === 'Default') {
            calmusIMG = "../images/Calmus/CalmusDefault.png"
        }
        else if (type === 'Ocean' || type === 'ocean') {
            calmusIMG = "../images/Calmus/CalmusOcean.png"
        }
        else if (type === 'Space'|| type === 'space') {
            calmusIMG = "../images/Calmus/CalmusSpace.png"
        }
        else if (type === "City" || type === "city") {
            calmusIMG = "../images/Calmus/CalmusCity.png"
        }
        else if (type === "Forest" || type === "forest") {
            calmusIMG = "../images/Calmus/CalmusForest.png"
        }
        else if (type === "White Noise" || type === "White noise" || calmusType === "white noise") {
            calmusIMG = "../images/Calmus/CalmusWhiteNoise.png"
        }
        else if (type === "Coffee" || type === "coffee") {
            calmusIMG = "../images/Calmus/CalmusCoffee.png"
        }
        else if (type === "Office" || type === "office") {
            calmusIMG = "../images/Calmus/CalmusOffice.png"
        }
        else if (type === "Library" || type === "library") {
            calmusIMG = "../images/Calmus/CalmusLibrary.png"
        }
        else if (type === "Fire" || type === "fire") {
            calmusIMG = "../images/Calmus/CalmusFire.png"
        }
        else if (type === "Train" || type === "train") {
            calmusIMG = "../images/Calmus/CalmusFire.png"
        }
    }



</script>

    <img on:notify alt="logo" src={calmusIMG}>

<style>
    img {
        z-index: 1;
        position: sticky;
        margin: 0;
        padding: 0;
        align-self: center;
        max-height: 375px;
        max-width: 375px;
    }
</style>
