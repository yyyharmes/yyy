const RAW_PLAYERS = Array.isArray(window.PLAYER_POOL) ? window.PLAYER_POOL : [];
const STORY_DATA = window.STORY_DATA || { honglou: [], zhenhuan: [], relations: {} };

const POSITION_NAMES = {
  Q201330: ["门将", "goalkeeper"], Q280658: ["前锋", "forward"], Q8025128: ["边锋", "winger"],
  Q193592: ["中场", "midfielder"], Q18691898: ["防守型中场", "defensive midfielder"],
  Q6008848: ["中前卫", "central midfielder"], Q90326494: ["进攻型中场", "attacking midfielder"],
  Q268258: ["边后卫", "full-back"], Q336286: ["中后卫", "centre-back"], Q1489923: ["清道夫", "sweeper"],
};
const CLUB_NAMES = {
  Q7156: ["巴塞罗那", "Barcelona"], Q8682: ["皇家马德里", "Real Madrid"], Q9617: ["阿森纳", "Arsenal"],
  Q9616: ["切尔西", "Chelsea"], Q18656: ["曼联", "Manchester United"], Q1130849: ["利物浦", "Liverpool"],
  Q50602: ["曼城", "Manchester City"], Q1543: ["AC米兰", "AC Milan"], Q631: ["国际米兰", "Inter Milan"],
  Q1422: ["尤文图斯", "Juventus"], Q483020: ["巴黎圣日耳曼", "Paris Saint-Germain"],
  Q15789: ["拜仁慕尼黑", "Bayern Munich"], Q41420: ["多特蒙德", "Borussia Dortmund"],
  Q16844931: ["迈阿密国际", "Inter Miami"], Q267245: ["本菲卡", "Benfica"], Q24711: ["阿贾克斯", "Ajax"],
};

