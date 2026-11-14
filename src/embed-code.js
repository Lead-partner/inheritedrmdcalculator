document.querySelector('#copy-embed')?.addEventListener('click',async()=>{
 const snippet=document.querySelector('#embed-snippet'),status=document.querySelector('#copy-status');
 try {await navigator.clipboard.writeText(snippet.value);status.textContent='Embed code copied.';}
 catch {snippet.focus();snippet.select();status.textContent='Code selected. Use your browser’s Copy command.';}
});
