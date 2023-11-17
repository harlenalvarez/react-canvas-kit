import './App.css'
import { TestContainer } from './components/TestContainer'
import { CanvasContainer } from './lib'
function App() {
  return (
    <>
      <CanvasContainer fullScreen>
        <TestContainer />
      </CanvasContainer>
    </>
  )
}

export default App