function normalize(value = "") {
  return String(value).toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f\s·.'’`()（）\-—_]/g, "");
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function hasChinese(value = "") { return /[\u3400-\u9fff]/.test(value); }
function intersection(a = [], b = []) { const set = new Set(a); return [...new Set(b)].filter((value) => set.has(value)); }
function pairKey(a, b) { return [normalize(a), normalize(b)].sort().join("::"); }
function storyPairKey(a, b) { return [a, b].sort().join("|"); }
function hashNumber(source = "") {
  let hash = 2166136261;
  for (const character of String(source)) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}
function deterministicNoise(a, b) { return (hashNumber(`${a.id}:${b.id}`) % 420) / 100; }

function prepareFootballPool() {
  const players = RAW_PLAYERS.map((player) => ({ ...player, teams: player.teams || [], positions: player.positions || [], countries: player.countries || [] }));
  const badXavi = players.findIndex((player) => normalize(player.en) === "xavi" && !player.teams.length);
  if (badXavi >= 0) players.splice(badXavi, 1);
  if (!players.some((player) => ["xavihernandez", "xavihernández"].includes(normalize(player.en)))) {
    players.unshift({ id: "curated-xavi", name: "哈维·埃尔南德斯", en: "Xavi Hernández", birth: 1980, countries: ["Q29"], positions: ["Q193592"], teams: ["Q7156"], popularity: 6000 });
  }
  if (!players.some((player) => normalize(player.en) === "joaofelix")) {
    players.unshift({ id: "curated-joao-felix", name: "若昂·菲利克斯", en: "João Félix", birth: 1999, countries: ["Q45"], positions: ["Q90326494", "Q280658"], teams: ["Q267245", "Q9616", "Q7156"], popularity: 5600 });
  }
  return players;
}

const PLAYERS = prepareFootballPool();
const FOOTBALL_BY_EN = new Map(PLAYERS.map((player) => [normalize(player.en), player]));

const FOOTBALL_PREFERRED = {
  哈维: "xavihernandez", 萨内蒂: "javierzanetti", 菲利克斯: "joaofelix", 梅西: "lionelmessi",
  罗纳尔多: "ronaldo", 大罗: "ronaldo", 小罗: "ronaldinho", 姆巴佩: "kylianmbappe", 内马尔: "neymar",
  贝克汉姆: "davidbeckham", 维埃拉: "patrickvieira", 马尔蒂尼: "paolomaldini", 齐达内: "zinedinezidane",
};

const FOOTBALL_RELATIONS = new Map();
function addFootballRelation(a, b, strength, zh, en) { FOOTBALL_RELATIONS.set(pairKey(a, b), { strength, zh, en }); }
addFootballRelation("Lionel Messi", "Neymar", .96, "两人曾在巴塞罗那与巴黎圣日耳曼并肩，也保持广为人知的公开友谊。", "They played together at Barcelona and Paris Saint-Germain and share a widely documented friendship.");
addFootballRelation("Lionel Messi", "Luis Suárez", .96, "两人既是长期搭档，也是公开关系亲密的场外好友。", "They were long-term teammates and remain close, publicly documented friends.");
addFootballRelation("Lionel Messi", "Sergio Agüero", .93, "两人的阿根廷国家队经历与长期公开友谊紧密相连。", "Their Argentina history is closely tied to a long public friendship.");
addFootballRelation("Cristiano Ronaldo", "Marcelo Vieira", .92, "两人在皇家马德里长期并肩，赛场默契也延伸为公开友谊。", "They played together for years at Real Madrid and developed a public friendship.");
addFootballRelation("Kylian Mbappé", "Achraf Hakimi", .93, "两人曾是巴黎圣日耳曼队友，也因频繁公开互动而被视为好友。", "They were Paris Saint-Germain teammates and are widely regarded as friends.");
addFootballRelation("Declan Rice", "Mason Mount", .91, "两人的友谊可追溯到少年时期。", "Their friendship stretches back to youth football.");
addFootballRelation("David Beckham", "Gary Neville", .90, "两人从曼联青训队友一路延续到共同参与足球投资。", "Their relationship runs from Manchester United academy teammates to football investment.");
addFootballRelation("Yaya Touré", "Kolo Touré", .98, "两人是亲兄弟，也都在顶级足球舞台留下重要经历。", "They are brothers who both built major careers.");
addFootballRelation("Peter Schmeichel", "Kasper Schmeichel", .99, "两人是父子，并都以顶级门将身份受到关注。", "They are father and son, both recognised goalkeepers.");
addFootballRelation("Paolo Maldini", "Daniel Maldini", .99, "两人是父子，延续了米兰的家族足球传承。", "They are father and son in a prominent Milan football dynasty.");
addFootballRelation("Lilian Thuram", "Marcus Thuram", .99, "两人是父子，职业生涯横跨两代法国足球。", "They are father and son across two generations of French football.");
addFootballRelation("Lilian Thuram", "Khéphren Thuram", .99, "两人是父子，职业生涯横跨两代法国足球。", "They are father and son across two generations of French football.");
addFootballRelation("Rio Ferdinand", "Anton Ferdinand", .98, "两人是兄弟，职业履历都与英格兰足球紧密相连。", "They are brothers whose careers are closely tied to English football.");
addFootballRelation("Frank de Boer", "Ronald de Boer", .99, "两人是双胞胎兄弟，也有多段共同效力经历。", "They are twin brothers with several shared chapters as teammates.");

const FOOTBALL_PROFILES = {
  lionelmessi: {
    zh: "梅西在巴塞罗那成长为进攻核心，以低重心盘带、连续变向、传射选择和禁区前创造力定义了一个时代。离开巴萨后先后效力巴黎圣日耳曼与迈阿密国际，并率阿根廷赢得美洲杯和世界杯。",
    en: "Lionel Messi became Barcelona's attacking reference through close control, rapid changes of direction, playmaking and finishing. He later played for Paris Saint-Germain and Inter Miami and led Argentina to Copa América and World Cup titles.",
    zhTags: ["世界杯冠军", "巴萨传奇", "持球核心"], enTags: ["World champion", "Barcelona legend", "Creative hub"],
  },
  cristianoronaldo: {
    zh: "C罗从曼联的突破型边锋成长为皇家马德里的历史级终结者，之后效力尤文图斯并重返曼联。速度、弹跳、无球跑动、双脚射门与头球让他能在不同联赛持续高产。",
    en: "Cristiano Ronaldo evolved from a dribbling winger at Manchester United into a historic scorer at Real Madrid, then played for Juventus and returned to United. Pace, movement, aerial power and two-footed finishing sustained his output across leagues.",
    zhTags: ["欧冠射手", "跨联赛巨星", "全能终结"], enTags: ["Champions League scorer", "Cross-league star", "Complete finisher"],
  },
  patrickvieira: {
    zh: "维埃拉从戛纳登陆意甲后，在阿森纳迎来巅峰并长期担任队长，是温格时代和“无敌之师”的中场支柱；之后又效力尤文图斯、国际米兰与曼城，并随法国赢得1998年世界杯和2000年欧洲杯。身材高大、对抗强硬，兼具大范围覆盖、拦截、带球推进和由守转攻能力，是典型的防守型“兽腰”。",
    en: "Patrick Vieira peaked as Arsenal captain and the midfield pillar of Arsène Wenger's Invincibles, later playing for Juventus, Inter and Manchester City. A 1998 World Cup and Euro 2000 winner with France, he combined size, duelling, ball-winning, huge coverage and driving transitions as an archetypal powerhouse defensive midfielder.",
    zhTags: ["阿森纳队长", "防守型兽腰", "世界杯冠军"], enTags: ["Arsenal captain", "Powerhouse No. 6", "World champion"],
  },
  xavihernandez: {
    zh: "哈维出自拉玛西亚，长期担任巴塞罗那与西班牙的中场节拍器，是传控体系的核心人物。他以观察、接应、短传角度和比赛节奏管理见长，随队完成俱乐部六冠王，并赢得世界杯和两届欧洲杯。",
    en: "A La Masia graduate, Xavi became the tempo-setter for Barcelona and Spain. His scanning, support angles, short passing and rhythm control powered Barcelona's sextuple and Spain's World Cup and two European Championship titles.",
    zhTags: ["巴萨传奇", "中场节拍器", "传控核心"], enTags: ["Barcelona legend", "Tempo-setter", "Possession master"],
  },
  javierzanetti: {
    zh: "萨内蒂在国际米兰效力近二十年并长期担任队长，能胜任左右边后卫与中场，是2010年三冠王的重要领袖。强悍体能、稳定推进、纪律性和极高出勤率构成了他的鲜明标签。",
    en: "Javier Zanetti spent nearly two decades at Inter and served as long-time captain, covering both full-back roles and midfield. A leader of the 2010 treble side, he was defined by stamina, disciplined carrying and extraordinary reliability.",
    zhTags: ["国米队长", "三冠王", "钢铁体能"], enTags: ["Inter captain", "Treble winner", "Elite stamina"],
  },
  zinedinezidane: {
    zh: "齐达内先后在波尔多、尤文图斯和皇家马德里效力，以停球、转身、护球和对节奏的控制成为古典前腰代表。他率法国赢得1998年世界杯和2000年欧洲杯，也留下欧冠决赛凌空抽射等经典瞬间。",
    en: "Zinedine Zidane played for Bordeaux, Juventus and Real Madrid, becoming an archetypal playmaker through first touch, turns, shielding and tempo control. He led France to the 1998 World Cup and Euro 2000 and produced iconic Champions League moments.",
    zhTags: ["法国核心", "古典前腰", "大赛先生"], enTags: ["France icon", "Classic playmaker", "Big-game player"],
  },
  ronaldo: {
    zh: "罗纳尔多在埃因霍温、巴塞罗那、国际米兰和皇家马德里等队留下足迹，巅峰期把爆发、钟摆过人和门前冷静结合到极致。他两夺世界杯冠军，并在重伤后重返世界之巅。",
    en: "Ronaldo played for PSV, Barcelona, Inter and Real Madrid, combining explosive acceleration, stepovers and calm finishing at his peak. He won two World Cups and returned to the top level after major knee injuries.",
    zhTags: ["外星人", "世界杯金靴", "爆发型中锋"], enTags: ["O Fenômeno", "World Cup Golden Boot", "Explosive striker"],
  },
  ronaldinho: {
    zh: "罗纳尔迪尼奥在巴黎圣日耳曼崭露头角，于巴塞罗那达到巅峰并赢得金球奖和欧冠，之后效力AC米兰。他以牛尾巴、假动作、无视野传球和极强即兴创造力，把街头足球的快乐带入最高舞台。",
    en: "Ronaldinho emerged at Paris Saint-Germain, peaked at Barcelona with the Ballon d'Or and Champions League, and later played for AC Milan. Elastico dribbles, disguise, no-look passes and improvisation brought street-football joy to the elite game.",
    zhTags: ["金球先生", "巴萨传奇", "即兴大师"], enTags: ["Ballon d'Or", "Barcelona legend", "Improvisation master"],
  },
  paolomaldini: {
    zh: "马尔蒂尼整个欧洲顶级生涯都献给AC米兰，横跨三个年代并多次赢得欧冠。既能踢左后卫也能踢中卫，他依靠预判、站位、步伐与一对一防守化解威胁，是优雅防守的代表。",
    en: "Paolo Maldini spent his entire elite European career with AC Milan, spanning three decades and winning multiple European Cups. At left-back or centre-back, anticipation, positioning, footwork and one-v-one defending made him an emblem of elegant defence.",
    zhTags: ["一人一城", "米兰队长", "防守艺术"], enTags: ["One-club icon", "Milan captain", "Defensive art"],
  },
  davidbeckham: {
    zh: "贝克汉姆出自曼联92班，在三冠王赛季成为右路关键人物，之后效力皇家马德里、洛杉矶银河、AC米兰与巴黎圣日耳曼。精准长传、传中和任意球是他的核心武器。",
    en: "David Beckham emerged from Manchester United's Class of '92 and was central to the treble side, later playing for Real Madrid, LA Galaxy, AC Milan and Paris Saint-Germain. Long passing, crossing and free kicks defined his game.",
    zhTags: ["曼联92班", "传中大师", "任意球专家"], enTags: ["Class of '92", "Crossing master", "Free-kick expert"],
  },
  andresiniesta: {
    zh: "伊涅斯塔出自巴塞罗那青训，是俱乐部与西班牙黄金时代的中场核心。他以狭小空间摆脱、方向变化、持球推进和关键传球著称，并在2010年世界杯决赛打入制胜球。",
    en: "A Barcelona academy graduate, Andrés Iniesta was central to the club and Spain's golden era. Tight-space escapes, changes of direction, carrying and final passes defined him, capped by the 2010 World Cup-winning goal.",
    zhTags: ["世界杯决赛英雄", "巴萨传奇", "空间大师"], enTags: ["World Cup final hero", "Barcelona legend", "Space manipulator"],
  },
  lukamodric: {
    zh: "莫德里奇从萨格勒布迪纳摩、热刺走到皇家马德里，在欧冠王朝中长期掌控中场，并率克罗地亚闯入世界杯决赛。外脚背传球、抗压转身、跑动覆盖和攻守节奏切换是其招牌。",
    en: "Luka Modrić moved from Dinamo Zagreb and Tottenham to Real Madrid, controlling midfield through a Champions League dynasty and leading Croatia to a World Cup final. Outside-foot passing, press resistance, coverage and tempo shifts are his signatures.",
    zhTags: ["金球先生", "皇马中场", "外脚背大师"], enTags: ["Ballon d'Or", "Madrid midfield", "Outside-foot master"],
  },
};

const UI = {
  football: {
    zh: { brand: "人物谜局", eyebrow: "RELATION RADAR", title: "猜球星", attempts: "已猜次数", best: "最高相似", ready: "等待第一次猜测", search: "输入球员中文名", guess: "猜测", empty: "从一个熟悉的名字开始", howTitle: "只凭相似度找答案", howCopy: "每次输入只显示你写下的姓名和综合相似度。计算会使用职业轨迹、时代影响与公开足球关系，不直接展示位置、年龄、俱乐部或国籍。", rules: ["猜测次数不限；系统无法匹配时也会返回相似度。", "前10次不显示提示，第11次起显示关系；重猜只在原词条补提示。", "重复猜测不增加次数；第50次后可以投降查看答案。"], settings: "设置", start: "开始挑战", locked: "还差 {n} 次可投降", surrender: "投降看答案", status: "第 {n} 次追踪", done: "答案已揭晓", solved: "恭喜猜中", revealed: "答案揭晓", solvedIn: "你用 {n} 次猜测找到了神秘球员。", surrenderedIn: "你在第 {n} 次猜测后查看了答案。", result: "我在人物谜局用 {n} 次猜中了 {name}！" },
    en: { brand: "IDENTITY PUZZLE", eyebrow: "RELATION RADAR", title: "GUESS THE FOOTBALLER", attempts: "GUESSES", best: "BEST SIMILARITY", ready: "Waiting for your first guess", search: "Enter a footballer's name", guess: "Guess", empty: "Start with a familiar name", howTitle: "Find the answer by similarity", howCopy: "Each entry shows exactly what you typed and an overall similarity score. Career paths, era and public football relationships stay hidden behind the score.", rules: ["Guesses are unlimited; unknown names still receive a score.", "The first 10 guesses show no hints. From guess 11, relationship lines appear in the original row.", "Duplicate guesses do not increase the count. Surrender unlocks after 50 guesses."], settings: "Settings", start: "Start challenge", locked: "{n} more to surrender", surrender: "Surrender & reveal", status: "Tracking guess {n}", done: "Answer revealed", solved: "YOU FOUND IT", revealed: "ANSWER REVEALED", solvedIn: "You found the mystery footballer in {n} guesses.", surrenderedIn: "You revealed the answer after {n} guesses.", result: "I found {name} in {n} guesses on Identity Puzzle!" },
  },
  honglou: { zh: { brand: "红楼谜局", eyebrow: "一百二十回人物关系", title: "猜红楼人物", attempts: "已猜次数", best: "最高相似", ready: "等待第一次猜测", search: "输入红楼人物中文名", guess: "猜测", empty: "从一个熟悉的人物开始", howTitle: "沿着120回人物关系找答案", howCopy: "相似度综合剧情同场、家族与院落、关键事件和人物关系计算。猜测中不直接展示身份资料。", rules: ["猜测次数不限，输入不完整姓名也会按大众称呼匹配。", "前10次不显示提示，第11次起显示剧情关系；重猜只在原词条补提示。", "可以随时投降并查看答案。"], settings: "", start: "开始挑战", locked: "还差 {n} 次可投降", surrender: "投降看答案", status: "第 {n} 次寻踪", done: "答案已揭晓", solved: "恭喜猜中", revealed: "答案揭晓", solvedIn: "你用 {n} 次猜测找到了神秘人物。", surrenderedIn: "你在第 {n} 次猜测后查看了答案。", result: "我在红楼谜局用 {n} 次猜中了{name}！" } },
  zhenhuan: { zh: { brand: "宫墙谜局", eyebrow: "宫廷人物关系", title: "猜甄嬛传人物", attempts: "已猜次数", best: "最高相似", ready: "等待第一次猜测", search: "输入甄嬛传人物中文名", guess: "猜测", empty: "从一个熟悉的人物开始", howTitle: "凭剧情相似度找答案", howCopy: "相似度综合宫廷阵营、人物关系、居所、剧情事件与出场阶段计算；游戏中不显示关系提示。", rules: ["猜测次数不限，姓名或常用称谓可按大众习惯匹配。", "每次只显示你输入的内容和相似度，不出现关联提示。", "可以随时投降并查看答案。"], settings: "", start: "开始挑战", locked: "还差 {n} 次可投降", surrender: "投降看答案", status: "第 {n} 次推演", done: "答案已揭晓", solved: "恭喜猜中", revealed: "答案揭晓", solvedIn: "你用 {n} 次猜测找到了神秘人物。", surrenderedIn: "你在第 {n} 次猜测后查看了答案。", result: "我在宫墙谜局用 {n} 次猜中了{name}！" } },
};

const CONFIG = {
  football: { pool: PLAYERS, hintsAfter: 10, surrenderAt: 50, language: true },
  honglou: { pool: (STORY_DATA.honglou || []).filter((person) => (person.weight || 0) > 1), hintsAfter: 10, surrenderAt: 0, language: false },
  zhenhuan: { pool: STORY_DATA.zhenhuan || [], hintsAfter: null, surrenderAt: 0, language: false },
};

const $ = (selector) => document.querySelector(selector);
const elements = {
  home: $("#homeView"), game: $("#gameView"), gameActions: $("#gameActions"), back: $("#backBtn"), brand: $("#brandBtn"), brandText: $("#brandText"),
  howBtn: $("#howToPlayBtn"), settingsBtn: $("#settingsBtn"), settingsLabel: $("#settingsLabel"), input: $("#playerInput"), guess: $("#guessBtn"), guessLabel: $("#guessLabel"),
  list: $("#guessList"), empty: $("#emptyState"), emptyTitle: $("#emptyTitle"), victory: $("#victoryCard"), attempts: $("#attemptCount"), attemptLabel: $("#attemptLabel"),
  best: $("#bestScore"), bestLabel: $("#bestLabel"), status: $("#roundStatus"), reveal: $("#revealBtn"), title: $("#pageTitle"), eyebrow: $("#gameEyebrow"), searchLabel: $("#searchLabel"),
  howDialog: $("#howToDialog"), closeHow: $("#closeHowToBtn"), howTitle: $("#howTitle"), howCopy: $("#howCopy"), ruleList: $("#ruleList"), start: $("#startBtn"),
  settingsDialog: $("#settingsDialog"), closeSettings: $("#closeSettingsBtn"), toast: $("#toast"),
};

let activeGame = null;
let language = localStorage.getItem("relation-puzzle-language") === "en" ? "en" : "zh";
let target = null;
let guesses = [];
let attempts = 0;
let finished = false;
let revealReason = "solved";
let lastGuessKey = "";
let toastTimer;

function currentLanguage() { return activeGame === "football" ? language : "zh"; }
function copy() { return UI[activeGame]?.[currentLanguage()] || UI.football.zh; }
function format(text, values = {}) { return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), text); }
function localeName(person) { return activeGame === "football" && language === "en" ? person.en : person.name; }
function currentConfig() { return CONFIG[activeGame]; }

