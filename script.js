// ======================================================
// AI RAILWAY TRAFFIC & LEVEL CROSSING SAFETY SYSTEM
// ======================================================

// -------------------- VARIABLES --------------------

let trainPosition = 0;          // 0 = Station A, 100 = Station B
let trainRunning = false;

let obstacleDetected = false;
let gateFailure = false;
let crossingClosedLogged = false;
let crossingClearedLogged = false;

let timer = null;

const TOTAL_DISTANCE = 10;      // Station A -> Station B = 10 km
const CROSSING_DISTANCE = 7;    // Level crossing at 7 km
const AUTO_GATE_DISTANCE = 2;   // Gate closes 2 km before crossing

const NORMAL_SPEED = 60;        // km/h
const EMERGENCY_SPEED = 0;


// -------------------- HTML ELEMENTS --------------------

const train = document.getElementById("train");

const trainStatus = document.getElementById("trainStatus");
const speed = document.getElementById("speed");
const distance = document.getElementById("distance");
const eta = document.getElementById("eta");

const signalLight = document.getElementById("signalLight");
const signalStatus = document.getElementById("signalStatus");

const gate = document.getElementById("gate");
const gateStatus = document.getElementById("gateStatus");

const crossingText = document.getElementById("crossingText");

const warningStatus = document.getElementById("warningStatus");
const emergencyStatus = document.getElementById("emergencyStatus");

const riskScore = document.getElementById("riskScore");
const riskLevel = document.getElementById("riskLevel");
const aiDecision = document.getElementById("aiDecision");
const riskBar = document.getElementById("riskBar");
const eventLog = document.getElementById("eventLog");

// LIVE TRAIN PROGRESS

const progressBar = document.getElementById("progressBar");
const progressTrain = document.getElementById("progressTrain");
const progressText = document.getElementById("progressText");
// ======================================================
// UPDATE TRAIN POSITION
// ======================================================

function updateTrainPosition() {

    const track = document.querySelector(".track");

    if (!track) return;

    const maxPosition = track.clientWidth - train.offsetWidth;

    const position = (trainPosition / 100) * maxPosition;

    train.style.left = position + "px";
}
// ======================================================
// LIVE TRAIN PROGRESS
// ======================================================

function updateProgress() {

    let progress = trainPosition;

    if (progress < 0) {
        progress = 0;
    }

    if (progress > 100) {
        progress = 100;
    }

    // Live progress bar
    progressBar.style.width = progress + "%";

    // Train icon follows actual train position
    progressTrain.style.left = progress + "%";


    // =========================================
    // LEVEL CROSSING POSITION
    // =========================================
    // Visual crossing is around % of track
    const crossingPosition = 70;


    // =========================================
    // TRAIN POSITION
    // =========================================

    if (progress >= 100) {

        progressText.textContent =
            "Station B - Arrived";

    }

    else if (progress >= crossingPosition + 3) {

        progressText.textContent =
            "Heading to Station B";

    }

    else if (
        progress >= crossingPosition - 2 &&
        progress <= crossingPosition + 3
    ) {

        progressText.textContent =
            "Crossing Level Crossing";

    }

    else if (progress >= crossingPosition - 7) {

        progressText.textContent =
            "Near Level Crossing";

    }

    else {

        progressText.textContent =
            "Approaching Level Crossing";
    }
}
// ======================================================
// CALCULATE DISTANCE TO LEVEL CROSSING
// ======================================================

function getDistanceToCrossing() {

    const currentDistance = (trainPosition / 100) * TOTAL_DISTANCE;

    return CROSSING_DISTANCE - currentDistance;
}


// ======================================================
// UPDATE SIGNAL
// ======================================================

function setSignal(color, text) {

    signalLight.style.background = color;
    signalStatus.textContent = text;
}


// ======================================================
// UPDATE GATE
// ======================================================

function setGate(isClosed) {

    if (isClosed) {

        gate.style.background = "#dc2626";
        gateStatus.textContent = "CLOSED";

    } else {

        gate.style.background = "#16a34a";
        gateStatus.textContent = "OPEN";
    }
}


// ======================================================
// AI RISK ANALYSIS
// ======================================================


