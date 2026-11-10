// Email / Google sign-in with Privy, loaded only when a player asks for it (the guest game never pays for it).
// Privy gives each player an embedded NEAR wallet (an implicit testnet account) and signs silently: no seed phrase,
// no wallet pop-up. The game's sponsor still pays the gas. Pattern from near-examples/hello-privy, without JSX.
import {createElement as h,useEffect,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {PrivyProvider,usePrivy,useLogin,useLogout} from '@privy-io/react-auth';
import {useCreateWallet,useSignRawHash} from '@privy-io/react-auth/extended-chains';
import {Signer,PublicKey} from 'near-api-js';
import {bytesToHex,hexToBytes} from '@noble/hashes/utils';

/** A near-api-js signer backed by Privy's embedded wallet (implicit account: the id is the public key in hex). */
class PrivySigner extends Signer {
 constructor(signRawHash,accountId){super();this.signRawHash=signRawHash;this.accountId=accountId;}
 async getPublicKey(){return new PublicKey({keyType:0,data:hexToBytes(this.accountId)});}
 async signBytes(bytes){const {signature}=await this.signRawHash({address:this.accountId,chainType:'near',hash:`0x${bytesToHex(bytes)}`});return hexToBytes(signature.replace(/^0x/,''));}
}

/** Mounts Privy once. Wait for ready before opening its sign-in dialog. */
export function startPrivy({appId,onAccount,onLoginError,onLogout}){
 const holder=document.createElement('div');holder.id='privy-root';document.body.append(holder);
 let resolveReady;
 const api={ready:new Promise(resolve=>{resolveReady=resolve;})};
 function Bridge(){
  const {ready,authenticated,user}=usePrivy();
  const {login}=useLogin({onError:onLoginError});
  const {logout}=useLogout();
  const {createWallet}=useCreateWallet();const {signRawHash}=useSignRawHash();
  const creating=useRef(false),reported=useRef('');
  function report(current,wallet){
   if(reported.current===wallet.address)return;
   reported.current=wallet.address;
   onAccount({accountId:wallet.address,signer:new PrivySigner(signRawHash,wallet.address),email:current.email?.address||current.google?.email||''});
  }
  async function ensureWallet(current){
   const existing=current.linkedAccounts.find(a=>a.type==='wallet'&&a.chainType==='near');
   if(existing){report(current,existing);return;}
   if(creating.current)return;
   creating.current=true;
   try{
    const result=await createWallet({chainType:'near'});
    report(result.user,result.wallet);
   }catch(error){
    console.warn('Privy NEAR wallet',error);
    onLoginError('wallet_creation_failed');
   }finally{creating.current=false;}
  }
  api.login=()=>authenticated&&user?ensureWallet(user):login();
  api.logout=async()=>{await logout();reported.current='';onLogout();};
  useEffect(()=>{
   if(!ready)return;
   resolveReady();
   if(authenticated&&user)ensureWallet(user);
  },[ready,authenticated,user]);
  return null;
 }
 createRoot(holder).render(h(PrivyProvider,{appId,config:{
  loginMethods:['email','google'],
  appearance:{theme:'dark',accentColor:'#62b6a6',logo:'/brand/lunearcy-mark.svg',landingHeader:'Lunearcy',loginMessage:'Save your valley and play on any device.'},
  embeddedWallets:{ethereum:{createOnLogin:'off'},solana:{createOnLogin:'off'}}
 }},h(Bridge)));
 return api;
}