function randomUnit() {
  if (window.crypto?.getRandomValues) { const values = new Uint32Array(1); window.crypto.getRandomValues(values); return values[0] / 4294967296; }
  return Math.random();
}
function chooseTarget(pool) {
  if (!pool.length) return null;
  const weights = pool.map((person, index) => activeGame === "football" ? (index < 350 ? 4 : index < 1100 ? 2 : 1) : (person.weight || 1));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = randomUnit() * total;
  for (let index = 0; index < pool.length; index += 1) { cursor -= weights[index]; if (cursor <= 0) return pool[index]; }
  return pool.at(-1);
}

function footballCandidateScore(player, query, raw) {
  const name = normalize(language === "en" ? player.en : player.name);
  if (name === query) return 100000 + (player.popularity || 0);
  if (language === "zh" && FOOTBALL_PREFERRED[raw] && normalize(player.en) === FOOTBALL_PREFERRED[raw]) return 95000 + (player.popularity || 0);
  if (name.endsWith(query)) return 70000 + (player.popularity || 0);
  if (name.includes(query)) return 50000 + (player.popularity || 0);
  return -1;
}
function findFootball(raw) {
  const query = normalize(raw);
  if (!query) return null;
  if (language === "zh" && FOOTBALL_PREFERRED[raw]) {
    const preferred = FOOTBALL_BY_EN.get(FOOTBALL_PREFERRED[raw]);
    if (preferred) return preferred;
  }
  const candidates = PLAYERS.map((player) => ({ player, score: footballCandidateScore(player, query, raw) })).filter((row) => row.score >= 0).sort((a, b) => b.score - a.score);
  return candidates[0]?.player || null;
}
function findStory(raw) {
  const query = normalize(raw);
  if (!query) return null;
  const candidates = currentConfig().pool.map((person, index) => {
    const terms = [person.name, ...(person.aliases || [])];
    let score = -1;
    for (const term of terms) {
      const normalized = normalize(term);
      if (normalized === query) score = Math.max(score, 100000);
      else if (normalized.endsWith(query)) score = Math.max(score, 70000);
      else if (normalized.includes(query)) score = Math.max(score, 50000);
    }
    return { person, score: score < 0 ? -1 : score + (person.weight || 1) * 100 - index / 1000 };
  }).filter((row) => row.score >= 0).sort((a, b) => b.score - a.score);
  return candidates[0]?.person || null;
}
function makeFreeEntry(raw) {
  const query = normalize(raw);
  return activeGame === "football"
    ? { id: `free-${query}`, name: raw, en: raw, birth: null, countries: [], positions: [], teams: [], popularity: 0, free: true }
    : { id: `free-${query}`, name: raw, aliases: [], groups: [], events: [], timeline: [0, 0], links: [], bio: "", tags: [], weight: 0, free: true };
}
function resolveEntry(raw) { return (activeGame === "football" ? findFootball(raw) : findStory(raw)) || makeFreeEntry(raw); }

