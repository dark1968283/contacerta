import { INTRO_SEEN_KEY, INTRO_SKIP_ATTR } from './introConfig';

/**
 * Script minúsculo, executado antes da primeira pintura.
 * Se a intro já correu nesta sessão, ou se o utilizador pediu menos movimento,
 * marca <html> para que o CSS esconda a intro de imediato (sem "flash" do ecrã de abertura).
 * Falha em silêncio: se o storage estiver bloqueado, a intro corre normalmente.
 */
const BOOT = `try{var d=document.documentElement;if(!window.matchMedia('(min-width: 768px)').matches&&(sessionStorage.getItem('${INTRO_SEEN_KEY}')==='1'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)){d.setAttribute('${INTRO_SKIP_ATTR}','skip')}}catch(e){}`;

export default function IntroBootScript() {
  return <script dangerouslySetInnerHTML={{ __html: BOOT }} />;
}