function updateRisk() {

    const d = getDistanceToCrossing();

    let risk = 5;


    // ==================================================
    // 1. DISTANCE-BASED RISK
    // ==================================================

    if (d > 5) {

        risk += 5;

    } else if (d > 3) {

        risk += 10;

    } else if (d > 2) {

        risk += 20;

    } else if (d > 1) {

        risk += 30;

    } else if (d > 0) {

        risk += 40;

    } else {

        // Train is crossing / has crossed
        risk += 10;
    }


    // ==================================================
    // 2. SPEED-BASED RISK
    // ==================================================

    const currentSpeed = Number(speed.textContent) || 0;

    if (currentSpeed >= 80) {

        risk += 20;

    } else if (currentSpeed >= 60) {

        risk += 10;

    } else if (currentSpeed > 0) {

        risk += 5;
    }


    // ==================================================
    // 3. OBSTACLE DETECTION
    // ==================================================

    if (obstacleDetected) {

        risk += 50;
    }


    // ==================================================
    // 4. GATE FAILURE
    // ==================================================

    if (gateFailure) {

        risk += 35;
    }


    // ==================================================
    // 5. TRAIN VERY CLOSE TO CROSSING
    // ==================================================

    if (d <= 1 && d > 0 && trainRunning) {

        risk += 10;
    }


    // ==================================================
    // LIMIT RISK BETWEEN 0 AND 100
    // ==================================================

    risk = Math.max(0, Math.min(risk, 100));


    // ==================================================
    // DISPLAY RISK SCORE
    // ==================================================

    riskScore.textContent = risk + "%";
riskBar.style.width = risk + "%";

    // ==================================================
    // AI DECISION
    // ==================================================

    if (obstacleDetected) {

        riskLevel.textContent = "CRITICAL";

        aiDecision.textContent =
            "EMERGENCY STOP - OBSTACLE DETECTED";

    }

    else if (gateFailure) {

        riskLevel.textContent = "CRITICAL";

        aiDecision.textContent =
            "EMERGENCY STOP - GATE FAILURE";

    }

    else if (risk >= 80) {

        riskLevel.textContent = "CRITICAL";

        aiDecision.textContent =
            "EMERGENCY STOP";

    }

    else if (risk >= 60) {

        riskLevel.textContent = "HIGH";

        aiDecision.textContent =
            "PREPARE TO STOP";

    }

    else if (risk >= 35) {

        riskLevel.textContent = "MEDIUM";

        aiDecision.textContent =
            "REDUCE SPEED - CROSSING APPROACHING";

    }

    else {

        riskLevel.textContent = "LOW";

        aiDecision.textContent =
            "TRAIN CAN PROCEED";
    }
}
// ======================================================
// EMERGENCY EVENT LOG
// ======================================================

function addEvent(message) {

    const time = new Date().toLocaleTimeString();

    const event = document.createElement("p");

    event.textContent = "[" + time + "] " + message;

    eventLog.prepend(event);
}


// ======================================================
// AUTOMATIC SPEED CONTROL
// ======================================================

function updateAutomaticSpeed() {

    const d = getDistanceToCrossing();

    // Emergency condition
    if (obstacleDetected || gateFailure) {

        speed.textContent = "0";
        return;
    }

    // Very close to crossing
    if (d > 0 && d < 1) {

        speed.textContent = "20";

    }

    // 1–2 km before crossing
    else if (d >= 1 && d < 2) {

        speed.textContent = "40";

    }

    // 2–3 km before crossing
    else if (d >= 2 && d < 3) {

        speed.textContent = "50";

    }

    // More than 3 km away
    else {

        speed.textContent = "60";
    }
}

// ======================================================
// UPDATE DASHBOARD
// ======================================================

function updateDashboard() {

    const d = getDistanceToCrossing();

    // Distance
    distance.textContent = Math.max(d, 0).toFixed(1);


    // ETA
    if (trainRunning && !obstacleDetected && !gateFailure) {

        const etaValue = Math.max(d / NORMAL_SPEED * 60, 0);

        eta.textContent = etaValue.toFixed(1);

    } else {

        eta.textContent = "0";
    }


    // Warning
    if (obstacleDetected) {

        warningStatus.textContent = "⚠ OBSTACLE DETECTED";

    }

    else if (gateFailure) {

        warningStatus.textContent = "⚠ GATE FAILURE";

    }

    else if (d <= 2 && d > 0) {

        warningStatus.textContent = "CROSSING SECURED";

    }

    else {

        warningStatus.textContent = "NORMAL";
    }


    // Emergency
    if (obstacleDetected || gateFailure) {

        emergencyStatus.textContent = "🚨 EMERGENCY";

    } else {

        emergencyStatus.textContent = "NORMAL";
    }


    updateRisk();
}


