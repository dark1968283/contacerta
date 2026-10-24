/**
 * Ícones da navegação do ContaCerta — desenho próprio, em pares contorno/preenchido.
 *
 * Regra (como Apple HIG, Material 3 e Shopify Polaris):
 *  - contorno  = destino não seleccionado
 *  - preenchido = destino actual
 * Grelha 24×24, traço 1.75, cantos arredondados. Cada ícone tem sempre o
 * mesmo significado em toda a app.
 */
import type { SVGProps } from "react";

export type NavIconProps = { filled?: boolean; className?: string };
export type NavIcon = (props: NavIconProps) => JSX.Element;

function Svg({ filled, className, children, ...rest }: NavIconProps & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      className={className}
      aria-hidden
      focusable="false"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Início — casa */
export const IconHome: NavIcon = ({ filled, className }) => (
  <Svg filled={filled} className={className}>
    {filled ? (
      <path fillRule="evenodd" d="M11.36 2.77a1 1 0 0 1 1.28 0l8 6.67a1 1 0 0 1 .36.77V20a1 1 0 0 1-1 1h-4.75v-6.25h-6.5V21H4a1 1 0 0 1-1-1v-9.79a1 1 0 0 1 .36-.77z" />
    ) : (
      <>
        <path d="M3.75 10.2 12 3.4l8.25 6.8V20.25H15v-6H9v6H3.75z" />
      </>
    )}
  </Svg>
);

/** Vendas — talão */
export const IconSales: NavIcon = ({ filled, className }) => (
  <Svg filled={filled} className={className}>
    {filled ? (
      <path
        fillRule="evenodd"
        d="M5.5 3.25A.75.75 0 0 1 6.25 2.5h11.5a.75.75 0 0 1 .75.75V21a.5.5 0 0 1-.78.42L15 19.75l-2.72 1.81a.5.5 0 0 1-.56 0L9 19.75l-2.72 1.67A.5.5 0 0 1 5.5 21zM8.75 7.25v1.5h6.5v-1.5zm0 4v1.5h6.5v-1.5zm0 4v1.5h3.5v-1.5z"
      />
    ) : (
      <>
        <path d="M6.25 3.25h11.5V20.5L15 18.75l-3 2-3-2-2.75 1.75z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    )}
  </Svg>
);

/** Produtos — caixa */
export const IconProducts: NavIcon = ({ filled, className }) => (
  <Svg filled={filled} className={className}>
    {filled ? (
      <>
        <path d="M12 2.9 19.6 7.2 12 11.5 4.4 7.2z" />
        <path d="M3.75 8.45 11.25 12.7v8.55l-7.04-3.98a.9.9 0 0 1-.46-.79z" />
        <path d="M12.75 12.7 20.25 8.45v7.98a.9.9 0 0 1-.46.79l-7.04 3.98z" />
      </>
    ) : (
      <>
        <path d="M12 3 20.25 7.6v8.8L12 21l-8.25-4.6V7.6z" />
        <path d="M3.75 7.6 12 12.2l8.25-4.6M12 12.2V21" />
      </>
    )}
  </Svg>
);

/** Dívidas — o "caderno do fiado" */
export const IconDebts: NavIcon = ({ filled, className }) => (
  <Svg filled={filled} className={className}>
    {filled ? (
      <path
        fillRule="evenodd"
        d="M6.5 2.5h11A2.5 2.5 0 0 1 20 5v14a2.5 2.5 0 0 1-2.5 2.5h-11A1.5 1.5 0 0 1 5 20V4a1.5 1.5 0 0 1 1.5-1.5zM10 7.25v1.5h6v-1.5zm0 4v1.5h6v-1.5zm0 4v1.5h3.5v-1.5zM2.75 6.5h2.25V8H2.75zm0 4.75h2.25v1.5H2.75zm0 4.75h2.25v1.5H2.75z"
      />
    ) : (
      <>
        <path d="M6.5 3.25h11a1.75 1.75 0 0 1 1.75 1.75v14a1.75 1.75 0 0 1-1.75 1.75h-11a.75.75 0 0 1-.75-.75V4a.75.75 0 0 1 .75-.75z" />
        <path d="M10 8h6M10 12h6M10 16h3.5M3.5 7.25h2.25M3.5 12h2.25M3.5 16.75h2.25" />
      </>
    )}
  </Svg>
);

/** Clientes — pessoa */
export const IconCustomers: NavIcon = ({ filled, className }) => (
  <Svg filled={filled} className={className}>
    {filled ? (
      <>
        <circle cx="12" cy="7.75" r="4.25" />
        <path d="M3.75 20.25a8.25 8.25 0 0 1 16.5 0 .75.75 0 0 1-.75.75h-15a.75.75 0 0 1-.75-.75z" />
      </>
    ) : (
      <>
        <circle cx="12" cy="7.75" r="3.75" />
        <path d="M4.5 20.25a7.5 7.5 0 0 1 15 0z" />
      </>
    )}
  </Svg>
);

/** Funcionários — equipa */
export const IconTeam: NavIcon = ({ filled, className }) => (
  <Svg filled={filled} className={className}>
    {filled ? (
      <>
        <circle cx="9" cy="8" r="3.75" />
        <path d="M2 19.5a7 7 0 0 1 14 0 .75.75 0 0 1-.75.75H2.75A.75.75 0 0 1 2 19.5z" />
        <circle cx="16.75" cy="7.25" r="3" />
        <path d="M17.1 12.6a6 6 0 0 1 4.9 5.9.75.75 0 0 1-.75.75H17.4a8.5 8.5 0 0 0-.3-6.65z" />
      </>
    ) : (
      <>
        <circle cx="9" cy="8" r="3.25" />
        <path d="M2.75 19.5a6.25 6.25 0 0 1 12.5 0z" />
        <path d="M15.5 4.6a3 3 0 1 1 0 5.3M17.5 13a5.5 5.5 0 0 1 3.75 5.25H18" />
      </>
    )}
  </Svg>
);

/** Meu plano — coroa */
export const IconPlan: NavIcon = ({ filled, className }) => (
  <Svg filled={filled} className={className}>
    {filled ? (
      <path d="M3.2 7.6a.75.75 0 0 1 1.2-.75l4.04 3.37 2.93-5.33a.75.75 0 0 1 1.32 0l2.93 5.33 4.04-3.37a.75.75 0 0 1 1.2.75l-1.9 10.3a.75.75 0 0 1-.74.6H5.78a.75.75 0 0 1-.74-.6zM5.5 20.25h13v1.5h-13z" />
    ) : (
      <path d="M3.75 7.75 8.6 11.8 12 5.6l3.4 6.2 4.85-4.05-1.95 10.5H5.7zM5.5 21h13" />
    )}
  </Svg>
);

/** Pagamentos — cartão */
export const IconPayments: NavIcon = ({ filled, className }) => (
  <Svg filled={filled} className={className}>
    {filled ? (
      <path
        fillRule="evenodd"
        d="M4.5 4.5h15A2.5 2.5 0 0 1 22 7v10a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 17V7a2.5 2.5 0 0 1 2.5-2.5zM2 8.75v2.5h20v-2.5zm4 6.25v1.5h4V15z"
      />
    ) : (
      <>
        <rect x="2.75" y="5.25" width="18.5" height="13.5" rx="2" />
        <path d="M2.75 10h18.5M6.5 15h3.5" />
      </>
    )}
  </Svg>
);

/** Mais — grelha */
export const IconMore: NavIcon = ({ filled, className }) => (
  <Svg filled={filled} className={className}>
    {filled ? (
      <>
        <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2" />
        <rect x="13" y="3.5" width="7.5" height="7.5" rx="2" />
        <rect x="3.5" y="13" width="7.5" height="7.5" rx="2" />
        <rect x="13" y="13" width="7.5" height="7.5" rx="2" />
      </>
    ) : (
      <>
        <rect x="4" y="4" width="6.5" height="6.5" rx="1.75" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.75" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.75" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.75" />
      </>
    )}
  </Svg>
);

/** Notificações — sino */
export const IconBell: NavIcon = ({ filled, className }) => (
  <Svg filled={filled} className={className}>
    {filled ? (
      <>
        <path d="M12 2.5a6.5 6.5 0 0 0-6.5 6.5v3.6l-1.65 3.3a.75.75 0 0 0 .67 1.1h14.96a.75.75 0 0 0 .67-1.1L18.5 12.6V9A6.5 6.5 0 0 0 12 2.5z" />
        <path d="M9.25 18.5h5.5a2.75 2.75 0 0 1-5.5 0z" />
      </>
    ) : (
      <>
        <path d="M6.25 9a5.75 5.75 0 0 1 11.5 0v3.75l1.75 3.5h-15l1.75-3.5z" />
        <path d="M9.75 19a2.25 2.25 0 0 0 4.5 0" />
      </>
    )}
  </Svg>
);
