(() => {
 if(!window.gsap||!window.ScrollTrigger)return;
 gsap.registerPlugin(ScrollTrigger);
 const media=gsap.matchMedia();
 media.add('(prefers-reduced-motion: no-preference)',()=>{
  gsap.utils.toArray('.cx-chapter').forEach(chapter=>{
   gsap.from(chapter.querySelectorAll('.cx-heading>*'),{y:40,opacity:0,duration:1,stagger:.1,ease:'power3.out',scrollTrigger:{trigger:chapter,start:'top 88%',once:true}});
   chapter.querySelectorAll('.ce-card-image,.cx-detail-frame,.cx-material-frame').forEach(frame=>{
    gsap.fromTo(frame,{clipPath:'inset(18% 0 0% 0)'},{clipPath:'inset(0% 0 0% 0)',duration:1.4,ease:'power3.out',scrollTrigger:{trigger:frame,start:'top 92%',once:true}});
    gsap.fromTo(frame.querySelector('img'),{scale:1.04,yPercent:0},{scale:1,yPercent:0,ease:'none',scrollTrigger:{trigger:frame,start:'top bottom',end:'bottom top',scrub:1}});
   });
  });
  gsap.from('.cx-interlude p',{y:60,opacity:0,duration:1.2,ease:'power3.out',scrollTrigger:{trigger:'.cx-interlude',start:'top 80%',once:true}});
  gsap.utils.toArray('.cx-text p').forEach(p=>{
   gsap.from(p,{y:40,opacity:0,duration:1.2,ease:'power3.out',scrollTrigger:{trigger:p,start:'top 85%',once:true}});
  });
 });
 window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
})();