// ======================================================
// AUTOMATIC LEVEL CROSSING LOGIC
// ======================================================

function automaticCrossingControl() {

    const d = getDistanceToCrossing();

    // =========================================
    // EMERGENCY CONDITION
    // =========================================

    if (obstacleDetected || gateFailure) {

        setGate(false);
        setSignal("red", "RED");

        trainRunning = false;
        speed.textContent = "0";

        if (obstacleDetected) {

            crossingText.textContent =
                "🚗 OBSTACLE ON CROSSING";

            trainStatus.textContent =
                "🚨 EMERGENCY STOP - OBSTACLE";

        } else {

            crossingText.textContent =
                "🚨 GATE FAILURE";

            trainStatus.textContent =
                "🚨 EMERGENCY STOP - GATE FAILURE";
        }

        updateDashboard();

        return;
    }


    // =========================================
    // 2 KM BEFORE CROSSING
    // =========================================

    if (d <= 2 && d > 0) {

    setGate(true);

    if (!crossingClosedLogged) {
        addEvent("🚧 LEVEL CROSSING CLOSED - Train approaching.");
        crossingClosedLogged = true;
    }

    crossingText.textContent =
        "🚧 CROSSING CLOSED";

    setSignal("green", "GREEN");

    trainStatus.textContent =
        "🚆 APPROACHING CROSSING";
}


    // =========================================
    // TRAIN AT CROSSING
    // =========================================

   if (d <= 0 && d > -1) {

    setGate(true);

    crossingText.textContent =
        "🚧 TRAIN CROSSING";

    setSignal("green", "GREEN");

    trainStatus.textContent =
        "🚆 CROSSING LEVEL CROSSING";
}


    // =========================================
    // TRAIN PASSED CROSSING
    // =========================================

    if (d <= -1) {

        setGate(false);
        if (!crossingClearedLogged) {
    addEvent("🚧 LEVEL CROSSING CLEAR - Train has safely passed.");
    crossingClearedLogged = true;
}

        crossingText.textContent =
            "🚧 CROSSING CLEAR";

        setSignal("green", "GREEN");

        trainStatus.textContent =
            "🚆 TRAIN RUNNING";
    }
}
// ======================================================
// START TRAIN
// ======================================================

function startTrain() {

    // If already running
    if (trainRunning) {
        return;
    }


    // If emergency exists
    if (obstacleDetected || gateFailure) {

        alert("⚠ Emergency condition active. Train cannot start.");

        return;
    }


    // If already at Station B
    if (trainPosition >= 100) {

        alert("Train has already reached Station B.");

        return;
    }


    trainRunning = true;

    trainStatus.textContent = "🚆 TRAIN RUNNING";
addEvent("🚆 TRAIN STARTED - Train departed from Station A.");
    setSignal("green", "GREEN");

    speed.textContent = "60";
updateAutomaticSpeed();


    // Start movement
    timer = setInterval(moveTrain, 50);
}


// ======================================================
// TRAIN MOVEMENT
// ======================================================

function moveTrain() {

    // --------------------------------------------------
    // EMERGENCY STOP
    // --------------------------------------------------

    if (obstacleDetected || gateFailure) {

        trainRunning = false;

        clearInterval(timer);

        speed.textContent = "0";

        automaticCrossingControl();
        updateAutomaticSpeed();
        return;
    }


    // --------------------------------------------------
    // NORMAL TRAIN MOVEMENT
    // --------------------------------------------------

    trainPosition += 0.5;
    updateProgress();


    // Train reaches Station B
    if (trainPosition >= 100) {

        trainPosition = 100;

        trainRunning = false;

        clearInterval(timer);

        speed.textContent = "0";

        trainStatus.textContent = "🏁 ARRIVED AT STATION B";

        setSignal("green", "GREEN");

        setGate(false);

        crossingText.textContent = "CLEAR";

        updateTrainPosition();
        updateDashboard();

        return;
    }


    // Update train visual
    updateTrainPosition();


    // Automatic crossing system
    automaticCrossingControl();

if (!obstacleDetected && !gateFailure) {

    updateAutomaticSpeed();

    trainStatus.textContent = "🚆 TRAIN RUNNING";
}


    updateDashboard();
}


