/**
 * Camel Up Shen - 實體桌遊版圖引擎
 * 版權宣告：Copyright © Liyuchiutiger Gongminshen
 * 全面使用 Font Awesome，無一般 emoji
 * 支援 2 ~ 6 位任意真人同機同樂 + 自動由電腦補齊
 */

// ==========================================
// 1. 音效合成系統 (Web Audio API)
// ==========================================
class SoundFX {
  constructor() {
    this.audioCtx = null;
    this.enabled = true;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  playCoin() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  playDiceRoll() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220 + Math.random() * 260, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }, i * 65);
    }
  }

  playCamelStep() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  }

  playFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.4);
    });
  }
}

const soundManager = new SoundFX();

// ==========================================
// 2. 駱駝與遊戲常數設定 (全面 Font Awesome)
// ==========================================
const CAMEL_CONFIGS = [
  { id: 'red', name: '烈焰紅', colorHex: '#e74c3c', colorClass: 'camel-red', dieClass: 'die-red', icon: 'fa-solid fa-horse-head' },
  { id: 'blue', name: '疾風藍', colorHex: '#3498db', colorClass: 'camel-blue', dieClass: 'die-blue', icon: 'fa-solid fa-horse-head' },
  { id: 'green', name: '翠玉綠', colorHex: '#2ecc71', colorClass: 'camel-green', dieClass: 'die-green', icon: 'fa-solid fa-horse-head' },
  { id: 'yellow', name: '閃電黃', colorHex: '#f1c40f', colorClass: 'camel-yellow', dieClass: 'die-yellow', icon: 'fa-solid fa-horse-head' },
  { id: 'purple', name: '幻影紫', colorHex: '#9b59b6', colorClass: 'camel-purple', dieClass: 'die-purple', icon: 'fa-solid fa-horse-head' },
];

const DEFAULT_AI_NAMES = [
  '快樂鯉魚',
  '秋老虎',
  '公民神',
  '資訊神',
  '金利餘',
  '李虞'
];

const TRACK_LENGTH = 16;
const WINNER_REWARDS = [8, 5, 3, 2];

// ==========================================
// 3. 遊戲核心狀態管理
// ==========================================
class CamelUpGame {
  constructor(initialConfigs = null) {
    this.currentConfigs = initialConfigs;
    this.initGame(initialConfigs);
  }

  initGame(playerConfigs = null) {
    if (playerConfigs && playerConfigs.length > 0) {
      this.currentConfigs = playerConfigs;
      this.players = playerConfigs.map((cfg, idx) => ({
        id: idx,
        name: cfg.name,
        isAI: cfg.isAI,
        money: 3,
        legBets: [],
        desertTile: null,
        hasPlacedDesert: false,
        usedOverallWinner: false,
        usedOverallLoser: false
      }));
    } else if (this.currentConfigs && this.currentConfigs.length > 0) {
      this.players = this.currentConfigs.map((cfg, idx) => ({
        id: idx,
        name: cfg.name,
        isAI: cfg.isAI,
        money: 3,
        legBets: [],
        desertTile: null,
        hasPlacedDesert: false,
        usedOverallWinner: false,
        usedOverallLoser: false
      }));
    } else {
      // 預設 1 真人 + 3 電腦
      this.players = [
        { id: 0, name: '玩家 1 (你)', isAI: false, money: 3, legBets: [], desertTile: null, hasPlacedDesert: false, usedOverallWinner: false, usedOverallLoser: false },
        { id: 1, name: '快樂鯉魚', isAI: true, money: 3, legBets: [], desertTile: null, hasPlacedDesert: false, usedOverallWinner: false, usedOverallLoser: false },
        { id: 2, name: '秋老虎', isAI: true, money: 3, legBets: [], desertTile: null, hasPlacedDesert: false, usedOverallWinner: false, usedOverallLoser: false },
        { id: 3, name: '公民神', isAI: true, money: 3, legBets: [], desertTile: null, hasPlacedDesert: false, usedOverallWinner: false, usedOverallLoser: false },
      ];
    }

    this.currentPlayerIndex = 0;
    this.isGameOver = false;
    this.isProcessingAction = false;

    this.track = Array.from({ length: TRACK_LENGTH + 5 }, () => []);
    this.desertTiles = {};
    this.overallWinnerBets = [];
    this.overallLoserBets = [];

    // 起跑位置隨機放置 1~3 格
    CAMEL_CONFIGS.forEach(c => {
      const startPos = Math.floor(Math.random() * 3) + 1;
      this.track[startPos].push(c.id);
    });

    this.resetLeg();
    const humanCount = this.players.filter(p => !p.isAI).length;
    const aiCount = this.players.filter(p => p.isAI).length;
    this.log(`<i class="fa-solid fa-flag-checkered text-gold"></i> 賽事起跑！共 ${this.players.length} 位參賽者（${humanCount} 位真人 + ${aiCount} 位電腦）。`);
  }

