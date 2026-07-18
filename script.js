const weddingDate = new Date("2026-09-19T11:00:00+07:00").getTime();

const swiper = new Swiper(".wedding-swiper", {
  direction: "vertical",
  speed: 850,
  parallax: true,
  grabCursor: true,
  keyboard: {
    enabled: true,
  },
  mousewheel: {
    forceToAxis: true,
    releaseOnEdges: true,
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  navigation: {
    nextEl: ".nav-button.next",
    prevEl: ".nav-button.prev",
  },
});

document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", () => swiper.slideNext());
});

const parts = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds"),
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  const distance = Math.max(0, weddingDate - Date.now());
  const seconds = Math.floor(distance / 1000);

  parts.days.textContent = pad(Math.floor(seconds / 86400));
  parts.hours.textContent = pad(Math.floor((seconds % 86400) / 3600));
  parts.minutes.textContent = pad(Math.floor((seconds % 3600) / 60));
  parts.seconds.textContent = pad(seconds % 60);
}

updateCountdown();
setInterval(updateCountdown, 1000);

const rsvpForm = document.querySelector("#rsvpForm");
const partnerInput = rsvpForm?.querySelector('[name="partner_name"]');
const partnerField = partnerInput?.closest("label");

function getGuestCount(attendance) {
  if (attendance === "Я буду один") {
    return "1";
  }

  if (attendance === "Буду со своей парой") {
    return "2";
  }

  return "0";
}

function updatePartnerField() {
  if (!rsvpForm || !partnerInput || !partnerField) {
    return;
  }

  const isWithPartner = rsvpForm.elements.attendance.value === "Буду со своей парой";
  partnerField.hidden = !isWithPartner;
  partnerInput.disabled = !isWithPartner;

  if (!isWithPartner) {
    partnerInput.value = "";
  }
}

rsvpForm?.addEventListener("change", (event) => {
  if (event.target.name === "attendance") {
    updatePartnerField();
  }
});

updatePartnerField();

rsvpForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const partnerName = data.attendance === "Буду со своей парой" ? data.partner_name || "" : "";
  const guestCount = getGuestCount(data.attendance);
  const answer = {
    attendance: data.attendance || "",
    guest_names: data.guest_names || "",
    partner_name: partnerName,
    guest_count: guestCount,
    message: data.message || "",
    sentAt: new Date().toISOString(),
  };
  const status = document.querySelector("#formStatus");
  const submitButton = form.querySelector('button[type="submit"]');
  const googleFormUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLSe_WZIMiPU1QQWTcFncsvfgtbbmqME5hjdr_y8bUgm0LPY0ag/formResponse";
  const payload = new URLSearchParams({
    "entry.1383429180": data.attendance || "",
    "entry.1641270290": guestCount,
    "entry.116719028": data.guest_names || "",
    "entry.919714122": partnerName,
    "entry.684450531": data.message || "",
  });

  submitButton.disabled = true;
  status.textContent = "Отправляем ответ...";

  localStorage.setItem("wedding-rsvp", JSON.stringify(answer));

  fetch(googleFormUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
  })
    .then(() => {
      status.textContent = "Спасибо! Ответ отправлен.";
      form.reset();
      updatePartnerField();
    })
    .catch(() => {
      status.textContent = "Не получилось отправить ответ. Попробуйте ещё раз.";
    })
    .finally(() => {
      submitButton.disabled = false;
    });
});