function footballSimilarity(player, answer) {
  if (player.id === answer.id) return 100;
  if (player.free) return .6 + (hashNumber(`${player.id}:${answer.id}`) % 118000) / 10000;
  let score = 3.5 + deterministicNoise(player, answer);
  const sharedTeams = intersection(player.teams, answer.teams).length;
  if (sharedTeams) score += 18 + Math.min(15, sharedTeams * 4.2);
  if (intersection(player.countries, answer.countries).length) score += 12;
  if (intersection(player.positions, answer.positions).length) score += 8;
  if (player.birth && answer.birth) score += Math.max(0, 12 - Math.abs(player.birth - answer.birth) * .8);
  const playerRank = Math.max(0, PLAYERS.indexOf(player));
  const answerRank = Math.max(0, PLAYERS.indexOf(answer));
  score += Math.max(0, 9 - Math.abs(playerRank - answerRank) / 150);
  if (playerRank < 350 && answerRank < 350) score += 4.5;
  const relation = FOOTBALL_RELATIONS.get(pairKey(player.en, answer.en));
  if (relation) score += 25 * relation.strength;
  return Math.min(99.8721, Math.max(.15, score));
}
function timelineAffinity(a = [0, 0], b = [0, 0]) {
  if (!a[0] || !b[0]) return 0;
  const overlap = Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]) + 1);
  if (overlap) return Math.min(14, 6 + overlap * .8);
  const gap = Math.max(a[0], b[0]) - Math.min(a[1], b[1]);
  return Math.max(0, 7 - gap * .25);
}
function storyTextSignals(person, answer) {
  const query = normalize(person.name);
  const references = [];
  for (const candidate of currentConfig().pool) {
    const matchedTerm = [candidate.name, ...(candidate.aliases || [])]
      .map((term) => normalize(term))
      .filter((term) => term.length >= 2 && query.includes(term))
      .sort((a, b) => b.length - a.length)[0];
    if (matchedTerm) references.push({ person: candidate, term: matchedTerm });
  }
  references.sort((a, b) => b.term.length - a.term.length || (b.person.weight || 1) - (a.person.weight || 1));
  const structuredTerms = [answer.name, ...(answer.aliases || []), ...(answer.groups || []), ...(answer.events || []), ...(answer.tags || []), ...(answer.links || [])]
    .map((term) => normalize(term)).filter(Boolean);
  const directClue = structuredTerms.filter((term) => term.length >= 2 && query.includes(term)).sort((a, b) => b.length - a.length)[0] || "";
  const grams = query.length < 2 ? [query] : [...new Set(Array.from({ length: query.length - 1 }, (_, index) => query.slice(index, index + 2)))];
  const sharedGrams = grams.filter((gram) => structuredTerms.some((term) => term.includes(gram)));
  const semanticWords = ["丫鬟", "侍女", "宫女", "太监", "皇帝", "皇后", "妃", "王爷", "公主", "贾府", "大观园", "宁国府", "荣国府", "甄家", "皇族", "姐妹", "夫妻", "母亲", "父亲", "女儿", "儿子", "哥哥", "妹妹"];
  const answerText = normalize([...structuredTerms, answer.bio || ""].join(""));
  const sharedWords = semanticWords.filter((word) => query.includes(normalize(word)) && answerText.includes(normalize(word)));
  return { references, directClue, grams, sharedGrams, sharedWords };
}
function storyTextSimilarity(person, answer) {
  const signals = storyTextSignals(person, answer);
  let score = .35 + (hashNumber(`${person.id}:${answer.id}`) % 30000) / 10000;
  for (const reference of signals.references.slice(0, 6)) {
    score = Math.max(score, storySimilarity(reference.person, answer) * .82);
  }
  if (signals.directClue) score = Math.max(score, 44 + Math.min(24, signals.directClue.length * 3));
  if (signals.sharedGrams.length) {
    const ratio = signals.sharedGrams.length / Math.max(1, signals.grams.length);
    score += Math.min(28, ratio * 18 + signals.sharedGrams.length * 3);
  }
  score += Math.min(18, signals.sharedWords.length * 7.5);
  return Math.min(89.8721, Math.max(.15, score));
}
function storySimilarity(person, answer) {
  if (person.id === answer.id) return 100;
  if (person.free) return storyTextSimilarity(person, answer);
  let score = 2.5 + deterministicNoise(person, answer);
  const groups = intersection(person.groups, answer.groups).length;
  const events = intersection(person.events, answer.events).length;
  if (groups) score += 10 + Math.min(20, groups * 7);
  if (events) score += 8 + Math.min(24, events * 6);
  score += timelineAffinity(person.timeline, answer.timeline);
  if (person.links?.includes(answer.name) || answer.links?.includes(person.name)) score += 16;
  const relation = STORY_DATA.relations?.[activeGame]?.[storyPairKey(person.name, answer.name)];
  if (relation) score += 25;
  if ((person.weight || 1) > 1 && (answer.weight || 1) > 1) score += 4;
  return Math.min(99.8721, Math.max(.15, score));
}
function similarity(person, answer) { return activeGame === "football" ? footballSimilarity(person, answer) : storySimilarity(person, answer); }