  resetLeg() {
    this.pyramidDice = [...CAMEL_CONFIGS.map(c => c.id)];
    this.shuffle(this.pyramidDice);
    this.rolledDiceHistory = [];

    this.legMarket = {};
    CAMEL_CONFIGS.forEach(c => {
      this.legMarket[c.id] = [5, 3, 2];
    });

    this.players.forEach(p => {
      p.legBets = [];
    });
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  getCamelRankings() {
    const ranks = [];
    for (let pos = this.track.length - 1; pos >= 1; pos--) {
      const stack = this.track[pos];
      if (stack && stack.length > 0) {
        for (let i = stack.length - 1; i >= 0; i--) {
          ranks.push({
            camelId: stack[i],
            position: pos,
            height: i
          });
        }
      }
    }
    return ranks;
  }

  getLeaderCamel() {
    const ranks = this.getCamelRankings();
    if (ranks.length > 0) {
      return CAMEL_CONFIGS.find(c => c.id === ranks[0].camelId);
    }
    return null;
  }

  moveCamel(camelId, steps) {
    let currentPos = -1;
    let stackIdx = -1;

    for (let pos = 1; pos < this.track.length; pos++) {
      const idx = this.track[pos].indexOf(camelId);
      if (idx !== -1) {
        currentPos = pos;
        stackIdx = idx;
        break;
      }
    }

    if (currentPos === -1) return { newPos: 1, movingPack: [] };

    const stack = this.track[currentPos];
    const movingPack = stack.splice(stackIdx);
    let targetPos = currentPos + steps;

    let modifierMsg = '';
    if (this.desertTiles[targetPos]) {
      const tile = this.desertTiles[targetPos];
      const tileOwner = this.players.find(p => p.id === tile.ownerId);

      if (tileOwner) {
        tileOwner.money += 1;
        this.log(`<i class="fa-solid fa-tree text-oasis"></i> ${tileOwner.name} 的沙漠板塊被踩中，獲得 <i class="fa-solid fa-coins text-gold"></i> 1 金幣！`);
      }

      if (tile.type === 'oasis') {
        targetPos += 1;
        modifierMsg = '（踩入綠洲！額外前進 1 格！）';
        if (!this.track[targetPos]) this.track[targetPos] = [];
        this.track[targetPos].push(...movingPack);
      } else if (tile.type === 'mirage') {
        targetPos -= 1;
        if (targetPos < 1) targetPos = 1;
        modifierMsg = '（遭遇幻象！後退 1 格並墊在最底下！）';
        if (!this.track[targetPos]) this.track[targetPos] = [];
        this.track[targetPos].unshift(...movingPack);
      }
    } else {
      if (!this.track[targetPos]) this.track[targetPos] = [];
      this.track[targetPos].push(...movingPack);
    }

    soundManager.playCamelStep();

    const camelConfig = CAMEL_CONFIGS.find(c => c.id === camelId);
    const packNames = movingPack.map(id => CAMEL_CONFIGS.find(c => c.id === id).name).join('與');
    this.log(`<i class="fa-solid fa-horse-head" style="color:${camelConfig.colorHex};"></i> ${camelConfig.name} 前進 ${steps} 步 (攜帶 ${packNames}) 到達第 ${targetPos} 格！${modifierMsg}`);

    if (targetPos > TRACK_LENGTH) {
      this.isGameOver = true;
      this.log(`<i class="fa-solid fa-flag-checkered text-gold"></i> 駱駝越過第 16 格終點線！比賽結束，進入終局結算！`);
    }

    return { targetPos, movingPack };
  }

  actionRollPyramid(player) {
    if (this.pyramidDice.length === 0) return null;

    const camelId = this.pyramidDice.pop();
    const rollValue = Math.floor(Math.random() * 3) + 1;
    const camelConfig = CAMEL_CONFIGS.find(c => c.id === camelId);

    player.money += 1;
    soundManager.playCoin();

    this.rolledDiceHistory.push({ camelId, value: rollValue });
    this.log(`<i class="fa-solid fa-dice"></i> ${player.name} 搖動金字塔，開出【${camelConfig.name}】點數 ${rollValue}！賺得 <i class="fa-solid fa-coins text-gold"></i> 1 金幣。`);

    this.moveCamel(camelId, rollValue);
    return { camelId, rollValue };
  }

  actionTakeLegTile(player, camelId) {
    const market = this.legMarket[camelId];
    if (!market || market.length === 0) return false;

    const rewardValue = market.shift();
    player.legBets.push({ camelId, reward: rewardValue });

    const camelConfig = CAMEL_CONFIGS.find(c => c.id === camelId);
    this.log(`<i class="fa-solid fa-ticket"></i> ${player.name} 拿取【${camelConfig.name}】分段彩票 (面額: <i class="fa-solid fa-coins text-gold"></i> ${rewardValue})！`);
    soundManager.playCoin();
    return true;
  }

  actionPlaceDesertTile(player, spaceIndex, type) {
    if (spaceIndex <= 1 || spaceIndex > TRACK_LENGTH) return { success: false, msg: '不能放置在起點格或終點以外！' };
    if (this.track[spaceIndex].length > 0) return { success: false, msg: '該格已有駱駝，無法放置板塊！' };
    
    for (let offset = -1; offset <= 1; offset++) {
      const checkPos = spaceIndex + offset;
      if (this.desertTiles[checkPos] && this.desertTiles[checkPos].ownerId !== player.id) {
        return { success: false, msg: '沙漠板塊之間不能相鄰放置！' };
      }
    }

    if (player.desertTile !== null) {
      delete this.desertTiles[player.desertTile.space];
    }

    this.desertTiles[spaceIndex] = { type, ownerId: player.id };
    player.desertTile = { space: spaceIndex, type };
    player.hasPlacedDesert = true;

    const typeName = type === 'oasis' ? '綠洲 (+1)' : '幻象 (-1)';
    this.log(`<i class="fa-solid fa-campground"></i> ${player.name} 於第 ${spaceIndex} 格擺放了【${typeName}】！`);
    soundManager.playCoin();
    return { success: true };
  }

  actionBetOverallWinner(player, camelId) {
    if (player.usedOverallWinner) return { success: false, msg: `${player.name} 已經預測過總冠軍囉！` };
    player.usedOverallWinner = true;
    this.overallWinnerBets.push({ playerId: player.id, camelId });
    this.log(`<i class="fa-solid fa-award text-gold"></i> ${player.name} 秘密投入了一張【總冠軍】預測卡！`);
    soundManager.playCoin();
    return { success: true };
  }

  actionBetOverallLoser(player, camelId) {
    if (player.usedOverallLoser) return { success: false, msg: `${player.name} 已經預測過總墊底囉！` };
    player.usedOverallLoser = true;
    this.overallLoserBets.push({ playerId: player.id, camelId });
    this.log(`<i class="fa-solid fa-skull"></i> ${player.name} 秘密投入了一張【總墊底】預測卡！`);
    soundManager.playCoin();
    return { success: true };
  }

  evaluateLeg() {
    const rankings = this.getCamelRankings();
    const firstPlace = rankings[0]?.camelId;
    const secondPlace = rankings[1]?.camelId;

    const details = [];

    this.players.forEach(p => {
      let earned = 0;
      let lost = 0;

      p.legBets.forEach(bet => {
        if (bet.camelId === firstPlace) {
          earned += bet.reward;
        } else if (bet.camelId === secondPlace) {
          earned += 1;
        } else {
          lost += 1;
        }
      });

      const net = earned - lost;
      p.money = Math.max(0, p.money + net);

      details.push({
        player: p,
        earned,
        lost,
        net,
        newBalance: p.money
      });
    });

    return {
      firstPlace: CAMEL_CONFIGS.find(c => c.id === firstPlace),
      secondPlace: CAMEL_CONFIGS.find(c => c.id === secondPlace),
      details
    };
  }

  evaluateGameEnd() {
    const legSummary = this.evaluateLeg();

    const rankings = this.getCamelRankings();
    const championId = rankings[0]?.camelId;
    const loserId = rankings[rankings.length - 1]?.camelId;

    const winnerResults = [];
    let rewardIdx = 0;
    this.overallWinnerBets.forEach(bet => {
      const p = this.players.find(pl => pl.id === bet.playerId);
      if (bet.camelId === championId) {
        const reward = WINNER_REWARDS[rewardIdx] || 1;
        p.money += reward;
        winnerResults.push({ player: p, reward, correct: true, camelId: bet.camelId });
        rewardIdx++;
      } else {
        p.money = Math.max(0, p.money - 1);
        winnerResults.push({ player: p, reward: -1, correct: false, camelId: bet.camelId });
      }
    });

    const loserResults = [];
    rewardIdx = 0;
    this.overallLoserBets.forEach(bet => {
      const p = this.players.find(pl => pl.id === bet.playerId);
      if (bet.camelId === loserId) {
        const reward = WINNER_REWARDS[rewardIdx] || 1;
        p.money += reward;
        loserResults.push({ player: p, reward, correct: true, camelId: bet.camelId });
        rewardIdx++;
      } else {
        p.money = Math.max(0, p.money - 1);
        loserResults.push({ player: p, reward: -1, correct: false, camelId: bet.camelId });
      }
    });

    const finalLeaderboard = [...this.players].sort((a, b) => b.money - a.money);

    return {
      champion: CAMEL_CONFIGS.find(c => c.id === championId),
      loser: CAMEL_CONFIGS.find(c => c.id === loserId),
      legSummary,
      winnerResults,
      loserResults,
      finalLeaderboard
    };
  }

  nextPlayer() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }

