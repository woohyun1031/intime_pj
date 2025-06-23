import IntimeWidget from "./IntimeWidget.tsx";
import {css} from "@emotion/react";

function App() {
  return (
      <div css={css`
        width: 100vw;
        height: 100dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      `}>
         <IntimeWidget />
      </div>
  )
}

export default App
