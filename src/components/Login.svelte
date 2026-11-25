<script lang="ts">
 let username=$state('');let password=$state('');let busy=$state(false);let error=$state('');
 async function login(e:SubmitEvent){e.preventDefault();busy=true;error='';try{const res=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});const data=await res.json();if(!res.ok)throw Error(data.error);location.href='/admin';}catch(e){error=e instanceof Error?e.message:'Login gagal';}finally{busy=false;password='';}}
</script>
<form onsubmit={login}><label class="field">Nama pengguna<input bind:value={username} autocomplete="username" required maxlength="100"/></label><label class="field">Password<input type="password" bind:value={password} autocomplete="current-password" required maxlength="512"/></label>{#if error}<p class="error" role="alert">{error}</p>{/if}<button class="button" disabled={busy}>{busy?'Memeriksa…':'Masuk ke dashboard'} <span>↗</span></button></form>