  log(htmlMsg) {
    const time = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    const logBox = document.getElementById('game-log-box');
    if (!logBox) return;

    const entry = document.createElement('div');
    entry.className = 'broadcast-line';
    entry.innerHTML = `<span class="broadcast-time">[${time}]</span><span class="broadcast-msg">${htmlMsg}</span>`;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
  }
}

// ==========================================
// 4. UI 渲染與桌遊版圖佈局控制器
// ==========================================
class UIController {
  constructor() {
    this.game = new CamelUpGame();
    this.initDOM();
    this.initMascot();
    this.bindEvents();
    this.populateSelects();
    this.render();
  }

  initDOM() {
    this.dom = {
      currentPlayerDisplay: document.getElementById('current-player-display'),
      legDiceProgress: document.getElementById('leg-dice-progress'),
      currentLeaderDisplay: document.getElementById('current-leader-display'),
      gameStatusText: document.getElementById('game-status-text'),
      playersGrid: document.getElementById('players-grid'),
      
      // 環形賽道槽位
      trackRowTop: document.getElementById('track-row-top'),
      trackColLeft: document.getElementById('track-col-left'),
      trackColRight: document.getElementById('track-col-right'),
      trackRowBottom: document.getElementById('track-row-bottom'),

      legTilesMarket: document.getElementById('leg-tiles-market'),
      desertTargetSpace: document.getElementById('desert-target-space'),
      winnerBetsCount: document.getElementById('winner-bets-count'),
      loserBetsCount: document.getElementById('loser-bets-count'),
      btnRollPyramid: document.getElementById('btn-roll-pyramid'),
      pyramidInteractiveTrigger: document.getElementById('pyramid-interactive-trigger'),
      btnPlaceDesert: document.getElementById('btn-place-desert'),
      btnBetWinner: document.getElementById('btn-bet-overall-winner'),
      btnBetLoser: document.getElementById('btn-bet-overall-loser'),
      selectWinner: document.getElementById('select-overall-winner'),
      selectLoser: document.getElementById('select-overall-loser'),
      latestDieBox: document.getElementById('latest-die-box'),
      diceHistoryList: document.getElementById('dice-history-list'),
      
      modalLegSummary: document.getElementById('modal-leg-summary'),
      legSummaryContent: document.getElementById('leg-summary-content'),
      btnNextLeg: document.getElementById('btn-next-leg'),
      modalGameOver: document.getElementById('modal-game-over'),
      gameOverContent: document.getElementById('game-over-content'),
      btnPlayAgain: document.getElementById('btn-play-again'),
      modalRules: document.getElementById('modal-rules'),
      btnHowToPlay: document.getElementById('btn-how-to-play'),
      btnCloseRules: document.getElementById('btn-close-rules'),
      btnOkRules: document.getElementById('btn-ok-rules'),
      btnSoundToggle: document.getElementById('btn-sound-toggle'),
      soundStatusText: document.getElementById('sound-status-text'),
      btnRestart: document.getElementById('btn-restart'),
      btnClearLog: document.getElementById('btn-clear-log'),
      mascot: document.getElementById('mascot-container'),

      // 人數與參賽者設定 Modal
      modalPlayerSetup: document.getElementById('modal-player-setup'),
      btnPlayerSetup: document.getElementById('btn-player-setup'),
      btnCloseSetup: document.getElementById('btn-close-setup'),
      btnConfirmSetup: document.getElementById('btn-confirm-setup'),
      setupTotalPlayers: document.getElementById('setup-total-players'),
      setupHumanPlayers: document.getElementById('setup-human-players'),
      setupPlayersList: document.getElementById('setup-players-list')
    };
  }

