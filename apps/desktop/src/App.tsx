import { useState } from 'react'
import { DesktopLayout } from './layout/DesktopLayout'
import { ChatPage } from './features/chat/ChatPage'
import { WorkersPage } from './features/workers/WorkersPage'
import { MemoryPage } from './features/memory/MemoryPage'
import { MissionsPage } from './features/missions/MissionsPage'
import { ApprovalsPage } from './features/approvals/ApprovalsPage'
import { MarketplacePage } from './features/marketplace/MarketplacePage'

export function App() {
  const [activeTab, setActiveTab] = useState<string>('chat')
  const [activeWorkerId, setActiveWorkerId] = useState<string | null>(null)

  const handleStartWorkerChat = (workerId: string) => {
    setActiveWorkerId(workerId)
    setActiveTab('chat')
  }

  return (
    <DesktopLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      activeWorkerId={activeWorkerId}
      onWorkerSelect={setActiveWorkerId}
    >
      {activeTab === 'chat' && (
        <ChatPage
          activeWorkerId={activeWorkerId}
          onWorkerSelect={setActiveWorkerId}
        />
      )}
      {activeTab === 'workers' && (
        <WorkersPage onStartChat={handleStartWorkerChat} />
      )}
      {activeTab === 'integrations' && <MarketplacePage />}
      {activeTab === 'memory' && <MemoryPage />}
      {activeTab === 'missions' && <MissionsPage />}
      {activeTab === 'approvals' && <ApprovalsPage />}
    </DesktopLayout>
  )
}

export default App
