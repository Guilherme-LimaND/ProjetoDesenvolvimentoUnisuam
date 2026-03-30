document.addEventListener('DOMContentLoaded', function () {

  // ── Navegação entre telas ────────────────────────────────────────────────

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(function (s) {
      s.classList.remove('active');
    });
    var target = document.getElementById(id);
    if (target) {
      target.classList.add('active');
      clearAllFeedback();
    }
  }

  document.getElementById('link-register').addEventListener('click', function (e) {
    e.preventDefault();
    showScreen('screen-register');
  });

  document.getElementById('link-login').addEventListener('click', function (e) {
    e.preventDefault();
    showScreen('screen-login');
  });

  document.getElementById('link-forgot').addEventListener('click', function (e) {
    e.preventDefault();
    showScreen('screen-forgot');
  });

  document.getElementById('link-back-login').addEventListener('click', function (e) {
    e.preventDefault();
    showScreen('screen-login');
  });


  // ── Mostrar/ocultar senha ────────────────────────────────────────────────

  document.querySelectorAll('.eye-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-target'));
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁';
      }
    });
  });


  // ── Helpers de validação e feedback ────────────────────────────────────

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function isValidPhone(phone) {
    var digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
  }

  function setError(fieldId, message) {
    var el = document.getElementById(fieldId);
    if (el) el.textContent = message;
  }

  function clearAllFeedback() {
    document.querySelectorAll('.feedback-box').forEach(function (el) {
      el.textContent = '';
      el.className = 'feedback-box';
    });
    document.querySelectorAll('.field-error').forEach(function (el) {
      el.textContent = '';
    });
  }

  function setFeedback(boxId, message, type) {
    var el = document.getElementById(boxId);
    if (!el) return;
    el.textContent = message;
    el.className = 'feedback-box ' + (type || '');
  }

  function setLoading(btn, label, loading) {
    btn.disabled = loading;
    btn.textContent = loading ? label : btn.getAttribute('data-label');
  }


  // ── Força da senha ───────────────────────────────────────────────────────

  function getPasswordStrength(password) {
    var score = 0;
    if (password.length >= 8)          score++;
    if (password.length >= 12)         score++;
    if (/[A-Z]/.test(password))        score++;
    if (/[0-9]/.test(password))        score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }

  var regSenha = document.getElementById('reg-senha');
  regSenha.addEventListener('input', function () {
    var val    = this.value;
    var score  = getPasswordStrength(val);
    var fill   = document.getElementById('strength-fill');
    var label  = document.getElementById('strength-label');
    var levels = [
      { pct: '0%',   color: '',        text: '' },
      { pct: '25%',  color: '#8B1A1A', text: 'Muito fraca' },
      { pct: '50%',  color: '#C9A84C', text: 'Fraca' },
      { pct: '75%',  color: '#E2C06A', text: 'Boa' },
      { pct: '90%',  color: '#5A9A5A', text: 'Forte' },
      { pct: '100%', color: '#3A7A3A', text: 'Muito forte' },
    ];
    var level = levels[Math.min(score, levels.length - 1)];
    fill.style.width      = val.length > 0 ? level.pct   : '0%';
    fill.style.background = val.length > 0 ? level.color : '';
    label.textContent     = val.length > 0 ? level.text  : '';
    label.style.color     = level.color;
  });


  // ── Máscara de telefone ──────────────────────────────────────────────────

  document.getElementById('reg-telefone').addEventListener('input', function () {
    var v = this.value.replace(/\D/g, '').slice(0, 11);
    if      (v.length > 6) v = '(' + v.slice(0,2) + ') ' + v.slice(2,7) + '-' + v.slice(7);
    else if (v.length > 2) v = '(' + v.slice(0,2) + ') ' + v.slice(2);
    else if (v.length > 0) v = '(' + v;
    this.value = v;
  });


  // ── Formulário: Login ────────────────────────────────────────────────────

  var btnLogin = document.querySelector('#form-login button[type="submit"]');
  btnLogin.setAttribute('data-label', 'Entrar');

  document.getElementById('form-login').addEventListener('submit', function (e) {
    e.preventDefault();
    clearAllFeedback();

    var email = document.getElementById('login-email').value;
    var senha = document.getElementById('login-senha').value;
    var valid = true;

    if (!email) {
      setError('err-login-email', 'Informe seu e-mail.');
      valid = false;
    } else if (!isValidEmail(email)) {
      setError('err-login-email', 'E-mail inválido.');
      valid = false;
    }

    if (!senha) {
      setError('err-login-senha', 'Informe sua senha.');
      valid = false;
    } else if (senha.length < 6) {
      setError('err-login-senha', 'Senha muito curta.');
      valid = false;
    }

    if (!valid) return;

    setLoading(btnLogin, 'Entrando...', true);
    setTimeout(function () {
      setLoading(btnLogin, '', false);
      // Substitua esta linha pela resposta real do seu backend:
      setFeedback('fb-login', 'E-mail ou senha incorretos. Tente novamente.', 'error');
    }, 1500);
  });


  // ── Formulário: Criar conta ──────────────────────────────────────────────

  var btnRegister = document.querySelector('#form-register button[type="submit"]');
  btnRegister.setAttribute('data-label', 'Criar conta');

  document.getElementById('form-register').addEventListener('submit', function (e) {
    e.preventDefault();
    clearAllFeedback();

    var nome     = document.getElementById('reg-nome').value.trim();
    var email    = document.getElementById('reg-email').value.trim();
    var telefone = document.getElementById('reg-telefone').value.trim();
    var senha    = document.getElementById('reg-senha').value;
    var confirma = document.getElementById('reg-confirma').value;
    var valid    = true;

    if (!nome || nome.split(' ').filter(Boolean).length < 2) {
      setError('err-reg-nome', 'Informe nome e sobrenome.');
      valid = false;
    }
    if (!email) {
      setError('err-reg-email', 'Informe seu e-mail.');
      valid = false;
    } else if (!isValidEmail(email)) {
      setError('err-reg-email', 'E-mail inválido.');
      valid = false;
    }
    if (telefone && !isValidPhone(telefone)) {
      setError('err-reg-telefone', 'Telefone inválido.');
      valid = false;
    }
    if (!senha) {
      setError('err-reg-senha', 'Crie uma senha.');
      valid = false;
    } else if (senha.length < 8) {
      setError('err-reg-senha', 'A senha deve ter ao menos 8 caracteres.');
      valid = false;
    }
    if (!confirma) {
      setError('err-reg-confirma', 'Confirme sua senha.');
      valid = false;
    } else if (senha !== confirma) {
      setError('err-reg-confirma', 'As senhas não coincidem.');
      valid = false;
    }

    if (!valid) return;

    setLoading(btnRegister, 'Criando conta...', true);
    setTimeout(function () {
      setLoading(btnRegister, '', false);
      // Substitua esta linha pela resposta real do seu backend:
      setFeedback('fb-register', '✔ Conta criada! Redirecionando para o login...', 'success');
      setTimeout(function () { showScreen('screen-login'); }, 2000);
    }, 1500);
  });


  // ── Formulário: Esqueceu a senha ─────────────────────────────────────────

  var btnForgot = document.querySelector('#form-forgot button[type="submit"]');
  btnForgot.setAttribute('data-label', 'Enviar link');

  document.getElementById('form-forgot').addEventListener('submit', function (e) {
    e.preventDefault();
    clearAllFeedback();

    var email = document.getElementById('forgot-email').value.trim();

    if (!email) {
      setError('err-forgot-email', 'Informe seu e-mail.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('err-forgot-email', 'E-mail inválido.');
      return;
    }

    setLoading(btnForgot, 'Enviando...', true);
    setTimeout(function () {
      setLoading(btnForgot, '', false);
      // Substitua esta linha pela resposta real do seu backend:
      setFeedback('fb-forgot', '✔ Se esse e-mail estiver cadastrado, você receberá o link em breve.', 'success');
    }, 1500);
  });

}); // fim DOMContentLoaded