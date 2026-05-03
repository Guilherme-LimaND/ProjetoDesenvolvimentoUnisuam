// ═══════════════════════════════════════════════════════════════
//  auth.js — módulo de autenticação compartilhado
//  Usado por: login.html, servicos.html, checkout.html, index.html
// ═══════════════════════════════════════════════════════════════

var Auth = (function () {

  var LS_USERS   = 'theblade_users';
  var LS_SESSION = 'theblade_session';

  // ── Usuários ──────────────────────────────────────────────────

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(LS_USERS)) || []; }
    catch (e) { return []; }
  }

  function saveUsers(users) {
    localStorage.setItem(LS_USERS, JSON.stringify(users));
  }

  function findUser(email) {
    return getUsers().find(function (u) {
      return u.email.toLowerCase() === email.trim().toLowerCase();
    }) || null;
  }

  function registerUser(nome, email, telefone, senha, cpf, cep) {
    var users = getUsers();
    if (findUser(email)) return { ok: false, error: 'email_exists' };
    var user = {
      id:        'usr_' + Date.now(),
      nome:      nome.trim(),
      email:     email.trim().toLowerCase(),
      telefone:  telefone ? telefone.trim() : '',
      cpf:       cpf ? cpf.trim() : '',
      cep:       cep ? cep.trim() : '',
      senha:     senha,             // ⚠ em produção: hash no backend
      criadoEm:  new Date().toISOString(),
    };
    users.push(user);
    saveUsers(users);
    return { ok: true, user: user };
  }

  function loginUser(email, senha) {
    var user = findUser(email);
    if (!user)            return { ok: false, error: 'not_found' };
    if (user.senha !== senha) return { ok: false, error: 'wrong_password' };
    return { ok: true, user: user };
  }

  // ── Sessão ────────────────────────────────────────────────────

  function saveSession(user) {
    localStorage.setItem(LS_SESSION, JSON.stringify({
      id:       user.id,
      nome:     user.nome,
      email:    user.email,
      telefone: user.telefone,
      cpf:      user.cpf,
      cep:      user.cep,
      loginEm:  new Date().toISOString(),
    }));
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(LS_SESSION)) || null; }
    catch (e) { return null; }
  }

  function clearSession() {
    localStorage.removeItem(LS_SESSION);
  }

  // ── Helpers ───────────────────────────────────────────────────

  function getInitials(nome) {
    var p = nome.trim().split(' ').filter(Boolean);
    return p.length >= 2
      ? (p[0][0] + p[p.length - 1][0]).toUpperCase()
      : p[0][0].toUpperCase();
  }

  function requireAuth(redirectTo) {
    if (!getSession()) {
      window.location.href = redirectTo || 'login.html';
      return false;
    }
    return true;
  }

  // API pública
  return {
    registerUser: registerUser,
    loginUser:    loginUser,
    findUser:     findUser,
    saveSession:  saveSession,
    getSession:   getSession,
    clearSession: clearSession,
    getInitials:  getInitials,
    requireAuth:  requireAuth,
  };

})();
