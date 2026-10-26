(() => {
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let course='all',spot='all';
 const spots=()=>[...new Map(Object.values(GUIDE_DATA.programs).flatMap(p=>p.slides).filter(s=>s.type==='stop'&&!['school','gimpo','jeju-arrive','jeju-depart','return'].includes(s.id)).map(s=>[s.id,s])).values()];
 const courseName=n=>'코스 '+GUIDE_DATA.classes[n].team;
 const entries=()=>GUIDE_REFLECTIONS.entries().filter(e=>(course==='all'||String(e.course)===course)&&(spot==='all'||e.spot===spot));
 function collectHtml(){return '<article class="slide"><p class="slide-kicker">이 브라우저의 기록 · 체험판</p><h1>여행 기록을<br>한눈에 모아봐요</h1><hr class="title-rule"><p class="lead">개인정보 없이 작성한 소감문 기록입니다. 글은 이 브라우저에만 보관됩니다.</p><h2>장소 선택</h2><div class="class-picker"><button data-demo-spot="all" aria-pressed="'+(spot==='all')+'">전체 보기</button>'+spots().map(s=>'<button data-demo-spot="'+s.id+'" aria-pressed="'+(spot===s.id)+'">'+esc(s.title)+'</button>').join('')+'</div><h2>코스 선택</h2><div class="class-picker"><button data-demo-course="all" aria-pressed="'+(course==='all')+'">전체 코스</button>'+[1,2,3].map(n=>'<button data-demo-course="'+n+'" aria-pressed="'+(course===String(n))+'">'+courseName(n)+'</button>').join('')+'</div><h2>소감문 모아보기</h2><div id="demoReflectionCollection"></div><button class="reflection-button" data-demo-xlsx>소감문 엑셀 받기</button><p id="demoCollectionStatus" role="status"></p><button class="reflection-link" data-demo-clear>이 체험판의 기록 모두 지우기</button></article>';}
 function loadCollection(){const el=document.getElementById('demoReflectionCollection');if(!el)return;const rows=entries();el.innerHTML=rows.length?rows.map(e=>'<div class="demo-entry"><strong>'+courseName(e.course)+' · '+esc(e.title)+'</strong><p>'+esc(e.text)+'</p></div>').join(''):'<p class="small-note">아직 제출 체험한 소감문이 없습니다. 장소별 페이지에서 작성해 보세요.</p>';}
 function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
 document.addEventListener('click',e=>{const s=e.target.closest('[data-demo-spot]'),c=e.target.closest('[data-demo-course]');if(s||c){if(s)spot=s.dataset.demoSpot;if(c)course=c.dataset.demoCourse;GUIDE_REFLECTIONS.rerenderCollection();return;}
 if(e.target.closest('[data-demo-xlsx]')){const rows=entries(),status=document.getElementById('demoCollectionStatus');if(!rows.length){status.textContent='내려받을 소감문이 없습니다.';return;}const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,XLSX.utils.aoa_to_sheet([['코스','장소','소감문','기록 시각'],...rows.map(x=>[courseName(x.course),x.title,x.text,x.at])]),'여행 기록');download(new Blob([XLSX.write(book,{bookType:'xlsx',type:'array'})]),'jeju-reflections.xlsx');status.textContent='소감문 엑셀을 받았습니다.';}
 if(e.target.closest('[data-demo-clear]')&&confirm('이 체험판에서 작성한 글을 이 브라우저에서 지울까요?')){GUIDE_REFLECTIONS.clear();loadCollection();}
 });
 window.GUIDE_DEMO={collectHtml,loadCollection,download};
})();
