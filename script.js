(function() {
    // Supabase Configuration
    const supabaseUrl = 'https://bxhrnnwfqlsoviysqcdw.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aHJubndmcWxzb3ZpeXNxY2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODkzNDIsImV4cCI6MjA4MTM2NTM0Mn0.O7fpv0TrDd-8ZE3Z9B5zWyAuWROPis5GRnKMxmqncX8';
    
    // Initialize Supabase client
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
    
    // DOM Elements
    const themeToggle = document.getElementById('themeToggle');
    const addFolderBtn = document.getElementById('addFolderBtn');
    const createFolderModal = document.getElementById('createFolderModal');
    const closeFolderModal = document.getElementById('closeFolderModal');
    const folderForm = document.getElementById('folderForm');
    const foldersContainer = document.getElementById('foldersContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const messageArea = document.getElementById('messageArea');
    const emptyState = document.getElementById('emptyState');
    const setupMessage = document.getElementById('setupMessage');
    
    // Folder Detail View Elements
    const mainView = document.getElementById('mainView');
    const folderDetailView = document.getElementById('folderDetailView');
    const backButton = document.getElementById('backButton');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadSection = document.getElementById('uploadSection');
    const uploadStickerForm = document.getElementById('uploadStickerForm');
    const stickersContainer = document.getElementById('stickersContainer');
    const stickersEmptyState = document.getElementById('stickersEmptyState');
    const quickDownloadBtn = document.getElementById('quickDownloadBtn');
    
    // Import Modal Elements
    const importStickerModal = document.getElementById('importStickerModal');
    const closeImportModal = document.getElementById('closeImportModal');
    const importModalContent = document.getElementById('importModalContent');
    
    // Detail View Info Elements
    const detailFolderName = document.getElementById('detailFolderName');
    const detailFolderCreator = document.getElementById('detailFolderCreator');
    const detailFolderDesc = document.getElementById('detailFolderDesc');
    const detailFolderDate = document.getElementById('detailFolderDate');
    const detailStickerCount = document.getElementById('detailStickerCount');
    
    // File Upload Elements
    const stickerFile = document.getElementById('stickerFile');
    const filePreview = document.getElementById('filePreview');
    const previewImage = document.getElementById('previewImage');
    const previewFileName = document.getElementById('previewFileName');
    
    // Current state
    let currentFolderId = null;
    let currentFolderData = null;
    let currentStickers = [];
    let isDarkMode = true;
    let bucketExists = false;
    let selectedStickerForImport = null;
    
    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('light-mode');
        
        const icon = themeToggle.querySelector('i');
        if (isDarkMode) {
            icon.className = 'fas fa-moon';
        } else {
            icon.className = 'fas fa-sun';
        }
    });
    
    // Check if bucket exists
    async function checkBucketExists() {
        try {
            const { data, error } = await supabaseClient.storage
                .from('sticker-images')
                .list();
            
            if (error && error.message.includes('Bucket not found')) {
                bucketExists = false;
                setupMessage.style.display = 'block';
                showMessage('Bucket storage belum dibuat. Silakan ikuti instruksi setup di atas.', 'warning');
            } else {
                bucketExists = true;
                setupMessage.style.display = 'none';
            }
        } catch (error) {
            console.error('Error checking bucket:', error);
            bucketExists = false;
            setupMessage.style.display = 'block';
        }
    }
    
    // Modal Controls
    addFolderBtn.addEventListener('click', () => {
        createFolderModal.style.display = 'flex';
    });
    
    closeFolderModal.addEventListener('click', () => {
        createFolderModal.style.display = 'none';
        folderForm.reset();
    });
    
    closeImportModal.addEventListener('click', () => {
        importStickerModal.style.display = 'none';
        selectedStickerForImport = null;
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === createFolderModal) {
            createFolderModal.style.display = 'none';
            folderForm.reset();
        }
        
        if (e.target === importStickerModal) {
            importStickerModal.style.display = 'none';
            selectedStickerForImport = null;
        }
    });
    
    // Show message
    function showMessage(message, type) {
        messageArea.innerHTML = `
            <div class="message ${type} fade-in">
                ${message}
            </div>
        `;
        messageArea.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            messageArea.style.display = 'none';
        }, 5000);
    }
    
    // Load all folders
    async function loadFolders() {
        loadingIndicator.style.display = 'block';
        emptyState.style.display = 'none';
        
        try {
            const { data, error } = await supabaseClient
                .from('folders_orasticker')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            if (data.length === 0) {
                emptyState.style.display = 'block';
                foldersContainer.innerHTML = '';
                foldersContainer.appendChild(emptyState);
            } else {
                displayFolders(data);
            }
        } catch (error) {
            console.error('Error loading folders:', error);
            showMessage('Gagal memuat folder: ' + error.message, 'error');
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }
    
    // Display folders in grid
    function displayFolders(folders) {
        foldersContainer.innerHTML = '';
        
        folders.forEach(folder => {
            const folderCard = document.createElement('div');
            folderCard.className = 'folder-card fade-in';
            folderCard.dataset.id = folder.id;
            
            // Format date
            const createdDate = new Date(folder.created_at);
            const formattedDate = createdDate.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
            
            folderCard.innerHTML = `
                <div class="folder-header">
                    <i class="fas fa-folder folder-icon"></i>
                    <div class="folder-name">${folder.name}</div>
                </div>
                ${folder.creator ? `<div class="folder-creator">Oleh: ${folder.creator}</div>` : ''}
                ${folder.description ? `<div class="folder-desc">${folder.description}</div>` : ''}
                <div class="folder-stats">
                    <span>Dibuat: ${formattedDate}</span>
                    <span><i class="fas fa-image"></i> ${folder.sticker_count || 0} stiker</span>
                </div>
            `;
            
            folderCard.addEventListener('click', () => openFolderDetail(folder.id));
            foldersContainer.appendChild(folderCard);
        });
    }
    
    // Create new folder
    folderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const creator = document.getElementById('creatorName').value.trim();
        const name = document.getElementById('folderName').value.trim();
        const description = document.getElementById('folderDescription').value.trim();
        
        if (!name) {
            showMessage('Nama folder harus diisi', 'error');
            return;
        }
        
        try {
            const { data, error } = await supabaseClient
                .from('folders_orasticker')
                .insert([
                    {
                        creator: creator || 'Anonim',
                        name: name,
                        description: description,
                        sticker_count: 0
                    }
                ])
                .select();
            
            if (error) throw error;
            
            showMessage('Folder berhasil dibuat!', 'success');
            createFolderModal.style.display = 'none';
            folderForm.reset();
            loadFolders();
        } catch (error) {
            console.error('Error creating folder:', error);
            showMessage('Gagal membuat folder: ' + error.message, 'error');
        }
    });
    
    // Open folder detail view
    async function openFolderDetail(folderId) {
        currentFolderId = folderId;
        
        try {
            // Get folder details
            const { data: folder, error: folderError } = await supabaseClient
                .from('folders_orasticker')
                .select('*')
                .eq('id', folderId)
                .single();
            
            if (folderError) throw folderError;
            
            currentFolderData = folder;
            
            // Update folder info in detail view
            updateFolderDetailInfo(folder);
            
            // Switch to detail view
            mainView.style.display = 'none';
            folderDetailView.style.display = 'block';
            uploadSection.style.display = 'none';
            quickDownloadBtn.style.display = 'flex';
            
            // Load stickers for this folder
            loadStickers();
        } catch (error) {
            console.error('Error opening folder:', error);
            showMessage('Gagal membuka folder: ' + error.message, 'error');
        }
    }
    
    // Update folder detail info
    function updateFolderDetailInfo(folder) {
        const createdDate = new Date(folder.created_at);
        const formattedDate = createdDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        detailFolderName.textContent = folder.name;
        detailFolderCreator.textContent = folder.creator ? `Oleh: ${folder.creator}` : '';
        detailFolderDesc.textContent = folder.description || 'Tidak ada deskripsi';
        detailFolderDate.textContent = `Dibuat: ${formattedDate}`;
        detailStickerCount.textContent = folder.sticker_count || 0;
    }
    
    // Load stickers for current folder
    async function loadStickers() {
        try {
            const { data: stickers, error: stickersError } = await supabaseClient
                .from('stickers_orasticker')
                .select('*')
                .eq('folder_id', currentFolderId)
                .order('created_at', { ascending: false });
            
            if (stickersError) throw stickersError;
            
            currentStickers = stickers;
            displayStickers(stickers);
        } catch (error) {
            console.error('Error loading stickers:', error);
            showMessage('Gagal memuat stiker: ' + error.message, 'error');
        }
    }
    
    // Display stickers in grid
    function displayStickers(stickers) {
        stickersContainer.innerHTML = '';
        
        if (stickers.length === 0) {
            stickersEmptyState.style.display = 'block';
            stickersContainer.style.display = 'none';
            quickDownloadBtn.style.display = 'none';
            return;
        }
        
        stickersEmptyState.style.display = 'none';
        stickersContainer.style.display = 'grid';
        quickDownloadBtn.style.display = 'flex';
        
        stickers.forEach(sticker => {
            const stickerItem = document.createElement('div');
            stickerItem.className = 'sticker-item fade-in';
            
            stickerItem.innerHTML = `
                <img src="${sticker.url}" alt="Sticker" class="sticker-img" loading="lazy">
                <div class="sticker-overlay">
                    <button class="sticker-btn download" onclick="downloadSticker('${sticker.url}', 'sticker_${sticker.id}_${sticker.file_name}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="sticker-btn whatsapp" onclick="openImportModal('${sticker.url}', '${sticker.file_name}', 'whatsapp')">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                    <button class="sticker-btn telegram" onclick="openImportModal('${sticker.url}', '${sticker.file_name}', 'telegram')">
                        <i class="fab fa-telegram"></i> Telegram
                    </button>
                </div>
            `;
            
            stickersContainer.appendChild(stickerItem);
        });
    }
    
    // Back to main view
    backButton.addEventListener('click', () => {
        folderDetailView.style.display = 'none';
        mainView.style.display = 'block';
        quickDownloadBtn.style.display = 'none';
        currentFolderId = null;
        currentFolderData = null;
        currentStickers = [];
        loadFolders();
    });
    
    // Toggle upload section
    uploadBtn.addEventListener('click', () => {
        if (!bucketExists) {
            showMessage('Bucket storage belum dibuat. Silakan ikuti instruksi setup di atas.', 'warning');
            setupMessage.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        
        if (uploadSection.style.display === 'none') {
            uploadSection.style.display = 'block';
            uploadBtn.innerHTML = '<i class="fas fa-times"></i> Batal';
            stickersSection.style.display = 'none';
            quickDownloadBtn.style.display = 'none';
        } else {
            uploadSection.style.display = 'none';
            uploadBtn.innerHTML = '<i class="fas fa-plus"></i> Tambah Stiker';
            stickersSection.style.display = 'block';
            uploadStickerForm.reset();
            filePreview.style.display = 'none';
            if (currentStickers.length > 0) {
                quickDownloadBtn.style.display = 'flex';
            }
        }
    });
    
    // File input preview
    stickerFile.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                previewFileName.textContent = file.name;
                filePreview.style.display = 'block';
            }
            
            reader.readAsDataURL(file);
        } else {
            filePreview.style.display = 'none';
        }
    });
    
    // Upload sticker to folder
    uploadStickerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!bucketExists) {
            showMessage('Bucket storage belum dibuat. Silakan ikuti instruksi setup di atas.', 'warning');
            setupMessage.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        
        if (!currentFolderId) {
            showMessage('Tidak ada folder yang dipilih', 'error');
            return;
        }
        
        const file = stickerFile.files[0];
        
        if (!file) {
            showMessage('Pilih file stiker terlebih dahulu', 'error');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showMessage('Ukuran file maksimal 5MB', 'error');
            return;
        }
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showMessage('Format file harus jpg, jpeg, png, atau webp', 'error');
            return;
        }
        
        try {
            // Generate unique file name
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `stickers/${fileName}`;
            
            // Upload file to Supabase Storage
            const { error: uploadError } = await supabaseClient.storage
                .from('sticker-images')
                .upload(filePath, file);
            
            if (uploadError) {
                if (uploadError.message.includes('bucket')) {
                    bucketExists = false;
                    setupMessage.style.display = 'block';
                    throw new Error('Bucket "sticker-images" belum dibuat. Silakan buat bucket terlebih dahulu di Supabase Storage.');
                }
                throw uploadError;
            }
            
            // Get public URL
            const { data: urlData } = supabaseClient.storage
                .from('sticker-images')
                .getPublicUrl(filePath);
            
            // Add sticker record to database
            const { error: dbError } = await supabaseClient
                .from('stickers_orasticker')
                .insert([
                    {
                        folder_id: currentFolderId,
                        url: urlData.publicUrl,
                        file_name: file.name,
                        file_size: file.size,
                        file_type: file.type
                    }
                ]);
            
            if (dbError) throw dbError;
            
            // Update sticker count in folder
            try {
                const { error: countError } = await supabaseClient.rpc('increment_sticker_count_orasticker', {
                    folder_id: currentFolderId
                });
                
                if (countError) {
                    // Fallback if function doesn't exist
                    const { data: folder } = await supabaseClient
                        .from('folders_orasticker')
                        .select('sticker_count')
                        .eq('id', currentFolderId)
                        .single();
                    
                    if (folder) {
                        await supabaseClient
                            .from('folders_orasticker')
                            .update({ sticker_count: folder.sticker_count + 1 })
                            .eq('id', currentFolderId);
                    }
                }
            } catch (countError) {
                console.warn('Error updating sticker count:', countError);
                // Continue anyway
            }
            
            showMessage('Stiker berhasil diupload!', 'success');
            
            // Reset form and hide upload section
            uploadStickerForm.reset();
            filePreview.style.display = 'none';
            uploadSection.style.display = 'none';
            uploadBtn.innerHTML = '<i class="fas fa-plus"></i> Tambah Stiker';
            stickersSection.style.display = 'block';
            
            // Reload stickers and update folder info
            loadStickers();
            if (currentFolderData) {
                currentFolderData.sticker_count = (currentFolderData.sticker_count || 0) + 1;
                updateFolderDetailInfo(currentFolderData);
            }
            
            // Update main view folder list
            loadFolders();
            
        } catch (error) {
            console.error('Error uploading sticker:', error);
            showMessage('Gagal mengupload stiker: ' + error.message, 'error');
        }
    });
    
    // Download sticker function (global)
    window.downloadSticker = function(url, fileName) {
        // Auto download
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        showMessage('Stiker berhasil didownload!', 'success');
    };
    
    // Open import modal
    window.openImportModal = function(url, fileName, app) {
        selectedStickerForImport = { url, fileName };
        
        let appName = app === 'whatsapp' ? 'WhatsApp' : 'Telegram';
        let appIcon = app === 'whatsapp' ? 'whatsapp' : 'telegram';
        let appColor = app === 'whatsapp' ? '#25D366' : '#0088cc';
        
        importModalContent.innerHTML = `
            <div class="import-options">
                <div class="import-option" onclick="importToWhatsApp('${url}', '${fileName}')">
                    <div class="import-icon">
                        <i class="fab fa-whatsapp whatsapp-icon"></i>
                    </div>
                    <div class="import-info">
                        <h4>Import ke WhatsApp</h4>
                        <p>Tambahkan stiker ke WhatsApp sebagai stiker pribadi</p>
                    </div>
                </div>
                
                <div class="import-option" onclick="importToTelegram('${url}', '${fileName}')">
                    <div class="import-icon">
                        <i class="fab fa-telegram telegram-icon"></i>
                    </div>
                    <div class="import-info">
                        <h4>Import ke Telegram</h4>
                        <p>Tambahkan stiker ke Telegram melalui bot @Stickers</p>
                    </div>
                </div>
            </div>
            
            <div class="import-steps">
                <h4>Cara Import Stiker:</h4>
                <ol>
                    <li><strong>WhatsApp:</strong> Buka WhatsApp → Pilih chat → Stiker icon (+) → Tambah stiker → Pilih gambar ini</li>
                    <li><strong>Telegram:</strong> Buka @Stickers bot → /newpack → Ikuti instruksi bot</li>
                    <li>Pastikan gambar sudah didownload terlebih dahulu</li>
                </ol>
            </div>
        `;
        
        importStickerModal.style.display = 'flex';
    };
    
    // Import to WhatsApp
    window.importToWhatsApp = function(url, fileName) {
        // Download the image first
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show WhatsApp instructions
        showMessage('Gambar telah didownload. Buka WhatsApp → Pilih chat → Stiker icon (+) → Tambah stiker → Pilih gambar yang baru didownload.', 'success');
        
        // Close modal
        importStickerModal.style.display = 'none';
    };
    
    // Import to Telegram
    window.importToTelegram = function(url, fileName) {
        // Download the image first
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Create Telegram bot link
        const telegramBotLink = 'https://t.me/Stickers';
        
        // Open Telegram bot in new tab
        window.open(telegramBotLink, '_blank');
        
        // Show Telegram instructions
        showMessage('Gambar telah didownload. Telegram dibuka. Gunakan bot @Stickers → /newpack → Ikuti instruksi bot.', 'success');
        
        // Close modal
        importStickerModal.style.display = 'none';
    };
    
    // Download all stickers in current folder
    quickDownloadBtn.addEventListener('click', async () => {
        if (currentStickers.length === 0) {
            showMessage('Tidak ada stiker untuk didownload', 'warning');
            return;
        }
        
        showMessage(`Mendownload ${currentStickers.length} stiker...`, 'success');
        
        // Create a zip file with all stickers
        try {
            // For now, we'll download them one by one
            for (let i = 0; i < currentStickers.length; i++) {
                const sticker = currentStickers[i];
                setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = sticker.url;
                    link.download = `sticker_${sticker.id}_${sticker.file_name}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }, i * 500); // Delay each download by 500ms
            }
            
            showMessage(`Sedang mendownload ${currentStickers.length} stiker... Cek folder Downloads Anda.`, 'success');
        } catch (error) {
            console.error('Error downloading stickers:', error);
            showMessage('Gagal mendownload stiker', 'error');
        }
    });
    
    // Initialize the app
    document.addEventListener('DOMContentLoaded', async () => {
        await checkBucketExists();
        loadFolders();
    });
    
    // Auto-check bucket every 30 seconds
    setInterval(async () => {
        if (!bucketExists) {
            await checkBucketExists();
        }
    }, 30000);
    
})();
