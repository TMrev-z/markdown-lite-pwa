// Markdown Lite PWA - メインアプリケーション
class MarkdownLitePWA {
  constructor() {
    this.initializeElements();
    this.initializeState();
    this.setupEventListeners();
    this.registerServiceWorker();
    this.setupPWAFeatures();
    this.loadSavedState();
  }

  initializeElements() {
    // ボタン要素
    this.openFolderBtn = document.getElementById('openFolder');
    this.openFileBtn = document.getElementById('openFile');
    this.refreshBtn = document.getElementById('refreshBtn');
    this.newBtn = document.getElementById('newBtn');
    this.saveBtn = document.getElementById('saveBtn');
    this.saveAsBtn = document.getElementById('saveAsBtn');
    
    // 表示切り替え
    this.toEditBtn = document.getElementById('toEdit');
    this.toPreviewBtn = document.getElementById('toPreview');
    
    // エディター関連
    this.fileTitle = document.getElementById('fileTitle');
    this.editor = document.getElementById('editor');
    this.preview = document.getElementById('preview');
    this.lineSelect = document.getElementById('lineSelect');
    
    // サイドバー
    this.search = document.getElementById('search');
    this.sortKey = document.getElementById('sortKey');
    this.sortDir = document.getElementById('sortDir');
    this.fileList = document.getElementById('fileList');
    
    // ステータス
    this.status = document.getElementById('status');
    this.fileInfo = document.getElementById('fileInfo');
    this.folderPath = document.getElementById('folderPath');
    this.offlineIndicator = document.getElementById('offlineIndicator');
  }

  initializeState() {
    this.currentMode = 'preview'; // 'edit' or 'preview'
    this.currentFile = null;
    this.currentFileHandle = null;
    this.currentFolderHandle = null;
    this.files = [];
    this.unsavedChanges = false;
    this.autoSaveTimer = null;
  }

  setupEventListeners() {
    // ファイル操作
    this.openFolderBtn?.addEventListener('click', () => this.openFolder());
    this.openFileBtn?.addEventListener('click', () => this.openFile());
    this.newBtn?.addEventListener('click', () => this.newFile());
    this.saveBtn?.addEventListener('click', () => this.saveFile());
    this.saveAsBtn?.addEventListener('click', () => this.saveAsFile());
    this.refreshBtn?.addEventListener('click', () => this.refreshFileList());
    
    // 表示モード切り替え
    this.toEditBtn?.addEventListener('click', () => this.switchMode('edit'));
    this.toPreviewBtn?.addEventListener('click', () => this.switchMode('preview'));
    
    // エディター
    this.editor?.addEventListener('input', () => this.onContentChange());
    this.fileTitle?.addEventListener('input', () => this.onTitleChange());
    this.lineSelect?.addEventListener('change', () => this.updateLineHeight());
    
    // 検索・ソート
    this.search?.addEventListener('input', () => this.filterFiles());
    this.sortKey?.addEventListener('change', () => this.sortFiles());
    this.sortDir?.addEventListener('change', () => this.sortFiles());
    
    // キーボードショートカット
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // オンライン/オフライン検知
    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());
    
    // ページ離脱時の警告
    window.addEventListener('beforeunload', (e) => {
      if (this.unsavedChanges) {
        e.preventDefault();
        e.returnValue = '保存されていない変更があります。ページを離れますか？';
        return e.returnValue;
      }
    });
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[PWA] Service Worker registered:', registration);
        this.setStatus('🔧 PWA機能が利用可能です');
        