  populateSelects() {
    this.dom.selectWinner.innerHTML = '';
    this.dom.selectLoser.innerHTML = '';
    CAMEL_CONFIGS.forEach(c => {
      const optW = document.createElement('option');
      optW.value = c.id;
      optW.innerText = `${c.name} (${c.name.slice(-1)}色)`;
      this.dom.selectWinner.appendChild(optW);

      const optL = document.createElement('option');
      optL.value = c.id;
      optL.innerText = `${c.name} (${c.name.slice(-1)}色)`;
      this.dom.selectLoser.appendChild(optL);
    });
  }

  bindEvents() {
    // 規則說明
    this.dom.btnHowToPlay.addEventListener('click', () => {
      this.dom.modalRules.style.display = 'flex';
    });
    this.dom.btnCloseRules.addEventListener('click', () => {
      this.dom.modalRules.style.display = 'none';
    });
    this.dom.btnOkRules.addEventListener('click', () => {
      this.dom.modalRules.style.display = 'none';
    });

    // 玩家人數設定 Modal 打開與關閉
    this.dom.btnPlayerSetup.addEventListener('click', () => {
      this.openSetupModal();
    });
    this.dom.btnCloseSetup.addEventListener('click', () => {
      this.dom.modalPlayerSetup.style.display = 'none';
    });

    // 設定選單連動更新
    this.dom.setupTotalPlayers.addEventListener('change', () => {
      this.updateHumanPlayersOptions();
      this.renderSetupList();
    });
    this.dom.setupHumanPlayers.addEventListener('change', () => {
      this.renderSetupList();
    });

    // 確認儲存設定並開始新局
    this.dom.btnConfirmSetup.addEventListener('click', () => {
      this.applyPlayerSetup();
    });

    // 音效切換
    this.dom.btnSoundToggle.addEventListener('click', () => {
      soundManager.enabled = !soundManager.enabled;
      this.dom.soundStatusText.innerText = soundManager.enabled ? '音效: 開' : '音效: 關';
      this.dom.btnSoundToggle.querySelector('i').className = soundManager.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    });

    // 重啟新局
    this.dom.btnRestart.addEventListener('click', () => {
      if (confirm('確定要放棄當前戰局，重新開始一局嗎？')) {
        this.game.initGame();
        this.render();
      }
    });

    this.dom.btnClearLog.addEventListener('click', () => {
      document.getElementById('game-log-box').innerHTML = '';
    });

    // 點擊搖骰按鈕或金字塔本體
    const triggerRoll = () => {
      this.handleHumanAction(() => {
        this.executeRollPyramid();
      });
    };
    this.dom.btnRollPyramid.addEventListener('click', triggerRoll);
    this.dom.pyramidInteractiveTrigger.addEventListener('click', triggerRoll);

    // 擺放沙漠板塊
    this.dom.btnPlaceDesert.addEventListener('click', () => {
      this.handleHumanAction(() => {
        const type = document.querySelector('input[name="desert-type"]:checked').value;
        const space = parseInt(this.dom.desertTargetSpace.value, 10);
        const player = this.game.players[this.game.currentPlayerIndex];
        const res = this.game.actionPlaceDesertTile(player, space, type);
        if (!res.success) {
          alert(res.msg);
          return false;
        }
        return true;
      });
    });

    // 押總冠軍
    this.dom.btnBetWinner.addEventListener('click', () => {
      this.handleHumanAction(() => {
        const camelId = this.dom.selectWinner.value;
        const player = this.game.players[this.game.currentPlayerIndex];
        const res = this.game.actionBetOverallWinner(player, camelId);
        if (!res.success) {
          alert(res.msg);
          return false;
        }
        return true;
      });
    });

    // 押總墊底
    this.dom.btnBetLoser.addEventListener('click', () => {
      this.handleHumanAction(() => {
        const camelId = this.dom.selectLoser.value;
        const player = this.game.players[this.game.currentPlayerIndex];
        const res = this.game.actionBetOverallLoser(player, camelId);
        if (!res.success) {
          alert(res.msg);
          return false;
        }
        return true;
      });
    });

    this.dom.btnNextLeg.addEventListener('click', () => {
      this.dom.modalLegSummary.style.display = 'none';
      this.game.resetLeg();
      this.game.nextPlayer();
      this.render();
      this.checkAITurn();
    });

    this.dom.btnPlayAgain.addEventListener('click', () => {
      this.dom.modalGameOver.style.display = 'none';
      this.game.initGame();
      this.render();
    });
  }

