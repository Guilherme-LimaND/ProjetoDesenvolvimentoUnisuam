document.addEventListener('DOMContentLoaded', function () {

  // ── Se já tem sessão ativa, mostra tela de conta ──────────────
  var session = Auth.getSession();
  if (session) { renderAccount(session); return; }

  // ── Navegação entre telas ─────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
    var t = document.getElementById(id);
    if (t) { t.classList.add('active'); clearFeedback(); }
  }

  document.getElementById('link-register').addEventListener('click',   function (e) { e.preventDefault(); showScreen('screen-register'); });
  document.getElementById('link-login').addEventListener('click',      function (e) { e.preventDefault(); showScreen('screen-login'); });
  document.getElementById('link-forgot').addEventListener('click',     function (e) { e.preventDefault(); showScreen('screen-forgot'); });
  document.getElementById('link-back-login').addEventListener('click', function (e) { e.preventDefault(); showScreen('screen-login'); });

  // ── Mostrar/ocultar senha ─────────────────────────────────────
  document.querySelectorAll('.eye-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-target'));
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.textContent = input.type === 'password' ? '👁' : '🙈';
    });
  });

  // ── Helpers ───────────────────────────────────────────────────
  function isValidEmail(e)  { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }
  function isValidPhone(p)  { var d = p.replace(/\D/g,''); return d.length >= 10 && d.length <= 11; }
  function setErr(id, msg)  { var el = document.getElementById(id); if (el) el.textContent = msg; }
  function clearFeedback()  {
    document.querySelectorAll('.feedback-box').forEach(function(el){ el.textContent=''; el.className='feedback-box'; });
    document.querySelectorAll('.field-error').forEach(function(el){ el.textContent=''; });
  }
  function setFeedback(id, msg, type) {
    var el = document.getElementById(id); if (!el) return;
    el.textContent = msg; el.className = 'feedback-box ' + (type||'');
  }
  function setLoading(btn, label, on) {
    btn.disabled = on; btn.textContent = on ? label : btn.getAttribute('data-label');
  }

  // ── Força da senha ────────────────────────────────────────────
  function pwStrength(p) {
    var s=0;
    if(p.length>=8) s++; if(p.length>=12) s++;
    if(/[A-Z]/.test(p)) s++; if(/[0-9]/.test(p)) s++; if(/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }
  document.getElementById('reg-senha').addEventListener('input', function () {
    var v=this.value, sc=pwStrength(v);
    var fill=document.getElementById('strength-fill'), lbl=document.getElementById('strength-label');
    var lvs=[{p:'0%',c:'',t:''},{p:'25%',c:'#8B1A1A',t:'Muito fraca'},{p:'50%',c:'#C9A84C',t:'Fraca'},{p:'75%',c:'#E2C06A',t:'Boa'},{p:'90%',c:'#5A9A5A',t:'Forte'},{p:'100%',c:'#3A7A3A',t:'Muito forte'}];
    var lv=lvs[Math.min(sc,lvs.length-1)];
    fill.style.width=v.length?lv.p:'0%'; fill.style.background=v.length?lv.c:'';
    lbl.textContent=v.length?lv.t:''; lbl.style.color=lv.c;
  });

  // ── Máscara telefone ──────────────────────────────────────────
  document.getElementById('reg-telefone').addEventListener('input', function () {
    var v=this.value.replace(/\D/g,'').slice(0,11);
    if(v.length>6) v='('+v.slice(0,2)+') '+v.slice(2,7)+'-'+v.slice(7);
    else if(v.length>2) v='('+v.slice(0,2)+') '+v.slice(2);
    else if(v.length>0) v='('+v;
    this.value=v;
  });

  // ── LOGIN ─────────────────────────────────────────────────────
  var btnLogin = document.querySelector('#form-login button[type="submit"]');
  btnLogin.setAttribute('data-label','Entrar');

  document.getElementById('form-login').addEventListener('submit', function (e) {
    e.preventDefault(); clearFeedback();
    var email=document.getElementById('login-email').value.trim();
    var senha=document.getElementById('login-senha').value;
    var ok=true;
    if (!email)              { setErr('err-login-email','Informe seu e-mail.'); ok=false; }
    else if (!isValidEmail(email)) { setErr('err-login-email','E-mail inválido.'); ok=false; }
    if (!senha)              { setErr('err-login-senha','Informe sua senha.'); ok=false; }
    if (!ok) return;

    setLoading(btnLogin,'Entrando...',true);
    setTimeout(function () {
      setLoading(btnLogin,'',false);
      var res = Auth.loginUser(email, senha);
      if (!res.ok) {
        setFeedback('fb-login',
          res.error==='not_found'
            ? 'E-mail não encontrado. Crie uma conta primeiro.'
            : 'Senha incorreta. Tente novamente.',
          'error');
        return;
      }
      Auth.saveSession(res.user);
      setFeedback('fb-login','✔ Bem-vindo, '+res.user.nome.split(' ')[0]+'!','success');
      setTimeout(function(){ renderAccount(Auth.getSession()); }, 900);
    }, 700);
  });

  // ── CADASTRO ──────────────────────────────────────────────────
  var btnReg = document.querySelector('#form-register button[type="submit"]');
  btnReg.setAttribute('data-label','Criar conta');

  document.getElementById('form-register').addEventListener('submit', function (e) {
    e.preventDefault(); clearFeedback();
    var nome     = document.getElementById('reg-nome').value.trim();
    var email    = document.getElementById('reg-email').value.trim();
    var telefone = document.getElementById('reg-telefone').value.trim();
    var senha    = document.getElementById('reg-senha').value;
    var confirma = document.getElementById('reg-confirma').value;
    var ok=true;
    if (!nome||nome.split(' ').filter(Boolean).length<2) { setErr('err-reg-nome','Informe nome e sobrenome.'); ok=false; }
    if (!email)              { setErr('err-reg-email','Informe seu e-mail.'); ok=false; }
    else if (!isValidEmail(email)) { setErr('err-reg-email','E-mail inválido.'); ok=false; }
    if (telefone&&!isValidPhone(telefone)) { setErr('err-reg-telefone','Telefone inválido.'); ok=false; }
    if (!senha)              { setErr('err-reg-senha','Crie uma senha.'); ok=false; }
    else if (senha.length<8) { setErr('err-reg-senha','Mínimo 8 caracteres.'); ok=false; }
    if (!confirma)           { setErr('err-reg-confirma','Confirme sua senha.'); ok=false; }
    else if (senha!==confirma){ setErr('err-reg-confirma','As senhas não coincidem.'); ok=false; }
    if (!ok) return;

    setLoading(btnReg,'Criando conta...',true);
    setTimeout(function () {
      setLoading(btnReg,'',false);
      var res = Auth.registerUser(nome, email, telefone, senha);
      if (!res.ok) { setErr('err-reg-email','Este e-mail já está cadastrado.'); return; }
      Auth.saveSession(res.user);
      setFeedback('fb-register','✔ Conta criada! Bem-vindo, '+nome.split(' ')[0]+'!','success');
      setTimeout(function(){ renderAccount(Auth.getSession()); }, 900);
    }, 700);
  });

  // ── ESQUECEU A SENHA ──────────────────────────────────────────
  var btnForgot = document.querySelector('#form-forgot button[type="submit"]');
  btnForgot.setAttribute('data-label','Enviar link');

  document.getElementById('form-forgot').addEventListener('submit', function (e) {
    e.preventDefault(); clearFeedback();
    var email = document.getElementById('forgot-email').value.trim();
    if (!email)              { setErr('err-forgot-email','Informe seu e-mail.'); return; }
    if (!isValidEmail(email)){ setErr('err-forgot-email','E-mail inválido.'); return; }
    setLoading(btnForgot,'Enviando...',true);
    setTimeout(function () {
      setLoading(btnForgot,'',false);
      var user = Auth.findUser(email);
      setFeedback('fb-forgot',
        user ? '✔ E-mail encontrado! Link de redefinição enviado.' : '✔ Se esse e-mail estiver cadastrado, o link será enviado.',
        'success');
    }, 700);
  });

  // ── TELA: CONTA LOGADA ────────────────────────────────────────
  function renderAccount(s) {
    var wrap = document.querySelector('.form-wrap');
    if (!wrap) return;
    var firstName = s.nome.split(' ')[0];
    var since = new Date(s.loginEm).toLocaleString('pt-BR');
    wrap.innerHTML =
      '<div class="screen active">' +
        '<div class="logged-avatar">'+Auth.getInitials(s.nome)+'</div>' +
        '<p class="form-eyebrow" style="text-align:center">Sessão ativa</p>' +
        '<h2 class="form-title" style="text-align:center;margin-bottom:.4rem">Olá, '+firstName+'! 👋</h2>' +
        '<p style="font-size:13px;color:var(--muted);text-align:center;margin-bottom:1.75rem">Desde '+since+'</p>' +
        '<div class="logged-info">' +
          '<div class="logged-row"><span class="logged-label">Nome</span><span class="logged-val">'+s.nome+'</span></div>' +
          '<div class="logged-row"><span class="logged-label">E-mail</span><span class="logged-val">'+s.email+'</span></div>' +
          (s.telefone ? '<div class="logged-row"><span class="logged-label">Telefone</span><span class="logged-val">'+s.telefone+'</span></div>' : '') +
        '</div>' +
        '<a href="servicos.html" style="display:block;text-align:center;text-decoration:none;padding:13px;background:var(--gold);color:#0E0C0A;font-family:Barlow,sans-serif;font-size:12px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;border-radius:6px;margin-bottom:.75rem;transition:background .2s">Ver serviços e agendar</a>' +
        '<button id="btn-logout" style="width:100%;padding:11px;background:transparent;color:var(--muted);font-family:Barlow,sans-serif;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;border:1px solid var(--border);border-radius:6px;cursor:pointer">Sair da conta</button>' +
      '</div>';
    document.getElementById('btn-logout').addEventListener('click', function () {
      Auth.clearSession(); location.reload();
    });
  }

});
