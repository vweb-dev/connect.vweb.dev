'use strict';
(()=>{
function init(){
const course=document.getElementById('connect-typing-course');
if(!course)return;
const section=document.createElement('section');
section.className='ct-finger-guide';
const heading=document.createElement('h3');
heading.textContent='Finger placement guide';
const p=document.createElement('p');
p.textContent='Left hand: A S D F. Right hand: J K L ;. Index fingers on F and J. Keep thumbs near Space. Return to home row after every reach.';
section.append(heading,p);
course.querySelector('#ct-keyboard')?.after(section);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();