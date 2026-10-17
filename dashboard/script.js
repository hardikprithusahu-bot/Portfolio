/* ============================================
   HARDIK SAHU - 8-BIT PORTFOLIO SCRIPTS
   Game layer on top of a normal, readable page.
   ============================================ */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Saved settings (safe if storage is blocked) ---------- */
const store = {
    get(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : JSON.parse(value);
        } catch (e) { return fallback; }
    },
    set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    },
};

/* ---------- 8-bit sound effects, made on the fly (off by default) ---------- */
const Sound = {
    on: store.get('sound', false),
    ctx: null,
    tone(freq, duration, delay = 0, slideTo = null, volume = 0.05) {
        if (!this.on) return;
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const start = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, start);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
        gain.gain.setValueAtTime(volume, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + duration + 0.02);
    },
    coin() { this.tone(988, 0.08); this.tone(1319, 0.3, 0.08); },
    jump() { this.tone(300, 0.2, 0, 760); },
    bump() { this.tone(160, 0.1, 0, 90, 0.07); },
    select() { this.tone(660, 0.05); },
    powerup() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, i * 0.09)); },
    start() { [392, 523, 659, 784, 659, 784].forEach((f, i) => this.tone(f, 0.1, i * 0.08)); },
};

/* ---------- Score, coins and achievements ---------- */
const ACHIEVEMENTS = [
    { id: 'start', name: 'Press start', hint: 'Press the start button.' },
    { id: 'blocks', name: 'Block buster', hint: 'Hit every ? block.' },
    { id: 'explorer', name: 'Explorer', hint: 'Visit every world.' },
    { id: 'quests', name: 'Quest reader', hint: 'Open every quest.' },
    { id: 'palette', name: 'Palette swap', hint: 'Change the color palette.' },
    { id: 'save', name: 'Save file', hint: 'Download the resume.' },
    { id: 'contact', name: 'Player 2 joined', hint: 'Pick a contact option.' },
    { id: 'konami', name: 'Cheater!', hint: 'Enter an old-school secret code.' },
];

const game = {
    score: store.get('score', 0),
    coins: store.get('coins', 0),
    unlocked: new Set(store.get('achievements', [])),
};

function saveGame() {
    store.set('score', game.score);
    store.set('coins', game.coins);
    store.set('achievements', [...game.unlocked]);
}

function renderHud() {
    $('#score').textContent = String(game.score).padStart(6, '0');
    $('#coins').textContent = String(game.coins).padStart(2, '0');
    const count = `${game.unlocked.size}/${ACHIEVEMENTS.length}`;
    $('#ach-count').textContent = count;
    $('#ach-count-2').textContent = count;
    $('.ach-list').innerHTML = ACHIEVEMENTS.map(a => {
        const got = game.unlocked.has(a.id);
        return `<li class="${got ? 'unlocked' : ''}"><i class="fas ${got ? 'fa-trophy' : 'fa-lock'}" aria-hidden="true"></i>
            <div><b>${got ? a.name : '???'}</b><span>${a.hint}</span></div></li>`;
    }).join('');
}

function addCoins(count = 1) {
    game.coins = Math.min(game.coins + count, 99);
    game.score += 100 * count;
    Sound.coin();
    const hudCoins = $('.hud-coins');
    hudCoins.classList.remove('pop');
    void hudCoins.offsetWidth; // restart the animation
    hudCoins.classList.add('pop');
    saveGame();
    renderHud();
}

function unlock(id) {
    if (game.unlocked.has(id)) return;
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    game.unlocked.add(id);
    game.score += 1000;
    saveGame();
    renderHud();
    Sound.powerup();
    toast('★ Achievement unlocked', `${achievement.name}: ${achievement.hint}`);
}

/* ---------- Pop-up messages, shown one at a time ---------- */
const toastQueue = [];
let toastBusy = false;

function toast(title, text) {
    toastQueue.push([title, text]);
    if (!toastBusy) nextToast();
}

function nextToast() {
    const item = toastQueue.shift();
    if (!item) { toastBusy = false; return; }
    toastBusy = true;
    const box = $('.toast');
    $('.toast-title', box).textContent = item[0];
    $('.toast-text', box).textContent = item[1];
    box.classList.add('show');
    setTimeout(() => {
        box.classList.remove('show');
        setTimeout(nextToast, 350);
    }, 2800);
}

