import 'styled-components';
import 'styled-components/native';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      onPrimary: string;
      on_primary: string;
      text: string;
      background: string;
      surface?: string;
      on_surface?: string;
      on_surface_variant?: string;
      surface_variant?: string;
      handle?: string;
      card_bg?: string;
      body_bg?: string;
    };
  }
}

declare module 'styled-components/native' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      onPrimary: string;
      on_primary: string;
      text: string;
      background: string;
      surface?: string;
      on_surface?: string;
      on_surface_variant?: string;
      surface_variant?: string;
      handle?: string;
      card_bg?: string;
      body_bg?: string;
    };
  }
}
