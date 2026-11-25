<script lang="ts">
 import type {IconName} from '../lib/icons';
 let {name,size=20,class:className=''}:{name:IconName;size?:number;class?:string}=$props();
</script>
<svg class={`ui-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href={`/icons/lucide.svg#${name}`}/></svg>
