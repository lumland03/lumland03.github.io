gsap.to(".layer-bg", {
  y: -50,
  ease: "none",
  scrollTrigger: {
    trigger: ".parallax-scene",
    start: "top bottom",
    end: "bottom top",
    scrub: true,
    markers: true,
   
  }
});
gsap.to('.layer-mid', {
  y: 300,
  ease: "none",
  scrollTrigger: {
    trigger:".parallax-scene", 
    start: "top bottom",
    end: "bottom top",
    scrub: true,
    markers: true,

}
});
gsap.to('.layer-fg', {
  y: 150,
  ease: "none",
  scrollTrigger: {
    trigger:".parallax-scene", 
    start: "top bottom",
    end: "bottom top",
    scrub: true,
    markers: true,
    
}
});