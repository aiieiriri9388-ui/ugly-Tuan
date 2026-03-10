const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const commandCatalog = {
  "courier-open": {
    actor: "骑手端",
    title: "骑手请求开柜",
    threadState: "骑手投递线程处理中",
    action: "骑手准备投递，正在打开柜门",
    finalStatus: "柜门已打开，请放入外卖",
    deviceStatus: "投递口已打开",
    userMessage: "骑手正在投递外卖",
    targetState: "open"
  },
  "courier-close": {
    actor: "骑手端",
    title: "骑手完成投递并关柜",
    threadState: "骑手投递线程处理中",
    action: "骑手已放餐，正在关闭柜门",
    finalStatus: "投递完成，等待用户取餐",
    deviceStatus: "已完成投递",
    userMessage: "你的外卖已送达，点击即可远程开柜",
    targetState: "closed",
    afterCloseDelivery: true
  },
  "user-open": {
    actor: "用户手机端",
    title: "用户远程开柜",
    threadState: "用户取餐线程处理中",
    action: "用户通过手机端发起开柜",
    finalStatus: "柜门已打开，请及时取餐",
    deviceStatus: "等待用户取餐",
    userMessage: "柜门已打开，请尽快取走外卖",
    targetState: "open"
  },
  "user-close": {
    actor: "用户手机端",
    title: "用户取餐后关柜",
    threadState: "用户取餐线程处理中",
    action: "用户取餐完成，正在关闭柜门",
    finalStatus: "取餐完成，柜体恢复待命",
    deviceStatus: "待命",
    userMessage: "本次取餐完成，欢迎再次使用",
    targetState: "closed",
    finishCycle: true
  }
};

const state = {
  queue: [],
  processing: false,
  orderNumber: 1001,
  doorState: "closed",
  progress: 0,
  currentActor: "系统",
  currentAction: "等待操作",
  lockerStatus: "柜门已关闭，可等待骑手投递",
  threadState: "空闲",
  courierDeviceStatus: "等待投递",
  userMessage: "暂无新通知",
  logs: [
    {
      id: "boot",
      title: "系统启动完成",
      actor: "系统",
      detail: "Web Worker 已上线，正在等待新的命令。",
      time: formatTime(Date.now())
    }
  ]
};

function formatTime(time) {
  return new Date(time).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function snapshot() {
  postMessage({
    type: "snapshot",
    payload: {
      queueSize: state.queue.length,
      orderNumber: `MT-${state.orderNumber}`,
      doorState: state.doorState,
      progress: state.progress,
      currentActor: state.currentActor,
      currentAction: state.currentAction,
      lockerStatus: state.lockerStatus,
      threadState: state.threadState,
      courierDeviceStatus: state.courierDeviceStatus,
      userMessage: state.userMessage,
      logs: state.logs.slice(0, 8)
    }
  });
}

function addLog(title, actor, detail) {
  state.logs.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title,
    actor,
    detail,
    time: formatTime(Date.now())
  });
}

async function animateDoor(targetState) {
  const totalFrames = 14;
  const opening = targetState === "open";
  state.doorState = opening ? "opening" : "closing";
  snapshot();

  for (let frame = 0; frame <= totalFrames; frame += 1) {
    const ratio = frame / totalFrames;
    state.progress = opening ? ratio : 1 - ratio;
    snapshot();
    await wait(52);
  }

  state.doorState = opening ? "open" : "closed";
  state.progress = opening ? 1 : 0;
  snapshot();
}

async function processNext() {
  if (state.processing || state.queue.length === 0) {
    snapshot();
    return;
  }

  state.processing = true;
  const commandKey = state.queue.shift();
  const command = commandCatalog[commandKey];

  state.currentActor = command.actor;
  state.currentAction = command.action;
  state.threadState = command.threadState;
  addLog(command.title, command.actor, command.action);
  snapshot();

  await animateDoor(command.targetState);

  if (command.afterCloseDelivery) {
    state.courierDeviceStatus = command.deviceStatus;
  }

  if (command.finishCycle) {
    state.orderNumber += 1;
  }

  if (!command.afterCloseDelivery && command.actor === "骑手端") {
    state.courierDeviceStatus = command.deviceStatus;
  }

  state.lockerStatus = command.finalStatus;
  state.userMessage = command.userMessage;

  if (command.finishCycle) {
    state.courierDeviceStatus = "等待投递";
    addLog("订单流转结束", "系统", `订单 MT-${state.orderNumber - 1} 已完成，系统已准备下一单。`);
  }

  state.threadState = state.queue.length > 0 ? "当前命令完成，等待下一条" : "空闲";
  snapshot();

  state.processing = false;
  if (state.queue.length > 0) {
    await wait(180);
    processNext();
    return;
  }

  if (command.finishCycle) {
    state.currentActor = "系统";
    state.currentAction = "等待新一轮投递";
    state.lockerStatus = "柜门已关闭，可等待骑手投递";
    state.userMessage = "暂无新通知";
    state.threadState = "空闲";
    snapshot();
  }
}

onmessage = async (event) => {
  if (event.data?.type === "enqueue") {
    const commandKey = event.data.command;
    if (!commandCatalog[commandKey]) {
      return;
    }

    state.queue.push(commandKey);
    addLog("命令入队", commandCatalog[commandKey].actor, commandCatalog[commandKey].title);
    snapshot();
    processNext();
    return;
  }

  if (event.data?.type === "boot") {
    snapshot();
  }
};
