const worker = new Worker("./worker.js");

const elements = {
  workerIndicator: document.querySelector("#worker-indicator"),
  queueSize: document.querySelector("#queue-size"),
  orderNumber: document.querySelector("#order-number"),
  doorStatusChip: document.querySelector("#door-status-chip"),
  lastActor: document.querySelector("#last-actor"),
  lastAction: document.querySelector("#last-action"),
  lockerStatus: document.querySelector("#locker-status"),
  screenState: document.querySelector("#screen-state"),
  threadState: document.querySelector("#thread-state"),
  courierDeviceStatus: document.querySelector("#courier-device-status"),
  userMessage: document.querySelector("#user-message"),
  lockerShell: document.querySelector("#locker-shell"),
  logList: document.querySelector("#log-list"),
  buttons: document.querySelectorAll("[data-command]")
};

const stateTextMap = {
  closed: "柜门关闭",
  closing: "柜门关闭中",
  open: "柜门打开",
  opening: "柜门打开中"
};

function renderLogs(logs) {
  if (!logs.length) {
    elements.logList.innerHTML = '<div class="log-empty">暂无日志</div>';
    return;
  }

  elements.logList.innerHTML = logs.map((log) => `
    <article class="log-item">
      <div class="log-top">
        <strong class="log-title">${log.title}</strong>
        <span class="log-time">${log.time}</span>
      </div>
      <div class="log-meta">${log.actor}</div>
      <div>${log.detail}</div>
    </article>
  `).join("");
}

function renderSnapshot(payload) {
  elements.queueSize.textContent = payload.queueSize;
  elements.orderNumber.textContent = payload.orderNumber;
  elements.lastActor.textContent = payload.currentActor;
  elements.lastAction.textContent = payload.currentAction;
  elements.lockerStatus.textContent = payload.lockerStatus;
  elements.threadState.textContent = payload.threadState;
  elements.courierDeviceStatus.textContent = payload.courierDeviceStatus;
  elements.userMessage.textContent = payload.userMessage;
  elements.screenState.textContent = stateTextMap[payload.doorState] ?? "待机";
  elements.doorStatusChip.textContent = stateTextMap[payload.doorState] ?? "柜门关闭";
  elements.lockerShell.style.setProperty("--door-open", payload.progress);
  renderLogs(payload.logs);
}

worker.onmessage = (event) => {
  if (event.data?.type === "snapshot") {
    renderSnapshot(event.data.payload);
  }
};

worker.onerror = () => {
  elements.workerIndicator.textContent = "异常";
};

elements.buttons.forEach((button) => {
  button.addEventListener("click", () => {
    worker.postMessage({
      type: "enqueue",
      command: button.dataset.command
    });
  });
});

renderLogs([]);
worker.postMessage({ type: "boot" });