/* ---------- Pixel-art character ---------- */
const SPRITE_TOP = [
    '.....HHHHHH.....',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '...HHSSSSSSHH...',
    '...HSSSSSSSSH...',
    '...SSESSSSESS...',
    '...SSSSSSSSSS...',
    '....SSSEESSS....',
    '.....SSSSSS.....',
    '....TTTTTTTT....',
    '...TTTTTTTTTT...',
    '..STTTTTTTTTTS..',
    '..STTTTTTTTTTS..',
    '..SS.TTTTTT.SS..',
];
const LEGS_STAND = ['.....PPPPPP.....', '.....PP..PP.....', '.....PP..PP.....', '....BBB..BBB....'];
const LEGS_STEP = ['.....PPPPPP.....', '....PP....PP....', '...PP......PP...', '..BBB......BBB..'];
const SPRITE_COLORS = { H: 'hair', S: 'skin', E: 'eye', T: 'shirt', P: 'pants', B: 'boots' };

function pixels(rows, top) {
    return rows.map((row, y) => [...row].map((c, x) => c === '.' ? '' :
        `<rect x="${x}" y="${y + top}" width="1.02" height="1.02" fill="var(--spr-${SPRITE_COLORS[c]})"/>`).join('')).join('');
}

function drawSprites() {
    const svg = `<svg viewBox="0 0 16 18" shape-rendering="crispEdges" aria-hidden="true">${pixels(SPRITE_TOP, 0)}
        <g class="legs-a">${pixels(LEGS_STAND, 14)}</g><g class="legs-b">${pixels(LEGS_STEP, 14)}</g></svg>`;
    $$('.sprite').forEach(el => { el.innerHTML = svg; });
}

/* ---------- The ? block mini game ---------- */
function initStage() {
    const stage = $('.stage');
    const player = $('.player');
    const blocks = $$('.qblock');
    const dialog = $('.stage-dialog-text');
    const collected = $('.collected');
    let busy = false;

    function hit(block) {
        if (block.classList.contains('used')) { Sound.bump(); return; }
        block.classList.add('used', 'bump');
        block.setAttribute('aria-label', `Used block: ${block.dataset.stat}`);
        setTimeout(() => block.classList.remove('bump'), 260);

        const coin = document.createElement('span');
        coin.className = 'pop-coin';
        block.appendChild(coin);
        setTimeout(() => coin.remove(), 650);

        addCoins(1);
        dialog.innerHTML = `<strong>${block.dataset.stat}</strong>: ${block.dataset.text}`;
        const chip = document.createElement('li');
        chip.textContent = block.dataset.stat;
        collected.appendChild(chip);
        if (blocks.every(b => b.classList.contains('used'))) {
            setTimeout(() => unlock('blocks'), 500);
        }
    }

    blocks.forEach(block => block.addEventListener('click', () => {
        if (busy) return;
        busy = true;

        // Walk under the block...
        const stageBox = stage.getBoundingClientRect();
        const blockBox = block.getBoundingClientRect();
        const playerBox = player.getBoundingClientRect();
        const target = blockBox.left - stageBox.left + blockBox.width / 2 - playerBox.width / 2;
        const current = playerBox.left - stageBox.left;
        const distance = Math.abs(target - current);
        const walkTime = reduceMotion ? 0 : Math.min(700, distance * 1.6);

        player.classList.toggle('face-left', target < current);
        player.style.transition = `left ${walkTime}ms linear`;
        if (walkTime > 40) player.classList.add('walking');
        player.style.left = `${target}px`;

        // ...then jump and hit it.
        setTimeout(() => {
            player.classList.remove('walking');
            const jumpHeight = playerBox.top - blockBox.bottom;
            player.style.setProperty('--jump', `${Math.max(jumpHeight, 20)}px`);
            Sound.jump();
            if (!reduceMotion) player.classList.add('jump');
            setTimeout(() => hit(block), reduceMotion ? 0 : 250);
            setTimeout(() => { player.classList.remove('jump'); busy = false; }, reduceMotion ? 0 : 520);
        }, walkTime);
    }));
}