  // 開啟玩家人數配置視窗
  openSetupModal() {
    const total = this.game.players.length;
    const humanCount = this.game.players.filter(p => !p.isAI).length;

    this.dom.setupTotalPlayers.value = total;
    this.updateHumanPlayersOptions(humanCount);
    this.renderSetupList();
    this.dom.modalPlayerSetup.style.display = 'flex';
  }

  // 根據總人數動態更新真人人數選單 (1 ~ 總人數)
  updateHumanPlayersOptions(preferredVal = null) {
    const total = parseInt(this.dom.setupTotalPlayers.value, 10);
    const prevVal = preferredVal || parseInt(this.dom.setupHumanPlayers.value, 10) || 1;

    this.dom.setupHumanPlayers.innerHTML = '';
    for (let h = 1; h <= total; h++) {
      const opt = document.createElement('option');
      opt.value = h;
      opt.innerText = `${h} 位真人玩家 ${h === total ? '(全真人同樂)' : ''}`;
      if (h === prevVal || (prevVal > total && h === total)) {
        opt.selected = true;
      }
      this.dom.setupHumanPlayers.appendChild(opt);
    }
  }

  // 渲染配置清單預覽與真人暱稱輸入框
  renderSetupList() {
    const total = parseInt(this.dom.setupTotalPlayers.value, 10);
    const humanCount = parseInt(this.dom.setupHumanPlayers.value, 10);

    this.dom.setupPlayersList.innerHTML = '';
    let aiIndex = 0;

    for (let i = 0; i < total; i++) {
      const row = document.createElement('div');
      row.className = 'setup-player-item';

      const isHuman = i < humanCount;
      if (isHuman) {
        const defaultName = (this.game.players[i] && !this.game.players[i].isAI)
          ? this.game.players[i].name
          : `玩家 ${i + 1}`;

        row.innerHTML = `
          <span class="setup-player-index">#${i + 1}</span>
          <span class="setup-player-type-badge tag-human">
            <i class="fa-solid fa-user"></i> 真人
          </span>
          <input type="text" class="setup-player-input" data-idx="${i}" value="${defaultName}" placeholder="輸入自訂暱稱" maxlength="12">
        `;
      } else {
        const aiName = DEFAULT_AI_NAMES[aiIndex % DEFAULT_AI_NAMES.length];
        aiIndex++;
        row.innerHTML = `
          <span class="setup-player-index">#${i + 1}</span>
          <span class="setup-player-type-badge tag-ai">
            <i class="fa-solid fa-robot"></i> 電腦
          </span>
          <span class="setup-player-ai-text">${aiName} (AI 智慧助手)</span>
        `;
      }
      this.dom.setupPlayersList.appendChild(row);
    }
  }

  // 套用人數配置並啟動新局
  applyPlayerSetup() {
    const total = parseInt(this.dom.setupTotalPlayers.value, 10);
    const humanCount = parseInt(this.dom.setupHumanPlayers.value, 10);
    const inputs = this.dom.setupPlayersList.querySelectorAll('.setup-player-input');

    const newConfigs = [];
    let aiIndex = 0;

    for (let i = 0; i < total; i++) {
      if (i < humanCount) {
        const nameVal = inputs[i] ? inputs[i].value.trim() : '';
        newConfigs.push({
          name: nameVal || `玩家 ${i + 1}`,
          isAI: false
        });
      } else {
        const aiName = DEFAULT_AI_NAMES[aiIndex % DEFAULT_AI_NAMES.length];
        aiIndex++;
        newConfigs.push({
          name: aiName,
          isAI: true
        });
      }
    }

    this.dom.modalPlayerSetup.style.display = 'none';
    this.game.initGame(newConfigs);
    this.render();
  }

  // 處理目前行動
  handleHumanAction(actionCallback) {
    if (this.game.isGameOver || this.game.isProcessingAction) return;
    const currentPlayer = this.game.players[this.game.currentPlayerIndex];
    if (currentPlayer.isAI) return;

    const success = actionCallback();
    if (success !== false) {
      this.finishTurn();
    }
  }

