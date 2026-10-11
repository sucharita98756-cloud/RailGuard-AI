function startTrain() {

    const train = document.getElementById("train");
    const signalLight = document.getElementById("signalLight");

    document.getElementById("trainStatus").innerText =
        "Running";

    document.getElementById("signalStatus").innerText =
        "GREEN";

    signalLight.style.background = "green";

    train.style.transition = "left 5s linear";
    train.style.left = "200px";

    setTimeout(function () {

        document.getElementById("trainStatus").innerText =
            "Passed Signal";

        document.getElementById("signalStatus").innerText =
            "RED";

        signalLight.style.background = "red";

    }, 5000);
}