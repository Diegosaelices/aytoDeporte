// Muestra mensaje de error bajo un input
function setError(input, message) {
  const group = input.closest(".form-group");
  if (!group) return;

  let errorEl = group.querySelector(".form-error");
  if (!errorEl) {
    errorEl = document.createElement("div");
    errorEl.className = "form-error";
    group.appendChild(errorEl);
  }
  errorEl.textContent = message;
  input.classList.add("input-error");
}

// Limpia error de un input
function clearError(input) {
  const group = input.closest(".form-group");
  if (!group) return;

  const errorEl = group.querySelector(".form-error");
  if (errorEl) errorEl.textContent = "";
  input.classList.remove("input-error");
}

// ===== Validación login =====
function validarLoginForm(form) {
  const emailInput = form.querySelector("input[name='email']");
  const passwordInput = form.querySelector("input[name='password']");
  let valido = true;

  if (emailInput) {
    clearError(emailInput);
    const value = emailInput.value.trim();
    if (!value) {
      setError(emailInput, "El correo es obligatorio");
      valido = false;
    } else if (!/^\S+@\S+\.\S+$/.test(value)) {
      setError(emailInput, "Introduce un correo válido");
      valido = false;
    }
  }

  if (passwordInput) {
    clearError(passwordInput);
    const value = passwordInput.value.trim();
    if (!value) {
      setError(passwordInput, "La contraseña es obligatoria");
      valido = false;
    } else if (value.length < 4) {
      setError(passwordInput, "La contraseña debe tener al menos 4 caracteres");
      valido = false;
    }
  }

  return valido;
}

// ===== Ejemplo validación reserva (horas, duración, instalación) =====
function validarReservaForm(form) {
  const installationSelect = form.querySelector("select[name='installation']");
  const dateInput = form.querySelector("input[name='date']");
  const timeInput = form.querySelector("input[name='time']");
  const durationInput = form.querySelector("select[name='duration']");

  let valido = true;

  if (installationSelect) {
    clearError(installationSelect);
    if (!installationSelect.value) {
      setError(installationSelect, "Selecciona una instalación");
      valido = false;
    }
  }

  if (dateInput) {
    clearError(dateInput);
    if (!dateInput.value) {
      setError(dateInput, "Selecciona una fecha");
      valido = false;
    }
  }

  if (timeInput) {
    clearError(timeInput);
    if (!timeInput.value) {
      setError(timeInput, "Selecciona una hora de inicio");
      valido = false;
    }
  }

  if (durationInput) {
    clearError(durationInput);
    if (!durationInput.value) {
      setError(durationInput, "Selecciona una duración");
      valido = false;
    }
  }

  return valido;
}
