(() => {
  const data = window.GUIDE_DATA;
  let slides = data.slides;
  let byId = new Map(slides.map(slide => [slide.id, slide]));
  const content = document.getElementById('slideContent');
  const scrollArea = document.getElementById('storyContent');
  const dialog = document.getElementById('chapterDialog');
  let current = slides[0];
  let selectedClass = Math.min(3, Math.max(1, Number(localStorage.getItem('jeju-demo-course') || 1) || 1));
  let map;
  let mapLayers = [];
  let busAnimation;
  let activeEvac = 'girls';
  let evacFloor = 2;
  const classLabel = () => `여행 코스 ${classProfile().team}`;
  const classProfile = () => data.classes[selectedClass];
  function selectProgram() {
    const profile = classProfile();
    const program = data.programs[profile.team];
    data.days = program.days;
    data.routes = program.routes;
    data.timelines = structuredClone(program.timelines);
    data.timelines[3].find(entry => entry.slide === 'return').time = profile.flight.arrival;
    slides = structuredClone(program.slides);
    slides.push({ id: 'after', type: 'after', group: 'after', title: '다녀와서 · 여행 기록' }, {id:'collect',type:'collect',group:'after',title:'기록 모아보기'});
    const home = slides.find(slide => slide.id === 'return');
    home.time = `${profile.flight.arrival}–23:30경`;
    home.body[0] = `${profile.flight.arrival} · 김포공항 도착 후 귀가 버스 탑승`;
    data.slides = slides;
    byId = new Map(slides.map(slide => [slide.id, slide]));
    window.GUIDE_REFLECTIONS.setContext(selectedClass, slides, render);
  }
  selectProgram();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const photo = (key, className = 'photo') => {
    const item = data.photos[key];
    if (!item) return '';
    return `<figure class="${className}"><img src="${esc(item.src)}" alt="${esc(item.alt)}"><figcaption>사진: <a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(item.credit)}</a></figcaption></figure>`;
  };
  const groupName = group => group === 'before' ? '출발 전' : group === 'after' ? '다녀와서' : `${group}일차 <small>${data.days[group].short}</small>`;
  const daySlides = group => slides.filter(slide => slide.group === group);
  const go = id => {
    const hash = `#/p/${id}`;
    if (!byId.has(id) || location.hash === hash) return;
    history.pushState(null, '', hash);
    render();
  };
  const nextSlide = () => slides[slides.indexOf(current) + 1];
  const previousSlide = () => slides[slides.indexOf(current) - 1];

  function coverHtml(){return `<article class="slide cover-slide"><p class="slide-kicker">JEJU · 2박 3일 · ${classLabel()}</p><h1>제주 2박 3일,<br>한 장씩 따라가요</h1><hr class="title-rule"><p class="lead">장소별 일정과 지도를 따라 제주를 둘러보세요.</p><div class="cover-card"><div><strong>JEJU TRIP</strong><small>2박 3일 · 여행 안내 체험판</small></div><em>DAY 1 → 3</em></div><p class="section-label">여행 코스 선택</p><div class="class-picker" role="group" aria-label="여행 코스 선택">${Object.keys(data.classes).map(n=>`<button type="button" data-class="${n}" aria-pressed="${Number(n)===selectedClass}">코스 ${data.classes[n].team}</button>`).join('')}</div><div class="cover-extra-actions"><button class="reflection-link" data-open-notices>공지 보기</button><button class="reflection-link" data-go="after">여행 기록 쓰기</button><button class="reflection-link" data-go="collect">기록 모아보기</button></div><div class="callout">출발지·학급·실제 배정 정보를 제외한 별도 체험판입니다. 소감문은 이 브라우저에만 저장되며 외부로 제출되지 않습니다.</div><p class="section-label">일차를 선택해 바로 이동</p>${[1,2,3].map(day=>`<button class="chapter-link" data-go="day${day}"><span class="chapter-num">0${day}</span><small>${day}일차</small><strong>${esc(data.days[day].heading)}</strong><span>›</span></button>`).join('')}<p class="section-label">출발 전 안내</p>${[['bus','이동 안내'],['ready','출발 전 체크리스트'],['rooms','숙소와 대피 안내'],['cautions-general','전체 유의사항']].map(([id,title])=>`<button class="chapter-link" data-go="${id}"><strong>${title}</strong><span>›</span></button>`).join('')}</article>`;}

  function busHtml(){return `<article class="slide"><p class="slide-kicker">출발 전 · 이동 안내</p><h1>출발 집결지에서<br>김포공항까지</h1><hr class="title-rule"><p class="lead">출발 전 안내된 집결 시각과 탑승편을 확인하세요.</p>${photo('gimpo')}<div class="bus-box"><h2>${classLabel()}</h2><p>실제 학급·인원·버스 배정은 포함하지 않습니다.</p></div><div class="callout">지도 위 버스는 도심 집결지에서 공항으로 이동하는 예시입니다. 실제 출발지 위치나 귀가 주소를 사용하지 않습니다.</div></article>`;}

  const preparationStorage='jeju-demo-preparation-checks';
  let preparationChecks={};
  try{const saved=JSON.parse(localStorage.getItem(preparationStorage)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))preparationChecks=saved;}catch{}
  document.addEventListener('change',e=>{
    const checkbox=e.target.closest('[data-preparation-check]');if(!checkbox)return;
    preparationChecks[checkbox.dataset.preparationCheck]=checkbox.checked;
    try{localStorage.setItem(preparationStorage,JSON.stringify(preparationChecks));}catch{}
  });
  function readyHtml(){const keys=['신분확인 서류는 여행 주최측 안내에 따라 준비','집결 시각과 이동편 확인','개인 약품과 비닐봉투 챙기기','배터리는 직접 가지고 탑승','숙소 비상구와 대피 방법 확인','귀가 이동편 확인'];return `<article class="slide"><p class="slide-kicker">출발 전 · 체크리스트</p><h1>출발 전에<br>챙길 것</h1><hr class="title-rule"><p class="lead">하나씩 체크하면서 준비하세요.</p><ul class="check-list preparation-list">${keys.map((item,i)=>{const key=selectedClass+':'+i;return `<li><label><input type="checkbox" data-preparation-check="${key}" ${preparationChecks[key]?'checked':''}><span>${item}</span></label></li>`;}).join('')}</ul></article>`;}

  function roomsHtml(){return `<article class="slide"><p class="slide-kicker">숙소 · 안전</p><h1>숙소와<br>대피 안내</h1><hr class="title-rule"><p class="lead">개인별 객실 배정 없이 대표 피난 대피도와 숙소 안전 수칙을 확인하세요.</p><section class="lodging-critical" aria-label="객실 생활 필수 주의사항"><h2>객실에서 반드시 지킬 것</h2><p class="lodging-ban">방 이동 금지</p><p>다른 방에 들어가지 마세요.</p><p class="lodging-ban">발코니 이동 · 무단외출 금지</p><p class="lodging-consequence">위반 시 퇴학</p><button type="button" class="reflection-button" data-show-lodging>객실 주의사항 크게 보기</button></section>${photo('resort')}<ul class="caution-list"><li>체크인 후 객실 문 안쪽의 대피 안내도를 확인하세요.</li><li>가까운 비상구와 계단 위치를 확인하세요.</li><li>비상시 엘리베이터를 이용하지 마세요.</li><li>현장 안내에 따라 질서 있게 대피하세요.</li></ul></article>`;}

  function cautionsHtml(slide) {
    const sections = {
      general: { title: '기본과 이동', lead: '집합 시간과 버스·항공 이동 수칙을 지켜요.', groups: [
        ['참가자 준수 사항 · 11가지', ['모든 교육 프로그램에 성실히 참여하세요.', '현장 지도 인력과 프로그램 진행자의 안전 지도를 따르세요.', '교육활동 중 유해한 장소나 위험한 시설에 접근하지 마세요.', '차량 운행을 방해하지 말고 탑승 중에는 안전띠를 착용하세요.', '돌발사고가 나면 현장 지도 인력이나 안전요원에게 즉시 알리고 지시를 받으세요.', '식당·화장실 등 여러 사람이 이용하는 시설에서 질서와 예절을 지키세요.', '친구를 존중하고 배려하세요.', '숙소 기물을 훼손하거나 과격하게 행동하지 마세요.', '승차·하차와 집합 시각을 지키세요.', '몸 상태 등으로 교육활동을 계속하기 어려우면 현장 지도 인력에게 알리고 지시를 받으세요.', '과도한 현금·귀중품이나 금지 물품을 소지하지 마세요.']],
        ['가져오지 말아야 할 물품', ['인화물질·흉기·폭발물·도박 도구·위험한 광선 발사 기구 등 안전을 해치는 물품을 가져오지 마세요.', '마약류·주류·담배·위험한 게임 도구와 고가 물품을 가져오지 마세요.']],
        ['버스와 공항', ['여행 주최측이 안내한 신분확인 서류을 준비하고, 지정된 버스와 항공 수속 안내를 확인하세요.', '버스에서는 출발부터 도착까지 안전띠를 매고 자리를 옮기거나 운전을 방해하지 마세요.', '차창 밖으로 손을 내밀거나 쓰레기를 버리지 말고, 창문을 열고 장난치지 마세요.', '휴게소와 주차장에서는 좌우를 살피고 보행로로 이동하세요. 차량 번호와 재집합 시각을 확인하세요.']]
      ]},
      activity: { title: '체험과 숙소', lead: '현장 안내와 객실 생활 규칙을 확인해요.', groups: [
        ['체험장·관람 시설', ['체험 전 건강 상태에 맞는 탑승 기준을 확인하고, 정해진 좌석에서 안전장치를 정확히 잠그세요.', '떨어지기 쉬운 물건을 지니고 탑승하지 마세요. 운행 중 촬영·취식·장난·창밖으로 손 내밀기를 하지 마세요.', '완전히 정지한 뒤 안전장치를 풀고 지정 출구로 천천히 나오세요.', '줄을 지키고 다른 이용객과 직원에게 피해를 주지 마세요. 꽃밭·시설물을 훼손하거나 금지 구역에 들어가지 마세요.', '체험장과 관람 시설의 출입구·대피로를 확인하고, 재난 시 질서 있게 이동하세요.']],
        ['숙소', ['객실에 들어가면 문 안쪽 피난안내도와 가까운 비상구·계단을 확인하세요.', '객실 기물을 훼손하거나 과격한 장난을 하지 마세요. 위험하거나 고가의 물건은 가져오지 마세요.', '방 이동 금지. 발코니를 통한 이동 또는 무단외출을 하지 마세요.', '화재가 나면 주변에 알리고 119에 신고한 뒤, 젖은 수건으로 코와 입을 가리고 낮은 자세로 안전한 대피로로 이동하세요.']]
      ]},
      emergency: { title: '건강과 비상', lead: '이상이 생기면 바로 알리고 현장 지시를 따라요.', groups: [
        ['개인 약품 준비', ['멀미약·감기약은 개인이 준비하고 개인 비닐봉투를 챙기세요.', '현장에서는 외상약만 지급합니다.']],
        ['건강·음식', ['몸이 아프거나 활동을 계속하기 어렵다면 즉시 현장 지도 인력에게 알리세요.', '음식 섭취 후 복통·구토·설사 등 이상 증상이 있으면 바로 알리세요.', '개인 건강 상태에 맞는 체험 기준을 따르고, 발열이나 감염병 의심 증상이 있으면 숨기지 말고 알리세요.']],
        ['사고·재난', ['돌발사고나 부상은 주변에 알리고 119에 신고한 뒤 현장 지도 인력의 지시를 따르세요.', '버스에 화재가 나면 안전띠를 풀고 질서 있게 하차하여 도로 밖 안전지대로 이동하세요.', '지진이 나면 떨어지는 물건과 유리창을 피하고 머리를 보호하세요. 흔들림이 멈추면 안내에 따라 넓고 안전한 곳으로 이동하세요.', '비상시 뛰거나 밀지 말고 가까운 출구·계단으로 이동하세요. 현장 대피 안내가 이 페이지보다 우선합니다.']]
      ]}
    };
    const section = sections[slide.section];
    return `<article class="slide"><p class="slide-kicker">출발 전 · 전체 유의사항</p><h1>${esc(section.title)}</h1><hr class="title-rule"><p class="lead">${esc(section.lead)}</p>${section.groups.map(([heading, items]) => `<h2 class="caution-heading">${esc(heading)}</h2><ul class="caution-list">${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`).join('')}<div class="callout">이동과 체험 중에는 현장 안전 안내를 먼저 확인하세요.</div></article>`;
  }

  function overviewHtml(slide) {
    const day = data.days[slide.group];
    const timeline = data.timelines[slide.group];
    return `<article class="slide overview-slide"><p class="slide-kicker">${esc(day.label)} · ${esc(day.date)} · ${classLabel()} · ${classProfile().team}팀</p><h1>${esc(slide.title)}</h1><hr class="title-rule"><p class="lead">${esc(day.lead)}</p><img class="day-hero" src="${esc(data.photos[slide.photo].src)}" alt="${esc(data.photos[slide.photo].alt)}"><p class="section-label">시간순으로 따라가기</p><ol class="timeline-list">${timeline.map(item => `<li><button type="button" data-go="${esc(item.slide)}"><time>${esc(item.time)}</time><span>${esc(item.title)}</span><i aria-hidden="true">›</i></button></li>`).join('')}</ol><p class="small-note">오른쪽 지도에서 장소를 눌러도 해당 장으로 이동합니다. 지도 선은 장소 순서를 나타내며 실제 도로 경로는 아닙니다.</p></article>`;
  }

  function tourismHtml(slide) {
    const info = data.tourism?.[slide.id];
    if (!info) return '';
    return `<section class="tourism-card" aria-label="${esc(slide.title)} 주요 관광 포인트">
      <p class="section-label">이곳에서 볼 것</p>
      <ul>${info.items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
      <div class="tourism-sources">장소 정보: ${info.sources.map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} ↗</a>`).join(' · ')}</div>
    </section>`;
  }

  function stopHtml(slide) {
    const day = data.days[slide.group];
    const dayStops = daySlides(slide.group).filter(item => item.type === 'stop');
    const order = dayStops.indexOf(slide) + 1;
    const position = slide.id === 'resort2' ? data.routes[slide.group].lastIndexOf(slide.point) : data.routes[slide.group].indexOf(slide.point);
    const previous = data.routes[slide.group][Math.max(0, position - 1)];
    const point = data.points[slide.point];
    const osm = point ? `https://www.openstreetmap.org/?mlat=${point[0]}&mlon=${point[1]}#map=15/${point[0]}/${point[1]}` : '';
    return `<article class="slide stop-slide">
      <button class="overview-back" type="button" data-go="${esc(day.overview)}">← ${esc(day.label)} 한눈에 보기</button>
      <p class="slide-kicker">${esc(day.label)} · ${esc(day.short)} · ${classLabel()} · ${classProfile().team}팀 &nbsp; / &nbsp; ${String(order).padStart(2, '0')}번째 장소</p>
      <p class="day-tag">${esc(slide.time)} <span style="color:#777;font-weight:500">· ${esc(slide.category)}</span></p>
      <h1>${esc(slide.title)}</h1><hr class="title-rule">
      ${window.GUIDE_REFLECTIONS.reflectionHtml(slide) ? '<button class="reflection-link" type="button" data-focus-reflection>이 장소 느낀 점 쓰기 ↓</button>' : ''}
      <div class="location-row"><span class="pin-icon" aria-hidden="true">⌖</span><span class="address">${esc(slide.address)}</span>${osm ? `<a href="${osm}" target="_blank" rel="noopener noreferrer">지도 열기 ↗</a>` : ''}</div>
      <div class="travel-card"><span class="travel-icon" aria-hidden="true">↗</span><div><strong>장소 따라가기</strong><p>${esc(previous && previous !== slide.point ? data.names[previous] : day.label)} → ${esc(data.names[slide.point])}</p></div></div>
      ${slide.photo ? photo(slide.photo) : ''}${slide.extraPhoto ? `<div class="photo-thumbs">${photo(slide.extraPhoto, 'thumb-photo')}</div>` : ''}
      <div class="stop-body"><p>${esc(slide.subtitle)}</p>${slide.body.map(text => `<p>${esc(text)}</p>`).join('')}</div>
      ${tourismHtml(slide)}
      ${window.GUIDE_REFLECTIONS.reflectionHtml(slide)}
      ${slide.point === 'resort' ? '<button class="next-inline" type="button" data-go="rooms"><span>숙소 안전 수칙과 피난 대피도 보기</span><span aria-hidden="true">›</span></button>' : ''}
      <div class="callout">${esc(day.date)} · ${esc(slide.time)}</div>
      ${nextSlide() ? `<button class="next-inline" type="button" data-go="${esc(nextSlide().id)}"><span>다음 장 · ${esc(nextSlide().title)}</span><span aria-hidden="true">›</span></button>` : ''}
    </article>`;
  }

  function renderContent() {
    if (current.type === 'cover') content.innerHTML = coverHtml();
    if (current.type === 'bus') content.innerHTML = busHtml();
    if (current.type === 'ready') content.innerHTML = readyHtml();
    if (current.type === 'rooms') content.innerHTML = roomsHtml();
    if (current.type === 'cautions') content.innerHTML = cautionsHtml(current);
    if (current.type === 'overview') content.innerHTML = overviewHtml(current);
    if (current.type === 'stop') content.innerHTML = stopHtml(current);
    if (current.type === 'after') content.innerHTML = window.GUIDE_REFLECTIONS.afterHtml();
    if(current.type==='collect'){content.innerHTML=window.GUIDE_DEMO.collectHtml();window.GUIDE_DEMO.loadCollection();}
  }

  function renderSidePanel() {
    const app = document.getElementById('app');
    const gallery = document.getElementById('roomMapGallery');
    const panel = document.getElementById('experiencePanel');
    const rooms = current.type === 'rooms';
    const detail = current.type === 'stop' && current.id !== 'return';
    const ready = current.type === 'ready';
    const writing = current.group === 'after';
    app.classList.toggle('rooms-view', rooms);
    app.classList.toggle('stop-view', detail);
    app.classList.toggle('photo-view', ready);
    app.classList.toggle('writing-view', writing);
    gallery.hidden = !rooms;
    panel.hidden = !(detail || ready || writing);
    if (writing) panel.innerHTML = window.GUIDE_REFLECTIONS.sideHtml(current.type);
    if(rooms)gallery.innerHTML=`<div class="evac-head"><strong>대표 피난 대피도</strong><span>A·B동 · 2~5층 공통</span></div><div class="evac-tabs"><button type="button" data-evac-expand aria-pressed="${gallery.classList.contains('evac-expanded')}">${gallery.classList.contains('evac-expanded')?'닫기':'크게 보기'}</button></div><div class="evac-large representative-evac"><img src="assets/evacuation-representative.jpg" width="1092" height="780" alt="A동과 B동의 2~5층 공통 피난 대피도. 객실 복도에서 양쪽 피난 계단으로 향하는 방향과 피난 유도등을 표시한 원본 도면."></div><p>개인별 객실 배정은 표시하지 않습니다. 실제 대피는 객실 문 안쪽의 피난안내도와 현장 지시에 따르세요.</p>`;
    if (ready) {
      const airport = data.photos.gimpo;
      panel.innerHTML = `<img class="ready-airport-photo" src="${esc(airport.src)}" alt="${esc(airport.alt)}"><div class="ready-airport-label"><span>출발 공항</span><strong>김포국제공항 국내선</strong><a href="${esc(airport.url)}" target="_blank" rel="noopener noreferrer">사진: ${esc(airport.credit)} ↗</a></div>`;
    }
    if (detail) {
      const info = data.tourism?.[current.id];
      const imageData = data.photos[current.photo];
      const lines = current.id === 'school' ? ['09:30까지 출발 집결지에 모여 인원을 확인합니다.', classProfile().bus, classProfile().busNote] : current.point === 'resort' ? [...current.body] : current.id === 'jeju-arrive' ? [...current.body, classProfile().jejuBus] : info?.items || current.body;
      panel.innerHTML = `<div class="immersive-photo">${imageData ? `<img src="${esc(imageData.src)}" alt="${esc(imageData.alt)}">` : ''}<div class="photo-overlay"><span class="photo-eyebrow">${classLabel()} · ${classProfile().team}팀 · ${esc(current.category)} · ${esc(current.time)}</span><h2>${esc(current.title)}</h2><p class="photo-subtitle">${esc(current.subtitle)}</p><h3>${info ? '이곳에서 볼 것 · 체험할 것' : '여기서 할 일'}</h3><ol>${lines.map(item=>`<li>${esc(item)}</li>`).join('')}</ol><small>사진: <a href="${esc(imageData?.url || '#')}" target="_blank" rel="noopener noreferrer">${esc(imageData?.credit || '')}</a></small></div></div>`;
    }
    if (!rooms && !ready) setTimeout(() => map?.invalidateSize(), 40);
  }

  function renderProgress() {
    const group = current.group;
    const groupSlides = daySlides(group);
    const index = groupSlides.indexOf(current);
    const first = group === 'before' ? '출발 전' : group === 'after' ? '기록' : '시작';
    const last = group === 'before' ? '제주' : group === 'after' ? '모으기' : '마지막';
    document.getElementById('progress').innerHTML = `<span class="progress-label">${first}</span><div class="progress-track">${groupSlides.map((slide, i) => `<button type="button" class="progress-dot ${i === index ? 'active' : ''}" data-go="${esc(slide.id)}" aria-label="${esc(slide.title)}" ${i === index ? 'aria-current="step"' : ''}></button>`).join('')}</div><span class="progress-label">${last}</span>`;
  }

  function renderNavigation() {
    const index = slides.indexOf(current);
    const prev = previousSlide();
    const next = nextSlide();
    document.getElementById('chapterName').innerHTML = groupName(current.group);
    document.getElementById('pageCounter').innerHTML = `<strong>${String(index + 1).padStart(2, '0')}</strong> / ${String(slides.length).padStart(2, '0')}`;
    document.getElementById('prevButton').disabled = !prev;
    document.getElementById('prevButton').setAttribute('aria-label', prev ? `이전: ${prev.title}` : '처음 장');
    document.getElementById('nextButton').disabled = !next;
    document.getElementById('nextTitle').textContent = next?.title || '마지막 장';
    document.getElementById('nextButton').setAttribute('aria-label', next ? `다음: ${next.title}` : '마지막 장');
  }

  function renderMenu() {
    const groups = ['before', 1, 2, 3, 'after'];
    document.getElementById('chapterList').innerHTML = groups.map(group => `<section class="menu-group"><h3>${groupName(group)}</h3>${daySlides(group).map(slide => `<button type="button" class="menu-item ${slide.id === current.id ? 'active' : ''}" data-go="${esc(slide.id)}"><small>${slide.time ? esc(slide.time.split('–')[0]) : slide.type === 'overview' ? '한눈에' : '안내'}</small><strong>${esc(slide.title)}</strong><span aria-hidden="true">›</span></button>`).join('')}</section>`).join('');
  }

  function initMap() {
    if (!window.L) {
      document.getElementById('map').innerHTML = '<p class="map-error">지도를 불러오지 못했습니다. 왼쪽 일정은 계속 확인할 수 있습니다.</p>';
      return;
    }
    map = L.map('map', { zoomControl: true, scrollWheelZoom: false, preferCanvas: true }).setView([33.37, 126.56], 10);
    syncMapGestures();
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(map);
  }

  function clearMap() { if (busAnimation) cancelAnimationFrame(busAnimation); busAnimation = null; mapLayers.forEach(layer => layer.remove()); mapLayers = []; }
  function animateBus(startId = 'school', endId = 'gimpo') {
    const start = data.points[startId];
    const end = data.points[endId];
    const icon = L.divIcon({ className: 'bus-icon', html: '<span aria-hidden="true">🚌</span>', iconSize: [42, 42], iconAnchor: [21, 21] });
    const marker = L.marker(start, { icon, interactive: false, zIndexOffset: 1000 }).addTo(map);
    mapLayers.push(marker);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { marker.setLatLng([(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]); return; }
    const began = performance.now();
    const frame = now => {
      const progress = ((now - began) % 4200) / 4200;
      marker.setLatLng([start[0] + (end[0] - start[0]) * progress, start[1] + (end[1] - start[1]) * progress]);
      busAnimation = requestAnimationFrame(frame);
    };
    busAnimation = requestAnimationFrame(frame);
  }
  function addLine(ids, color, weight = 4, dashArray) {
    if (ids.length < 2) return;
    const line = L.polyline(ids.map(id => data.points[id]), { color, weight, opacity: .92, dashArray, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(map);
    mapLayers.push(line);
  }
  function addMarker(pointId, number, active, complete, slideId, displayPoint) {
    const selectedClass = active ? 'active' : complete ? 'complete' : '';
    const compact = current.type === 'stop' && current.id !== 'return';
    const size = compact ? (active ? 28 : 24) : (active ? 34 : 27);
    const icon = L.divIcon({ className: '', html: `<span class="map-marker ${selectedClass}">${number}</span>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
    const marker = L.marker(displayPoint || data.points[pointId], { icon, keyboard: true, title: data.names[pointId], zIndexOffset: active ? 100 : 0 }).addTo(map);
    marker.on('click', () => slideId && go(slideId));
    marker.bindTooltip(data.names[pointId], { permanent: active, direction: compact ? 'top' : 'right', offset: compact ? [0, -12] : [14, 0], className: 'map-label' });
    if (active) marker.openTooltip();
    mapLayers.push(marker);
  }
  function mapSlideForPoint(group, pointId) {
    return daySlides(group).find(slide => slide.type === 'stop' && slide.point === pointId)?.id;
  }

  function updateMap() {
    if (!map) return;
    clearMap();
    if (current.type === 'rooms' || current.type === 'ready' || current.group === 'after') return;
    map.invalidateSize({ animate: false });
    if (current.id === 'return') {
      addLine(['gimpo', 'school'], '#ed5b13', 4);
      addMarker('gimpo', 'G', false, false, 'gimpo');
      addMarker('school', 'S', false, false, 'school');
      addMarker('returnStop', '하차', true, false, 'return');
      map.fitBounds(L.latLngBounds([data.points.gimpo, data.points.school, data.points.returnStop]), { padding: map.getSize().y < 300 ? [35, 35] : [70, 70], animate: false, maxZoom: 11 });
      animateBus('gimpo', 'school');
      document.getElementById('mapTopNote').textContent = '김포공항 → 출발지 방향 · 귀가 버스';
      document.getElementById('mapCaption').textContent = '버스는 출발지 방향으로 이동합니다. 실제 하차는 23:30경 귀가 집결지 · 종례 후 귀가. 지도 선은 이동 방향을 나타냅니다.';
      return;
    }
    if (current.type === 'stop') {
      const island = new Set(['jeju','jetboat','beach','resort','osulloc','cliff','soesokkak','wind','seongsan','laf','peace','market','gwakji','pyoseon']);
      const route = data.routes[current.group].filter(id=>island.has(id));
      addLine(route,'#e85b16',2);
      map.fitBounds(L.latLngBounds([data.points.osulloc,data.points.seongsan,data.points.jeju,data.points.beach,data.points.resort]),{padding:[28,28],animate:false,maxZoom:9});
      const uniquePoints = [...new Set(route)];
      const occupied = [];
      uniquePoints.forEach((point, i) => {
        const actual = map.latLngToContainerPoint(data.points[point]);
        let position = actual;
        // Spread adjacent stops so every marker remains selectable in the inset.
        for (let step = 0; occupied.some(other => other.distanceTo(position) < 32) && step < 16; step++) {
          const angle = step * Math.PI / 4;
          const radius = 34 * (1 + Math.floor(step / 8));
          position = actual.add(L.point(Math.cos(angle) * radius, Math.sin(angle) * radius));
        }
        occupied.push(position);
        const displayPoint = map.containerPointToLatLng(position);
        if (position.distanceTo(actual) > 1) {
          mapLayers.push(L.polyline([data.points[point], displayPoint], {color:'#343d39',weight:1,dashArray:'2 3',interactive:false}).addTo(map));
          mapLayers.push(L.circleMarker(data.points[point], {radius:2,color:'#343d39',fillOpacity:1,interactive:false}).addTo(map));
        }
        const target = mapSlideForPoint(current.group, point) || mapSlideForPoint(1, point) || mapSlideForPoint(2, point) || mapSlideForPoint(3, point);
        addMarker(point, i + 1, current.point === point, false, current.point === point ? current.id : target, displayPoint);
      });
      return;
    }
    const group = current.group;
    if (group === 'before') {
      const islandRoutes = [data.routes[1].slice(2),data.routes[2],data.routes[3].slice(0,-2)];
      islandRoutes.forEach((route,i) => addLine(route, i === 1 ? '#777874' : '#292929', 2.5));
      [...new Set(islandRoutes.flat())].forEach((point, i) => addMarker(point, i + 1, false, false, mapSlideForPoint(1, point) || mapSlideForPoint(2, point) || mapSlideForPoint(3, point)));
      if (current.point === 'school') {
        addLine(['school', 'gimpo'], '#ed5b13');
        addMarker('school', 'S', true, false, 'bus');
        addMarker('gimpo', 'G', false, false, 'gimpo');
        map.fitBounds(L.latLngBounds([data.points.school, data.points.gimpo]), { padding: map.getSize().y < 300 ? [14, 14] : [60, 60], animate: false, maxZoom: 11 });
        animateBus();
      } else {
        map.fitBounds(L.latLngBounds([data.points.osulloc, data.points.seongsan, data.points.jeju, data.points.beach]), { padding: [65, 65], animate: false, maxZoom: 10 });
      }
      document.getElementById('mapTopNote').textContent = current.point === 'school' ? '출발지 → 김포공항 · 버스 이동' : '제주 2박 3일 · 전체 동선';
      document.getElementById('mapCaption').textContent = current.point === 'school' ? '버스 아이콘은 이동 방향을 보여줍니다. 선은 실제 도로 경로가 아닙니다.' : '지도는 장소 순서를 보여줍니다. 선은 실제 주행 경로가 아닙니다.';
      return;
    }
    const route = data.routes[group];
    const activeIndex = current.point ? Math.max(0, current.id === 'resort2' ? route.lastIndexOf(current.point) : route.indexOf(current.point)) : -1;
    const dayRoute = group === 1 ? route.slice(2) : group === 3 ? route.slice(0, -2) : route;
    addLine(dayRoute, '#3b3b38', 3);
    if (group === 1) {
      addLine(['school', 'gimpo'], '#3b3b38', 3);
      addLine(['gimpo', 'jeju'], '#858983', 2, '5 8');
    }
    if (group === 3) {
      addLine(['jeju', 'gimpo'], '#858983', 2, '5 8');
      addLine(['gimpo', 'returnStop'], '#3b3b38', 3);
    }
    if (activeIndex > 0) {
      const part = route.slice(0, activeIndex + 1);
      if (group === 1 && activeIndex >= 2) {
        addLine(['school', 'gimpo'], '#ed5b13', 4);
        addLine(part.slice(2), '#ed5b13', 4);
      } else if (group === 3 && activeIndex >= route.length - 2) {
        addLine(part.slice(0, activeIndex === route.length - 1 ? -2 : -1), '#ed5b13', 4);
        if (activeIndex === route.length - 1) addLine(['gimpo', 'returnStop'], '#ed5b13', 4);
      } else addLine(part, '#ed5b13', 4);
    }
    const uniquePoints = [...new Set(route)];
    uniquePoints.forEach((point, i) => {
      const routeIndex = route.indexOf(point);
      const active = current.point === point;
      const complete = activeIndex >= 0 && routeIndex < activeIndex;
      const id = mapSlideForPoint(group, point) || data.days[group].overview;
      addMarker(point, i + 1, active, complete, id);
    });
    if (current.id === 'school') animateBus();
    if (current.point) {
      const point = data.points[current.point];
      const prev = activeIndex > 0 ? data.points[route[activeIndex - 1]] : null;
      if (prev && Math.abs(prev[0] - point[0]) < .7 && Math.abs(prev[1] - point[1]) < .7) {
        map.fitBounds(L.latLngBounds([prev, point]), { padding: [100, 110], animate: false, maxZoom: 12 });
      } else if (current.id === 'school') map.fitBounds(L.latLngBounds([data.points.school, data.points.gimpo]), { padding: map.getSize().y < 300 ? [14, 14] : [50, 50], animate: false, maxZoom: 11 });
      else map.setView(point, current.point === 'gimpo' ? 10 : 11, { animate: false });
    } else {
      const islandPoints = dayRoute.map(id => data.points[id]);
      map.fitBounds(L.latLngBounds(islandPoints), { padding: [95, 100], animate: false, maxZoom: 10 });
    }
    document.getElementById('mapTopNote').textContent = `${data.days[group].label} · ${data.days[group].short}${current.point ? ' · ' + data.names[current.point] : ''}`;
  }

  function syncMapGestures() {
    if(!map)return;
    const full=document.getElementById('app').classList.contains('map-full');
    map.dragging[full||!window.matchMedia('(max-width:800px)').matches?'enable':'disable']();
    map.scrollWheelZoom[full?'enable':'disable']();
  }

  function render() {
    const requested = location.hash.match(/^#\/p\/([a-z0-9-]+)$/)?.[1];
    current = byId.get(requested) || slides[0];
    if (!requested || !byId.has(requested)) history.replaceState(null, '', '#/p/cover');
    renderContent();
    document.querySelector('.header-pill').textContent = `${classLabel()} · ${classProfile().team}팀`;
    document.getElementById('app').classList.remove('map-full');
    document.getElementById('mapExpandButton').setAttribute('aria-pressed', 'false');
    document.getElementById('mapExpandButton').innerHTML = '지도 크게 <span aria-hidden="true">↗</span>';
    renderSidePanel();
    renderProgress();
    renderNavigation();
    renderMenu();
    updateMap();
    if(current.id==='laf')window.GUIDE_NOTICES?.laf();
    if(current.id==='gimpo')window.GUIDE_NOTICES?.airport();
    if(['resort1','resort2'].includes(current.id))window.GUIDE_NOTICES?.lodging(current.id);
    scrollArea.scrollTop = 0;
    window.scrollTo(0,0);
    syncMapGestures();
    document.title = `${current.title} · 제주 여행 · ${classLabel()}`;
  }

  content.addEventListener('click', event => {
    const classButton = event.target.closest('[data-class]');
    if (classButton) { selectedClass = Number(classButton.dataset.class); localStorage.setItem('jeju-demo-course', String(selectedClass)); selectProgram(); render(); return; }
    const button = event.target.closest('[data-go]'); if (button) go(button.dataset.go);
  });
  document.getElementById('progress').addEventListener('click', event => { const button = event.target.closest('[data-go]'); if (button) go(button.dataset.go); });
  document.getElementById('chapterList').addEventListener('click', event => { const button = event.target.closest('[data-go]'); if (button) { dialog.close(); go(button.dataset.go); } });
  document.getElementById('prevButton').addEventListener('click', () => { if (previousSlide()) go(previousSlide().id); });
  document.getElementById('nextButton').addEventListener('click', () => { if (nextSlide()) go(nextSlide().id); });
  document.getElementById('chapterButton').addEventListener('click', () => dialog.showModal());
  document.getElementById('menuButton').addEventListener('click', () => dialog.showModal());
  document.getElementById('closeDialog').addEventListener('click', () => dialog.close());
  document.getElementById('roomMapGallery').addEventListener('click', event => {
    const button = event.target.closest('[data-evac], [data-evac-floor], [data-evac-expand]');
    if (!button) return;
    if (button.hasAttribute('data-evac')) { activeEvac = button.dataset.evac; evacFloor = 2; }
    if (button.hasAttribute('data-evac-floor')) evacFloor = Number(button.dataset.evacFloor);
    if (button.hasAttribute('data-evac-expand')) document.getElementById('roomMapGallery').classList.toggle('evac-expanded');
    renderSidePanel();
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  document.getElementById('mapExpandButton').addEventListener('click', event => {
    const full = document.getElementById('app').classList.toggle('map-full');
    event.currentTarget.setAttribute('aria-pressed', String(full));
    event.currentTarget.innerHTML = full ? '지도 닫기 <span aria-hidden="true">↙</span>' : '지도 크게 <span aria-hidden="true">↗</span>';
    window.scrollTo(0,0);
    syncMapGestures();
    setTimeout(() => map?.invalidateSize(), 80);
  });
  window.addEventListener('hashchange', render);
  window.addEventListener('resize', () => {syncMapGestures();map?.invalidateSize();});
  document.addEventListener('keydown', event => {
    if (document.querySelector('dialog[open]') || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest('button, a, input, textarea, #map')) return;
    if (event.key === 'ArrowRight' && nextSlide()) go(nextSlide().id);
    if (event.key === 'ArrowLeft' && previousSlide()) go(previousSlide().id);
  });
  initMap();
  render();
})();