        // アップデート検知
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.setStatus('🔄 アプリの新しいバージョンが利用可能です');
            }
          });
        });
      } catch (error) {
        console.warn('[PWA] Service Worker registration failed:', error);
      }
    }
  }

  setupPWAFeatures() {
    // インストールプロンプト
    let deferredPrompt;
    const installPrompt = document.getElementById('installPrompt');
    const installBtn = document.getElementById('installBtn');
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      installPrompt?.classList.remove('hidden');
      
      installBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          console.log('[PWA] Install prompt outcome:', outcome);
          deferredPrompt = null;
          installPrompt?.classList.add('hidden');
        }
      });
    });

    // インストール完了検知
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.setStatus('✅ アプリがインストールされました！');
      installPrompt?.classList.add('hidden');
    });

    // オンライン状態の初期化
    this.updateOnlineStatus();
  }

  updateOnlineStatus() {
    if (navigator.onLine) {
      this.offlineIndicator?.classList.add('hidden');
    } else {
      this.offlineIndicator?.classList.remove('hidden');
      this.setStatus('📡 オフラインモードで動作中');
    }
  }

  // File System Access API を使用したフォルダ選択
  async openFolder() {
    if (!('showDirectoryPicker' in window)) {
      alert('お使いのブラウザはフォルダ選択機能をサポートしていません。Chromeまたは新しいEdgeをご利用ください。');
      return;
    }

    try {
      this.currentFolderHandle = await window.showDirectoryPicker();
      this.folderPath.textContent = this.currentFolderHandle.name;
      this.setStatus('📂 フォルダを開きました');
      await this.loadFolderContents();
      this.saveState();
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('フォルダ選択エラー:', error);
        this.setStatus('❌ フォルダの選択に失敗しました');
      }
    }
  }

  // File System Access API を使用したファイル選択
  async openFile() {
    if (!('showOpenFilePicker' in window)) {
      alert('お使いのブラウザはファイル選択機能をサポートしていません。Chromeまたは新しいEdgeをご利用ください。');
      return;
    }

    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md', '.markdown'] }
        }],
        multiple: false
      });
      
      await this.loadFileFromHandle(fileHandle);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('ファイル選択エラー:', error);
        this.setStatus('❌ ファイルの選択に失敗しました');
      }
    }
  }

  async loadFileFromHandle(fileHandle) {
    try {
      const file = await fileHandle.getFile();
      const content = await file.text();
      
      this.currentFileHandle = fileHandle;
      this.currentFile = {
        name: file.name.replace('.md', ''),
        content: content,
        handle: fileHandle
      };
      
      this.fileTitle.value = this.currentFile.name;
      this.editor.value = content;
      this.updatePreview();
      this.unsavedChanges = false;
      this.updateSaveButton();
      
      this.setStatus(`📄 ${file.name} を開きました`);
      this.updateFileInfo();
    } catch (error) {
      console.error('ファイル読み込みエラー:', error);
      this.setStatus('❌ ファイルの読み込みに失敗しました');
    }
  }

  async loadFolderContents() {
    if (!this.currentFolderHandle) return;

    this.files = [];
    try {
      for await (const [name, handle] of this.currentFolderHandle.entries()) {
        if (handle.kind === 'file' && (name.endsWith('.md') || name.endsWith('.markdown'))) {
          const file = await handle.getFile();
          this.files.push({
            name: name.replace(/\.(md|markdown)$/i, ''),
            fullName: name,
            handle: handle,
            size: file.size,
            lastModified: file.lastModified
          });
        }
      }
      this.sortFiles();
      this.renderFileList();
      this.setStatus(`📁 ${this.files.length}個のMarkdownファイルを発見`);
    } catch (error) {
      console.error('フォルダ内容読み込みエラー:', error);
      this.setStatus('❌ フォルダ内容の読み込みに失敗しました');
    }
  }

  renderFileList() {
    const filteredFiles = this.getFilteredFiles();
    
    if (filteredFiles.length === 0) {
      this.fileList.innerHTML = `
        <div class="empty-state">
          <h3>📄 Markdownファイルがありません</h3>
          <p>「新規」ボタンでファイルを作成するか、.mdファイルをフォルダに追加してください</p>
        </div>
      `;
      return;
    }

    this.fileList.innerHTML = filteredFiles.map(file => {
      const isActive = this.currentFile && this.currentFile.name === file.name;
      const lastModified = new Date(file.lastModified).toLocaleDateString('ja-JP');
      
      return `
        <div class="file-item ${isActive ? 'active' : ''}" data-name="${file.name}">
          <span class="file-icon">📄</span>
          <span class="file-name">${file.name}</span>
          <span class="file-date">${lastModified}</span>
        </div>
      `;
    }).join('');

    // ファイル項目にクリックイベントを追加
    this.fileList.querySelectorAll('.file-item').forEach(item => {
      item.addEventListener('click', () => {
        const fileName = item.dataset.name;
        const file = this.files.find(f => f.name === fileName);
        if (file) {
          this.loadFileFromHandle(file.handle);
        }
      });
    });
  }

  getFilteredFiles() {
    let filtered = [...this.files];
    
    // 検索フィルタ
    const searchTerm = this.search.value.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(searchTerm)
      );
    }
    
    return filtered;
  }

  sortFiles() {
    const key = this.sortKey.value;
    const direction = this.sortDir.value;
    
    this.files.sort((a, b) => {
      let comparison = 0;
      
      switch (key) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'ja');
          break;
        case 'modified':
          comparison = a.lastModified - b.lastModified;
          break;
        default:
          comparison = 0;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
    
    this.renderFileList();
  }

  filterFiles() {
    this.renderFileList();
  }

  async refreshFileList() {
    if (this.currentFolderHandle) {
      this.setStatus('🔄 ファイル一覧を更新中...');
      await this.loadFolderContents();
    } else {
      this.setStatus('フォルダが選択されていません');
    }
  }

  switchMode(mode) {
    this.currentMode = mode;
    
    if (mode === 'edit') {
      this.editor.classList.remove('hidden');
      this.preview.classList.add('hidden');
      this.toEditBtn.classList.add('active');
      this.toPreviewBtn.classList.remove('active');
      this.editor.focus();
    } else {
      this.editor.classList.add('hidden');
      this.preview.classList.remove('hidden');
      this.toEditBtn.classList.remove('active');
      this.toPreviewBtn.classList.add('active');
      this.updatePreview();
    }
    
    this.saveState();
  }

  onContentChange() {
    this.unsavedChanges = true;
    this.updateSaveButton();
    
    if (this.currentMode === 'preview') {
      this.updatePreview();
    }
    
    // 自動保存（5秒後）
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.autoSaveTimer = setTimeout(() => {
      if (this.currentFileHandle && this.unsavedChanges) {
        this.saveFile();
      }
    }, 5000);
  }

  onTitleChange() {
    this.unsavedChanges = true;
    this.updateSaveButton();
  }

  updatePreview() {
    if (!this.preview || !window.marked) return;
    
    const content = this.editor.value || '';
    this.preview.innerHTML = marked.parse(content);
  }

  updateLineHeight() {
    const lineHeight = this.lineSelect.value;
    document.documentElement.style.setProperty('--line', lineHeight);
    this.saveState();
  }

  async newFile() {
    if (this.unsavedChanges) {
      if (!confirm('保存されていない変更があります。新規作成を続けますか？')) {
        return;
      }
    }

    this.currentFile = null;
    this.currentFileHandle = null;
    this.fileTitle.value = '';
    this.editor.value = '';
    this.preview.innerHTML = this.getWelcomeHTML();
    this.unsavedChanges = false;
    this.updateSaveButton();
    this.updateFileInfo();
    this.switchMode('edit');
    this.setStatus('📝 新規ファイルを作成しました');
  }

  async saveFile() {
    if (!this.currentFileHandle) {
      return this.saveAsFile();
    }

    try {
      const content = this.editor.value;
      const writable = await this.currentFileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      
      this.unsavedChanges = false;
      this.updateSaveButton();
      this.setStatus('💾 保存しました');
      
      // ファイルリストの更新
      if (this.currentFolderHandle) {
        await this.loadFolderContents();
      }
    } catch (error) {
      console.error('保存エラー:', error);
      this.setStatus('❌ 保存に失敗しました');
    }
  }

  async saveAsFile() {
    if (!('showSaveFilePicker' in window)) {
      alert('お使いのブラウザはファイル保存機能をサポートしていません。');
      return;
    }

    try {
      const fileName = this.fileTitle.value || '無題';
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: `${fileName}.md`,
        types: [{
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md'] }
        }]
      });

      const content = this.editor.value;
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      this.currentFileHandle = fileHandle;
      this.currentFile = {
        name: fileName,
        handle: fileHandle
      };
      
      this.unsavedChanges = false;
      this.updateSaveButton();
      this.setStatus('💾 名前を付けて保存しました');
      this.updateFileInfo();
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('名前を付けて保存エラー:', error);
        this.setStatus('❌ 保存に失敗しました');
      }
    }
  }

  handleKeyboard(e) {
    // Cmd/Ctrl + S: 保存
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      this.saveFile();
    }
    
    // Cmd/Ctrl + N: 新規
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      this.newFile();
    }
    
    // Cmd/Ctrl + O: ファイルを開く
    if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
      e.preventDefault();
      this.openFile();
    }
    
    // Cmd/Ctrl + E: 編集モード
    if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
      e.preventDefault();
      this.switchMode('edit');
    }
    
    // Cmd/Ctrl + P: プレビューモード  
    if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
      e.preventDefault();
      this.switchMode('preview');
    }
  }

  updateSaveButton() {
    if (this.unsavedChanges) {
      this.saveBtn.textContent = '保存 *';
      this.saveBtn.classList.add('primary');
    } else {
      this.saveBtn.textContent = '保存';
      this.saveBtn.classList.remove('primary');
    }
  }

  updateFileInfo() {
    if (this.currentFile) {
      const chars = this.editor.value.length;
      const lines = this.editor.value.split('\n').length;
      this.fileInfo.textContent = `${chars} 文字, ${lines} 行`;
    } else {
      this.fileInfo.textContent = '';
    }
  }

  setStatus(message) {
    this.status.textContent = message;
    console.log(`[Status] ${message}`);
  }

  getWelcomeHTML() {
    return document.querySelector('.welcome-screen').innerHTML;
  }

  // ローカルストレージによる状態保存
  saveState() {
    const state = {
      mode: this.currentMode,
      lineHeight: this.lineSelect.value,
      sortKey: this.sortKey.value,
      sortDir: this.sortDir.value,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem('markdown-lite-pwa-state', JSON.stringify(state));
    } catch (error) {
      console.warn('状態保存に失敗:', error);
    }
  }

  loadSavedState() {
    try {
      const saved = localStorage.getItem('markdown-lite-pwa-state');
      if (saved) {
        const state = JSON.parse(saved);
        
        // UI状態の復元
        this.lineSelect.value = state.lineHeight || '1.38';
        this.sortKey.value = state.sortKey || 'name';
        this.sortDir.value = state.sortDir || 'asc';
        
        this.updateLineHeight();
        
        // モードの復元
        if (state.mode) {
          this.switchMode(state.mode);
        }
      }
    } catch (error) {
      console.warn('状態読み込みに失敗:', error);
    }
  }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
  window.markdownApp = new MarkdownLitePWA();
  console.log('[PWA] Markdown Lite PWA initialized');
});