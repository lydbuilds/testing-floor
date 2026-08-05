"use strict";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const toast = $("#toast");
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function formatList(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function resultMarkup(label, title, body, script = "") {
  return `
    <p class="result-label">${label}</p>
    <h3>${title}</h3>
    <p>${body}</p>
    ${script ? `<p class="result-script">${script}</p>` : ""}
  `;
}

// Site dropdown navigation
const menuButton = $(".menu-button");
const navigation = $("#site-menu");

function closeSiteMenu({ returnFocus = false } = {}) {
  if (!menuButton || !navigation) return;
  navigation.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
  if (returnFocus) menuButton.focus();
}

if (menuButton && navigation) {
  menuButton.addEventListener("click", event => {
    event.stopPropagation();
    const isOpen = !navigation.classList.contains("open");
    if (isOpen) {
      navigation.classList.add("open");
      menuButton.setAttribute("aria-expanded", "true");
      document.body.classList.add("menu-open");
    } else {
      closeSiteMenu();
    }
  });

  navigation.addEventListener("click", event => event.stopPropagation());
  $$('a', navigation).forEach(link => link.addEventListener("click", () => closeSiteMenu()));
  document.addEventListener("click", () => closeSiteMenu());
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && navigation.classList.contains("open")) {
      closeSiteMenu({ returnFocus: true });
    }
  });
}

// Orientation flip cards
$$('.flip-card').forEach(card => {
  card.addEventListener('click', () => {
    const isFlipped = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', String(isFlipped));
    const front = $('.flip-card-front', card);
    const back = $('.flip-card-back', card);
    if (front) front.setAttribute('aria-hidden', String(isFlipped));
    if (back) back.setAttribute('aria-hidden', String(!isFlipped));
    const title = $('.flip-card-title', isFlipped ? back : front)?.textContent.trim() || 'Definition card';
    card.setAttribute('aria-label', `${title}. Select to ${isFlipped ? 'return to the front' : 'reveal definition'}.`);
  });
});

// Decision Readiness Index
const driData = {
  1: {
    status: "Steady",
    action: "Proceed.",
    grounding: "Identify the decision, confirm the objective, and continue at your current pace.",
    script: "I’m ready to proceed."
  },
  2: {
    status: "Alert",
    action: "Proceed with awareness.",
    grounding: "Take one slow breath and identify what deserves your attention before responding.",
    script: "I can proceed, and I’m going to verify the details first."
  },
  3: {
    status: "Strained",
    action: "Slow down and clarify.",
    grounding: "Use the Innie Wellness Request Form or ask for missing information, scope, priority, or decision criteria.",
    script: "Before I decide, I need the scope, priority, and decision criteria."
  },
  4: {
    status: "Overloaded",
    action: "Pause before deciding.",
    grounding: "Step away for two to five minutes, complete an Innie Systems Reporting Check, and reduce inputs before returning.",
    script: "I need a short pause before I can give a responsible answer."
  },
  5: {
    status: "System Offline",
    action: "Do not make a final decision yet.",
    grounding: "Communicate that you need time, move the decision if possible, and identify the support required before re-engaging.",
    script: "I’m not in a position to make a sound final decision right now. I need to return to this after reviewing the facts."
  }
};

const driButtons = $$(".level-button");
const driResult = $("#dri-result");
driButtons.forEach(button => {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => {
    driButtons.forEach(item => item.setAttribute("aria-pressed", "false"));
    button.setAttribute("aria-pressed", "true");
    const level = Number(button.dataset.level);
    const item = driData[level];
    driResult.innerHTML = resultMarkup(
      `Decision Readiness Level ${level}`,
      item.status,
      `<strong>${item.action}</strong> ${item.grounding}<br><br><strong>Next question:</strong> What would help my Innie move down one level?`,
      item.script
    );
  });
});