// ======================================================
// SIMULATE OBSTACLE
// ======================================================

function simulateObstacle() {

    obstacleDetected = true;

addEvent("🚗 OBSTACLE DETECTED - AI initiated emergency stop.");
    // Stop train immediately
    trainRunning = false;

    clearInterval(timer);

    speed.textContent = "0";


    // Emergency system
    setGate(false);

    setSignal("red", "RED");

    crossingText.textContent = "🚗 OBSTACLE ON CROSSING";


    trainStatus.textContent = "🚨 EMERGENCY STOP - OBSTACLE";


    warningStatus.textContent = "⚠ OBSTACLE DETECTED";

    emergencyStatus.textContent = "🚨 EMERGENCY";


    updateRisk();
    updateDashboard();
}


// ======================================================
// CLEAR OBSTACLE
// ======================================================

function clearObstacle() {

    obstacleDetected = false;
addEvent("✅ OBSTACLE CLEARED - Train safety check completed.");
    clearInterval(timer);
    timer = null;

    // Restore normal condition
    setGate(false);
    setSignal("green", "GREEN");

    crossingText.textContent = "🚧 CROSSING CLEAR";

    warningStatus.textContent = "NORMAL";
    emergencyStatus.textContent = "NORMAL";

    updateDashboard();

    // Resume train
    if (!gateFailure && trainPosition < 100) {

        trainRunning = true;

        trainStatus.textContent = "🚆 TRAIN RESUMED";
addEvent("🚆 TRAIN RESUMED - Normal operation restored.");
        speed.textContent = NORMAL_SPEED;

        timer = setInterval(moveTrain, 50);
    }
}


// ======================================================
// SIMULATE GATE FAILURE
// ======================================================

function simulateGateFailure() {

    gateFailure = true;

addEvent("🚨 GATE FAILURE DETECTED - AI initiated emergency stop.");
    // Stop train
    trainRunning = false;

    clearInterval(timer);


    // Emergency
    speed.textContent = "0";

    setGate(false);

    setSignal("red", "RED");

    crossingText.textContent = "🚨 GATE FAILURE";

    trainStatus.textContent = "🚨 EMERGENCY STOP - GATE FAILURE";

    warningStatus.textContent = "⚠ GATE FAILURE";

    emergencyStatus.textContent = "🚨 EMERGENCY";


    updateRisk();
    updateDashboard();
}


// ======================================================
// RESET SYSTEM
// ======================================================

function resetSystem() {

    clearInterval(timer);

    trainRunning = false;

    obstacleDetected = false;

    gateFailure = false;
    crossingClosedLogged = false;
crossingClearedLogged = false;

    trainPosition = 0;
    updateProgress();


    // Train
    updateTrainPosition();


    // Normal state
    setGate(false);

    setSignal("red", "RED");

    crossingText.textContent = "CLEAR";


    trainStatus.textContent = "WAITING";

    speed.textContent = "0";

    distance.textContent = "7.0";

    eta.textContent = "0";

    warningStatus.textContent = "NORMAL";

    emergencyStatus.textContent = "NORMAL";


    riskScore.textContent = "10%";
    riskBar.style.width = "10%";

    riskLevel.textContent = "LOW";

    aiDecision.textContent = "TRAIN CAN PROCEED";
    eventLog.innerHTML =
        "<p>🔄 System reset. Waiting for train...</p>";
}


// ======================================================
// INITIALIZE SYSTEM
// ======================================================

window.addEventListener("load", function () {

    updateTrainPosition();
    updateProgress();

    setGate(false);

    setSignal("red", "RED");

    updateDashboard();

});


// ======================================================
// RESPONSIVE TRAIN POSITION
// ======================================================

window.addEventListener("resize", function () {

    updateTrainPosition();

});