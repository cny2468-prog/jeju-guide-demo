(() => {
  const lodgingNotice = {id:'critical-lodging',title:'반드시 지킬 숙소 규칙',body:'방 이동 금지\n다른 방에 들어가지 마세요.\n\n발코니 이동 · 무단외출 금지\n위반 시 퇴학'};
  const notices = [
    {id:'departure',title:'출발·귀가 안내',body:'10월 28일 09:30 집결\n본교 운동장 · 내 반 버스 확인\n\n주민등록초본 필수\n초본은 주민등록번호 뒷자리까지 모두 표시\n\n10월 30일 23:30경 하차\n서해아파트 정류장 · 종례 후 귀가'},
    {id:'activities',title:'이동·체험할 때 꼭 지켜 주세요',body:'시간 준수 · 안전띠 착용\n내 반 일정과 버스를 확인하세요.\n\n체험은 현장 안전 안내대로\n운행 중 촬영·취식·장난 금지\n\n아프거나 다치면 즉시 알리기\n위험 장소 출입 · 과격한 장난 금지'},
    {id:'lodging',title:'숙소 생활·비상 상황 안내',body:'내 반 객실 · 피난도 확인\n비상구와 계단 위치를 먼저 확인하세요.\n\n주류 · 담배 · 위험 물품 금지\n기물 훼손 · 과격한 장난 금지\n\n비상시 계단으로 대피\n엘리베이터 금지 · 밀거나 뛰지 않기'},
    {id:'reflections',title:'장소별 느낀 점을 남겨 주세요',body:'장소마다 작성하고 바로 제출\n방문 장소 아래 ‘이 장소 소감문 제출’\n\n마지막 페이지에서 모아 제출도 가능\n제출을 눌러야 선생님께 전송됩니다.'},
    {id:'personal-preparation',title:'개인 준비물 · 약품과 배터리',body:'멀미약 · 감기약 개인 준비\n개인 비닐봉투도 챙기세요.\n\n현장에서는 외상약만 지급\n\n배터리는 직접 가지고 탑승'},
  ];
  let active=[], index=0, seen=new Set(), initialOpen=false, queued=[];
  const allSeen=()=>active.every(n=>seen.has(n.id));
  function advanceOrClose(){
    const next=active.findIndex(n=>!seen.has(n.id));
    if(next<0){
      if(initialOpen){initialOpen=false;if(queued.length){active=queued;queued=[];index=0;seen=new Set();paint();return;}}
      dialog.close();return;
    }
    index=next;paint();
  }
  function context(n){
    if(initialOpen&&dialog.open){if(!queued.some(item=>item.id===n.id))queued.push(n);paint();return;}
    const pending=dialog.open?active:[];
    if(!dialog.open)seen=new Set();
    active=[n,...pending.filter(item=>item.id!==n.id)];
    seen.delete(n.id);index=0;paint();if(!dialog.open)dialog.showModal();
  }
  const dialog=document.getElementById('noticeDialog');
  function paint(){
    const n=active[index];if(!n){dialog.close();return;}
    seen.add(n.id);
    dialog.querySelector('[data-notice-close]').textContent=allSeen()&&!(initialOpen&&queued.length)?'안내 확인 완료 · 닫기':'다음 안내 보기';
    document.getElementById('noticeTitle').textContent=n.title;
    document.getElementById('noticeTitle').classList.toggle('critical-title',n.id==='critical-lodging');
    const body=document.getElementById('noticeBody');body.replaceChildren();
    n.body.split('\n\n').forEach(text=>{
      const card=document.createElement('div');card.className='notice-point';
      const [headline,...detail]=text.split('\n');
      const strong=document.createElement('strong');strong.textContent=headline;card.append(strong);
      if(detail.length){const small=document.createElement('span');small.textContent=detail.join('\n');card.append(small);}
      if(n.id==='laf-allergy'||text.includes('주민등록초본')||(n.id==='airport'&&text.includes('배터리')))card.classList.add('notice-point-important');
      if(n.id==='critical-lodging')card.classList.add('notice-point-critical');
      if(n.id==='laf-allergy')card.classList.add('notice-point-allergy');
      body.append(card);
    });
    if(n.id==='reflections'){const note=document.createElement('p');note.className='small-note';note.textContent='공개 체험판에서는 소감문이 외부로 전송되지 않고 이 브라우저에만 저장됩니다.';body.append(note);}
    document.getElementById('noticeCounter').textContent=`${index+1} / ${active.length}`;
  }
  function open(){active=[...notices];index=0;seen=new Set();initialOpen=true;if(!active.length)return;paint();if(!dialog.open)dialog.showModal();}
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-open-notices]'))open();
    if(e.target.closest('[data-show-lodging]'))context(lodgingNotice);
    if(e.target.closest('[data-notice-close]'))advanceOrClose();

  });
  dialog.addEventListener('cancel',e=>e.preventDefault());
  let airportShown=false,lafShown=false;const lodgingShown=new Set();
  window.GUIDE_NOTICES={laf(){if(lafShown)return;lafShown=true;context({id:'laf-allergy',title:'제주 라프 · 땅콩 알레르기 확인',body:'땅콩 알레르기가 있다면\n체험 전 현장 담당자에게 알려 주세요.'});},lodging(page,repeat=false){if(!repeat&&lodgingShown.has(page))return;lodgingShown.add(page);context(lodgingNotice);},airport(){if(airportShown)return;airportShown=true;const airport={id:'airport',title:'김포공항 · 탑승 전 필수 확인',body:'배터리는 직접 가지고 탑승\n\n신분확인 서류 확인\n여행 주최측 안내를 따르세요.'};context(airport);}};
  open();
})();
