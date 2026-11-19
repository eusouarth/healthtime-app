function atualizarDataAtual() {
    const elementoData = document.querySelector('.date-text');
    if (!elementoData) return;
    const agora = new Date();
    const opcoes = { weekday: 'long', day: 'numeric', month: 'long' };
    let dataFormatada = agora.toLocaleDateString('pt-BR', opcoes);
    elementoData.textContent = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
}

function mudarTela(idTela) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  
  document.getElementById('screen-' + idTela).classList.add('active');
  event.currentTarget.classList.add('active');

  if (idTela === 'historico') {
    carregarHistoricoDoBanco();
    carregarObservacoesDoApp();
  }
}

let cenarioAtual = 'NORMAL';
let bpm = 72;
let spo2 = 97;
let timerAlerta = null;
let alertaJaEnviado = false;

function setCenario(novoCenario) {
  cenarioAtual = novoCenario;
  const bpmStatusElem = document.getElementById('bpmStatus');
  const alertBanner = document.getElementById('alertBanner');

  cancelarAlerta();
  alertaJaEnviado = false;

  if (novoCenario === 'NORMAL') {
    bpm = 72;
    spo2 = 97;
    bpmStatusElem.innerText = "● Ritmo normal em repouso";
    bpmStatusElem.style.color = "#10b981";
    alertBanner.style.display = 'none';
  } else if (novoCenario === 'TAQUICARDIA') {
    bpm = 138;
    spo2 = 91;
    bpmStatusElem.innerText = "● CRÍTICO: Taquicardia severa";
    bpmStatusElem.style.color = "#f43f5e";
    dispararAlerta("Frequência cardíaca crítica acima de 120 BPM em repouso!");
  } else if (novoCenario === 'QUEDA') {
    bpm = 115;
    spo2 = 93;
    bpmStatusElem.innerText = "● ALERTA: Queda corporal detectada";
    bpmStatusElem.style.color = "#f59e0b";
    dispararAlerta("Impacto brusco e imobilidade identificados pelo acelerômetro MPU-6050!");
  }

  document.getElementById('bpmValue').innerText = bpm;
  document.getElementById('spo2Value').innerText = spo2;
}

setInterval(() => {
  if (cenarioAtual === 'NORMAL') {
    bpm = Math.floor(Math.random() * (76 - 70 + 1)) + 70;
    spo2 = 97;
    document.getElementById('bpmValue').innerText = bpm;
    document.getElementById('spo2Value').innerText = spo2;
  }
}, 3000);

function dispararAlerta(msg) {
  const banner = document.getElementById('alertBanner');
  const txtMsg = document.getElementById('alertMessage');
  const countdown = document.getElementById('countdown');

  if (banner.style.display === 'block') return;

  txtMsg.innerText = msg;
  banner.style.display = 'block';

  let tempo = 5; 
  countdown.innerText = tempo;

  if (!timerAlerta) {
    timerAlerta = setInterval(() => {
      tempo--;
      countdown.innerText = tempo;
      if (tempo <= 0) {
        clearInterval(timerAlerta);
        timerAlerta = null;
        
        if (!alertaJaEnviado) {
          alertaJaEnviado = true;
          salvarAlertaNoBanco(msg);
        }
        cancelarAlerta();
      }
    }, 1000);
  }
}

function cancelarAlerta() {
  if (timerAlerta) {
    clearInterval(timerAlerta);
    timerAlerta = null;
  }
  document.getElementById('alertBanner').style.display = 'none';
}

function salvarAlertaNoBanco(descricao) {
  fetch('api/salvar_alerta.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bpm, spo2, tipo_evento: cenarioAtual, descricao })
  })
  .then(res => res.json())
  .catch(err => console.error("Erro:", err));
}

function carregarHistoricoDoBanco() {
  const lista = document.getElementById('listaHistorico');
  if (!lista) return;
  lista.innerHTML = '<p style="font-size: 0.75rem; color: #94a3b8;">Carregando histórico...</p>';

  fetch(`api/listar_historico.php?t=${Date.now()}`, { cache: 'no-store' })
    .then(res => res.json())
    .then(dados => {
      if (!dados || dados.length === 0) {
        lista.innerHTML = '<p style="font-size: 0.75rem; color: #94a3b8;">Nenhum evento registrado.</p>';
        return;
      }
      lista.innerHTML = '';
      dados.forEach(item => {
        lista.innerHTML += `
          <div class="history-item">
            <div><b>${item.tipo_evento}</b> (${item.bpm} BPM | SpO₂: ${item.spo2}%)</div>
            <div style="color: #64748b; margin: 2px 0;">${item.descricao}</div>
            <div class="history-date">${item.data_hora}</div>
          </div>
        `;
      });
    })
    .catch(() => lista.innerHTML = '<p style="font-size: 0.75rem; color: #f43f5e;">Erro ao carregar.</p>');
}

function carregarObservacoesDoApp() {
  const lista = document.getElementById('listaObservacoes');
  if (!lista) return;
  lista.innerHTML = '<p style="font-size: 0.75rem; color: #94a3b8;">Buscando observações...</p>';

  fetch(`api/listar_observacoes.php?t=${Date.now()}`, { cache: 'no-store' })
    .then(res => res.json())
    .then(dados => {
      if (!dados || dados.length === 0) {
        lista.innerHTML = '<p style="font-size: 0.75rem; color: #94a3b8;">Nenhuma observação médica registrada.</p>';
        return;
      }
      lista.innerHTML = '';
      dados.forEach(item => {
        let textoMensagem = item.texto || item.parecer || item.observacao || item.mensagem || "Observação sem texto";
        let dataHora = item.data_hora || item.data || "Recentemente";

        lista.innerHTML += `
          <div class="history-item" style="border-left: 4px solid #0284c7;">
            <div><b>Parecer Médico:</b> ${textoMensagem}</div>
            <div class="history-date">${dataHora}</div>
          </div>
        `;
      });
    })
    .catch(err => {
      console.error(err);
      lista.innerHTML = '<p style="font-size: 0.75rem; color: #f43f5e;">Erro ao buscar notas.</p>';
    });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
  });
}

document.addEventListener('DOMContentLoaded', () => { 
  atualizarDataAtual(); 
});