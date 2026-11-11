"use strict";
document.querySelectorAll('.year').forEach(e=>e.textContent=new Date().getFullYear());
const byId=id=>document.getElementById(id), cash=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
let scenarios=null;
function simulate(original,budget,pct,floor,method){
 const cards=original.map(c=>({...c})), rows=[];let interestTotal=0,paidTotal=0;
 for(let month=1;month<=600;month++){
  let interests=cards.map(c=>c.balance>0?c.balance*c.apr/1200:0);
  let due=cards.map((c,i)=>c.balance>0?Math.min(c.balance+interests[i],Math.max(c.balance*pct/100,floor,interests[i]+1)):0);
  const minTotal=due.reduce((a,b)=>a+b,0);
  if(minTotal>budget+0.000001)return {error:`Budget is below estimated minimum payments in month ${month} (${cash(minTotal)} required). Increase the monthly budget.`};
  let payments=[...due],extra=budget-minTotal;
  const order=cards.map((c,i)=>i).filter(i=>cards[i].balance+interests[i]>0.0000001).sort((a,b)=>method==='avalanche'?(cards[b].apr-cards[a].apr || cards[a].balance-cards[b].balance || a-b):(cards[a].balance-cards[b].balance || cards[b].apr-cards[a].apr || a-b));
  for(const i of order){const needed=Math.max(0,cards[i].balance+interests[i]-payments[i]);const add=Math.min(extra,needed);payments[i]+=add;extra-=add;}
  let paid=0,interest=0;
  cards.forEach((c,i)=>{interest+=interests[i];paid+=payments[i];c.balance=Math.max(0,c.balance+interests[i]-payments[i]);});
  paidTotal+=paid;interestTotal+=interest;
  rows.push({month,payment:paid,interest,balance:cards.reduce((a,c)=>a+c.balance,0),perCard:cards.map((c,i)=>({name:c.name,payment:payments[i],interest:interests[i],balance:c.balance}))});
  if(rows[rows.length-1].balance<0.005)return {months:month,interest:interestTotal,paid:paidTotal,rows};
 }
 return {error:'Payoff exceeds 600 months (50 years). Increase the monthly budget.'};
}
function getInputs(){let cards=[];for(let i=1;i<=5;i++){
 const b=byId('balance'+i).value.trim(),a=byId('apr'+i).value.trim();if(!b&&!a)continue;
 if(!b||!a)throw Error(`Card ${i}: enter both a balance and APR.`);
 const balance=Number(b),apr=Number(a);if(!Number.isFinite(balance)||balance<=0||!Number.isFinite(apr)||apr<0||apr>100)throw Error(`Card ${i}: balance must be positive and APR must be between 0% and 100%.`);
 cards.push({name:byId('name'+i).value.trim()||`Card ${i}`,balance,apr});
 }if(!cards.length)throw Error('Enter at least one card.');
 const budget=Number(byId('budget').value),pct=Number(byId('minpct').value),floor=Number(byId('minfloor').value);
 if(!Number.isFinite(budget)||budget<=0||!Number.isFinite(pct)||pct<0||pct>100||!Number.isFinite(floor)||floor<0)throw Error('Enter a positive budget and valid nonnegative minimum-payment settings.');
 return {cards,budget,pct,floor};}
function showSchedule(){if(!scenarios)return;const method=byId('strategy').value,r=scenarios[method];byId('schedule-summary').textContent=`${r.months} months • ${cash(r.interest)} total interest • ${cash(r.paid)} total paid`;
 byId('schedule').innerHTML=r.rows.map(x=>`<tr><td>${x.month}</td><td>${cash(x.payment)}</td><td>${cash(x.interest)}</td><td>${cash(x.balance)}</td></tr>`).join('');}
byId('calculate').addEventListener('click',()=>{try{const input=getInputs();const avalanche=simulate(input.cards,input.budget,input.pct,input.floor,'avalanche'),snowball=simulate(input.cards,input.budget,input.pct,input.floor,'snowball');if(avalanche.error||snowball.error)throw Error(avalanche.error||snowball.error);scenarios={avalanche,snowball};byId('planner-result').classList.remove('error');byId('planner-result').textContent=`Avalanche: ${avalanche.months} months, ${cash(avalanche.interest)} interest. Snowball: ${snowball.months} months, ${cash(snowball.interest)} interest. Estimated interest difference: ${cash(Math.abs(snowball.interest-avalanche.interest))}.`;byId('schedule-panel').hidden=false;showSchedule();}catch(e){scenarios=null;byId('schedule-panel').hidden=true;byId('planner-result').classList.add('error');byId('planner-result').textContent=e.message;}});
byId('strategy').addEventListener('change',showSchedule);
byId('download').addEventListener('click',()=>{if(!scenarios)return;const method=byId('strategy').value,rows=scenarios[method].rows;
 const quote=s=>'"'+String(s).replace(/"/g,'""')+'"';let out=[['Month','Total Payment','Total Interest','Remaining Balance','Card','Card Payment','Card Interest','Card Remaining Balance'].map(quote).join(',')];
 for(const r of rows)for(const c of r.perCard)out.push([r.month,r.payment.toFixed(2),r.interest.toFixed(2),r.balance.toFixed(2),c.name,c.payment.toFixed(2),c.interest.toFixed(2),c.balance.toFixed(2)].map(quote).join(','));
 const url=URL.createObjectURL(new Blob([out.join('\r\n')],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`cardcalc365-${method}-schedule.csv`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
if(typeof module!=='undefined')module.exports={simulate};
