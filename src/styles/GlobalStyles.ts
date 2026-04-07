import { createGlobalStyle } from 'styled-components'

export const GlobalStyles = createGlobalStyle`
  /* Регистрация всех весов шрифта */
  
  @font-face {
    font-family: 'SB Sans Display';
    src: url('/fonts/SBSansDisplay-Thin.woff') format('woff');
    font-weight: 100;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'SB Sans Display';
    src: url('/fonts/SBSansDisplay-Light.woff') format('woff');
    font-weight: 300;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'SB Sans Display';
    src: url('/fonts/SBSansDisplay-Regular.woff') format('woff');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'SB Sans Display';
    src: url('/fonts/SBSansDisplay-SemiBold.woff') format('woff');
    font-weight: 600;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'SB Sans Display';
    src: url('/fonts/SBSansDisplay-Bold.woff') format('woff');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-height: 100vh;
    font-family: 'SB Sans Display', -apple-system, BlinkMacSystemFont, 'Segoe UI',
      Roboto, Helvetica, Arial, sans-serif;
    background-color: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.textPrimary};
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body.cursor-hidden,
  body.cursor-hidden * {
    cursor: none !important;
  }

  #root {
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }
`