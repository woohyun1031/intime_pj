import { css, Global } from '@emotion/react';

const GlobalStyle = () => (
    <Global
        styles={css`
            html, body, #root {
                margin: 0;
                padding: 0;
                height: 100%;
            }
        `}
    />
);

export default GlobalStyle;
