'use strict';
/* Browser-only games; Watch/Discover and book search are retired. */
(function(){
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
function textNode(tag,value,cls=''){const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e;}
function empty(root,message){if(root)root.replaceChildren(textNode('div',message,'ent-empty'));}
// Open Trivia DB: questions are CC BY-SA 4.0; client fetch, no backend burden.
const fallbackQuiz=[
 {q:'Which planet is known as the Red Planet?',answers:['Mars','Venus','Neptune','Jupiter'],correct:'Mars'},
 {q:'What does HTML stand for?',answers:['HyperText Markup Language','Home Tool Markup Language','Hyperlink Text Main Language','High Text Media Link'],correct:'HyperText Markup Language'},
 {q:'How many minutes are in an hour?',answers:['60','100','50','30'],correct:'60'},
 {q:'Which gas do plants absorb from the air?',answers:['Carbon dioxide','Oxygen','Helium','Hydrogen'],correct:'Carbon dioxide'},
 {q:'Which ocean is the largest?',answers:['Pacific','Atlantic','Arctic','Indian'],correct:'Pacific'},
 {q:'Which of these is a web browser?',answers:['Firefox','MySQL','PHP','DNS'],correct:'Firefox'},
 {q:'What is the square root of 81?',answers:['9','8','7','6'],correct:'9'},
 {q:'Which continent contains Pakistan?',answers:['Asia','Africa','Europe','Australia'],correct:'Asia'}
];
let quiz=[],quizIndex=0,quizScore=0,lastQuizCall=0,quizSource='online';
function shuffled(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function decodeB64(text){
 const bin=atob(text);return new TextDecoder().decode(Uint8Array.from(bin,c=>c.charCodeAt(0)));
}
async function beginQuiz(){
 $('#quiz-start').disabled=true;
 const root=$('#quiz-main');empty(root,'Loading your questions from Open Trivia DB…');
 try{
  if(Date.now()-lastQuizCall<5500)throw Error('Please wait a few seconds between question downloads.');
  lastQuizCall=Date.now();
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),9000);
  const response=await fetch('https://opentdb.com/api.php?amount=8&type=multiple&encode=base64',{signal:ctl.signal,cache:'no-store'});
  clearTimeout(timer);
  if(!response.ok)throw Error('External quiz source unavailable.');
  const data=await response.json();
  if(data.response_code===5)throw Error('Open Trivia DB rate limit reached.');
  if(data.response_code!==0||!Array.isArray(data.results))throw Error('No questions returned.');
  quizSource='online';
  quiz=data.results.map(x=>({q:decodeB64(x.question),correct:decodeB64(x.correct_answer),
    answers:shuffled([x.correct_answer,...x.incorrect_answers].map(decodeB64))}));
 }catch(err){
  quizSource='offline';
  quiz=shuffled(fallbackQuiz).map(x=>({...x,answers:shuffled(x.answers)}));
  const tip=textNode('p','Using a locally authored offline question set because the external API is unavailable or rate-limited.','ent-helper');root.replaceChildren(tip);
 }
 quizIndex=0;quizScore=0;showQuizQuestion();
}
function showQuizQuestion(){
 const root=$('#quiz-main');root.replaceChildren();$('#quiz-score').textContent='Score: '+quizScore;
 if(quizIndex>=quiz.length){
  root.append(textNode('div','Round complete','overline'),textNode('div',quizScore+' / '+quiz.length+' correct','ent-question'));
  const b=textNode('button','Play again ↻','button primary');b.type='button';b.addEventListener('click',beginQuiz);root.append(b);return;
 }
 const item=quiz[quizIndex];root.append(textNode('div',(quizSource==='offline'?'OFFLINE PRACTICE · ':'')+'QUESTION '+(quizIndex+1)+' / '+quiz.length,'ent-quiz-progress'),textNode('div',item.q,'ent-question'));
 const options=document.createElement('div');options.className='ent-answers';
 const response=textNode('p','');
 const next=textNode('button',quizIndex===quiz.length-1?'See results ↗':'Next question ↗','button secondary');next.type='button';next.hidden=true;
 item.answers.forEach(answer=>{
  const b=textNode('button',answer,'ent-answer');b.type='button';
  b.addEventListener('click',()=>{
   options.querySelectorAll('button').forEach(t=>{t.disabled=true;if(t.textContent===item.correct)t.classList.add('correct');});
   if(answer===item.correct){quizScore++;response.textContent='Correct!';}else{b.classList.add('wrong');response.textContent='Correct answer: '+item.correct;}
   $('#quiz-score').textContent='Score: '+quizScore;next.hidden=false;
  });options.append(b);
 });
 next.addEventListener('click',()=>{quizIndex++;showQuizQuestion();});
 root.append(options,response,next);
}
$('#quiz-start').addEventListener('click',beginQuiz);
let memoryCards=[],openMemory=[],memoryMoves=0,memoryMatched=0,memoryLock=false;
function makeMemory(){
 const icons=['◆','●','✳','♣','☀','♫','✦','☾'];memoryCards=shuffled(icons.concat(icons));
 openMemory=[];memoryMoves=0;memoryMatched=0;memoryLock=false;
 $('#memory-moves').textContent='Moves: 0';$('#memory-feedback').textContent='';
 const board=$('#memory-board');board.replaceChildren();
 memoryCards.forEach((symbol,index)=>{
  const b=textNode('button','?','ent-memory-cell');b.type='button';b.setAttribute('aria-label','Hidden card '+(index+1));
  b.addEventListener('click',()=>{
   if(memoryLock||b.classList.contains('matched')||openMemory.some(x=>x.index===index))return;
   b.textContent=symbol;b.classList.add('open');openMemory.push({index,symbol,button:b});
   if(openMemory.length===2){
    memoryMoves++;$('#memory-moves').textContent='Moves: '+memoryMoves;
    if(openMemory[0].symbol===openMemory[1].symbol){
      openMemory.forEach(c=>{c.button.classList.remove('open');c.button.classList.add('matched');c.button.disabled=true;});
      memoryMatched++;openMemory=[];
      if(memoryMatched===8)$('#memory-feedback').textContent='All 8 pairs matched in '+memoryMoves+' moves!';
    }else{memoryLock=true;setTimeout(()=>{
      openMemory.forEach(c=>{c.button.textContent='?';c.button.classList.remove('open');});
      openMemory=[];memoryLock=false;
    },750);}
   }
  });board.append(b);
 });
}
$('#memory-new').addEventListener('click',makeMemory);makeMemory();
let numberCorrect=0,numberAnswer=0;
function nextNumber(){
 const a=2+Math.floor(Math.random()*17),b=2+Math.floor(Math.random()*15);
 numberAnswer=a+b;$('#number-question').textContent=a+' + '+b+' = ?';
 const responses=shuffled([numberAnswer,numberAnswer+2,numberAnswer-3]);
 const root=$('#number-answers');root.replaceChildren();$('#number-feedback').textContent='';
 responses.forEach(n=>{const btn=textNode('button',String(n));btn.type='button';btn.addEventListener('click',()=>{
  root.querySelectorAll('button').forEach(x=>{x.disabled=true;if(Number(x.textContent)===numberAnswer)x.classList.add('correct');});
  if(n===numberAnswer){numberCorrect++;$('#number-feedback').textContent='Correct!';}
  else{btn.classList.add('wrong');$('#number-feedback').textContent='Answer: '+numberAnswer;}
  $('#number-score').textContent='Correct: '+numberCorrect;
 });root.append(btn);});
}
$('#number-next').addEventListener('click',nextNumber);nextNumber();
$$('[data-game]').forEach(btn=>btn.addEventListener('click',()=>{
 const type=btn.dataset.game;$$('[data-game]').forEach(x=>x.classList.toggle('active',x===btn));
 ['quiz','memory','number','flags','word','sudoku'].forEach(x=>$('#game-'+x).hidden=x!==type);
}));

/* Additional zero-backend games */
const flagPairs=[
 ['🇵🇰','Pakistan'],['🇮🇳','India'],['🇨🇦','Canada'],['🇯🇵','Japan'],
 ['🇧🇷','Brazil'],['🇫🇷','France'],['🇩🇪','Germany'],['🇦🇺','Australia'],
 ['🇹🇷','Turkey'],['🇰🇪','Kenya'],['🇬🇧','United Kingdom'],['🇦🇪','United Arab Emirates']
];
let flagCorrect=0,currentFlag=null;
function newFlag(){
 currentFlag=flagPairs[Math.floor(Math.random()*flagPairs.length)];
 $('#flag-symbol').textContent=currentFlag[0];
 const opts=shuffled([currentFlag[1],...shuffled(flagPairs.filter(p=>p!==currentFlag)).slice(0,3).map(p=>p[1])]);
 const root=$('#flag-answers');root.replaceChildren();$('#flag-feedback').textContent='';
 for(const option of opts){
  const btn=textNode('button',option,'ent-answer');btn.type='button';
  btn.addEventListener('click',()=>{
   root.querySelectorAll('button').forEach(el=>{el.disabled=true;if(el.textContent===currentFlag[1])el.classList.add('correct');});
   if(option===currentFlag[1]){flagCorrect++;$('#flag-feedback').textContent='Correct!';}
   else{btn.classList.add('wrong');$('#flag-feedback').textContent='Correct answer: '+currentFlag[1];}
   $('#flag-score').textContent='Correct: '+flagCorrect;
  });root.append(btn);
 }
}
$('#flag-next').addEventListener('click',newFlag);newFlag();
const words=['BROWSER','LIBRARY','NETWORK','PLANET','DESIGN','ROUTER','LEARNING','CREATIVE','COMPUTER','SCIENCE'];
let activeWord='',wordScore=0,wordSolved=false;
function newWord(){
 activeWord=words[Math.floor(Math.random()*words.length)];
 let mixed=activeWord;
 for(let i=0;i<8&&mixed===activeWord;i++)mixed=shuffled(activeWord.split('')).join('');
 $('#word-letters').textContent=mixed;
 $('#word-answer').value='';wordSolved=false;$('#word-feedback').textContent='';
}
$('#word-check').addEventListener('click',()=>{
 const attempt=$('#word-answer').value.trim().toUpperCase();
 if(!attempt){$('#word-feedback').textContent='Enter your guess.';return;}
 if(attempt===activeWord&&!wordSolved){wordSolved=true;wordScore++;$('#word-score').textContent='Correct: '+wordScore;$('#word-feedback').textContent='Correct! Try another word.';}
 else if(wordSolved)$('#word-feedback').textContent='Already solved! Choose a new word.';
 else $('#word-feedback').textContent='Not quite. Try again.';
});
$('#word-next').addEventListener('click',newWord);
$('#word-answer').addEventListener('keydown',e=>{if(e.key==='Enter'){$('#word-check').click();}});
newWord();
const sudokuSolution=[1,2,3,4,3,4,1,2,2,1,4,3,4,3,2,1];
const sudokuStart=[1,0,3,0,0,4,0,2,2,0,4,0,0,3,0,1];
function resetSudoku(){
 const grid=$('#sudoku-grid');grid.replaceChildren();
 sudokuStart.forEach((n,i)=>{
  const input=document.createElement('input');input.type='number';input.inputMode='numeric';
  input.min='1';input.max='4';input.step='1';input.maxLength=1;
  input.className='ent-sudoku-cell'+(n?' fixed':'');
  if(n){input.value=String(n);input.disabled=true;}
  input.setAttribute('aria-label','Row '+(Math.floor(i/4)+1)+' column '+(i%4+1));
  grid.append(input);
 });
 $('#sudoku-feedback').textContent='';
}
$('#sudoku-check').addEventListener('click',()=>{
 const got=$$('#sudoku-grid input').map(i=>Number(i.value));
 const filled=got.every(n=>Number.isInteger(n)&&n>=1&&n<=4);
 if(!filled){$('#sudoku-feedback').textContent='Fill all blank squares with numbers 1–4.';return;}
 const valid=got.every((v,i)=>v===sudokuSolution[i]);
 $('#sudoku-feedback').textContent=valid?'Solved! Every number is correct.':'Some squares are incorrect. Keep trying.';
});
$('#sudoku-new').addEventListener('click',resetSudoku);resetSudoku();

})();