  executeRollPyramid() {
    this.game.isProcessingAction = true;
    soundManager.playDiceRoll();

    const pyramidCone = document.getElementById('pyramid-cone');
    const pyramidIcon = pyramidCone.querySelector('.pyramid-icon-main');
    pyramidIcon.classList.add('shaking');

    setTimeout(() => {
      pyramidIcon.classList.remove('shaking');
      const currentPlayer = this.game.players[this.game.currentPlayerIndex];
      const rollRes = this.game.actionRollPyramid(currentPlayer);

      if (rollRes) {
        const camelConfig = CAMEL_CONFIGS.find(c => c.id === rollRes.camelId);
        this.dom.latestDieBox.innerHTML = `
          <div class="die-cube die-pop" style="background:${camelConfig.colorHex};">
            ${rollRes.rollValue}
          </div>
        `;
      }

      this.game.isProcessingAction = false;
      this.finishTurn();
    }, 600);

    return false;
  }

  finishTurn() {
    this.render();

    if (this.game.isGameOver) {
      soundManager.playFanfare();
      setTimeout(() => this.showGameOverModal(), 700);
      return;
    }

    if (this.game.pyramidDice.length === 0) {
      soundManager.playFanfare();
      setTimeout(() => this.showLegSummaryModal(), 600);
      return;
    }

    this.game.nextPlayer();
    this.render();
    this.checkAITurn();
  }

  checkAITurn() {
    if (this.game.isGameOver) return;
    const currentPlayer = this.game.players[this.game.currentPlayerIndex];

    if (currentPlayer.isAI) {
      this.dom.btnRollPyramid.disabled = true;
      this.game.isProcessingAction = true;

      const aiDelays = 850 + Math.random() * 450;
      setTimeout(() => {
        this.executeAIDecision(currentPlayer);
      }, aiDelays);
    } else {
      this.dom.btnRollPyramid.disabled = false;
    }
  }

  executeAIDecision(aiPlayer) {
    const rankings = this.game.getCamelRankings();
    const leader = rankings[0]?.camelId;

    if (leader && this.game.legMarket[leader] && this.game.legMarket[leader].length === 3 && Math.random() < 0.6) {
      this.game.actionTakeLegTile(aiPlayer, leader);
      this.game.isProcessingAction = false;
      this.finishTurn();
      return;
    }

    const leaderRank = rankings[0];
    if (leaderRank && leaderRank.position >= 12 && !aiPlayer.usedOverallWinner && Math.random() < 0.35) {
      this.game.actionBetOverallWinner(aiPlayer, leader);
      this.game.isProcessingAction = false;
      this.finishTurn();
      return;
    }

    this.executeRollPyramid();
  }

  showLegSummaryModal() {
    const summary = this.game.evaluateLeg();
    let rowsHtml = '';

    summary.details.forEach(item => {
      const netClass = item.net >= 0 ? 'score-gain' : 'score-loss';
      const sign = item.net >= 0 ? '+' : '';
      rowsHtml += `
        <div class="score-row">
          <div>
            <strong>${item.player.name}</strong>
            <span style="font-size:0.8rem; color:#a4b0be; margin-left:6px;">(彩票獲利: ${item.earned}，失誤扣分: ${item.lost})</span>
          </div>
          <div class="${netClass}">
            ${sign}${item.net} 金幣 <i class="fa-solid fa-coins text-gold"></i> 現有 ${item.newBalance}
          </div>
        </div>
      `;
    });

    this.dom.legSummaryContent.innerHTML = `
      <div style="margin-bottom:14px; text-align:center;">
        <span style="font-size:1.1rem; color:#ffd700;">
          <i class="fa-solid fa-crown"></i> 本分段第一名：<strong>${summary.firstPlace?.name}</strong>
        </span>
        <span style="font-size:0.95rem; color:#a4b0be; margin-left:14px;">
          第二名：<strong>${summary.secondPlace?.name}</strong>
        </span>
      </div>
      <div class="summary-score-list">
        ${rowsHtml}
      </div>
    `;

    this.dom.modalLegSummary.style.display = 'flex';
  }

  showGameOverModal() {
    const result = this.game.evaluateGameEnd();

    let leaderboardHtml = '';
    const rankIcons = [
      '<i class="fa-solid fa-medal text-gold" style="font-size:1.2rem;"></i>',
      '<i class="fa-solid fa-medal" style="font-size:1.2rem; color:#bdc3c7;"></i>',
      '<i class="fa-solid fa-medal" style="font-size:1.2rem; color:#cd7f32;"></i>',
      '<i class="fa-solid fa-award" style="font-size:1.1rem; color:#95a5a6;"></i>',
      '<i class="fa-solid fa-award" style="font-size:1.1rem; color:#7f8c8d;"></i>',
      '<i class="fa-solid fa-award" style="font-size:1.1rem; color:#7f8c8d;"></i>'
    ];

    result.finalLeaderboard.forEach((p, idx) => {
      leaderboardHtml += `
        <div class="score-row" style="background:${idx === 0 ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255,255,255,0.05)'};">
          <div style="display:flex; align-items:center; gap:8px;">
            ${rankIcons[idx] || '<i class="fa-solid fa-award"></i>'}
            <strong style="font-size:1.05rem;">${p.name}</strong>
            <span style="font-size:0.75rem; color:#a4b0be;">(${p.isAI ? '電腦' : '真人'})</span>
          </div>
          <div class="score-gain" style="font-size:1.15rem;">
            <i class="fa-solid fa-coins text-gold"></i> ${p.money} 金幣
          </div>
        </div>
      `;
    });

    this.dom.gameOverContent.innerHTML = `
      <div style="text-align:center; margin-bottom:18px;">
        <h3 style="color:#ffd700; font-size:1.35rem; margin-bottom:6px;">
          <i class="fa-solid fa-trophy"></i> 冠軍駱駝：${result.champion?.name}！
        </h3>
        <p style="color:#a4b0be; font-size:0.95rem;">
          <i class="fa-solid fa-skull"></i> 總墊底駱駝：${result.loser?.name}
        </p>
      </div>

      <h4 style="color:#f3c26b; margin-bottom:8px;"><i class="fa-solid fa-ranking-star"></i> 玩家身價總排名：</h4>
      <div class="summary-score-list">
        ${leaderboardHtml}
      </div>
    `;

    this.dom.modalGameOver.style.display = 'flex';
  }