function variedHint(options, person, answer, salt = "") {
  return options[hashNumber(`${person.id}:${answer.id}:${salt}`) % options.length];
}

function footballHint(player, answer, score) {
  if (player.id === answer.id) return language === "en" ? "This is the mystery answer." : "这就是本局答案。";
  if (player.free) return variedHint(language === "en" ? [
    "No documented football link emerges from this entry.",
    "This entry does not reveal a verifiable career connection to the answer.",
    "The available football record offers no clear bridge from this entry to the answer."
  ] : [
    "这次输入暂未指向可核实的足球交集。",
    "现有职业资料里，尚未找到这次输入与答案之间的明确桥梁。",
    "这条线索没有落到可确认的球队、赛事或人物关系上。"
  ], player, answer, "free");
  const relation = FOOTBALL_RELATIONS.get(pairKey(player.en, answer.en));
  if (relation) return relation[language];
  const sharedTeamIds = intersection(player.teams, answer.teams);
  if (sharedTeamIds.length) {
    const team = CLUB_NAMES[sharedTeamIds[0]]?.[language === "en" ? 1 : 0];
    return variedHint(language === "en" ? [
      team ? `Both careers passed through ${team}.` : "Their club or team careers crossed at the same stop.",
      team ? `${team} is a shared point on their career maps.` : "A shared team is the clearest bridge between their careers.",
      team ? `Their dressing-room histories overlap at ${team}.` : "Their public career records include the same football setup."
    ] : [
      team ? `两人的职业履历都经过${team}。` : "两人的俱乐部或球队履历曾在同一站交汇。",
      team ? `${team}是两人生涯中的共同坐标。` : "同一支球队是两人职业轨迹里最明确的交点。",
      team ? `二人的更衣室足迹曾在${team}重合。` : "两人的公开履历里出现过同一足球阵营。"
    ], player, answer, "team");
  }
  if (intersection(player.countries, answer.countries).length) return variedHint(language === "en" ? [
    "They come from the same national-team football background.",
    "A shared football nation links their international profiles.",
    "Their international identities point to the same national setup."
  ] : [
    "两人的国家队背景来自同一条足球脉络。",
    "相同的足球国别，是两人履历中的共同线索。",
    "二人的国际赛场身份指向同一国家队体系。"
  ], player, answer, "country");
  if (player.birth && answer.birth && Math.abs(player.birth - answer.birth) <= 4) return variedHint(language === "en" ? [
    "They rose within roughly the same football generation.",
    "Their prime years belong to a similar era of the game.",
    "Their career timelines place them in the same football age."
  ] : [
    "两人的成长与成名阶段处在相近的足球年代。",
    "二人的生涯黄金期大致属于同一代足坛。",
    "从时间线看，两人活跃在相近的职业足球时期。"
  ], player, answer, "era");
  if (score >= 28) return variedHint(language === "en" ? [
    "Their career maps overlap indirectly, although no close public relationship is documented.",
    "Several football-context clues align, but not through a direct documented link.",
    "The similarity comes from parallel career context rather than a known personal connection."
  ] : [
    "两人的足球履历存在侧面重合，但未发现明确的直接关系。",
    "若干职业背景线索相近，不过并非来自可确认的直接交集。",
    "这份相似度主要来自平行的生涯背景，而不是已知的人物关系。"
  ], player, answer, "indirect");
  return variedHint(language === "en" ? [
    "No direct public football relationship appears in the available record.",
    "Their known career paths remain far apart in the current data.",
    "The available record offers little evidence of a direct football connection."
  ] : [
    "现有公开记录中，暂未发现两人的直接足球关联。",
    "从已收录的职业轨迹看，两人的交集相当有限。",
    "现有资料不足以把两人连到同一条明确的足球关系线上。"
  ], player, answer, "distant");
}
function storyHint(person, answer) {
  if (person.id === answer.id) return "这就是本局答案。";
  if (person.free) {
    const signals = storyTextSignals(person, answer);
    const reference = signals.references
      .sort((a, b) => storySimilarity(b.person, answer) - storySimilarity(a.person, answer))[0];
    if (reference?.person.id === answer.id) return "输入内容中包含了与答案相符的人物称呼。";
    if (reference) return `输入中提到了“${reference.person.name}”；${storyHint(reference.person, answer)}`;
    if (signals.directClue) return `输入内容命中了与答案相关的“${signals.directClue}”线索。`;
    if (signals.sharedWords.length) return `输入内容与答案共享“${signals.sharedWords[0]}”这一人物或剧情特征。`;
    if (signals.sharedGrams.length) return variedHint([
      "输入文字与答案的人物称谓或剧情标签存在部分重合。",
      "这段文字碰到了答案称谓或剧情标签中的一部分。",
      "文字层面出现了少量可与答案对照的称谓线索。"
    ], person, answer, "text-overlap");
    return variedHint([
      "这次输入尚未落到答案已有的剧情线索上。",
      "现有剧情资料里，还找不到这段文字与目标人物的明确交点。",
      "这条文字线索暂时没有连到答案的人物关系网。",
      "从当前收录的事件与人物关系看，这次输入离答案较远。"
    ], person, answer, "text-distant");
  }
  const direct = STORY_DATA.relations?.[activeGame]?.[storyPairKey(person.name, answer.name)];
  if (direct) return direct;
  const events = intersection(person.events, answer.events);
  const namedEvent = events.find((event) => !/^第\d+回$/.test(event));
  if (namedEvent) return variedHint([
    `二人的命运都被卷入“${namedEvent}”这条剧情线。`,
    `“${namedEvent}”是两人故事轨迹中的共同节点。`,
    `顺着“${namedEvent}”这段情节，可以找到二人的交集。`,
    `两人的人物线都曾因“${namedEvent}”发生转折或汇合。`
  ], person, answer, `event:${namedEvent}`);
  const sharedChapter = events.find((event) => /^第\d+回$/.test(event));
  if (sharedChapter) return variedHint([
    `二人的人物线都在“${sharedChapter}”留下了线索。`,
    `“${sharedChapter}”同时出现了与二人有关的叙事。`,
    `在“${sharedChapter}”的相关情节中，两人的故事轨迹发生重合。`,
    `沿着“${sharedChapter}”回看，可以发现二人处在同一段人物叙事里。`
  ], person, answer, `chapter:${sharedChapter}`);
  const bridge = intersection(person.links, answer.links).find((name) => name !== person.name && name !== answer.name);
  if (bridge) return variedHint([
    `二人的故事线都与“${bridge}”相连。`,
    `“${bridge}”是串起两人人物关系的一处关键节点。`,
    `顺着“${bridge}”的人物线，可以分别找到二人的剧情位置。`,
    `两人的关系网都经过“${bridge}”，但各自承担的剧情作用不同。`
  ], person, answer, `bridge:${bridge}`);
  const groups = intersection(person.groups, answer.groups);
  if (groups.length) return variedHint([
    `二人同处“${groups[0]}”人物网络，但身份和作用并不相同。`,
    `“${groups[0]}”是两人共同所在的人物阵营。`,
    `两人的剧情都从“${groups[0]}”这条人物线延伸出来。`,
    `若从“${groups[0]}”的人物关系入手，可以同时找到二人的位置。`
  ], person, answer, `group:${groups[0]}`);
  if (person.links?.includes(answer.name) || answer.links?.includes(person.name)) return variedHint([
    "原著人物关系中，二人的剧情线存在直接交点。",
    "两人并非只在同一时代出现，人物关系网中也有明确连接。",
    "顺着原著中的人物往来，可以找到二人的直接交集。"
  ], person, answer, "direct-link");
  return variedHint(activeGame === "honglou" ? [
    "在120回故事中，二人的直接往来很少。",
    "两人分处较远的人物线，原著中没有明显正面交集。",
    "从已收录的章节和人物关系看，二人的故事距离较远。",
    "二人的活动范围并不重合，暂无线索表明有直接往来。"
  ] : [
    "在现有剧情中，二人的直接往来很少。",
    "两人分处不同人物线，暂未发现明显正面交集。",
    "从已收录的事件和关系看，二人的故事距离较远。"
  ], person, answer, "distant");
}
function relationshipHint(person, answer, score) { return activeGame === "football" ? footballHint(person, answer, score) : storyHint(person, answer); }

