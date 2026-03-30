document.addEventListener('DOMContentLoaded', function () {

  // ── Dados dos serviços (espelho do servicos.html) ─────────────────────────
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

  // ── Lê serviço da URL ou usa padrão ──────────────────────────────────────
  var params  = new URLSearchParams(window.location.search);
  var slug    = params.get('servico') || 'corte-classico';
  var service = SERVICES[slug] || SERVICES['corte-classico'];
  var total   = service.price;

  // ── Preenche resumo ───────────────────────────────────────────────────────
  var itemsEl = document.getElementById('summary-items');
  var div = document.createElement('div');
  div.className = 'summary-item';
  div.innerHTML =
    '<span class="summary-item-name">' + service.name + '</span>' +
    '<span class="summary-item-price">R$ ' + total + '</span>';
  itemsEl.appendChild(div);
  document.getElementById('summary-total').textContent = 'R$ ' + total;

  // Popula parcelas do crédito
  var selParcelas = document.getElementById('cred-parcelas');
  for (var i = 1; i <= 3; i++) {
    var val = (total / i).toFixed(2).replace('.', ',');
    var opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i === 1
      ? '1× de R$ ' + val + ' (sem juros)'
      : i + '× de R$ ' + val + ' (sem juros)';
    selParcelas.appendChild(opt);
  }

  // ── Helpers de navegação entre passos ────────────────────────────────────
  function showStep(id) {
    document.querySelectorAll('.step').forEach(function (s) {
      s.classList.add('hidden');
    });
    var el = document.getElementById(id);
    if (el) { el.classList.remove('hidden'); }
  }

  // ── Helpers de validação ──────────────────────────────────────────────────
  function setError(id, msg) {
    var el = document.getElementById(id);
    if (el) el.textContent = msg;
  }
  function clearErrors(ids) {
    ids.forEach(function (id) { setError(id, ''); });
  }
  function setFeedback(id, msg, type) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className = 'feedback-box ' + (type || '');
  }

  // ── Passo 1: Quando pagar ─────────────────────────────────────────────────
  document.getElementById('btn-pay-now').addEventListener('click', function () {
    showStep('step-method');
  });

  document.getElementById('btn-pay-later').addEventListener('click', function () {
    showStep('step-presencial');
  });

  // ── Passo 2: Tabs de método ───────────────────────────────────────────────
  document.querySelectorAll('.method-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.method-tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.method-panel').forEach(function (p) {
        p.classList.remove('active');
        p.classList.add('hidden');
      });
      tab.classList.add('active');
      var panel = document.getElementById('panel-' + tab.getAttribute('data-method'));
      if (panel) { panel.classList.remove('hidden'); panel.classList.add('active'); }
      if (tab.getAttribute('data-method') === 'pix') startPixTimer();
    });
  });

  document.getElementById('btn-back-method').addEventListener('click', function () {
    clearPixTimer();
    showStep('step-when');
  });

  document.getElementById('btn-back-presencial').addEventListener('click', function () {
    showStep('step-when');
  });

  // ── PIX: timer e copiar ───────────────────────────────────────────────────
  var pixTimerInterval = null;
  var pixSeconds = 600;

  function startPixTimer() {
    clearPixTimer();
    pixSeconds = 600;
    updateTimerDisplay();
    pixTimerInterval = setInterval(function () {
      pixSeconds--;
      updateTimerDisplay();
      if (pixSeconds <= 0) clearPixTimer();
    }, 1000);
  }

  function clearPixTimer() {
    if (pixTimerInterval) { clearInterval(pixTimerInterval); pixTimerInterval = null; }
  }

  function updateTimerDisplay() {
    var min = Math.floor(pixSeconds / 60);
    var sec = pixSeconds % 60;
    var str = (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec;
    var el  = document.getElementById('pix-timer');
    if (el) {
      el.textContent = str;
      el.className = 'timer-value' + (pixSeconds <= 60 ? ' urgent' : '');
    }
  }

  startPixTimer();

  document.getElementById('btn-copy-pix').addEventListener('click', function () {
    var key = document.getElementById('pix-key').textContent;
    navigator.clipboard.writeText(key).catch(function () {});
    this.textContent = 'Copiado!';
    this.classList.add('copied');
    var btn = this;
    setTimeout(function () { btn.textContent = 'Copiar'; btn.classList.remove('copied'); }, 2000);
  });

  document.getElementById('btn-confirm-pix').addEventListener('click', function () {
    clearPixTimer();
    showConfirmation('pix');
  });

  // ── Cartão: máscaras e preview em tempo real ──────────────────────────────
  function maskCardNumber(val) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }
  function maskExpiry(val) {
    var d = val.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
  }

  function bindCardInputs(prefix, displayNumId, displayNomeId, displayValId) {
    var numInput  = document.getElementById(prefix + '-numero');
    var nomeInput = document.getElementById(prefix + '-nome');
    var valInput  = document.getElementById(prefix + '-validade');
    var cvvInput  = document.getElementById(prefix + '-cvv');

    numInput.addEventListener('input', function () {
      this.value = maskCardNumber(this.value);
      var raw = this.value.replace(/\s/g, '');
      var display = (raw + '????????????????').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
      document.getElementById(displayNumId).textContent = display;
    });
    nomeInput.addEventListener('input', function () {
      document.getElementById(displayNomeId).textContent = this.value.toUpperCase() || 'SEU NOME';
    });
    valInput.addEventListener('input', function () {
      this.value = maskExpiry(this.value);
      document.getElementById(displayValId).textContent = this.value || 'MM/AA';
    });
    cvvInput.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').slice(0, 4);
    });
  }

  bindCardInputs('cred', 'display-num-credito', 'display-nome-credito', 'display-val-credito');
  bindCardInputs('deb',  'display-num-debito',  'display-nome-debito',  'display-val-debito');

  // ── Validação genérica de cartão ──────────────────────────────────────────
  function validateCardForm(prefix, feedbackId) {
    var numero   = document.getElementById(prefix + '-numero').value.replace(/\s/g, '');
    var nome     = document.getElementById(prefix + '-nome').value.trim();
    var validade = document.getElementById(prefix + '-validade').value;
    var cvv      = document.getElementById(prefix + '-cvv').value;
    var errs     = [
      'err-' + prefix + '-numero',
      'err-' + prefix + '-nome',
      'err-' + prefix + '-validade',
      'err-' + prefix + '-cvv',
    ];
    clearErrors(errs);
    setFeedback(feedbackId, '', '');
    var valid = true;

    if (numero.length < 16) {
      setError('err-' + prefix + '-numero', 'Número de cartão inválido.');
      valid = false;
    }
    if (!nome || nome.split(' ').filter(Boolean).length < 2) {
      setError('err-' + prefix + '-nome', 'Informe o nome como está no cartão.');
      valid = false;
    }
    if (!/^\d{2}\/\d{2}$/.test(validade)) {
      setError('err-' + prefix + '-validade', 'Validade inválida (MM/AA).');
      valid = false;
    } else {
      var parts = validade.split('/');
      var mes = parseInt(parts[0], 10);
      var ano = parseInt('20' + parts[1], 10);
      var agora = new Date();
      if (mes < 1 || mes > 12 || new Date(ano, mes - 1) < new Date(agora.getFullYear(), agora.getMonth())) {
        setError('err-' + prefix + '-validade', 'Cartão vencido.');
        valid = false;
      }
    }
    if (cvv.length < 3) {
      setError('err-' + prefix + '-cvv', 'CVV inválido.');
      valid = false;
    }
    return valid;
  }

  // ── Submit crédito ────────────────────────────────────────────────────────
  document.getElementById('form-credito').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateCardForm('cred', 'fb-credito')) return;
    var btn = this.querySelector('.btn-confirm');
    btn.textContent = 'Processando...'; btn.disabled = true;
    setTimeout(function () {
      btn.textContent = 'Pagar com crédito'; btn.disabled = false;
      showConfirmation('credito');
    }, 2000);
  });

  // ── Submit débito ─────────────────────────────────────────────────────────
  document.getElementById('form-debito').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateCardForm('deb', 'fb-debito')) return;
    var btn = this.querySelector('.btn-confirm');
    btn.textContent = 'Processando...'; btn.disabled = true;
    setTimeout(function () {
      btn.textContent = 'Pagar com débito'; btn.disabled = false;
      showConfirmation('debito');
    }, 2000);
  });

  // ── Confirmar presencial ──────────────────────────────────────────────────
  document.getElementById('btn-confirm-presencial').addEventListener('click', function () {
    showConfirmation('presencial');
  });

  // ── Tela de confirmação ───────────────────────────────────────────────────
  function showConfirmation(method) {
    var labels = {
      pix:        { title: 'Pagamento confirmado!',    method: 'PIX' },
      credito:    { title: 'Pagamento aprovado!',      method: 'Cartão de crédito' },
      debito:     { title: 'Pagamento aprovado!',      method: 'Cartão de débito' },
      presencial: { title: 'Agendamento confirmado!',  method: 'Presencial na barbearia' },
    };
    var info = labels[method] || labels['presencial'];

    document.getElementById('confirm-title').textContent = info.title;
    document.getElementById('confirm-desc').textContent =
      method === 'presencial'
        ? 'Seu horário está reservado. Lembre-se de chegar com 5 minutos de antecedência!'
        : 'Seu agendamento está garantido. Você receberá a confirmação por e-mail em breve.';

    var now = new Date();
    var dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

    var details = document.getElementById('confirm-details');
    details.innerHTML = [
      { label: 'Serviço',         value: service.name },
      { label: 'Valor',           value: 'R$ ' + total },
      { label: 'Pagamento',       value: info.method },
      { label: 'Data reservada',  value: dateStr },
      { label: 'Código',          value: '#BLD-' + Math.floor(10000 + Math.random() * 90000) },
    ].map(function (row) {
      return '<div class="confirm-row">' +
        '<span class="confirm-row-label">' + row.label + '</span>' +
        '<span class="confirm-row-value">' + row.value + '</span>' +
        '</div>';
    }).join('');

    showStep('step-confirmation');
  }

});