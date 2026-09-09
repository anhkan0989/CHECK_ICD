import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { SearchTT25Page } from './pages/SearchTT25Page';
import { SearchICDTT06Page } from './pages/SearchICDTT06Page';
import { SearchYHCTPage } from './pages/SearchYHCTPage';
import { SearchFacilityPage } from './pages/SearchFacilityPage';
import { SearchDVKTPage } from './pages/SearchDVKTPage';
import { SearchThuocPage } from './pages/SearchThuocPage';
import { ImportPage } from './pages/ImportPage';
import { HistoryPage } from './pages/HistoryPage';
import { BackupPage } from './pages/BackupPage';
import { CLSEnginePage } from './pages/CLSEnginePage';
import { RuleManagementPage } from './pages/RuleManagementPage';
import { db } from './db/database';

export default function App() {
  const [currentTab, setCurrentTab] = useState('tt06');
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    const checkUpdates = async () => {
       // Kích hoạt đồng bộ ngầm khi mở app
       db.syncFromSupabase().then(success => {
          if (success) {
             setUpdateMessage('Đã đồng bộ dữ liệu mới nhất từ hệ thống!');
             setTimeout(() => setUpdateMessage(''), 3000);
          }
       });

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
      {currentTab === 'tt06' && <SearchICDTT06Page />}
      {currentTab === 'tt25' && <SearchTT25Page />}
      {currentTab === 'yhct' && <SearchYHCTPage />}
      {currentTab === 'facility' && <SearchFacilityPage />}
      {currentTab === 'dvkt' && <SearchDVKTPage />}
      {currentTab === 'thuoc' && <SearchThuocPage />}
      {currentTab === 'import' && <ImportPage />}
      {currentTab === 'history' && <HistoryPage />}
      {currentTab === 'cls_engine' && <CLSEnginePage />}
      {currentTab === 'rule_management' && <RuleManagementPage />}
      {currentTab === 'backup' && <BackupPage />}
    </Layout>
  );
}