function updateUI() {
  const text = copy();
  document.documentElement.lang = currentLanguage() === "en" ? "en" : "zh-CN";
  document.body.dataset.game = activeGame || "home";
  document.title = activeGame ? `${text.brand}｜${text.title}` : "人物谜局｜猜人物";
  elements.brandText.textContent = activeGame ? text.brand : "人物谜局";
  elements.title.textContent = text.title;
  elements.eyebrow.textContent = text.eyebrow;
  elements.attemptLabel.textContent = text.attempts;
  elements.bestLabel.textContent = text.best;
  elements.searchLabel.textContent = text.search;
  elements.guessLabel.textContent = text.guess;
  elements.emptyTitle.textContent = text.empty;
  elements.howBtn.textContent = currentLanguage() === "en" ? "How to play" : "玩法";
  elements.settingsLabel.textContent = text.settings;
  elements.settingsBtn.hidden = !currentConfig()?.language;
  elements.howTitle.textContent = text.howTitle;
  elements.howCopy.textContent = text.howCopy;
  elements.ruleList.innerHTML = text.rules.map((rule, index) => `<div><b>0${index + 1}</b><span>${escapeHtml(rule)}</span></div>`).join("");
  elements.start.textContent = text.start;
  elements.input.placeholder = "";
  document.querySelectorAll("[data-lang]").forEach((button) => button.classList.toggle("active", button.dataset.lang === language));
  updateStats();
  renderGuesses();
  renderReveal();
}

