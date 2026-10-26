(() => {
  const lodgingNotice = {id:'critical-lodging',title:'반드시 지킬 숙소 규칙',body:'숙소 안전 수칙 확인\n현장 안내에 따라 안전하게 이동하세요.'};
  const notices = [
 {id:'demo',title:'개인정보 없는 여행 안내 체험판',body:'이름·학번 입력 없이 이용\n학교·학급·실제 객실 배정은 표시하지 않습니다.\n\n여행 코스를 고르고 장소 따라가기\n지도의 위치를 누르면 해당 일정으로 이동합니다.'},
 {id:'record',title:'소감문 기록 체험',body:'장소마다 소감문 기록\n이름·학번·연락처는 적지 마세요.\n\n제출은 이 브라우저 안에서만 체험\n기존 운영 앱이나 다른 서버로 전달되지 않습니다.'},
 {id:'collect',title:'기록을 모아 내려받기',body:'장소·코스별로 기록 모아보기\n소감문 엑셀 다운로드를 체험하세요.\n\n다른 기기와 기록은 공유되지 않습니다.\n브라우저 데이터를 지우면 기록도 삭제됩니다.'}
 ];
  let active=[], index=0, seen=new Set();
  const allSeen=()=>active.every(n=>seen.has(n.id));
  function advanceOrClose(){
    const next=active.findIndex(n=>!seen.has(n.id));
    if(next<0){dialog.close();return;}
    index=next;paint();
  }
  function context(n){
    const pending=dialog.open?active:[];
    if(!dialog.open)seen=new Set();
    active=[n,...pending.filter(item=>item.id!==n.id)];
    seen.delete(n.id);index=0;paint();if(!dialog.open)dialog.showModal();
  }
  const dialog=document.getElementById('noticeDialog');
  function paint(){
    const n=active[index];if(!n){dialog.close();return;}
    seen.add(n.id);
    dialog.querySelector('[data-notice-close]').textContent=allSeen()?'안내 확인 완료 · 닫기':'다음 안내 보기';
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
    document.getElementById('noticeCounter').textContent=`${index+1} / ${active.length}`;
  }
  function open(){active=[...notices];index=0;seen=new Set();if(!active.length)return;paint();if(!dialog.open)dialog.showModal();}
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-open-notices]'))open();
    if(e.target.closest('[data-notice-close]'))advanceOrClose();

  });
  dialog.addEventListener('cancel',e=>e.preventDefault());
  let airportShown=false,lafShown=false;const lodgingShown=new Set();
  window.GUIDE_NOTICES={laf(){if(lafShown)return;lafShown=true;context({id:'laf-allergy',title:'제주 라프 · 땅콩 알레르기 확인',body:'땅콩 알레르기가 있다면\n체험 전 현장 담당자에게 알려 주세요.'});},lodging(page){if(lodgingShown.has(page))return;lodgingShown.add(page);context(lodgingNotice);},airport(){if(airportShown)return;airportShown=true;const airport={id:'airport',title:'김포공항 · 탑승 전 필수 확인',body:'배터리는 직접 가지고 탑승\n\n신분확인 서류 확인\n여행 주최측 안내를 따르세요.'};context(airport);}};
  open();
})();
