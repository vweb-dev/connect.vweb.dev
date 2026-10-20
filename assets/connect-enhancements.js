'use strict';
// Additional enhancements load after the app shell.
document.addEventListener('click',async function(event){const button=event.target.closest('[data-connect-copy]');if(!button)return;try{await navigator.clipboard.writeText(button.dataset.connectCopy);button.textContent='Copied';}catch(error){button.textContent='Select command manually';}});