/* ---------- Typewriter dialog in the About section ---------- */
function initTyping() {
    const dialog = $('.dialog');
    const typed = $('.typed', dialog);
    const text = typed.dataset.text;
    let index = 0;
    let timer = null;

    const finish = () => {
        clearInterval(timer);
        typed.textContent = text;
        dialog.classList.remove('typing');
    };

    if (reduceMotion) { finish(); return; }

    const start = () => {
        dialog.classList.add('typing');
        timer = setInterval(() => {
            index += 2;
            typed.textContent = text.slice(0, index);
            if (index % 8 === 0) Sound.tone(880, 0.02, 0, null, 0.015);
            if (index >= text.length) finish();
        }, 18);
    };

    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { start(); observer.disconnect(); }
    }, { threshold: 0.4 });
    observer.observe(dialog);
    dialog.addEventListener('click', finish);
}

/* ---------- Worlds: highlight the menu and award coins for exploring ---------- */
function initWorlds() {
    const sections = $$('main section[data-world]');
    const navLinks = $$('.hud-nav a');
    const visited = new Set();

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const id = entry.target.id;
            navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
            if (!visited.has(id)) {
                visited.add(id);
                if (id !== 'top') addCoins(1);
                if (visited.size === sections.length) unlock('explorer');
            }
        });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(section => observer.observe(section));
}

/* ---------- Quest log ---------- */
function initQuests() {
    const quests = $$('.quest');
    const opened = new Set(quests.filter(q => q.open));
    quests.forEach(quest => quest.addEventListener('toggle', () => {
        Sound.select();
        if (quest.open) opened.add(quest);
        if (opened.size === quests.length) unlock('quests');
    }));
}

/* ---------- Inventory tabs and items ---------- */
function initInventory() {
    const tabs = $$('.inv-tabs [role="tab"]');
    const equipped = $('.equipped');

    function select(tab) {
        tabs.forEach(t => {
            const on = t === tab;
            t.setAttribute('aria-selected', String(on));
            t.tabIndex = on ? 0 : -1;
            $(`#${t.getAttribute('aria-controls')}`).hidden = !on;
        });
        Sound.select();
    }

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => select(tab));
        tab.addEventListener('keydown', e => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
            select(next);
            next.focus();
        });
    });

    $$('.slots button').forEach(item => item.addEventListener('click', () => {
        $$('.slots button').forEach(b => b.classList.remove('equipped-item'));
        item.classList.add('equipped-item');
        equipped.innerHTML = '<b>Equipped</b>';
        equipped.append(item.textContent);
        Sound.select();
    }));
}

/* ---------- Contact: continue countdown and menu keys ---------- */
function initContact() {
    const countdown = $('.countdown');
    const text = $('.continue-text');
    const original = text.textContent;
    let timer = null;
    let count = 9;

    const tick = () => {
        count -= 1;
        if (count >= 0) {
            countdown.textContent = count;
            Sound.tone(440, 0.05, 0, null, 0.02);
            return;
        }
        text.textContent = "Just kidding. There's no game over here, I'm always up for a chat. :)";
        text.classList.add('joke');
        clearInterval(timer);
        timer = setTimeout(() => {
            count = 9;
            countdown.textContent = count;
            text.textContent = original;
            text.classList.remove('joke');
            timer = setInterval(tick, 1000);
        }, 4000);
    };

    if (!reduceMotion) {
        new IntersectionObserver(entries => {
            clearInterval(timer);
            clearTimeout(timer);
            if (entries[0].isIntersecting) timer = setInterval(tick, 1000);
        }, { threshold: 0.5 }).observe($('.continue'));
    }

    const links = $$('.menu a');
    links.forEach((link, i) => {
        link.addEventListener('click', () => unlock('contact'));
        link.addEventListener('keydown', e => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            e.preventDefault();
            links[(i + (e.key === 'ArrowDown' ? 1 : links.length - 1)) % links.length].focus();
            Sound.select();
        });
    });
}

/* ---------- Settings: sound, scanlines, palette ---------- */
function applySettings() {
    const root = document.documentElement;
    const soundOn = Sound.on;
    $$('[data-action="sound"]').forEach(b => b.setAttribute('aria-pressed', String(soundOn)));
    const icon = $('.hud-btn[data-action="sound"] i');
    icon.className = `fas ${soundOn ? 'fa-volume-high' : 'fa-volume-xmark'}`;
    $('.opt-sound').textContent = soundOn ? 'On' : 'Off';
    $('.opt-crt').textContent = root.dataset.crt === 'on' ? 'On' : 'Off';
    $('.opt-palette').textContent = root.dataset.palette === 'pocket' ? 'Pocket' : 'Night';
    $('meta[name="theme-color"]').content = root.dataset.palette === 'pocket' ? '#9bbc0f' : '#10102a';
}

