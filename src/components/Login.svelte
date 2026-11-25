<script lang="ts">
 import Icon from './Icon.svelte';
 let username=$state('');let password=$state('');let busy=$state(false);let error=$state('');let showPassword=$state(false);
 async function login(e:SubmitEvent){
  e.preventDefault();if(busy)return;busy=true;error='';
  try{
   const res=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:username.trim(),password})});
   const data=await res.json();
   if(!res.ok)throw Error(data.error||'Login gagal. Silakan coba lagi.');
   password='';location.href='/admin';
  }catch(e){error=e instanceof Error?e.message:'Login gagal. Silakan coba lagi.';}
  finally{busy=false;}
 }
</script>
<form onsubmit={login} aria-busy={busy}>
 <label class="field">Nama pengguna<input bind:value={username} autocomplete="username" autocapitalize="none" spellcheck="false" required maxlength="100" disabled={busy}/></label>
 <div class="field"><label for="admin-password">Password</label><div class="password-field"><input id="admin-password" type={showPassword?'text':'password'} bind:value={password} autocomplete="current-password" required maxlength="512" disabled={busy}/><button class="password-toggle" type="button" onclick={()=>showPassword=!showPassword} aria-label={showPassword?'Sembunyikan password':'Tampilkan password'} title={showPassword?'Sembunyikan password':'Tampilkan password'} aria-controls="admin-password" aria-pressed={showPassword}><Icon name={showPassword?'eye-off':'eye'}/></button></div></div>
 {#if error}<p class="error" role="alert">{error}</p>{/if}
 <button class="button login-submit" type="submit" disabled={busy}>{busy?'Memeriksa…':'Masuk ke dashboard'} <Icon name={busy?'refresh-cw':'log-in'}/></button>
</form>
<style>
 .password-field{position:relative}.password-field input{padding-right:54px}.password-toggle{position:absolute;right:1px;top:1px;bottom:1px;width:48px;display:grid;place-items:center;background:transparent;border:0;color:#58604f}.password-toggle:hover{background:#e0e5d5}.login-submit{width:100%}
</style>
