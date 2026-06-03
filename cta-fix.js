(() => {
  const KAKAO_URL = ['https://pf.kakao.com', '_xeKxaon', 'chat'].join('/');
  const INSTA_URL = ['https://www.instagram.com', 'dongdaemun_helloapm_nice'].join('/') + '/';

  const INSTAGRAM_SVG = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" stroke-width="2"></rect>
      <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"></circle>
      <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor"></circle>
    </svg>
  `;

  function injectStyle(){
    if(document.getElementById('nice-cta-fix-style')) return;
    const style = document.createElement('style');
    style.id = 'nice-cta-fix-style';
    style.textContent = `
      .cta{
        display:grid!important;
        grid-template-columns:1fr 1fr!important;
        gap:12px!important;
        margin-top:18px!important;
      }
      .cta a{
        min-height:58px!important;
        padding:14px 16px!important;
        border-radius:18px!important;
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:10px!important;
        text-decoration:none!important;
        font-weight:900!important;
        font-size:18px!important;
        line-height:1.05!important;
        white-space:nowrap!important;
        box-sizing:border-box!important;
      }
      .cta a.kakao{
        background:#FEE500!important;
        color:#1e1600!important;
        border:1px solid rgba(60,30,30,.12)!important;
        box-shadow:0 10px 22px rgba(254,229,0,.16)!important;
      }
      .cta a.kakao .kakao-logo{
        width:34px!important;
        height:24px!important;
        min-width:34px!important;
        padding:0!important;
        border-radius:9px!important;
        background:#3C1E1E!important;
        color:#FEE500!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        font-size:9px!important;
        letter-spacing:-.02em!important;
        font-weight:1000!important;
      }
      .cta a.insta{
        background:#fff!important;
        color:#201713!important;
        border:1px solid #d9c8b8!important;
        box-shadow:0 10px 22px rgba(60,35,20,.06)!important;
      }
      .cta a.insta .insta-logo{
        width:30px!important;
        height:30px!important;
        min-width:30px!important;
        border-radius:10px!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        background:radial-gradient(circle at 30% 105%, #fdf497 0%, #fdf497 18%, #fd5949 42%, #d6249f 64%, #285AEB 100%)!important;
        color:#fff!important;
      }
      .cta a.insta .insta-logo svg{
        width:21px!important;
        height:21px!important;
        stroke:#fff!important;
      }
      @media(max-width:720px){
        .cta{
          grid-template-columns:1fr 1fr!important;
          gap:9px!important;
          position:sticky!important;
          bottom:0!important;
          background:#fbf7f1!important;
          padding:10px 0 4px!important;
          z-index:30!important;
        }
        .cta a{
          min-height:50px!important;
          padding:11px 9px!important;
          font-size:15px!important;
          border-radius:15px!important;
          gap:7px!important;
        }
        .cta a.kakao .kakao-logo{width:30px!important;height:22px!important;min-width:30px!important;font-size:8px!important}
        .cta a.insta .insta-logo{width:28px!important;height:28px!important;min-width:28px!important}
        .cta a.insta .insta-logo svg{width:19px!important;height:19px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function fixCta(){
    injectStyle();

    const kakao = document.querySelector('#detail .cta a.kakao');
    const insta = document.querySelector('#detail .cta a.insta');

    if(kakao){
      kakao.href = KAKAO_URL;
      kakao.target = '_blank';
      kakao.rel = 'noopener';
      kakao.innerHTML = '<span class="kakao-logo">TALK</span><span>카카오톡 문의</span>';
    }

    if(insta){
      insta.href = INSTA_URL;
      insta.target = '_blank';
      insta.rel = 'noopener';
      insta.innerHTML = `<span class="insta-logo">${INSTAGRAM_SVG}</span><span>인스타 DM</span>`;
    }
  }

  document.addEventListener('click', () => setTimeout(fixCta, 50), true);
  document.addEventListener('DOMContentLoaded', () => {
    injectStyle();
    const detail = document.getElementById('detail');
    if(detail){
      new MutationObserver(fixCta).observe(detail, {childList:true, subtree:true});
    }
    fixCta();
  });
})();
