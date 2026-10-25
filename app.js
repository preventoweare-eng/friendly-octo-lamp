const views = document.querySelectorAll('.view');
const nav = document.querySelectorAll('.nav-item');
const toast = document.getElementById('toast');
function showToast(message){toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2600)}
nav.forEach(item=>item.addEventListener('click',()=>{nav.forEach(n=>n.classList.remove('active'));item.classList.add('active');views.forEach(v=>v.classList.toggle('active',v.id===item.dataset.view));window.scrollTo({top:0,behavior:'smooth'})}));
document.getElementById('refreshResearch').addEventListener('click',()=>{showToast('正在扫描新的趋势和用户反馈…');setTimeout(()=>showToast('研究已更新，发现 6 条新资料'),1200)});
document.getElementById('newProject').addEventListener('click',()=>showToast('新建项目功能即将开放'));
document.getElementById('exportBtn').addEventListener('click',()=>{document.querySelector('[data-view="report"]').click();showToast('已打开可编辑的机会报告')});
document.getElementById('downloadBtn').addEventListener('click',()=>showToast('报告已准备好，PDF 导出功能即将开放'));
document.querySelectorAll('.suggestion').forEach(btn=>btn.addEventListener('click',()=>showToast('已创建新的研究任务')));