  // 渲染單一格子
  renderTileElement(space) {
    const tile = document.createElement('div');
    tile.className = 'circuit-tile';
    if (space === 1) tile.classList.add('tile-is-start');
    if (space === TRACK_LENGTH) tile.classList.add('tile-is-finish');

    let badgeIcon = `<i class="fa-solid fa-hashtag"></i> ${space}`;
    if (space === 1) badgeIcon = `<i class="fa-solid fa-flag"></i> 起點 (1)`;
    if (space === TRACK_LENGTH) badgeIcon = `<i class="fa-solid fa-flag-checkered"></i> 終點 (16)`;

    let modifierHtml = '';
    if (this.game.desertTiles[space]) {
      const d = this.game.desertTiles[space];
      const isOasis = d.type === 'oasis';
      modifierHtml = `
        <div class="circuit-modifier ${isOasis ? 'mod-oasis' : 'mod-mirage'}">
          <i class="fa-solid ${isOasis ? 'fa-droplet' : 'fa-wind'}"></i> ${isOasis ? '綠洲 +1' : '幻象 -1'}
        </div>
      `;
    }

    const camelsInSpace = this.game.track[space] || [];
    let camelsHtml = '';
    camelsInSpace.forEach((camelId, idx) => {
      const config = CAMEL_CONFIGS.find(c => c.id === camelId);
      camelsHtml += `
        <div class="camel-wood-block ${config.colorClass}">
          <span><i class="${config.icon}"></i> ${config.name}</span>
          <span class="stack-level-badge">層 ${idx + 1}</span>
        </div>
      `;
    });

    const isCrowded = camelsInSpace.length >= 4;

    tile.innerHTML = `
      <div class="tile-number-banner">${badgeIcon}</div>
      ${modifierHtml}
      <div class="camels-block-stack ${isCrowded ? 'stack-crowded' : ''}">
        ${camelsHtml}
      </div>
    `;
    return tile;
  }

