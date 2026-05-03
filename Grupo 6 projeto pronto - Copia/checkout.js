document.addEventListener('DOMContentLoaded', function () {

  // ── Catálogo de serviços ─────────────────────────────────────────────────
  var SERVICES = {
    'corte-classico':      { name: 'Corte Clássico',        price: 45  },
    'corte-degrade':       { name: 'Corte Degradê',          price: 55  },
    'corte-infantil':      { name: 'Corte Infantil',         price: 35  },
    'barba-completa':      { name: 'Barba Completa',         price: 40  },
    'acabamento-barba':    { name: 'Acabamento de Barba',    price: 20  },
    'corte-barba':         { name: 'Corte + Barba',          price: 85  },
    'hidratacao':          { name: 'Hidratação Capilar',     price: 50  },
    'progressiva':         { name: 'Progressiva Masculina',  price: 150 },
    'reflexo':             { name: 'Reflexo / Mechas',       price: 120 },
    'coloracao':           { name: 'Coloração',              price: 80  },
    'limpeza-pele':        { name: 'Limpeza de Pele',        price: 70  },
    'sobrancelha':         { name: 'Sobrancelha Masculina',  price: 25  },
    'pkg-basico':          { name: 'Pacote Básico',          price: 120 },
    'pkg-premium':         { name: 'Pacote Premium',         price: 220 },
    'pkg-vip':             { name: 'Pacote VIP',             price: 350 },
  };

  // ── Lê serviço da URL ─────────────────────────────────────────────────────
  var params  = new URLSearchParams(window.location.search);
  var slug    = params.get('servico') || 'corte-classico';
  var service = SERVICES[slug] || SERVICES['corte-classico'];
  var total   = service.price;

  // ── Preenche resumo lateral ───────────────────────────────────────────────
  var itemsEl = document.getElementById('summary-items');
  var row = document.createElement('div');
  row.className = 'summary-item';
  row.innerHTML = '<span class="summary-item-name">' + service.name + '</span>'
                + '<span class="summary-item-price">R$ ' + total + '</span>';
  itemsEl.appendChild(row);
  document.getElementById('summary-total').textContent = 'R$ ' + total;

  // Inicia no passo de agendamento
  showStep('step-schedule');

  // Preenche parcelamento (crédito)
  var sel = document.getElementById('cred-parcelas');
  for (var i = 1; i <= 3; i++) {
    var val = (total / i).toFixed(2).replace('.', ',');
    var opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i === 1 ? '1× de R$ ' + val + ' (sem juros)' : i + '× de R$ ' + val + ' (sem juros)';
    sel.appendChild(opt);
  }

  // ── Preenche nome do usuário logado se existir ────────────────────────────
  if (typeof Auth !== 'undefined') {
    var session = Auth.getSession();
    if (session) {
      var loginLink = document.querySelector('.header-nav a[href="login.html"]');
      if (loginLink) loginLink.textContent = '👤 ' + session.nome.split(' ')[0];
    }
  }

  // ── Navegação entre passos ────────────────────────────────────────────────
  function showStep(id) {
    document.querySelectorAll('.step').forEach(function (s) { s.classList.add('hidden'); });
    var el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function setError(id, msg)   { var el = document.getElementById(id); if (el) el.textContent = msg; }
  function clearErrors(ids)    { ids.forEach(function(id) { setError(id,''); }); }
  function setFeedback(id, msg, type) {
    var el = document.getElementById(id); if (!el) return;
    el.textContent = msg; el.className = 'feedback-box ' + (type || '');
  }


  // ── AGENDAMENTO: Datas e horários ─────────────────────────────────────────

  var HORARIOS = ['09:00','09:30','10:00','10:30','11:00','11:30',
                  '13:00','13:30','14:00','14:30','15:00','15:30',
                  '16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30'];

  // Horários já ocupados (simulado — em produção viria do backend)
  var OCUPADOS = {'09:00':true, '11:00':true, '14:30':true, '17:00':true};

  var selectedDate = null;
  var selectedTime = null;

  // Gera os proximos 21 dias corridos (exceto domingo)
  var datesGrid = document.getElementById('dates-grid');
  var weekdays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
  var months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  var today = new Date();
  today.setHours(0,0,0,0);

  for (var d = 1; d <= 30; d++) {
    var date = new Date(today.getTime());
    date.setDate(today.getDate() + d);
    if (date.getDay() === 0) continue; // pula domingo
    (function(dt) {
      var btn = document.createElement('button');
      btn.className = 'date-btn';
      btn.innerHTML =
        '<span class="date-weekday">' + weekdays[dt.getDay()] + '</span>' +
        '<span class="date-day">' + dt.getDate() + '</span>' +
        '<span class="date-weekday">' + months[dt.getMonth()] + '</span>';
      btn.addEventListener('click', function () {
        document.querySelectorAll('.date-btn').forEach(function(b){ b.classList.remove('selected'); });
        btn.classList.add('selected');
        selectedDate = dt;
        selectedTime = null;
        renderTimes();
        document.getElementById('times-section').style.display = 'block';
      });
      datesGrid.appendChild(btn);
    })(date);
  }

  function renderTimes() {
    var grid = document.getElementById('times-grid');
    grid.innerHTML = '';
    HORARIOS.forEach(function(h) {
      var btn = document.createElement('button');
      btn.className = 'time-btn';
      btn.textContent = h;
      if (OCUPADOS[h]) {
        btn.disabled = true;
        btn.title = 'Horario indisponivel';
      } else {
        btn.addEventListener('click', function () {
          document.querySelectorAll('.time-btn').forEach(function(b){ b.classList.remove('selected'); });
          btn.classList.add('selected');
          selectedTime = h;
          document.getElementById('fb-schedule').textContent = '';
        });
      }
      grid.appendChild(btn);
    });
  }

  // Confirmar agendamento
  document.getElementById('btn-confirm-schedule').addEventListener('click', function () {
    if (!selectedDate) {
      document.getElementById('fb-schedule').textContent = 'Selecione uma data.';
      document.getElementById('fb-schedule').className = 'feedback-box error';
      return;
    }
    if (!selectedTime) {
      document.getElementById('fb-schedule').textContent = 'Selecione um horario.';
      document.getElementById('fb-schedule').className = 'feedback-box error';
      return;
    }
    showStep('step-when');
  });

  // ── PASSO 1: Quando pagar ─────────────────────────────────────────────────

  document.getElementById('btn-pay-now').addEventListener('click', function () {
    showStep('step-method');
    startPixTimer();
  });

  document.getElementById('btn-pay-later').addEventListener('click', function () {
    showStep('step-presencial');
  });

  document.getElementById('btn-back-method').addEventListener('click', function () {
    clearPixTimer();
    showStep('step-when');
  });

  document.getElementById('btn-back-presencial').addEventListener('click', function () {
    showStep('step-when');
  });

  // ── PASSO 2: Tabs de método ───────────────────────────────────────────────
  document.querySelectorAll('.method-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.method-tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.method-panel').forEach(function (p) { p.classList.remove('active'); p.classList.add('hidden'); });
      tab.classList.add('active');
      var panel = document.getElementById('panel-' + tab.getAttribute('data-method'));
      if (panel) { panel.classList.remove('hidden'); panel.classList.add('active'); }
      if (tab.getAttribute('data-method') === 'pix') startPixTimer();
      else clearPixTimer();
    });
  });

  // ── PIX: timer ───────────────────────────────────────────────────────────
  var pixInterval = null;
  var pixSecs = 600;

  function startPixTimer() {
    clearPixTimer();
    pixSecs = 600;
    updateTimer();
    pixInterval = setInterval(function () {
      pixSecs--;
      updateTimer();
      if (pixSecs <= 0) clearPixTimer();
    }, 1000);
  }

  function clearPixTimer() {
    if (pixInterval) { clearInterval(pixInterval); pixInterval = null; }
  }

  function updateTimer() {
    var m = Math.floor(pixSecs / 60);
    var s = pixSecs % 60;
    var el = document.getElementById('pix-timer');
    if (el) {
      el.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
      el.className   = 'timer-value' + (pixSecs <= 60 ? ' urgent' : '');
    }
  }

  // ── PIX: copiar chave ─────────────────────────────────────────────────────
  document.getElementById('btn-copy-pix').addEventListener('click', function () {
    var key = document.getElementById('pix-key').textContent;
    navigator.clipboard.writeText(key).catch(function(){});
    this.textContent = 'Copiado!';
    this.classList.add('copied');
    var btn = this;
    setTimeout(function () { btn.textContent = 'Copiar'; btn.classList.remove('copied'); }, 2000);
  });

  document.getElementById('btn-confirm-pix').addEventListener('click', function () {
    clearPixTimer();
    showConfirmation('pix');
  });

  // ── Cartão: máscaras e preview ────────────────────────────────────────────
  function maskNum(v)    { return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim(); }
  function maskExpiry(v) { var d=v.replace(/\D/g,'').slice(0,4); return d.length>2 ? d.slice(0,2)+'/'+d.slice(2) : d; }

  function bindCard(prefix, numId, nomeId, valId) {
    document.getElementById(prefix+'-numero').addEventListener('input', function(){
      this.value = maskNum(this.value);
      var raw = this.value.replace(/\s/g,'');
      var padded = (raw+'????????????????').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
      document.getElementById(numId).textContent = padded;
    });
    document.getElementById(prefix+'-nome').addEventListener('input', function(){
      document.getElementById(nomeId).textContent = this.value.toUpperCase() || 'SEU NOME';
    });
    document.getElementById(prefix+'-validade').addEventListener('input', function(){
      this.value = maskExpiry(this.value);
      document.getElementById(valId).textContent = this.value || 'MM/AA';
    });
    document.getElementById(prefix+'-cvv').addEventListener('input', function(){
      this.value = this.value.replace(/\D/g,'').slice(0,4);
    });
  }

  bindCard('cred','display-num-credito','display-nome-credito','display-val-credito');
  bindCard('deb', 'display-num-debito', 'display-nome-debito', 'display-val-debito');

  // ── Validação de cartão ───────────────────────────────────────────────────
  function validateCard(prefix, fbId) {
    var numero   = document.getElementById(prefix+'-numero').value.replace(/\s/g,'');
    var nome     = document.getElementById(prefix+'-nome').value.trim();
    var validade = document.getElementById(prefix+'-validade').value;
    var cvv      = document.getElementById(prefix+'-cvv').value;
    clearErrors(['err-'+prefix+'-numero','err-'+prefix+'-nome','err-'+prefix+'-validade','err-'+prefix+'-cvv']);
    setFeedback(fbId,'','');
    var ok = true;

    if (numero.length < 16)             { setError('err-'+prefix+'-numero','Número inválido.'); ok=false; }
    if (!nome || nome.split(' ').filter(Boolean).length < 2) { setError('err-'+prefix+'-nome','Nome como no cartão.'); ok=false; }
    if (!/^\d{2}\/\d{2}$/.test(validade)) { setError('err-'+prefix+'-validade','Formato MM/AA.'); ok=false; }
    else {
      var pts = validade.split('/');
      var mes = parseInt(pts[0],10), ano = parseInt('20'+pts[1],10);
      var agora = new Date();
      if (mes<1||mes>12||new Date(ano,mes-1)<new Date(agora.getFullYear(),agora.getMonth())) {
        setError('err-'+prefix+'-validade','Cartão vencido.'); ok=false;
      }
    }
    if (cvv.length < 3) { setError('err-'+prefix+'-cvv','CVV inválido.'); ok=false; }
    return ok;
  }

  // ── Submit crédito ────────────────────────────────────────────────────────
  document.getElementById('form-credito').addEventListener('submit', function(e) {
    e.preventDefault();
    if (!validateCard('cred','fb-credito')) return;
    var btn = this.querySelector('.btn-confirm');
    btn.textContent = 'Processando...'; btn.disabled = true;
    setTimeout(function() { btn.textContent='Pagar com crédito'; btn.disabled=false; showConfirmation('credito'); }, 1800);
  });

  // ── Submit débito ─────────────────────────────────────────────────────────
  document.getElementById('form-debito').addEventListener('submit', function(e) {
    e.preventDefault();
    if (!validateCard('deb','fb-debito')) return;
    var btn = this.querySelector('.btn-confirm');
    btn.textContent = 'Processando...'; btn.disabled = true;
    setTimeout(function() { btn.textContent='Pagar com débito'; btn.disabled=false; showConfirmation('debito'); }, 1800);
  });

  // ── Confirmar presencial ──────────────────────────────────────────────────
  document.getElementById('btn-confirm-presencial').addEventListener('click', function() {
    showConfirmation('presencial');
  });

  // ── Tela de confirmação ───────────────────────────────────────────────────
  function showConfirmation(method) {
    clearPixTimer();
    var info = {
      pix:        { title: 'Pagamento confirmado!',   label: 'PIX' },
      credito:    { title: 'Pagamento aprovado!',     label: 'Cartão de crédito' },
      debito:     { title: 'Pagamento aprovado!',     label: 'Cartão de débito' },
      presencial: { title: 'Agendamento confirmado!', label: 'Pagar na barbearia' },
    }[method] || { title: 'Confirmado!', label: method };

    document.getElementById('confirm-title').textContent = info.title;
    document.getElementById('confirm-desc').textContent = method === 'presencial'
      ? 'Seu horário está reservado! Chegue com 5 minutos de antecedência.'
      : 'Agendamento garantido! Você receberá a confirmação por e-mail em breve.';

    var now     = new Date();
    var dateStr = selectedDate
      ? selectedDate.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' }) + (selectedTime ? ' às ' + selectedTime : '')
      : now.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' });
    var codigo  = '#BLD-' + Math.floor(10000 + Math.random() * 90000);

    // Salva no localStorage se tiver Auth disponível
    if (typeof Auth !== 'undefined') {
      var s = Auth.getSession();
      if (s) {
        try {
          var bookings = JSON.parse(localStorage.getItem('theblade_bookings') || '[]');
          bookings.push({ codigo: codigo, servico: service.name, valor: total, metodo: info.label, data: now.toISOString(), usuario: s.email });
          localStorage.setItem('theblade_bookings', JSON.stringify(bookings));
        } catch(e) {}
      }
    }

    var detailsEl = document.getElementById('confirm-details');
    detailsEl.innerHTML = [
      { label: 'Serviço',   value: service.name },
      { label: 'Valor',     value: 'R$ ' + total },
      { label: 'Pagamento', value: info.label },
      { label: 'Data',      value: dateStr },
      { label: 'Código',    value: codigo },
    ].map(function(r) {
      return '<div class="confirm-row"><span class="confirm-row-label">'+r.label+'</span><span class="confirm-row-value">'+r.value+'</span></div>';
    }).join('');

    showStep('step-confirmation');
  }

});
