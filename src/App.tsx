import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { SearchPage } from './pages/SearchPage';
import { ImportPage } from './pages/ImportPage';
import { HistoryPage } from './pages/HistoryPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { BackupPage } from './pages/BackupPage';
import { db } from './db/database';

export default function App() {
  const [currentTab, setCurrentTab] = useState('search');
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    const checkUpdates = async () => {
       // @ts-ignore
       if (window.electronAPI) {
          // @ts-ignore
          const updateData = await window.electronAPI.checkForUpdateFile();
          if (updateData && Array.isArray(updateData)) {
            setUpdateMessage('Đang nạp file update ICD...');
            try {
               await db.importData(updateData, 'vUpdateAuto', 'SystemAuto', 'icd_update_file');
               // @ts-ignore
               await window.electronAPI.deleteUpdateFile();
               setUpdateMessage('Đã nạp file update thành công!');
               setTimeout(() => setUpdateMessage(''), 3000);
            } catch (err) {
               setUpdateMessage('Lỗi nạp file update!');
               console.error(err);
               setTimeout(() => setUpdateMessage(''), 3000);
            }
          }
       }
    };
    checkUpdates();
  }, []);

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {updateMessage && (
        <div className="bg-indigo-600 text-white p-3 text-center text-sm font-semibold rounded-lg mb-4 shadow-sm animate-pulse">
          {updateMessage}
        </div>
      )}
      {currentTab === 'search' && <SearchPage />}
      {currentTab === 'import' && <ImportPage />}
      {currentTab === 'history' && <HistoryPage />}
      {currentTab === 'ai' && <AIAssistantPage />}
      {currentTab === 'backup' && <BackupPage />}
    </Layout>
  );
}