/* ---------- Pause menu ---------- */
const pause = {
    el: null,
    lastFocus: null,
    open() {
        this.lastFocus = document.activeElement;
        this.el.hidden = false;
        document.body.style.overflow = 'hidden';
        $('.pause-nav a', this.el).focus();
        Sound.select();
    },
    close() {
        this.el.hidden = true;
        document.body.style.overflow = '';
        if (this.lastFocus) this.lastFocus.focus();
    },
};

/* ---------- Buttons with data-action ---------- */
function initActions() {
    const root = document.documentElement;
    document.addEventListener('click', e => {
        const button = e.target.closest('[data-action]');
        if (!button) return;
        switch (button.dataset.action) {
            case 'start':
                Sound.start();
                unlock('start');
                $('#about').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
                break;
            case 'sound':
                Sound.on = !Sound.on;
                store.set('sound', Sound.on);
                applySettings();
                Sound.coin();
                break;
            case 'crt':
                root.dataset.crt = root.dataset.crt === 'on' ? 'off' : 'on';
                store.set('crt', root.dataset.crt);
                applySettings();
                Sound.select();
                break;
            case 'palette':
                root.dataset.palette = root.dataset.palette === 'pocket' ? 'nes' : 'pocket';
                store.set('palette', root.dataset.palette);
                applySettings();
                Sound.select();
                unlock('palette');
                break;
            case 'menu':
            case 'achievements':
                pause.open();
                break;
            case 'close-menu':
                pause.close();
                break;
        }
    });

    // Close the menu after picking a world, or by clicking the dark backdrop.
    $$('.pause-nav a').forEach(link => link.addEventListener('click', () => pause.close()));
    pause.el.addEventListener('click', e => { if (e.target === pause.el) pause.close(); });

    // Resume download counts as a save file.
    $$('a[download]').forEach(link => link.addEventListener('click', () => unlock('save')));
}

/* ---------- Keyboard: Esc/P pauses, Enter starts, and a secret code ---------- */
function initKeys() {
    const code = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
    let progress = 0;

    document.addEventListener('keydown', e => {
        const key = e.key.toLowerCase();
        const typing = e.target.closest('input, textarea');

        if (key === 'escape') { pause.el.hidden ? pause.open() : pause.close(); return; }
        if (key === 'p' && !typing && pause.el.hidden) { pause.open(); return; }
        if (key === 'enter' && e.target === document.body && window.scrollY < 200) {
            $('[data-action="start"]').click();
            return;
        }

        progress = key === code[progress] ? progress + 1 : (key === code[0] ? 1 : 0);
        if (progress === code.length) {
            progress = 0;
            coinRain();
            addCoins(30);
            unlock('konami');
        }
    });
}

function coinRain() {
    if (reduceMotion) return;
    for (let i = 0; i < 40; i++) {
        const coin = document.createElement('span');
        coin.className = 'rain-coin';
        coin.style.left = `${Math.random() * 100}vw`;
        coin.style.animationDuration = `${1.2 + Math.random() * 1.6}s`;
        coin.style.animationDelay = `${Math.random() * 0.8}s`;
        document.body.appendChild(coin);
        setTimeout(() => coin.remove(), 3800);
    }
}

/* ---------- Choppy reveal as sections scroll in ---------- */
function initReveal() {
    if (reduceMotion) return;
    const items = $$('.world-tag, .section-title, .profile, .about-main, .quest, .cartridge, .inventory, .badge, .continue');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    items.forEach(item => { item.classList.add('reveal'); observer.observe(item); });
}

/* ---------- Start everything ---------- */
document.addEventListener('DOMContentLoaded', () => {
    pause.el = $('#pause');
    drawSprites();
    renderHud();
    applySettings();
    initStage();
    initTyping();
    initWorlds();
    initQuests();
    initInventory();
    initContact();
    initActions();
    initKeys();
    initReveal();
});