function updateStats() {
  if (!activeGame) return;
  const text = copy();
  elements.attempts.textContent = String(attempts);
  const best = guesses.length ? Math.max(...guesses.map((guess) => guess.score)) : null;
  elements.best.textContent = best === null ? "—" : `${best.toFixed(2)}%`;
  elements.status.textContent = finished ? text.done : attempts ? format(text.status, { n: attempts }) : text.ready;
  const remaining = Math.max(0, currentConfig().surrenderAt - attempts);
  elements.reveal.disabled = remaining > 0 || finished;
  elements.reveal.textContent = remaining ? format(text.locked, { n: remaining }) : text.surrender;
}

function submitGuess() {
  if (!activeGame || finished) return;
  const raw = elements.input.value.trim();
  if (!raw) { showToast(currentLanguage() === "en" ? "Enter a name first." : "请先输入一个名字。" ); return; }
  if (activeGame !== "football" && !hasChinese(raw)) { showToast("本游戏请使用中文姓名或称谓。"); return; }
  const person = resolveEntry(raw);
  const key = normalize(raw);
  const previous = guesses.find((guess) => guess.key === key);
  if (previous) {
    if (currentConfig().hintsAfter !== null && attempts >= currentConfig().hintsAfter && !previous.hint) {
      previous.hint = relationshipHint(previous.person, target, previous.score);
      lastGuessKey = key;
      renderGuesses();
      showToast(currentLanguage() === "en" ? "Already guessed — the hint was added to the original row." : "已经猜过该人物，关系提示已补充到原词条。" );
    } else {
      showToast(currentLanguage() === "en" ? "You already guessed this player." : "你已经猜过该人物了。" );
    }
    elements.input.value = "";
    return;
  }
  attempts += 1;
  const score = similarity(person, target);
  const hint = currentConfig().hintsAfter !== null && attempts > currentConfig().hintsAfter ? relationshipHint(person, target, score) : "";
  guesses.push({ key, person, displayName: raw, score, hint, sequence: attempts });
  lastGuessKey = key;
  elements.input.value = "";
  elements.empty.hidden = true;
  if (person.id === target.id) finishGame("solved");
  renderGuesses();
  updateStats();
}

function renderGuesses() {
  if (!activeGame) return;
  const ordered = [...guesses].sort((a, b) => b.score - a.score || b.sequence - a.sequence);
  elements.list.innerHTML = ordered.map((guess) => {
    const solved = guess.person.id === target?.id;
    const color = guess.score >= 75 ? "var(--accent)" : guess.score >= 45 ? "#d5df69" : guess.score >= 22 ? "#e3b25c" : "#92a198";
    return `<article class="guess-row${guess.key === lastGuessKey ? " latest" : ""}${solved ? " solved" : ""}" style="--score-color:${color}">
      <div class="guess-main"><div class="guess-player"><span>${escapeHtml(guess.displayName)}</span></div><div class="guess-score">${guess.score.toFixed(4)}%</div></div>
      ${guess.hint ? `<p class="relation-hint">${escapeHtml(guess.hint)}</p>` : ""}
    </article>`;
  }).join("");
}

