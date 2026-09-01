const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
function calculate(){
const start=parseFloat(document.getElementById('balance').value),apr=parseFloat(document.getElementById('apr').value),payment=parseFloat(document.getElementById('payment').value);
const msg=document.getElementById('msg'),time=document.getElementById('time'),interestEl=document.getElementById('interest'),paidEl=document.getElementById('paid'),dateEl=document.getElementById('date');
msg.textContent='';[time,interestEl,paidEl,dateEl].forEach(x=>x.textContent='—');
if(!Number.isFinite(start)||start<=0||!Number.isFinite(apr)||apr<0||!Number.isFinite(payment)||payment<=0){msg.textContent='Please enter valid values.';return;}
const r=apr/100/12;
if(r>0&&payment<=start*r){msg.textContent='Your payment is not high enough to reduce the balance at this APR.';return;}
let bal=start,totalInterest=0,totalPaid=0,months=0;
while(bal>0.005&&months<1200){const i=bal*r;const due=bal+i;const p=Math.min(payment,due);totalInterest+=i;totalPaid+=p;bal=due-p;months++;}
if(months>=1200){msg.textContent='Payoff period exceeds the calculator limit. Try a larger payment.';return;}
const years=Math.floor(months/12),rem=months%12;let txt='';
if(years)txt+=years+(years===1?' year':' years');if(rem)txt+=(txt?', ':'')+rem+(rem===1?' month':' months');
const d=new Date();d.setMonth(d.getMonth()+months);
time.textContent=txt||'Less than 1 month';interestEl.textContent=money.format(totalInterest);paidEl.textContent=money.format(totalPaid);dateEl.textContent=d.toLocaleDateString('en-US',{month:'long',year:'numeric'});
}
document.getElementById('calc').addEventListener('click',calculate);document.getElementById('year').textContent=new Date().getFullYear();calculate();