// Systems Reporting
const systemsGenerate = $("#systems-generate");
if (systemsGenerate) {
  systemsGenerate.addEventListener("click", () => {
    const panel = systemsGenerate.closest("[data-app='systems']");
    const signals = $$(".systems-grid input:checked", panel).map(input => input.value);
    const actions = $$(".next-actions input:checked", panel).map(input => input.value);
    const result = $("#systems-result");

    if (!signals.length) {
      result.innerHTML = resultMarkup("System Notice", "No signals selected", "Select at least one body, attention, or behavior report. Neutral and steady signals are valid reports.");
      return;
    }

    const actionText = actions.length
      ? `Approved next action${actions.length > 1 ? "s" : ""}: ${formatList(actions)}.`
      : "No next action has been selected. Consider slowing down, taking a brief pause, or requesting clarification.";

    result.innerHTML = resultMarkup(
      "System Report Received",
      "Innie signals detected",
      `<strong>Reported signals:</strong> ${formatList(signals)}.<br><br>${actionText}`,
      actions.length ? `My system is reporting ${formatList(signals)}. I will ${formatList(actions)} before proceeding.` : "The system report is sufficient. A feeling word is not required."
    );
  });
}

// Wellness Request
const requestsGenerate = $("#requests-generate");
if (requestsGenerate) {
  requestsGenerate.addEventListener("click", () => {
    const selections = $$("#request-options input:checked").map(input => input.value);
    const result = $("#requests-result");
    if (!selections.length) {
      result.innerHTML = resultMarkup("Request Incomplete", "No support selected", "Select one or more supports that would make the situation clearer, safer, or more workable.");
      return;
    }
    const request = formatList(selections);
    result.innerHTML = resultMarkup(
      "Wellness Request Approved",
      "Support requirements identified",
      `Your Innie requested ${request}.`,
      `Before I make this decision, I need ${request}.`
    );
  });
}

// Communication Protocol
const responseTypeInputs = $$('input[name="response-type"]');
const alternativeField = $("#alternative-field");
responseTypeInputs.forEach(input => input.addEventListener("change", () => {
  const type = $('input[name="response-type"]:checked')?.value;
  alternativeField.hidden = type !== "alternative";
}));

const communicationGenerate = $("#communication-generate");
if (communicationGenerate) {
  communicationGenerate.addEventListener("click", () => {
    const task = $("#comm-task").value.trim();
    const need = $("#comm-need").value.trim();
    const alternative = $("#comm-alternative").value.trim();
    const innie = $("#comm-innie").value.trim();
    const type = $('input[name="response-type"]:checked')?.value || "conditional";
    const result = $("#communication-result");

    if (!task || !need) {
      result.innerHTML = resultMarkup("Protocol Incomplete", "Additional information required", "Enter the task you were asked to do and the condition or support you need.");
      return;
    }

    let finalDraft;
    if (type === "alternative") {
      if (!alternative) {
        result.innerHTML = resultMarkup("Protocol Incomplete", "Alternative required", "Enter the smaller, later, or different action you can responsibly offer.");
        return;
      }
      finalDraft = `I cannot ${task} as currently requested, but I can ${alternative}. To proceed, I need ${need}.`;
    } else {
      finalDraft = `I can ${task}, but I need ${need}.`;
    }

    result.innerHTML = resultMarkup(
      "Outie Final Draft Generated",
      "Response authorized for review",
      innie ? `<strong>Innie signal received:</strong> “${innie}”<br><br>The signal has been translated into a professional response.` : "The internal signal has been translated into a professional response.",
      finalDraft
    );
  });
}

// Action Forecast
const forecastGenerate = $("#forecast-generate");
const protocolMap = {
  "over-explain": "Testing Floor Communication Protocol",
  "shut down": "Innie Systems Reporting Check",
  "say yes too fast": "Testing Floor Communication Protocol",
  "argue": "Decision Readiness Index",
  "people-please": "Innie Wellness Request Form",
  "avoid": "Innie Wellness Request Form",
  "rush": "Decision Readiness Index",
  "control": "Innie Systems Reporting Check",
  "send a spicy email": "Testing Floor Communication Protocol",
  "agree without understanding": "Testing Floor Communication Protocol",
  "keep working past capacity": "Innie Wellness Request Form"
};