function genericFootballProfile(player) {
  const langIndex = language === "en" ? 1 : 0;
  const positions = [...new Set(player.positions.map((id) => POSITION_NAMES[id]?.[langIndex]).filter(Boolean))];
  const clubs = [...new Set(player.teams.map((id) => CLUB_NAMES[id]?.[langIndex]).filter(Boolean))].slice(0, 4);
  const role = positions[0] || (language === "en" ? "professional footballer" : "职业球员");
  let style;
  if (player.positions.includes("Q201330")) style = language === "en" ? "shot-stopping, positioning and command of the penalty area" : "门线反应、位置选择和禁区指挥";
  else if (player.positions.includes("Q18691898")) style = language === "en" ? "ball-winning, coverage and defensive transitions" : "拦截、覆盖和由守转攻";
  else if (player.positions.some((id) => ["Q193592", "Q6008848", "Q90326494"].includes(id))) style = language === "en" ? "link play, press resistance and control of tempo" : "串联、抗压处理和比赛节奏控制";
  else if (player.positions.some((id) => ["Q268258", "Q336286", "Q1489923"].includes(id))) style = language === "en" ? "defensive reading, duels and progression from the back" : "防守阅读、对抗和后场推进";
  else style = language === "en" ? "movement, attacking impact and end product" : "跑位、进攻冲击和终结效率";
  if (language === "en") {
    const career = clubs.length ? ` Their career includes ${clubs.join(", ")}.` : "";
    return { copy: `${localeName(player)} is a ${role}${player.birth ? ` born in ${player.birth}` : ""}.${career} Their profile is associated with ${style}.`, tags: [role, player.birth && player.birth < 1985 ? "Established era" : "Modern career", clubs.length > 2 ? "Multi-club career" : "Distinct role"].filter(Boolean) };
  }
  const career = clubs.length ? `其公开生涯与${clubs.join("、")}等俱乐部有关。` : "其职业履历跨越了明确的俱乐部或国家队阶段。";
  return { copy: `${localeName(player)}${player.birth ? `出生于${player.birth}年，` : ""}主要司职${role}。${career}比赛特点主要体现在${style}，人物介绍根据已收录的公开职业信息生成。`, tags: [role, player.birth && player.birth < 1985 ? "经典年代" : "职业足迹", clubs.length > 2 ? "多段生涯" : "鲜明角色"].filter(Boolean) };
}
function profileFor(person) {
  if (activeGame !== "football") {
    let profileCopy = person.bio || "";
    if (!profileCopy || /120回故事中(?:以)?(?:有)?姓名或称谓/.test(profileCopy)) {
      const groups = (person.groups || []).filter((group) => !/人物$/.test(group)).slice(0, 2);
      const event = (person.events || []).find((item) => !/^第\d+回$/.test(item));
      const firstChapter = (person.events || []).find((item) => /^第\d+回$/.test(item));
      const identity = groups.length ? `${groups.join("、")}人物` : "故事人物";
      const deed = event
        ? `其相关情节涉及“${event}”。`
        : firstChapter
          ? `自${firstChapter}起进入相关情节。`
          : "其事迹散见于人物关系与相关剧情之中。";
      profileCopy = `${person.name}是${identity}，${deed}`;
    }
    return { copy: profileCopy, tags: (person.tags || person.groups || []).slice(0, 3) };
  }
  const curated = FOOTBALL_PROFILES[normalize(person.en)];
  if (!curated) return genericFootballProfile(person);
  return { copy: curated[language], tags: language === "en" ? curated.enTags : curated.zhTags };
}

function finishGame(reason) {
  finished = true;
  revealReason = reason;
  elements.input.disabled = true;
  elements.guess.disabled = true;
  renderReveal();
}
function renderReveal() {
  if (!activeGame || !finished || !target) { if (elements.victory) elements.victory.hidden = true; return; }
  const text = copy();
  const profile = profileFor(target);
  const summary = revealReason === "solved" ? format(text.solvedIn, { n: attempts }) : format(text.surrenderedIn, { n: attempts });
  elements.victory.innerHTML = `<span class="reveal-kicker">${escapeHtml(revealReason === "solved" ? text.solved : text.revealed)}</span>
    <h2>${escapeHtml(localeName(target))}</h2>
    <div class="profile-tags">${profile.tags.slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
    <p class="profile-copy">${escapeHtml(profile.copy)}<br>${escapeHtml(summary)}</p>
    <div class="reveal-actions"><button id="againBtn" type="button">${currentLanguage() === "en" ? "Play again" : "再来一局"}</button><button id="copyBtn" type="button">${currentLanguage() === "en" ? "Copy result" : "复制战绩"}</button></div>`;
  elements.victory.hidden = false;
  $("#againBtn").addEventListener("click", startNewGame);
  $("#copyBtn").addEventListener("click", copyResult);
}
async function copyResult() {
  try { await navigator.clipboard.writeText(format(copy().result, { n: attempts, name: localeName(target) })); showToast(currentLanguage() === "en" ? "Result copied." : "战绩已复制。" ); }
  catch { showToast(currentLanguage() === "en" ? "Could not copy the result." : "暂时无法复制，请截图分享。" ); }
}
function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2600);
}

function startNewGame() {
  const config = currentConfig();
  target = chooseTarget(config.pool);
  guesses = [];
  attempts = 0;
  finished = false;
  revealReason = "solved";
  lastGuessKey = "";
  elements.input.disabled = !target;
  elements.guess.disabled = !target;
  elements.input.value = "";
  elements.list.innerHTML = "";
  elements.empty.hidden = false;
  elements.victory.hidden = true;
  updateUI();
  elements.input.focus();
}
function openGame(game) {
  if (!CONFIG[game]) return showHome();
  activeGame = game;
  elements.home.hidden = true;
  elements.game.hidden = false;
  elements.gameActions.hidden = false;
  elements.back.hidden = false;
  startNewGame();
}
function showHome() {
  activeGame = null;
  document.body.dataset.game = "home";
  document.documentElement.lang = "zh-CN";
  document.title = "人物谜局｜猜人物";
  elements.brandText.textContent = "人物谜局";
  elements.home.hidden = false;
  elements.game.hidden = true;
  elements.gameActions.hidden = true;
  elements.back.hidden = true;
  elements.howDialog.close?.();
  elements.settingsDialog.close?.();
}
function route() {
  const game = location.hash.replace(/^#/, "");
  if (CONFIG[game]) openGame(game); else showHome();
}

document.querySelectorAll("[data-game-select]").forEach((button) => button.addEventListener("click", () => { location.hash = button.dataset.gameSelect; }));
elements.back.addEventListener("click", () => { location.hash = ""; });
elements.brand.addEventListener("click", (event) => { event.preventDefault(); location.hash = ""; });
elements.input.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); submitGuess(); } });
elements.guess.addEventListener("click", submitGuess);
elements.reveal.addEventListener("click", () => {
  if (attempts >= currentConfig().surrenderAt && !finished && window.confirm(currentLanguage() === "en" ? "Surrender and reveal the answer?" : "确定要投降并查看答案吗？")) { finishGame("surrender"); updateStats(); }
});
elements.howBtn.addEventListener("click", () => elements.howDialog.showModal());
elements.closeHow.addEventListener("click", () => elements.howDialog.close());
elements.start.addEventListener("click", () => { elements.howDialog.close(); elements.input.focus(); });
elements.settingsBtn.addEventListener("click", () => elements.settingsDialog.showModal());
elements.closeSettings.addEventListener("click", () => elements.settingsDialog.close());
document.querySelectorAll("[data-lang]").forEach((button) => button.addEventListener("click", () => {
  language = button.dataset.lang;
  localStorage.setItem("relation-puzzle-language", language);
  elements.settingsDialog.close();
  updateUI();
}));
window.addEventListener("hashchange", route);
route();
