import gsap from "https://esm.sh/gsap";
import ScrollTrigger from "https://esm.sh/gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);



gsap.to(".layer-bg", {
  y: -100,
  ease: "none",
  scrollTrigger: {
    trigger: ".parallax-scene",
    start: "top bottom",
    end: "bottom top",
    scrub: true,
  
   
  }
});
gsap.to('.layer-mid', {
  y: 50,
  ease: "none",
  scrollTrigger: {
    trigger:".parallax-scene", 
    start: "top bottom",
    end: "bottom top",
    scrub: true,
    

}
});
gsap.to('.layer-fg', {
  y: 200,
  ease: "none",
  scrollTrigger: {
    trigger:".parallax-scene", 
    start: "top bottom",
    end: "bottom top",
    scrub: true,
   
    
}
});