if (forecastGenerate) {
  forecastGenerate.addEventListener("click", () => {
    const actions = $$("#forecast-options input:checked").map(input => input.value);
    const impact = $('input[name="forecast-impact"]:checked')?.value;
    const result = $("#forecast-result");

    if (!actions.length || !impact) {
      result.innerHTML = resultMarkup("Forecast Incomplete", "Additional inputs required", "Select at least one predicted action and its likely impact.");
      return;
    }

    if (impact === "help") {
      result.innerHTML = resultMarkup(
        "Forecast Received",
        "Proceed intentionally",
        `Your Innie is preparing to ${formatList(actions)}. You assessed this as likely to help. Confirm that the action protects the work, the relationship, and your capacity before proceeding.`,
        "I have reviewed the likely impact and will proceed intentionally."
      );
      return;
    }

    const recommendations = [...new Set(actions.map(action => protocolMap[action]).filter(Boolean))];
    const recommendation = recommendations.length ? formatList(recommendations) : "Decision Readiness Index";
    const impactText = impact === "hurt" ? "likely to cause harm" : "unclear in its likely impact";
    result.innerHTML = resultMarkup(
      "Forecast Received",
      "Pause before output",
      `Your Innie is preparing to ${formatList(actions)}. You assessed the behavior as ${impactText}. Pause and select another protocol before responding.<br><br><strong>Recommended protocol${recommendations.length > 1 ? "s" : ""}:</strong> ${recommendation}.`,
      "My first impulse is information. It is not yet an instruction."
    );
  });
}

// Resets
const resetHandlers = {
  dri() {
    driButtons.forEach(item => item.setAttribute("aria-pressed", "false"));
    driResult.innerHTML = '<p class="result-placeholder">Select a level to receive an approved grounding action.</p>';
  },
  systems() {
    $$("[data-app='systems'] input").forEach(input => { input.checked = false; });
    $("#systems-result").innerHTML = '<p class="result-placeholder">You do not need to know the emotion. The system report is sufficient.</p>';
  },
  requests() {
    $$("#request-options input").forEach(input => { input.checked = false; });
    $("#requests-result").innerHTML = '<p class="result-placeholder">Your Innie may request multiple supports. Excessive specificity will not be penalized.</p>';
  },
  communication() {
    $("#comm-task").value = "";
    $("#comm-innie").value = "";
    $("#comm-need").value = "";
    $("#comm-alternative").value = "";
    $('input[name="response-type"][value="conditional"]').checked = true;
    alternativeField.hidden = true;
    $("#communication-result").innerHTML = '<p class="result-placeholder">Your first reaction has been received. It is not yet authorized for external distribution.</p>';
  },
  forecast() {
    $$("#forecast-options input, input[name='forecast-impact']").forEach(input => { input.checked = false; });
    $("#forecast-result").innerHTML = '<p class="result-placeholder">Your projected behavior has not yet been authorized.</p>';
  }
};

$$(".reset-button").forEach(button => button.addEventListener("click", () => {
  const key = button.dataset.reset;
  if (resetHandlers[key]) {
    resetHandlers[key]();
    showToast("Protocol reset. No responses were retained.");
  }
}));

// Copy result text with a fallback for older browsers
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

$$(".copy-button").forEach(button => button.addEventListener("click", async () => {
  const target = document.getElementById(button.dataset.copyTarget);
  const text = target?.innerText.trim();
  if (!text || target.querySelector(".result-placeholder")) {
    showToast("Complete the protocol before copying the result.");
    return;
  }
  try {
    await copyText(text);
    showToast("Result copied. Please enjoy the approved language responsibly.");
  } catch (error) {
    console.error(error);
    showToast("Copy failed. Select the result text manually.");
  }
}));

$$(".print-button").forEach(button => button.addEventListener("click", () => window.print()));
