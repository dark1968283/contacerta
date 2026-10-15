import { INTRO_SEEN_KEY, INTRO_SKIP_ATTR } from './introConfig';

/**
 * Evita mostrar a intro novamente durante a mesma sessão do separador.
 * Aplica-se tanto ao desktop como ao navegador móvel.
 */
const BOOT = `try{var d=document.documentElement;if(sessionStorage.getItem('${INTRO_SEEN_KEY}')==='1'){d.setAttribute('${INTRO_SKIP_ATTR}','skip')}}catch(e){}`;

export default function IntroBootScript() {
  return <script dangerouslySetInnerHTML={{ __html: BOOT }} />;
}
