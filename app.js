const RAW_PLAYERS = Array.isArray(window.PLAYER_POOL) ? window.PLAYER_POOL : [];
const STORY_DATA = window.STORY_DATA || { honglou: [], zhenhuan: [], relations: {} };

const POSITION_NAMES = {
  Q201330: ["闂ㄥ皢", "goalkeeper"], Q280658: ["鍓嶉攱", "forward"], Q8025128: ["杈归攱", "winger"],
  Q193592: ["涓満", "midfielder"], Q18691898: ["闃插畧鍨嬩腑鍦?, "defensive midfielder"],
  Q6008848: ["涓墠鍗?, "central midfielder"], Q90326494: ["杩涙敾鍨嬩腑鍦?, "attacking midfielder"],
  Q268258: ["杈瑰悗鍗?, "full-back"], Q336286: ["涓悗鍗?, "centre-back"], Q1489923: ["娓呴亾澶?, "sweeper"],
};
const CLUB_NAMES = {
  Q7156: ["宸村缃楅偅", "Barcelona"], Q8682: ["鐨囧椹痉閲?, "Real Madrid"], Q9617: ["闃挎．绾?, "Arsenal"],
  Q9616: ["鍒囧皵瑗?, "Chelsea"], Q18656: ["鏇艰仈", "Manchester United"], Q1130849: ["鍒╃墿娴?, "Liverpool"],
  Q50602: ["鏇煎煄", "Manchester City"], Q1543: ["AC绫冲叞", "AC Milan"], Q631: ["鍥介檯绫冲叞", "Inter Milan"],
  Q1422: ["灏ゆ枃鍥炬柉", "Juventus"], Q483020: ["宸撮粠鍦ｆ棩鑰虫浖", "Paris Saint-Germain"],
  Q15789: ["鎷滀粊鎱曞凹榛?, "Bayern Munich"], Q41420: ["澶氱壒钂欏痉", "Borussia Dortmund"],
  Q16844931: ["杩堥樋瀵嗗浗闄?, "Inter Miami"], Q267245: ["鏈彶鍗?, "Benfica"], Q24711: ["闃胯淳鍏嬫柉", "Ajax"],
};

function normalize(value = "") {
  return String(value).toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f\s路.'鈥檂()锛堬級\-鈥擾]/g, "");
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
  if (!players.some((player) => ["xavihernandez", "xavihern谩ndez"].includes(normalize(player.en)))) {
    players.unshift({ id: "curated-xavi", name: "鍝堢淮路鍩冨皵鍗楀痉鏂?, en: "Xavi Hern谩ndez", birth: 1980, countries: ["Q29"], positions: ["Q193592"], teams: ["Q7156"], popularity: 6000 });
  }
  if (!players.some((player) => normalize(player.en) === "joaofelix")) {
    players.unshift({ id: "curated-joao-felix", name: "鑻ユ槀路鑿插埄鍏嬫柉", en: "Jo茫o F茅lix", birth: 1999, countries: ["Q45"], positions: ["Q90326494", "Q280658"], teams: ["Q267245", "Q9616", "Q7156"], popularity: 5600 });
  }
  return players;
}

const PLAYERS = prepareFootballPool();
const FOOTBALL_BY_EN = new Map(PLAYERS.map((player) => [normalize(player.en), player]));

const FOOTBALL_PREFERRED = {
  鍝堢淮: "xavihernandez", 钀ㄥ唴钂? "javierzanetti", 鑿插埄鍏嬫柉: "joaofelix", 姊呰タ: "lionelmessi",
  缃楃撼灏斿: "ronaldo", 澶х綏: "ronaldo", 灏忕綏: "ronaldinho", 濮嗗反浣? "kylianmbappe", 鍐呴┈灏? "neymar",
  璐濆厠姹夊: "davidbeckham", 缁村焹鎷? "patrickvieira", 椹皵钂傚凹: "paolomaldini", 榻愯揪鍐? "zinedinezidane",
};

const FOOTBALL_RELATIONS = new Map();
function addFootballRelation(a, b, strength, zh, en) { FOOTBALL_RELATIONS.set(pairKey(a, b), { strength, zh, en }); }
addFootballRelation("Lionel Messi", "Neymar", .96, "涓や汉鏇惧湪宸村缃楅偅涓庡反榛庡湥鏃ヨ€虫浖骞惰偐锛屼篃淇濇寔骞夸负浜虹煡鐨勫叕寮€鍙嬭皧銆?, "They played together at Barcelona and Paris Saint-Germain and share a widely documented friendship.");
addFootballRelation("Lionel Messi", "Luis Su谩rez", .96, "涓や汉鏃㈡槸闀挎湡鎼。锛屼篃鏄叕寮€鍏崇郴浜插瘑鐨勫満澶栧ソ鍙嬨€?, "They were long-term teammates and remain close, publicly documented friends.");
addFootballRelation("Lionel Messi", "Sergio Ag眉ero", .93, "涓や汉鐨勯樋鏍瑰环鍥藉闃熺粡鍘嗕笌闀挎湡鍏紑鍙嬭皧绱у瘑鐩歌繛銆?, "Their Argentina history is closely tied to a long public friendship.");
addFootballRelation("Cristiano Ronaldo", "Marcelo Vieira", .92, "涓や汉鍦ㄧ殗瀹堕┈寰烽噷闀挎湡骞惰偐锛岃禌鍦洪粯濂戜篃寤朵几涓哄叕寮€鍙嬭皧銆?, "They played together for years at Real Madrid and developed a public friendship.");
addFootballRelation("Kylian Mbapp茅", "Achraf Hakimi", .93, "涓や汉鏇炬槸宸撮粠鍦ｆ棩鑰虫浖闃熷弸锛屼篃鍥犻绻佸叕寮€浜掑姩鑰岃瑙嗕负濂藉弸銆?, "They were Paris Saint-Germain teammates and are widely regarded as friends.");
addFootballRelation("Declan Rice", "Mason Mount", .91, "涓や汉鐨勫弸璋婂彲杩芥函鍒板皯骞存椂鏈熴€?, "Their friendship stretches back to youth football.");
addFootballRelation("David Beckham", "Gary Neville", .90, "涓や汉浠庢浖鑱旈潚璁槦鍙嬩竴璺欢缁埌鍏卞悓鍙備笌瓒崇悆鎶曡祫銆?, "Their relationship runs from Manchester United academy teammates to football investment.");
addFootballRelation("Yaya Tour茅", "Kolo Tour茅", .98, "涓や汉鏄翰鍏勫紵锛屼篃閮藉湪椤剁骇瓒崇悆鑸炲彴鐣欎笅閲嶈缁忓巻銆?, "They are brothers who both built major careers.");
addFootballRelation("Peter Schmeichel", "Kasper Schmeichel", .99, "涓や汉鏄埗瀛愶紝骞堕兘浠ラ《绾ч棬灏嗚韩浠藉彈鍒板叧娉ㄣ€?, "They are father and son, both recognised goalkeepers.");
addFootballRelation("Paolo Maldini", "Daniel Maldini", .99, "涓や汉鏄埗瀛愶紝寤剁画浜嗙背鍏扮殑瀹舵棌瓒崇悆浼犳壙銆?, "They are father and son in a prominent Milan football dynasty.");
addFootballRelation("Lilian Thuram", "Marcus Thuram", .99, "涓や汉鏄埗瀛愶紝鑱屼笟鐢熸动妯法涓や唬娉曞浗瓒崇悆銆?, "They are father and son across two generations of French football.");
addFootballRelation("Lilian Thuram", "Kh茅phren Thuram", .99, "涓や汉鏄埗瀛愶紝鑱屼笟鐢熸动妯法涓や唬娉曞浗瓒崇悆銆?, "They are father and son across two generations of French football.");
addFootballRelation("Rio Ferdinand", "Anton Ferdinand", .98, "涓や汉鏄厔寮燂紝鑱屼笟灞ュ巻閮戒笌鑻辨牸鍏拌冻鐞冪揣瀵嗙浉杩炪€?, "They are brothers whose careers are closely tied to English football.");
addFootballRelation("Frank de Boer", "Ronald de Boer", .99, "涓や汉鏄弻鑳炶儙鍏勫紵锛屼篃鏈夊娈靛叡鍚屾晥鍔涚粡鍘嗐€?, "They are twin brothers with several shared chapters as teammates.");

const FOOTBALL_PROFILES = {
  lionelmessi: {
    zh: "姊呰タ鍦ㄥ反濉炵綏閭ｆ垚闀夸负杩涙敾鏍稿績锛屼互浣庨噸蹇冪洏甯︺€佽繛缁彉鍚戙€佷紶灏勯€夋嫨鍜岀鍖哄墠鍒涢€犲姏瀹氫箟浜嗕竴涓椂浠ｃ€傜寮€宸磋惃鍚庡厛鍚庢晥鍔涘反榛庡湥鏃ヨ€虫浖涓庤繄闃垮瘑鍥介檯锛屽苟鐜囬樋鏍瑰环璧㈠緱缇庢床鏉拰涓栫晫鏉€?,
    en: "Lionel Messi became Barcelona's attacking reference through close control, rapid changes of direction, playmaking and finishing. He later played for Paris Saint-Germain and Inter Miami and led Argentina to Copa Am茅rica and World Cup titles.",
    zhTags: ["涓栫晫鏉啝鍐?, "宸磋惃浼犲", "鎸佺悆鏍稿績"], enTags: ["World champion", "Barcelona legend", "Creative hub"],
  },
  cristianoronaldo: {
    zh: "C缃椾粠鏇艰仈鐨勭獊鐮村瀷杈归攱鎴愰暱涓虹殗瀹堕┈寰烽噷鐨勫巻鍙茬骇缁堢粨鑰咃紝涔嬪悗鏁堝姏灏ゆ枃鍥炬柉骞堕噸杩旀浖鑱斻€傞€熷害銆佸脊璺炽€佹棤鐞冭窇鍔ㄣ€佸弻鑴氬皠闂ㄤ笌澶寸悆璁╀粬鑳藉湪涓嶅悓鑱旇禌鎸佺画楂樹骇銆?,
    en: "Cristiano Ronaldo evolved from a dribbling winger at Manchester United into a historic scorer at Real Madrid, then played for Juventus and returned to United. Pace, movement, aerial power and two-footed finishing sustained his output across leagues.",
    zhTags: ["娆у啝灏勬墜", "璺ㄨ仈璧涘法鏄?, "鍏ㄨ兘缁堢粨"], enTags: ["Champions League scorer", "Cross-league star", "Complete finisher"],
  },
  patrickvieira: {
    zh: "缁村焹鎷変粠鎴涚撼鐧婚檰鎰忕敳鍚庯紝鍦ㄩ樋妫撼杩庢潵宸呭嘲骞堕暱鏈熸媴浠婚槦闀匡紝鏄俯鏍兼椂浠ｅ拰鈥滄棤鏁屼箣甯堚€濈殑涓満鏀煴锛涗箣鍚庡張鏁堝姏灏ゆ枃鍥炬柉銆佸浗闄呯背鍏颁笌鏇煎煄锛屽苟闅忔硶鍥借耽寰?998骞翠笘鐣屾澂鍜?000骞存娲叉澂銆傝韩鏉愰珮澶с€佸鎶楀己纭紝鍏煎叿澶ц寖鍥磋鐩栥€佹嫤鎴€佸甫鐞冩帹杩涘拰鐢卞畧杞敾鑳藉姏锛屾槸鍏稿瀷鐨勯槻瀹堝瀷鈥滃吔鑵扳€濄€?,
    en: "Patrick Vieira peaked as Arsenal captain and the midfield pillar of Ars猫ne Wenger's Invincibles, later playing for Juventus, Inter and Manchester City. A 1998 World Cup and Euro 2000 winner with France, he combined size, duelling, ball-winning, huge coverage and driving transitions as an archetypal powerhouse defensive midfielder.",
    zhTags: ["闃挎．绾抽槦闀?, "闃插畧鍨嬪吔鑵?, "涓栫晫鏉啝鍐?], enTags: ["Arsenal captain", "Powerhouse No. 6", "World champion"],
  },
  xavihernandez: {
    zh: "鍝堢淮鍑鸿嚜鎷夌帥瑗夸簹锛岄暱鏈熸媴浠诲反濉炵綏閭ｄ笌瑗跨彮鐗欑殑涓満鑺傛媿鍣紝鏄紶鎺т綋绯荤殑鏍稿績浜虹墿銆備粬浠ヨ瀵熴€佹帴搴斻€佺煭浼犺搴﹀拰姣旇禌鑺傚绠＄悊瑙侀暱锛岄殢闃熷畬鎴愪勘涔愰儴鍏啝鐜嬶紝骞惰耽寰椾笘鐣屾澂鍜屼袱灞婃娲叉澂銆?,
    en: "A La Masia graduate, Xavi became the tempo-setter for Barcelona and Spain. His scanning, support angles, short passing and rhythm control powered Barcelona's sextuple and Spain's World Cup and two European Championship titles.",
    zhTags: ["宸磋惃浼犲", "涓満鑺傛媿鍣?, "浼犳帶鏍稿績"], enTags: ["Barcelona legend", "Tempo-setter", "Possession master"],
  },
  javierzanetti: {
    zh: "钀ㄥ唴钂傚湪鍥介檯绫冲叞鏁堝姏杩戜簩鍗佸勾骞堕暱鏈熸媴浠婚槦闀匡紝鑳借儨浠诲乏鍙宠竟鍚庡崼涓庝腑鍦猴紝鏄?010骞翠笁鍐犵帇鐨勯噸瑕侀琚栥€傚己鎮嶄綋鑳姐€佺ǔ瀹氭帹杩涖€佺邯寰嬫€у拰鏋侀珮鍑哄嫟鐜囨瀯鎴愪簡浠栫殑椴滄槑鏍囩銆?,
    en: "Javier Zanetti spent nearly two decades at Inter and served as long-time captain, covering both full-back roles and midfield. A leader of the 2010 treble side, he was defined by stamina, disciplined carrying and extraordinary reliability.",
    zhTags: ["鍥界背闃熼暱", "涓夊啝鐜?, "閽㈤搧浣撹兘"], enTags: ["Inter captain", "Treble winner", "Elite stamina"],
  },
  zinedinezidane: {
    zh: "榻愯揪鍐呭厛鍚庡湪娉㈠皵澶氥€佸挨鏂囧浘鏂拰鐨囧椹痉閲屾晥鍔涳紝浠ュ仠鐞冦€佽浆韬€佹姢鐞冨拰瀵硅妭濂忕殑鎺у埗鎴愪负鍙ゅ吀鍓嶈叞浠ｈ〃銆備粬鐜囨硶鍥借耽寰?998骞翠笘鐣屾澂鍜?000骞存娲叉澂锛屼篃鐣欎笅娆у啝鍐宠禌鍑岀┖鎶藉皠绛夌粡鍏哥灛闂淬€?,
    en: "Zinedine Zidane played for Bordeaux, Juventus and Real Madrid, becoming an archetypal playmaker through first touch, turns, shielding and tempo control. He led France to the 1998 World Cup and Euro 2000 and produced iconic Champions League moments.",
    zhTags: ["娉曞浗鏍稿績", "鍙ゅ吀鍓嶈叞", "澶ц禌鍏堢敓"], enTags: ["France icon", "Classic playmaker", "Big-game player"],
  },
  ronaldo: {
    zh: "缃楃撼灏斿鍦ㄥ焹鍥犻湇娓┿€佸反濉炵綏閭ｃ€佸浗闄呯背鍏板拰鐨囧椹痉閲岀瓑闃熺暀涓嬭冻杩癸紝宸呭嘲鏈熸妸鐖嗗彂銆侀挓鎽嗚繃浜哄拰闂ㄥ墠鍐烽潤缁撳悎鍒版瀬鑷淬€備粬涓ゅず涓栫晫鏉啝鍐涳紝骞跺湪閲嶄激鍚庨噸杩斾笘鐣屼箣宸呫€?,
    en: "Ronaldo played for PSV, Barcelona, Inter and Real Madrid, combining explosive acceleration, stepovers and calm finishing at his peak. He won two World Cups and returned to the top level after major knee injuries.",
    zhTags: ["澶栨槦浜?, "涓栫晫鏉噾闈?, "鐖嗗彂鍨嬩腑閿?], enTags: ["O Fen么meno", "World Cup Golden Boot", "Explosive striker"],
  },
  ronaldinho: {
    zh: "缃楃撼灏旇开灏煎ゥ鍦ㄥ反榛庡湥鏃ヨ€虫浖宕湶澶磋锛屼簬宸村缃楅偅杈惧埌宸呭嘲骞惰耽寰楅噾鐞冨鍜屾鍐狅紝涔嬪悗鏁堝姏AC绫冲叞銆備粬浠ョ墰灏惧反銆佸亣鍔ㄤ綔銆佹棤瑙嗛噹浼犵悆鍜屾瀬寮哄嵆鍏村垱閫犲姏锛屾妸琛楀ご瓒崇悆鐨勫揩涔愬甫鍏ユ渶楂樿垶鍙般€?,
    en: "Ronaldinho emerged at Paris Saint-Germain, peaked at Barcelona with the Ballon d'Or and Champions League, and later played for AC Milan. Elastico dribbles, disguise, no-look passes and improvisation brought street-football joy to the elite game.",
    zhTags: ["閲戠悆鍏堢敓", "宸磋惃浼犲", "鍗冲叴澶у笀"], enTags: ["Ballon d'Or", "Barcelona legend", "Improvisation master"],
  },
  paolomaldini: {
    zh: "椹皵钂傚凹鏁翠釜娆ф床椤剁骇鐢熸动閮界尞缁橝C绫冲叞锛屾í璺ㄤ笁涓勾浠ｅ苟澶氭璧㈠緱娆у啝銆傛棦鑳借涪宸﹀悗鍗篃鑳借涪涓崼锛屼粬渚濋潬棰勫垽銆佺珯浣嶃€佹浼愪笌涓€瀵逛竴闃插畧鍖栬В濞佽儊锛屾槸浼橀泤闃插畧鐨勪唬琛ㄣ€?,
    en: "Paolo Maldini spent his entire elite European career with AC Milan, spanning three decades and winning multiple European Cups. At left-back or centre-back, anticipation, positioning, footwork and one-v-one defending made him an emblem of elegant defence.",
    zhTags: ["涓€浜轰竴鍩?, "绫冲叞闃熼暱", "闃插畧鑹烘湳"], enTags: ["One-club icon", "Milan captain", "Defensive art"],
  },
  davidbeckham: {
    zh: "璐濆厠姹夊鍑鸿嚜鏇艰仈92鐝紝鍦ㄤ笁鍐犵帇璧涘鎴愪负鍙宠矾鍏抽敭浜虹墿锛屼箣鍚庢晥鍔涚殗瀹堕┈寰烽噷銆佹礇鏉夌煻閾舵渤銆丄C绫冲叞涓庡反榛庡湥鏃ヨ€虫浖銆傜簿鍑嗛暱浼犮€佷紶涓拰浠绘剰鐞冩槸浠栫殑鏍稿績姝﹀櫒銆?,
    en: "David Beckham emerged from Manchester United's Class of '92 and was central to the treble side, later playing for Real Madrid, LA Galaxy, AC Milan and Paris Saint-Germain. Long passing, crossing and free kicks defined his game.",
    zhTags: ["鏇艰仈92鐝?, "浼犱腑澶у笀", "浠绘剰鐞冧笓瀹?], enTags: ["Class of '92", "Crossing master", "Free-kick expert"],
  },
  andresiniesta: {
    zh: "浼婃秴鏂鍑鸿嚜宸村缃楅偅闈掕锛屾槸淇变箰閮ㄤ笌瑗跨彮鐗欓粍閲戞椂浠ｇ殑涓満鏍稿績銆備粬浠ョ嫮灏忕┖闂存憜鑴便€佹柟鍚戝彉鍖栥€佹寔鐞冩帹杩涘拰鍏抽敭浼犵悆钁楃О锛屽苟鍦?010骞翠笘鐣屾澂鍐宠禌鎵撳叆鍒惰儨鐞冦€?,
    en: "A Barcelona academy graduate, Andr茅s Iniesta was central to the club and Spain's golden era. Tight-space escapes, changes of direction, carrying and final passes defined him, capped by the 2010 World Cup-winning goal.",
    zhTags: ["涓栫晫鏉喅璧涜嫳闆?, "宸磋惃浼犲", "绌洪棿澶у笀"], enTags: ["World Cup final hero", "Barcelona legend", "Space manipulator"],
  },
  lukamodric: {
    zh: "鑾痉閲屽浠庤惃鏍煎嫆甯冭开绾虫懇銆佺儹鍒鸿蛋鍒扮殗瀹堕┈寰烽噷锛屽湪娆у啝鐜嬫湞涓暱鏈熸帉鎺т腑鍦猴紝骞剁巼鍏嬬綏鍦颁簹闂叆涓栫晫鏉喅璧涖€傚鑴氳儗浼犵悆銆佹姉鍘嬭浆韬€佽窇鍔ㄨ鐩栧拰鏀诲畧鑺傚鍒囨崲鏄叾鎷涚墝銆?,
    en: "Luka Modri膰 moved from Dinamo Zagreb and Tottenham to Real Madrid, controlling midfield through a Champions League dynasty and leading Croatia to a World Cup final. Outside-foot passing, press resistance, coverage and tempo shifts are his signatures.",
    zhTags: ["閲戠悆鍏堢敓", "鐨囬┈涓満", "澶栬剼鑳屽ぇ甯?], enTags: ["Ballon d'Or", "Madrid midfield", "Outside-foot master"],
  },
};

const UI = {
  football: {
    zh: { brand: "浜虹墿璋滃眬", eyebrow: "RELATION RADAR", title: "鐚滅悆鏄?, attempts: "宸茬寽娆℃暟", best: "鏈€楂樼浉浼?, ready: "绛夊緟绗竴娆＄寽娴?, search: "杈撳叆鐞冨憳涓枃鍚?, guess: "鐚滄祴", empty: "浠庝竴涓啛鎮夌殑鍚嶅瓧寮€濮?, howTitle: "鍙嚟鐩镐技搴︽壘绛旀", howCopy: "姣忔杈撳叆鍙樉绀轰綘鍐欎笅鐨勫鍚嶅拰缁煎悎鐩镐技搴︺€傝绠椾細浣跨敤鑱屼笟杞ㄨ抗銆佹椂浠ｅ奖鍝嶄笌鍏紑瓒崇悆鍏崇郴锛屼笉鐩存帴灞曠ず浣嶇疆銆佸勾榫勩€佷勘涔愰儴鎴栧浗绫嶃€?, rules: ["鐚滄祴娆℃暟涓嶉檺锛涚郴缁熸棤娉曞尮閰嶆椂涔熶細杩斿洖鐩镐技搴︺€?, "鍓?0娆′笉鏄剧ず鎻愮ず锛岀11娆¤捣鏄剧ず鍏崇郴锛涢噸鐚滃彧鍦ㄥ師璇嶆潯琛ユ彁绀恒€?, "閲嶅鐚滄祴涓嶅鍔犳鏁帮紱绗?0娆″悗鍙互鎶曢檷鏌ョ湅绛旀銆?], settings: "璁剧疆", start: "寮€濮嬫寫鎴?, locked: "杩樺樊 {n} 娆″彲鎶曢檷", surrender: "鎶曢檷鐪嬬瓟妗?, status: "绗?{n} 娆¤拷韪?, done: "绛旀宸叉彮鏅?, solved: "鎭枩鐚滀腑", revealed: "绛旀鎻檽", solvedIn: "浣犵敤 {n} 娆＄寽娴嬫壘鍒颁簡绁炵鐞冨憳銆?, surrenderedIn: "浣犲湪绗?{n} 娆＄寽娴嬪悗鏌ョ湅浜嗙瓟妗堛€?, result: "鎴戝湪浜虹墿璋滃眬鐢?{n} 娆＄寽涓簡 {name}锛? },
    en: { brand: "IDENTITY PUZZLE", eyebrow: "RELATION RADAR", title: "GUESS THE FOOTBALLER", attempts: "GUESSES", best: "BEST SIMILARITY", ready: "Waiting for your first guess", search: "Enter a footballer's name", guess: "Guess", empty: "Start with a familiar name", howTitle: "Find the answer by similarity", howCopy: "Each entry shows exactly what you typed and an overall similarity score. Career paths, era and public football relationships stay hidden behind the score.", rules: ["Guesses are unlimited; unknown names still receive a score.", "The first 10 guesses show no hints. From guess 11, relationship lines appear in the original row.", "Duplicate guesses do not increase the count. Surrender unlocks after 50 guesses."], settings: "Settings", start: "Start challenge", locked: "{n} more to surrender", surrender: "Surrender & reveal", status: "Tracking guess {n}", done: "Answer revealed", solved: "YOU FOUND IT", revealed: "ANSWER REVEALED", solvedIn: "You found the mystery footballer in {n} guesses.", surrenderedIn: "You revealed the answer after {n} guesses.", result: "I found {name} in {n} guesses on Identity Puzzle!" },
  },
  honglou: { zh: { brand: "绾㈡ゼ璋滃眬", eyebrow: "涓€鐧句簩鍗佸洖浜虹墿鍏崇郴", title: "鐚滅孩妤间汉鐗?, attempts: "宸茬寽娆℃暟", best: "鏈€楂樼浉浼?, ready: "绛夊緟绗竴娆＄寽娴?, search: "杈撳叆绾㈡ゼ浜虹墿涓枃鍚?, guess: "鐚滄祴", empty: "浠庝竴涓啛鎮夌殑浜虹墿寮€濮?, howTitle: "娌跨潃120鍥炰汉鐗╁叧绯绘壘绛旀", howCopy: "鐩镐技搴︾患鍚堝墽鎯呭悓鍦恒€佸鏃忎笌闄㈣惤銆佸叧閿簨浠跺拰浜虹墿鍏崇郴璁＄畻銆傜寽娴嬩腑涓嶇洿鎺ュ睍绀鸿韩浠借祫鏂欍€?, rules: ["鐚滄祴娆℃暟涓嶉檺锛岃緭鍏ヤ笉瀹屾暣濮撳悕涔熶細鎸夊ぇ浼楃О鍛煎尮閰嶃€?, "鍓?0娆′笉鏄剧ず鎻愮ず锛岀11娆¤捣鏄剧ず鍓ф儏鍏崇郴锛涢噸鐚滃彧鍦ㄥ師璇嶆潯琛ユ彁绀恒€?, "鍙互闅忔椂鎶曢檷骞舵煡鐪嬬瓟妗堛€?], settings: "", start: "寮€濮嬫寫鎴?, locked: "杩樺樊 {n} 娆″彲鎶曢檷", surrender: "鎶曢檷鐪嬬瓟妗?, status: "绗?{n} 娆″韪?, done: "绛旀宸叉彮鏅?, solved: "鎭枩鐚滀腑", revealed: "绛旀鎻檽", solvedIn: "浣犵敤 {n} 娆＄寽娴嬫壘鍒颁簡绁炵浜虹墿銆?, surrenderedIn: "浣犲湪绗?{n} 娆＄寽娴嬪悗鏌ョ湅浜嗙瓟妗堛€?, result: "鎴戝湪绾㈡ゼ璋滃眬鐢?{n} 娆＄寽涓簡{name}锛? } },
  zhenhuan: { zh: { brand: "瀹璋滃眬", eyebrow: "瀹环浜虹墿鍏崇郴", title: "鐚滅攧瀣涗紶浜虹墿", attempts: "宸茬寽娆℃暟", best: "鏈€楂樼浉浼?, ready: "绛夊緟绗竴娆＄寽娴?, search: "杈撳叆鐢勫瑳浼犱汉鐗╀腑鏂囧悕", guess: "鐚滄祴", empty: "浠庝竴涓啛鎮夌殑浜虹墿寮€濮?, howTitle: "鍑墽鎯呯浉浼煎害鎵剧瓟妗?, howCopy: "鐩镐技搴︾患鍚堝寤烽樀钀ャ€佷汉鐗╁叧绯汇€佸眳鎵€銆佸墽鎯呬簨浠朵笌鍑哄満闃舵璁＄畻锛涙父鎴忎腑涓嶆樉绀哄叧绯绘彁绀恒€?, rules: ["鐚滄祴娆℃暟涓嶉檺锛屽鍚嶆垨甯哥敤绉拌皳鍙寜澶т紬涔犳儻鍖归厤銆?, "姣忔鍙樉绀轰綘杈撳叆鐨勫唴瀹瑰拰鐩镐技搴︼紝涓嶅嚭鐜板叧鑱旀彁绀恒€?, "鍙互闅忔椂鎶曢檷骞舵煡鐪嬬瓟妗堛€?], settings: "", start: "寮€濮嬫寫鎴?, locked: "杩樺樊 {n} 娆″彲鎶曢檷", surrender: "鎶曢檷鐪嬬瓟妗?, status: "绗?{n} 娆℃帹婕?, done: "绛旀宸叉彮鏅?, solved: "鎭枩鐚滀腑", revealed: "绛旀鎻檽", solvedIn: "浣犵敤 {n} 娆＄寽娴嬫壘鍒颁簡绁炵浜虹墿銆?, surrenderedIn: "浣犲湪绗?{n} 娆＄寽娴嬪悗鏌ョ湅浜嗙瓟妗堛€?, result: "鎴戝湪瀹璋滃眬鐢?{n} 娆＄寽涓簡{name}锛? } },
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
  const semanticWords = ["涓瑹", "渚嶅コ", "瀹コ", "澶洃", "鐨囧笣", "鐨囧悗", "濡?, "鐜嬬埛", "鍏富", "璐惧簻", "澶ц鍥?, "瀹佸浗搴?, "鑽ｅ浗搴?, "鐢勫", "鐨囨棌", "濮愬", "澶", "姣嶄翰", "鐖朵翰", "濂冲効", "鍎垮瓙", "鍝ュ摜", "濡瑰"];
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
  if (player.id === answer.id) return language === "en" ? "This is the mystery answer." : "杩欏氨鏄湰灞€绛旀銆?;
  if (player.free) return variedHint(language === "en" ? [
    "No documented football link emerges from this entry.",
    "This entry does not reveal a verifiable career connection to the answer.",
    "The available football record offers no clear bridge from this entry to the answer."
  ] : [
    "杩欐杈撳叆鏆傛湭鎸囧悜鍙牳瀹炵殑瓒崇悆浜ら泦銆?,
    "鐜版湁鑱屼笟璧勬枡閲岋紝灏氭湭鎵惧埌杩欐杈撳叆涓庣瓟妗堜箣闂寸殑鏄庣‘妗ユ銆?,
    "杩欐潯绾跨储娌℃湁钀藉埌鍙‘璁ょ殑鐞冮槦銆佽禌浜嬫垨浜虹墿鍏崇郴涓娿€?
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
      team ? `涓や汉鐨勮亴涓氬饱鍘嗛兘缁忚繃${team}銆俙 : "涓や汉鐨勪勘涔愰儴鎴栫悆闃熷饱鍘嗘浘鍦ㄥ悓涓€绔欎氦姹囥€?,
      team ? `${team}鏄袱浜虹敓娑腑鐨勫叡鍚屽潗鏍囥€俙 : "鍚屼竴鏀悆闃熸槸涓や汉鑱屼笟杞ㄨ抗閲屾渶鏄庣‘鐨勪氦鐐广€?,
      team ? `浜屼汉鐨勬洿琛ｅ瓒宠抗鏇惧湪${team}閲嶅悎銆俙 : "涓や汉鐨勫叕寮€灞ュ巻閲屽嚭鐜拌繃鍚屼竴瓒崇悆闃佃惀銆?
    ], player, answer, "team");
  }
  if (intersection(player.countries, answer.countries).length) return variedHint(language === "en" ? [
    "They come from the same national-team football background.",
    "A shared football nation links their international profiles.",
    "Their international identities point to the same national setup."
  ] : [
    "涓や汉鐨勫浗瀹堕槦鑳屾櫙鏉ヨ嚜鍚屼竴鏉¤冻鐞冭剦缁溿€?,
    "鐩稿悓鐨勮冻鐞冨浗鍒紝鏄袱浜哄饱鍘嗕腑鐨勫叡鍚岀嚎绱€?,
    "浜屼汉鐨勫浗闄呰禌鍦鸿韩浠芥寚鍚戝悓涓€鍥藉闃熶綋绯汇€?
  ], player, answer, "country");
  if (player.birth && answer.birth && Math.abs(player.birth - answer.birth) <= 4) return variedHint(language === "en" ? [
    "They rose within roughly the same football generation.",
    "Their prime years belong to a similar era of the game.",
    "Their career timelines place them in the same football age."
  ] : [
    "涓や汉鐨勬垚闀夸笌鎴愬悕闃舵澶勫湪鐩歌繎鐨勮冻鐞冨勾浠ｃ€?,
    "浜屼汉鐨勭敓娑粍閲戞湡澶ц嚧灞炰簬鍚屼竴浠ｈ冻鍧涖€?,
    "浠庢椂闂寸嚎鐪嬶紝涓や汉娲昏穬鍦ㄧ浉杩戠殑鑱屼笟瓒崇悆鏃舵湡銆?
  ], player, answer, "era");
  if (score >= 28) return variedHint(language === "en" ? [
    "Their career maps overlap indirectly, although no close public relationship is documented.",
    "Several football-context clues align, but not through a direct documented link.",
    "The similarity comes from parallel career context rather than a known personal connection."
  ] : [
    "涓や汉鐨勮冻鐞冨饱鍘嗗瓨鍦ㄤ晶闈㈤噸鍚堬紝浣嗘湭鍙戠幇鏄庣‘鐨勭洿鎺ュ叧绯汇€?,
    "鑻ュ共鑱屼笟鑳屾櫙绾跨储鐩歌繎锛屼笉杩囧苟闈炴潵鑷彲纭鐨勭洿鎺ヤ氦闆嗐€?,
    "杩欎唤鐩镐技搴︿富瑕佹潵鑷钩琛岀殑鐢熸动鑳屾櫙锛岃€屼笉鏄凡鐭ョ殑浜虹墿鍏崇郴銆?
  ], player, answer, "indirect");
  return variedHint(language === "en" ? [
    "No direct public football relationship appears in the available record.",
    "Their known career paths remain far apart in the current data.",
    "The available record offers little evidence of a direct football connection."
  ] : [
    "鐜版湁鍏紑璁板綍涓紝鏆傛湭鍙戠幇涓や汉鐨勭洿鎺ヨ冻鐞冨叧鑱斻€?,
    "浠庡凡鏀跺綍鐨勮亴涓氳建杩圭湅锛屼袱浜虹殑浜ら泦鐩稿綋鏈夐檺銆?,
    "鐜版湁璧勬枡涓嶈冻浠ユ妸涓や汉杩炲埌鍚屼竴鏉℃槑纭殑瓒崇悆鍏崇郴绾夸笂銆?
  ], player, answer, "distant");
}
function storyHint(person, answer) {
  if (person.id === answer.id) return "杩欏氨鏄湰灞€绛旀銆?;
  if (person.free) {
    const signals = storyTextSignals(person, answer);
    const reference = signals.references
      .sort((a, b) => storySimilarity(b.person, answer) - storySimilarity(a.person, answer))[0];
    if (reference?.person.id === answer.id) return "杈撳叆鍐呭涓寘鍚簡涓庣瓟妗堢浉绗︾殑浜虹墿绉板懠銆?;
    if (reference) return `杈撳叆涓彁鍒颁簡鈥?{reference.person.name}鈥濓紱${storyHint(reference.person, answer)}`;
    if (signals.directClue) return `杈撳叆鍐呭鍛戒腑浜嗕笌绛旀鐩稿叧鐨勨€?{signals.directClue}鈥濈嚎绱€俙;
    if (signals.sharedWords.length) return `杈撳叆鍐呭涓庣瓟妗堝叡浜€?{signals.sharedWords[0]}鈥濊繖涓€浜虹墿鎴栧墽鎯呯壒寰併€俙;
    if (signals.sharedGrams.length) return variedHint([
      "杈撳叆鏂囧瓧涓庣瓟妗堢殑浜虹墿绉拌皳鎴栧墽鎯呮爣绛惧瓨鍦ㄩ儴鍒嗛噸鍚堛€?,
      "杩欐鏂囧瓧纰板埌浜嗙瓟妗堢О璋撴垨鍓ф儏鏍囩涓殑涓€閮ㄥ垎銆?,
      "鏂囧瓧灞傞潰鍑虹幇浜嗗皯閲忓彲涓庣瓟妗堝鐓х殑绉拌皳绾跨储銆?
    ], person, answer, "text-overlap");
    return variedHint([
      "杩欐杈撳叆灏氭湭钀藉埌绛旀宸叉湁鐨勫墽鎯呯嚎绱笂銆?,
      "鐜版湁鍓ф儏璧勬枡閲岋紝杩樻壘涓嶅埌杩欐鏂囧瓧涓庣洰鏍囦汉鐗╃殑鏄庣‘浜ょ偣銆?,
      "杩欐潯鏂囧瓧绾跨储鏆傛椂娌℃湁杩炲埌绛旀鐨勪汉鐗╁叧绯荤綉銆?,
      "浠庡綋鍓嶆敹褰曠殑浜嬩欢涓庝汉鐗╁叧绯荤湅锛岃繖娆¤緭鍏ョ绛旀杈冭繙銆?
    ], person, answer, "text-distant");
  }
  const direct = STORY_DATA.relations?.[activeGame]?.[storyPairKey(person.name, answer.name)];
  if (direct) return direct;
  const events = intersection(person.events, answer.events);
  const namedEvent = events.find((event) => !/^绗琝d+鍥?/.test(event));
  if (namedEvent) return variedHint([
    `浜屼汉鐨勫懡杩愰兘琚嵎鍏モ€?{namedEvent}鈥濊繖鏉″墽鎯呯嚎銆俙,
    `鈥?{namedEvent}鈥濇槸涓や汉鏁呬簨杞ㄨ抗涓殑鍏卞悓鑺傜偣銆俙,
    `椤虹潃鈥?{namedEvent}鈥濊繖娈垫儏鑺傦紝鍙互鎵惧埌浜屼汉鐨勪氦闆嗐€俙,
    `涓や汉鐨勪汉鐗╃嚎閮芥浘鍥犫€?{namedEvent}鈥濆彂鐢熻浆鎶樻垨姹囧悎銆俙
  ], person, answer, `event:${namedEvent}`);
  const sharedChapter = events.find((event) => /^绗琝d+鍥?/.test(event));
  if (sharedChapter) return variedHint([
    `浜屼汉鐨勪汉鐗╃嚎閮藉湪鈥?{sharedChapter}鈥濈暀涓嬩簡绾跨储銆俙,
    `鈥?{sharedChapter}鈥濆悓鏃跺嚭鐜颁簡涓庝簩浜烘湁鍏崇殑鍙欎簨銆俙,
    `鍦ㄢ€?{sharedChapter}鈥濈殑鐩稿叧鎯呰妭涓紝涓や汉鐨勬晠浜嬭建杩瑰彂鐢熼噸鍚堛€俙,
    `娌跨潃鈥?{sharedChapter}鈥濆洖鐪嬶紝鍙互鍙戠幇浜屼汉澶勫湪鍚屼竴娈典汉鐗╁彊浜嬮噷銆俙
  ], person, answer, `chapter:${sharedChapter}`);
  const bridge = intersection(person.links, answer.links).find((name) => name !== person.name && name !== answer.name);
  if (bridge) return variedHint([
    `浜屼汉鐨勬晠浜嬬嚎閮戒笌鈥?{bridge}鈥濈浉杩炪€俙,
    `鈥?{bridge}鈥濇槸涓茶捣涓や汉浜虹墿鍏崇郴鐨勪竴澶勫叧閿妭鐐广€俙,
    `椤虹潃鈥?{bridge}鈥濈殑浜虹墿绾匡紝鍙互鍒嗗埆鎵惧埌浜屼汉鐨勫墽鎯呬綅缃€俙,
    `涓や汉鐨勫叧绯荤綉閮界粡杩団€?{bridge}鈥濓紝浣嗗悇鑷壙鎷呯殑鍓ф儏浣滅敤涓嶅悓銆俙
  ], person, answer, `bridge:${bridge}`);
  const groups = intersection(person.groups, answer.groups);
  if (groups.length) return variedHint([
    `浜屼汉鍚屽鈥?{groups[0]}鈥濅汉鐗╃綉缁滐紝浣嗚韩浠藉拰浣滅敤骞朵笉鐩稿悓銆俙,
    `鈥?{groups[0]}鈥濇槸涓や汉鍏卞悓鎵€鍦ㄧ殑浜虹墿闃佃惀銆俙,
    `涓や汉鐨勫墽鎯呴兘浠庘€?{groups[0]}鈥濊繖鏉′汉鐗╃嚎寤朵几鍑烘潵銆俙,
    `鑻ヤ粠鈥?{groups[0]}鈥濈殑浜虹墿鍏崇郴鍏ユ墜锛屽彲浠ュ悓鏃舵壘鍒颁簩浜虹殑浣嶇疆銆俙
  ], person, answer, `group:${groups[0]}`);
  if (person.links?.includes(answer.name) || answer.links?.includes(person.name)) return variedHint([
    "鍘熻憲浜虹墿鍏崇郴涓紝浜屼汉鐨勫墽鎯呯嚎瀛樺湪鐩存帴浜ょ偣銆?,
    "涓や汉骞堕潪鍙湪鍚屼竴鏃朵唬鍑虹幇锛屼汉鐗╁叧绯荤綉涓篃鏈夋槑纭繛鎺ャ€?,
    "椤虹潃鍘熻憲涓殑浜虹墿寰€鏉ワ紝鍙互鎵惧埌浜屼汉鐨勭洿鎺ヤ氦闆嗐€?
  ], person, answer, "direct-link");
  return variedHint(activeGame === "honglou" ? [
    "鍦?20鍥炴晠浜嬩腑锛屼簩浜虹殑鐩存帴寰€鏉ュ緢灏戙€?,
    "涓や汉鍒嗗杈冭繙鐨勪汉鐗╃嚎锛屽師钁椾腑娌℃湁鏄庢樉姝ｉ潰浜ら泦銆?,
    "浠庡凡鏀跺綍鐨勭珷鑺傚拰浜虹墿鍏崇郴鐪嬶紝浜屼汉鐨勬晠浜嬭窛绂昏緝杩溿€?,
    "浜屼汉鐨勬椿鍔ㄨ寖鍥村苟涓嶉噸鍚堬紝鏆傛棤绾跨储琛ㄦ槑鏈夌洿鎺ュ線鏉ャ€?
  ] : [
    "鍦ㄧ幇鏈夊墽鎯呬腑锛屼簩浜虹殑鐩存帴寰€鏉ュ緢灏戙€?,
    "涓や汉鍒嗗涓嶅悓浜虹墿绾匡紝鏆傛湭鍙戠幇鏄庢樉姝ｉ潰浜ら泦銆?,
    "浠庡凡鏀跺綍鐨勪簨浠跺拰鍏崇郴鐪嬶紝浜屼汉鐨勬晠浜嬭窛绂昏緝杩溿€?
  ], person, answer, "distant");
}
function relationshipHint(person, answer, score) { return activeGame === "football" ? footballHint(person, answer, score) : storyHint(person, answer); }

function updateUI() {
  const text = copy();
  document.documentElement.lang = currentLanguage() === "en" ? "en" : "zh-CN";
  document.body.dataset.game = activeGame || "home";
  document.title = activeGame ? `${text.brand}锝?{text.title}` : "浜虹墿璋滃眬锝滅寽浜虹墿";
  elements.brandText.textContent = activeGame ? text.brand : "浜虹墿璋滃眬";
  elements.title.textContent = text.title;
  elements.eyebrow.textContent = text.eyebrow;
  elements.attemptLabel.textContent = text.attempts;
  elements.bestLabel.textContent = text.best;
  elements.searchLabel.textContent = text.search;
  elements.guessLabel.textContent = text.guess;
  elements.emptyTitle.textContent = text.empty;
  elements.howBtn.textContent = currentLanguage() === "en" ? "How to play" : "鐜╂硶";
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
  elements.best.textContent = best === null ? "鈥? : `${best.toFixed(2)}%`;
  elements.status.textContent = finished ? text.done : attempts ? format(text.status, { n: attempts }) : text.ready;
  const remaining = Math.max(0, currentConfig().surrenderAt - attempts);
  elements.reveal.disabled = remaining > 0 || finished;
  elements.reveal.textContent = remaining ? format(text.locked, { n: remaining }) : text.surrender;
}

function submitGuess() {
  if (!activeGame || finished) return;
  const raw = elements.input.value.trim();
  if (!raw) { showToast(currentLanguage() === "en" ? "Enter a name first." : "璇峰厛杈撳叆涓€涓悕瀛椼€? ); return; }
  if (activeGame !== "football" && !hasChinese(raw)) { showToast("鏈父鎴忚浣跨敤涓枃濮撳悕鎴栫О璋撱€?); return; }
  const person = resolveEntry(raw);
  const key = normalize(raw);
  const previous = guesses.find((guess) => guess.key === key);
  if (previous) {
    if (currentConfig().hintsAfter !== null && attempts >= currentConfig().hintsAfter && !previous.hint) {
      previous.hint = relationshipHint(previous.person, target, previous.score);
      lastGuessKey = key;
      renderGuesses();
      showToast(currentLanguage() === "en" ? "Already guessed 鈥?the hint was added to the original row." : "宸茬粡鐚滆繃璇ヤ汉鐗╋紝鍏崇郴鎻愮ず宸茶ˉ鍏呭埌鍘熻瘝鏉°€? );
    } else {
      showToast(currentLanguage() === "en" ? "You already guessed this player." : "浣犲凡缁忕寽杩囪浜虹墿浜嗐€? );
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
  const role = positions[0] || (language === "en" ? "professional footballer" : "鑱屼笟鐞冨憳");
  let style;
  if (player.positions.includes("Q201330")) style = language === "en" ? "shot-stopping, positioning and command of the penalty area" : "闂ㄧ嚎鍙嶅簲銆佷綅缃€夋嫨鍜岀鍖烘寚鎸?;
  else if (player.positions.includes("Q18691898")) style = language === "en" ? "ball-winning, coverage and defensive transitions" : "鎷︽埅銆佽鐩栧拰鐢卞畧杞敾";
  else if (player.positions.some((id) => ["Q193592", "Q6008848", "Q90326494"].includes(id))) style = language === "en" ? "link play, press resistance and control of tempo" : "涓茶仈銆佹姉鍘嬪鐞嗗拰姣旇禌鑺傚鎺у埗";
  else if (player.positions.some((id) => ["Q268258", "Q336286", "Q1489923"].includes(id))) style = language === "en" ? "defensive reading, duels and progression from the back" : "闃插畧闃呰銆佸鎶楀拰鍚庡満鎺ㄨ繘";
  else style = language === "en" ? "movement, attacking impact and end product" : "璺戜綅銆佽繘鏀诲啿鍑诲拰缁堢粨鏁堢巼";
  if (language === "en") {
    const career = clubs.length ? ` Their career includes ${clubs.join(", ")}.` : "";
    return { copy: `${localeName(player)} is a ${role}${player.birth ? ` born in ${player.birth}` : ""}.${career} Their profile is associated with ${style}.`, tags: [role, player.birth && player.birth < 1985 ? "Established era" : "Modern career", clubs.length > 2 ? "Multi-club career" : "Distinct role"].filter(Boolean) };
  }
  const career = clubs.length ? `鍏跺叕寮€鐢熸动涓?{clubs.join("銆?)}绛変勘涔愰儴鏈夊叧銆俙 : "鍏惰亴涓氬饱鍘嗚法瓒婁簡鏄庣‘鐨勪勘涔愰儴鎴栧浗瀹堕槦闃舵銆?;
  return { copy: `${localeName(player)}${player.birth ? `鍑虹敓浜?{player.birth}骞达紝` : ""}涓昏鍙歌亴${role}銆?{career}姣旇禌鐗圭偣涓昏浣撶幇鍦?{style}锛屼汉鐗╀粙缁嶆牴鎹凡鏀跺綍鐨勫叕寮€鑱屼笟淇℃伅鐢熸垚銆俙, tags: [role, player.birth && player.birth < 1985 ? "缁忓吀骞翠唬" : "鑱屼笟瓒宠抗", clubs.length > 2 ? "澶氭鐢熸动" : "椴滄槑瑙掕壊"].filter(Boolean) };
}
function asSentence(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return /[銆傦紒锛?!?]$/.test(text) ? text : `${text}銆俙;
}
function storyProfileCopy(person) {
  const genericBio = /120鍥炴晠浜嬩腑(?:浠??(?:鏈??濮撳悕鎴栫О璋?.test(person.bio || "");
  let result = genericBio ? "" : asSentence(person.bio);
  const groups = (person.groups || []).filter((group) => !/^(绾㈡ゼ浜虹墿|鐢勫瑳浼犱汉鐗?$/.test(group)).slice(0, 2);
  const namedEvent = (person.events || []).find((event) => !/^绗琝d+鍥?/.test(event));
  const firstChapter = (person.events || []).find((event) => /^绗琝d+鍥?/.test(event));
  const links = (person.links || []).filter((name) => name !== person.name).slice(0, 3);
  if (result.length < 50 && groups.length) {
    result += `${person.name}鐨勪汉鐗╃嚎褰掑叆鈥?{groups.join("銆?)}鈥濈浉鍏冲彊浜嬨€俙;
  }
  if (result.length < 50 && namedEvent) {
    result += `鍏剁粡鍘嗘秹鍙娾€?{namedEvent}鈥濊繖娈甸噸瑕佹儏鑺傦紝杩欎篃鏄悊瑙ｄ汉鐗╁澧冧笌鍓ф儏浣滅敤鐨勪竴鏉＄嚎绱€俙;
  } else if (result.length < 50 && firstChapter) {
    result += `杩欎竴瑙掕壊鑷?{firstChapter}璧疯繘鍏ョ浉鍏虫儏鑺傦紝鍑哄満琛ュ厖浜嗘墍灞炰汉鐗╃嚎鐨勬棩甯稿叧绯讳笌鏁呬簨鑴夌粶銆俙;
  }
  if (result.length < 50 && links.length) {
    result += `鍏舵晠浜嬭繕涓?{links.join("銆?)}绛夎鑹茬殑浜虹墿绾跨浉浜掔壍杩炪€俙;
  }
  if (result.length < 50) {
    result += `${person.name}铏界劧鐫€澧ㄦ湁闄愶紝浣嗗叾鍑哄満浠嶅府鍔╀氦浠ｄ簡浜虹墿鍏崇郴銆佽韩浠戒綅缃笌鐩稿簲鐨勫墽鎯呰儗鏅€俙;
  }
  if (result.length < 50) {
    result += "杩欎簺鐗囨鍏卞悓鏋勬垚浜嗚繖涓€浜虹墿鍦ㄤ綔鍝佷腑鐨勫熀鏈舰璞′笌鍙欎簨浣滅敤銆?;
  }
  return result;
}
function profileFor(person) {
  if (activeGame !== "football") {
    return { copy: storyProfileCopy(person), tags: (person.tags || person.groups || []).slice(0, 3) };
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
    <div class="reveal-actions"><button id="againBtn" type="button">${currentLanguage() === "en" ? "Play again" : "鍐嶆潵涓€灞€"}</button><button id="copyBtn" type="button">${currentLanguage() === "en" ? "Copy result" : "澶嶅埗鎴樼哗"}</button></div>`;
  elements.victory.hidden = false;
  $("#againBtn").addEventListener("click", startNewGame);
  $("#copyBtn").addEventListener("click", copyResult);
}
async function copyResult() {
  try { await navigator.clipboard.writeText(format(copy().result, { n: attempts, name: localeName(target) })); showToast(currentLanguage() === "en" ? "Result copied." : "鎴樼哗宸插鍒躲€? ); }
  catch { showToast(currentLanguage() === "en" ? "Could not copy the result." : "鏆傛椂鏃犳硶澶嶅埗锛岃鎴浘鍒嗕韩銆? ); }
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
  document.title = "浜虹墿璋滃眬锝滅寽浜虹墿";
  elements.brandText.textContent = "浜虹墿璋滃眬";
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
  if (attempts >= currentConfig().surrenderAt && !finished && window.confirm(currentLanguage() === "en" ? "Surrender and reveal the answer?" : "纭畾瑕佹姇闄嶅苟鏌ョ湅绛旀鍚楋紵")) { finishGame("surrender"); updateStats(); }
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

