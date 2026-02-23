import FlowCanvas from '@/components/FlowCanvas'
import Sidebar from '@/components/Sidebar'
import PromptInput from '@/components/PromptInput'
import PromptOutput from '@/components/PromptOutput'
import './styles.css'

const App = () => {
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1 className="logo">flompt</h1>
        <span className="tagline">Visual Prompt Builder</span>
      </header>

      {/* Main layout */}
      <main className="main">
        {/* Left panel */}
        <aside className="left-panel">
          <PromptInput />
          <Sidebar />
        </aside>

        {/* Canvas */}
        <FlowCanvas />

        {/* Right panel */}
        <aside className="right-panel">
          <PromptOutput />
        </aside>
      </main>
    </div>
  )
}

export default App
