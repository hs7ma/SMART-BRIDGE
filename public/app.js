const wsUrl = `ws${location.protocol === "https:" ? "s" : ""}://${location.host}`;
let ws;
let reconnectTimer;

function connect() {
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    document.getElementById("connDot").classList.add("online");
    document.getElementById("connText").textContent = "متصل";
    document.getElementById("connText").style.color = "var(--green)";
  };

  ws.onclose = () => {
    document.getElementById("connDot").classList.remove("online");
    document.getElementById("connText").textContent = "غير متصل";
    document.getElementById("connText").style.color = "var(--muted)";
    reconnectTimer = setTimeout(connect, 3000);
  };

  ws.onerror = () => ws.close();

  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === "init" || data.type !== "command") {
      updateDashboard(data);
    }
  };
}

function updateDashboard(d) {
  const statusEl = document.getElementById("bridgeStatus");
  if (d.bridgeStatus === "open") {
    statusEl.textContent = "مفتوح";
    statusEl.className = "status-badge open";
  } else {
    statusEl.textContent = "مغلق";
    statusEl.className = "status-badge closed";
  }

  document.getElementById("lightValue").textContent = d.light;
  document.getElementById("lightBar").style.width = Math.min((d.light / 4095) * 100, 100) + "%";

  const vibIcon = document.getElementById("vibIcon");
  const vibText = document.getElementById("vibText");
  if (d.vibration) {
    vibIcon.classList.add("active");
    vibText.textContent = "تنبيه اهتزاز!";
    vibText.style.color = "var(--red)";
    addAlert("تنبيه: اهتزاز مكتشف!");
  } else {
    vibIcon.classList.remove("active");
    vibText.textContent = "طبيعي";
    vibText.style.color = "var(--text)";
  }

  document.getElementById("irEntryDot").classList.toggle("active", !!d.irEntry);
  document.getElementById("irExitDot").classList.toggle("active", !!d.irExit);

  const crowdedBadge = document.getElementById("crowdedBadge");
  crowdedBadge.style.display = d.crowded ? "block" : "none";
}

function setMode(mode) {
  document.querySelectorAll(".btn").forEach((b) => b.classList.remove("active"));

  let body;
  if (mode === "auto") {
    document.getElementById("btnAuto").classList.add("active");
    body = { override: false, angle: 90 };
  } else if (mode === "open") {
    document.getElementById("btnOpen").classList.add("active");
    body = { override: true, angle: 90 };
  } else {
    document.getElementById("btnClose").classList.add("active");
    body = { override: true, angle: 0 };
  }

  fetch("/api/override", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  addAlert(mode === "auto" ? "تم التحويل للوضع التلقائي" : mode === "open" ? "تم فتح الجسر يدوياً" : "تم إغلاق الجسر يدوياً");
}

function addAlert(msg) {
  const list = document.getElementById("alertsList");
  const now = new Date().toLocaleTimeString("ar-EG");
  const item = document.createElement("div");
  item.className = "alert-item";
  item.innerHTML = `<span>${msg}</span><span class="alert-time">${now}</span>`;
  list.prepend(item);
  if (list.children.length > 50) list.removeChild(list.lastChild);
}

connect();