  render() {
    const currentPlayer = this.game.players[this.game.currentPlayerIndex];
    this.dom.currentPlayerDisplay.innerHTML = `
      <i class="fa-solid ${currentPlayer.isAI ? 'fa-robot' : 'fa-user'}"></i>
      ${currentPlayer.name} ${currentPlayer.isAI ? '(電腦思考中)' : '(輪到你行動)'}
    `;
    this.dom.currentPlayerDisplay.style.color = currentPlayer.isAI ? '#d299ea' : '#55efc4';

    this.dom.legDiceProgress.innerText = `剩餘 ${this.game.pyramidDice.length} / 5 顆`;

    const leader = this.game.getLeaderCamel();
    this.dom.currentLeaderDisplay.innerText = leader ? leader.name : '準備起跑';

    // 1. 渲染環形賽道四個分區
    // 頂橫排：1 ~ 6
    this.dom.trackRowTop.innerHTML = '';
    for (let space = 1; space <= 6; space++) {
      this.dom.trackRowTop.appendChild(this.renderTileElement(space));
    }

    // 右豎排：7, 8
    this.dom.trackColRight.innerHTML = '';
    for (let space = 7; space <= 8; space++) {
      this.dom.trackColRight.appendChild(this.renderTileElement(space));
    }

    // 底橫排：14, 13, 12, 11, 10, 9
    this.dom.trackRowBottom.innerHTML = '';
    for (let space = 14; space >= 9; space--) {
      this.dom.trackRowBottom.appendChild(this.renderTileElement(space));
    }

    // 左豎排：16 (終點), 15
    this.dom.trackColLeft.innerHTML = '';
    this.dom.trackColLeft.appendChild(this.renderTileElement(16));
    this.dom.trackColLeft.appendChild(this.renderTileElement(15));

    // 2. 渲染玩家桌位面板 (動態支援 2~6 人)
    this.dom.playersGrid.innerHTML = '';
    this.game.players.forEach(p => {
      const isActive = p.id === this.game.currentPlayerIndex;
      const card = document.createElement('div');
      card.className = `player-board-card ${isActive ? 'active-turn' : ''}`;

      const betsSummary = p.legBets.length > 0
        ? p.legBets.map(b => `${CAMEL_CONFIGS.find(c => c.id === b.camelId).name}(${b.reward})`).join('、')
        : '無';

      const desertInfo = p.desertTile ? `第 ${p.desertTile.space} 格 (${p.desertTile.type === 'oasis' ? '+1' : '-1'})` : '尚未擺放';

      card.innerHTML = `
        <div class="player-card-header">
          <div class="player-name-wrapper">
            <span class="badge-tag ${p.isAI ? 'tag-ai' : 'tag-human'}">
              <i class="fa-solid ${p.isAI ? 'fa-robot' : 'fa-user'}"></i> ${p.isAI ? 'AI' : '真人'}
            </span>
            <span class="player-name-text">${p.name}</span>
          </div>
          <div class="player-purse">
            <i class="fa-solid fa-coins"></i> ${p.money}
          </div>
        </div>
        <div class="player-assets">
          <span class="asset-pill"><i class="fa-solid fa-ticket"></i> 分段卡: ${betsSummary}</span>
          <span class="asset-pill"><i class="fa-solid fa-campground"></i> 沙漠: ${desertInfo}</span>
        </div>
      `;
      this.dom.playersGrid.appendChild(card);
    });

    // 3. 渲染左側彩票架
    this.dom.legTilesMarket.innerHTML = '';
    const isHumanTurn = !currentPlayer.isAI;

    CAMEL_CONFIGS.forEach(c => {
      const marketVals = this.game.legMarket[c.id] || [];
      const topVal = marketVals.length > 0 ? marketVals[0] : null;

      const slot = document.createElement('div');
      slot.className = 'leg-rack-slot';
      slot.innerHTML = `
        <div class="leg-slot-info">
          <span class="camel-color-badge" style="background:${c.colorHex};"></span>
          <span>${c.name}</span>
        </div>
        <button class="btn-leg-card" data-camel="${c.id}" ${(!topVal || !isHumanTurn || this.game.isProcessingAction) ? 'disabled' : ''}>
          <i class="fa-solid fa-ticket"></i> ${topVal ? `${topVal} 金幣卡` : '已抽完'}
        </button>
      `;

      const btn = slot.querySelector('.btn-leg-card');
      if (topVal && isHumanTurn) {
        btn.addEventListener('click', () => {
          this.handleHumanAction(() => {
            return this.game.actionTakeLegTile(currentPlayer, c.id);
          });
        });
      }

      this.dom.legTilesMarket.appendChild(slot);
    });

    // 4. 沙漠空格選單更新
    const currentSelectedVal = this.dom.desertTargetSpace.value;
    this.dom.desertTargetSpace.innerHTML = '';
    for (let space = 2; space < TRACK_LENGTH; space++) {
      if (this.game.track[space].length === 0) {
        const option = document.createElement('option');
        option.value = space;
        option.innerText = `第 ${space} 格`;
        this.dom.desertTargetSpace.appendChild(option);
      }
    }
    if (currentSelectedVal) {
      this.dom.desertTargetSpace.value = currentSelectedVal;
    }

    // 5. 本分段已擲出歷史
    if (this.game.rolledDiceHistory.length === 0) {
      this.dom.diceHistoryList.innerHTML = '<span class="no-dice-hint">本分段尚未出骰</span>';
    } else {
      this.dom.diceHistoryList.innerHTML = '';
      this.game.rolledDiceHistory.forEach(item => {
        const c = CAMEL_CONFIGS.find(cfg => cfg.id === item.camelId);
        const pill = document.createElement('span');
        pill.className = 'tray-die-pill';
        pill.style.background = c.colorHex;
        pill.innerHTML = `<i class="fa-solid fa-dice"></i> ${c.name}: ${item.value}`;
        this.dom.diceHistoryList.appendChild(pill);
      });
    }

    // 6. 更新投注計數
    this.dom.winnerBetsCount.innerText = `已投: ${this.game.overallWinnerBets.length} 張`;
    this.dom.loserBetsCount.innerText = `已投: ${this.game.overallLoserBets.length} 張`;

    // 7. 按鈕狀態：根據當前行動者（若是真人，檢查該真人的資格；若是電腦則停用）
    this.dom.btnRollPyramid.disabled = !isHumanTurn || this.game.isProcessingAction;
    this.dom.btnPlaceDesert.disabled = !isHumanTurn || this.game.isProcessingAction;
    this.dom.btnBetWinner.disabled = !isHumanTurn || currentPlayer.usedOverallWinner || this.game.isProcessingAction;
    this.dom.btnBetLoser.disabled = !isHumanTurn || currentPlayer.usedOverallLoser || this.game.isProcessingAction;
  }

  // ==========================================
  // 5. 吉祥物任意拖曳引擎 (無框無對話框)
  // ==========================================
  initMascot() {
    const mascot = this.dom.mascot;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    mascot.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = mascot.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      mascot.style.transition = 'none';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      const maxLeft = window.innerWidth - mascot.offsetWidth;
      const maxTop = window.innerHeight - mascot.offsetHeight;

      newLeft = Math.max(10, Math.min(newLeft, maxLeft - 10));
      newTop = Math.max(10, Math.min(newTop, maxTop - 10));

      mascot.style.left = `${newLeft}px`;
      mascot.style.top = `${newTop}px`;
      mascot.style.bottom = 'auto';
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        mascot.style.transition = 'transform 0.1s ease';
      }
    });

    mascot.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      isDragging = true;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;

      const rect = mascot.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      mascot.style.transition = 'none';
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      const maxLeft = window.innerWidth - mascot.offsetWidth;
      const maxTop = window.innerHeight - mascot.offsetHeight;

      newLeft = Math.max(10, Math.min(newLeft, maxLeft - 10));
      newTop = Math.max(10, Math.min(newTop, maxTop - 10));

      mascot.style.left = `${newLeft}px`;
      mascot.style.top = `${newTop}px`;
      mascot.style.bottom = 'auto';
    }, { passive: false });

    window.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        mascot.style.transition = 'transform 0.1s ease';
      }
    });
  }
}

// 啟動遊戲
document.addEventListener('DOMContentLoaded', () => {
  window.camelApp = new UIController();
});
